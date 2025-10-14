# app.py
import os, time, uuid, logging, jwt, json
from typing import List, Dict
from datetime import datetime

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv

load_dotenv()

SECRET = os.getenv("FLASK_SECRET", "dev-secret")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
JWT_EXP_SECONDS = int(os.getenv("JWT_EXP_SECONDS", "86400"))
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///dev.sqlite3")

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = DATABASE_URL
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

CORS(
    app,
    resources={
        r"/auth/*": {"origins": [FRONTEND_ORIGIN]},
        r"/levels": {"origins": [FRONTEND_ORIGIN]},
        r"/levels/*": {"origins": [FRONTEND_ORIGIN]},
        r"/users": {"origins": [FRONTEND_ORIGIN]},        # <-- ADD
        r"/users/*": {"origins": [FRONTEND_ORIGIN]},      # <-- ADD
    },
    supports_credentials=True,
)


app.logger.setLevel(logging.INFO)

# -------------------- Models --------------------
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(80), unique=True, index=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    user_type = db.Column(db.String(20), default="player", nullable=False)
    score = db.Column(db.Integer, nullable=False, default=0)  # <-- ADD

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "user_type": self.user_type,
            "score": self.score,             # <-- ADD
        }
        
class UserLevelCompletion(db.Model):
    __tablename__ = "user_level_completions"
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False, index=True)
    level_id = db.Column(db.String(36), db.ForeignKey("levels.id"), nullable=False, index=True)
    completed_at = db.Column(db.Integer, nullable=False, default=lambda: int(time.time()))

    __table_args__ = (
        db.UniqueConstraint("user_id", "level_id", name="uq_user_level_once"),  # prevent duplicates
    )


class Level(db.Model):
    __tablename__ = "levels"
    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    score = db.Column(db.Integer, nullable=False)
    rows = db.Column(db.Integer, nullable=False)
    cols = db.Column(db.Integer, nullable=False)
    cell = db.Column(db.Integer, nullable=False)

    # Use TEXT + JSON dump/load for maximum SQLite compatibility
    stones = db.Column(db.Text, nullable=False)         # JSON string
    boxes = db.Column(db.Text, nullable=False)          # JSON string
    finishPoints = db.Column(db.Text, nullable=False)   # JSON string
    initial = db.Column(db.Text, nullable=False)        # JSON string {row,col}

    created_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.Integer, nullable=False, default=lambda: int(time.time()))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "score": self.score,
            "rows": self.rows,
            "cols": self.cols,
            "cell": self.cell,
            "stones": json.loads(self.stones),
            "boxes": json.loads(self.boxes),
            "finishPoints": json.loads(self.finishPoints),
            "initial": json.loads(self.initial),
            "created_by": self.created_by,
            "created_at": self.created_at,
        }

# -------------------- Utilities --------------------
def make_token(user: User) -> str:
    payload = {
        "sub": user.id,
        "username": user.username,
        "role": user.user_type,
        "exp": int(time.time()) + JWT_EXP_SECONDS,
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")

def serialize_user(user: User):
    return {"id": user.id, "username": user.username, "user_type": user.user_type}

def _require_user(req):
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise ValueError("Missing bearer token")
    token = auth.split(" ", 1)[1].strip()
    try:
        claims = jwt.decode(token, SECRET, algorithms=["HS256"])
        return claims.get("sub"), claims  # (user_id, claims)
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")


def _require_admin(req):
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise ValueError("Missing bearer token")
    token = auth.split(" ", 1)[1].strip()
    try:
        claims = jwt.decode(token, SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")
    if claims.get("role") != "admin":
        raise ValueError("Admin privileges required")
    return claims.get("sub"), claims

def _coord_list(value, field_name):
    if not isinstance(value, list):
        raise ValueError(f"{field_name} must be a list")
    out = []
    for i, item in enumerate(value):
        if isinstance(item, dict):
            r, c = item.get("row"), item.get("col")
        elif isinstance(item, (list, tuple)) and len(item) == 2:
            r, c = item[0], item[1]
        else:
            raise ValueError(f"{field_name}[{i}] must be {{row, col}} or [row, col]")
        if not isinstance(r, int) or not isinstance(c, int):
            raise ValueError(f"{field_name}[{i}] row/col must be integers")
        out.append({"row": r, "col": c})
    return out

def _in_bounds(r, c, rows, cols):
    return 0 <= r < rows and 0 <= c < cols

def _validate_and_normalize_level(payload: dict) -> dict:
    required = ["name", "score", "rows", "cols", "cell", "stones", "boxes", "finishPoints", "initial"]
    missing = [k for k in required if k not in payload]
    if missing:
        raise ValueError(f"Missing fields: {', '.join(missing)}")

    name = str(payload["name"]).strip()
    if not name:
        raise ValueError("name is required")

    try:
        rows = int(payload["rows"]); cols = int(payload["cols"]); cell = int(payload["cell"]); score = int(payload["score"])
    except Exception:
        raise ValueError("rows, cols, cell, score must be integers")

    if rows <= 0 or cols <= 0 or cell <= 0 or score < 0:
        raise ValueError("rows, cols, cell must be > 0 and score >= 0")

    initial_raw = payload["initial"]
    if not isinstance(initial_raw, dict) or "row" not in initial_raw or "col" not in initial_raw:
        raise ValueError("initial must be an object {row, col}")
    initial = {"row": int(initial_raw["row"]), "col": int(initial_raw["col"])}

    stones = _coord_list(payload["stones"], "stones")
    boxes = _coord_list(payload["boxes"], "boxes")
    finish = _coord_list(payload["finishPoints"], "finishPoints")

    if len(boxes) != len(finish):
        raise ValueError("finishPoints count must equal boxes count")

    used = set()
    def _k(rc): return f"{rc['row']},{rc['col']}"

    if not _in_bounds(initial["row"], initial["col"], rows, cols):
        raise ValueError("initial is out of bounds")
    used.add(_k(initial))

    def check_group(group, label):
        seen = set()
        for i, rc in enumerate(group):
            r, c = rc["row"], rc["col"]
            if not isinstance(r, int) or not isinstance(c, int):
                raise ValueError(f"{label}[{i}] row/col must be integers")
            if not _in_bounds(r, c, rows, cols):
                raise ValueError(f"{label}[{i}] out of bounds")
            k = _k(rc)
            if k in seen:
                raise ValueError(f"{label} contains duplicates at {k}")
            if k in used:
                raise ValueError(f"{label}[{i}] overlaps with another entity or initial at {k}")
            seen.add(k)
        used.update(seen)

    check_group(stones, "stones")
    check_group(boxes, "boxes")
    check_group(finish, "finishPoints")

    return {
        "name": name,
        "score": score,
        "rows": rows,
        "cols": cols,
        "cell": cell,
        "stones": stones,
        "boxes": boxes,
        "finishPoints": finish,
        "initial": initial,
    }

# -------------------- Auth Routes --------------------
@app.post("/auth/signup")
def signup():
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    user_type = (data.get("user_type") or "player").strip().lower()

    if not username or not password:
        return jsonify({"message": "username and password are required"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"message": "Username already exists"}), 409

    user = User(
        id=str(uuid.uuid4()),
        username=username,
        password_hash=generate_password_hash(password),
        user_type=user_type,
    )
    db.session.add(user)
    db.session.commit()

    token = make_token(user)
    return jsonify({"user": serialize_user(user), "accessToken": token})

@app.post("/auth/login")
def login():
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    app.logger.info("Login route hit")

    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid username or password"}), 401

    app.logger.info(f"User {username} authenticated successfully")
    app.logger.info(f"User type: {user.user_type}")

    token = make_token(user)
    return jsonify({"user": serialize_user(user), "accessToken": token})

# -------------------- Levels Routes --------------------
@app.get("/levels")
def list_levels():
    levels = Level.query.order_by(Level.created_at.desc()).all()
    return jsonify({"levels": [l.to_dict() for l in levels]})

@app.post("/levels")
def create_level():
    try:
        user_id, _ = _require_admin(request)
    except ValueError as e:
        return jsonify({"message": str(e)}), 401

    try:
        data = request.get_json(force=True) or {}
        norm = _validate_and_normalize_level(data)
    except ValueError as e:
        return jsonify({"message": str(e)}), 400

    if Level.query.filter(Level.name.ilike(norm["name"])).first():
        return jsonify({"message": "Level name already exists"}), 409

    level = Level(
        id=str(uuid.uuid4()),
        name=norm["name"],
        score=norm["score"],
        rows=norm["rows"],
        cols=norm["cols"],
        cell=norm["cell"],
        stones=json.dumps(norm["stones"]),
        boxes=json.dumps(norm["boxes"]),
        finishPoints=json.dumps(norm["finishPoints"]),
        initial=json.dumps(norm["initial"]),
        created_by=user_id or "unknown",
        created_at=int(time.time()),
    )
    db.session.add(level)
    db.session.commit()
    return jsonify({"level": level.to_dict()}), 201

@app.get("/levels/<level_id>")
def get_level(level_id: str):
    level = Level.query.filter_by(id=level_id).first()
    if not level:
        return jsonify({"message": "Level not found"}), 404
    return jsonify({"level": level.to_dict()}), 200

@app.post("/levels/<level_id>/complete")
def complete_level(level_id: str):
    try:
        user_id, _ = _require_user(request)
    except ValueError as e:
        return jsonify({"message": str(e)}), 401

    user = User.query.filter_by(id=user_id).first()
    if not user:
        return jsonify({"message": "User not found"}), 404

    level = Level.query.filter_by(id=level_id).first()
    if not level:
        return jsonify({"message": "Level not found"}), 404

    # Check if already completed
    exists = UserLevelCompletion.query.filter_by(user_id=user.id, level_id=level.id).first()
    if exists:
        return jsonify({
            "message": "Already completed",
            "user": user.to_dict(),
            "level": level.to_dict()
        }), 200

    # Record completion and add score
    rec = UserLevelCompletion(
        id=str(uuid.uuid4()),
        user_id=user.id,
        level_id=level.id,
        completed_at=int(time.time()),
    )
    db.session.add(rec)
    user.score = (user.score or 0) + int(level.score)
    db.session.commit()

    return jsonify({
        "message": "Completion recorded",
        "user": user.to_dict(),
        "level": level.to_dict()
    }), 201

@app.get("/users")
def list_users():
    users = User.query.order_by(User.username.asc()).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200

# -------------------- Bootstrap --------------------
def _seed_admin():
    if not User.query.filter_by(username="admin").first():
        admin = User(
            id=str(uuid.uuid4()),
            username="admin",
            password_hash=generate_password_hash("admin"),
            user_type="admin",
        )
        db.session.add(admin)
        db.session.commit()

with app.app_context():
    db.create_all()
    _seed_admin()

if __name__ == "__main__":
    app.run(debug=True, port=8000)
