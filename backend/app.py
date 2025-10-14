import os, time, uuid
from dataclasses import dataclass
from typing import Dict, Optional

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from dotenv import load_dotenv
import logging


load_dotenv()

SECRET = os.getenv("FLASK_SECRET", "dev-secret")
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
JWT_EXP_SECONDS = 60 * 60 * 24  # 24h

app = Flask(__name__)
# CORS(app, resources={r"/auth/*": {"origins": [FRONTEND_ORIGIN]}}, supports_credentials=True)

app.logger.setLevel(logging.INFO)  # DEBUG / INFO / WARNING / ERROR


# ---- In-memory "DB" (replace with real DB) ----
@dataclass
class User:
    id: str
    username: str
    password_hash: str
    user_type: str = "player"         # <-- NEW: default user type

USERS_BY_USERNAME: Dict[str, User] = {}

# --- Seed default admin user on server load ---
def _seed_admin():
    if "admin" not in USERS_BY_USERNAME:
        USERS_BY_USERNAME["admin"] = User(
            id=str(uuid.uuid4()),
            username="admin",
            password_hash=generate_password_hash("admin"),
            user_type="admin",
        )

_seed_admin()

def make_token(user: User) -> str:
    payload = {
        "sub": user.id,
        "username": user.username,
        "role": user.user_type,        # <-- OPTIONAL: put role in the JWT
        "exp": int(time.time()) + JWT_EXP_SECONDS,
    }
    return jwt.encode(payload, SECRET, algorithm="HS256")

def serialize_user(user: User):
    # Match the shape your frontend expects
    return {
        "id": user.id,
        "username": user.username,
        "user_type": user.user_type,    # <-- NEW: include in response
    }

# ---- Routes ----
@app.post("/auth/signup")
def signup():
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    # optional: allow client to request a type; default to "player"
    user_type = (data.get("user_type") or "player").strip().lower()  # <-- NEW

    if not username or not password:
        return jsonify({"message": "username and password are required"}), 400
    if username in USERS_BY_USERNAME:
        return jsonify({"message": "Username already exists"}), 409

    uid = str(uuid.uuid4())
    user = User(
        id=uid,
        username=username,
        password_hash=generate_password_hash(password),
        user_type=user_type,           # <-- NEW
    )
    USERS_BY_USERNAME[username] = user

    token = make_token(user)
    return jsonify({"user": serialize_user(user), "accessToken": token})

@app.post("/auth/login")
def login():
    data = request.get_json(force=True) or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = USERS_BY_USERNAME.get(username)
    app.logger.info("Login route hit")

    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "Invalid username or password"}), 401
    
    app.logger.info(f"User {username} authenticated successfully")
    app.logger.info(f"User type: {user.user_type}")
    token = make_token(user)
    # NOTE: user_type comes from the stored user, not from the request
    return jsonify({"user": serialize_user(user), "accessToken": token})

# ---- Levels model ----
from dataclasses import asdict

@dataclass
class Level:
    id: str
    name: str
    score: int
    rows: int
    cols: int
    cell: int
    stones: list[dict]           # [{row, col}, ...]
    boxes: list[dict]
    finishPoints: list[dict]
    initial: dict                # {row, col}
    created_by: str              # user id (from JWT)
    created_at: int              # epoch seconds

LEVELS: list[Level] = []  # in-memory; swap with a DB later


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

    # ints
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

    # Matching counts
    if len(boxes) != len(finish):
        raise ValueError("finishPoints count must equal boxes count")

    # Bounds + overlaps
    used = set()  # all occupied
    def _k(rc): return f"{rc['row']},{rc['col']}"

    # initial in bounds + reserve its cell
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
        # reserve cells into global used
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


def _require_admin(request):
    """Return (user_id, claims) if admin, else raise ValueError."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise ValueError("Missing bearer token")
    token = auth.split(" ", 1)[1].strip()
    try:
        claims = jwt.decode(token, SECRET, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise ValueError("Token expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid token")

    role = claims.get("role")
    if role != "admin":
        raise ValueError("Admin privileges required")
    return claims.get("sub"), claims

@app.get("/levels")
def list_levels():
    # Return all levels (full payload); trim if you prefer summaries
    return jsonify({
        "levels": [asdict(l) for l in LEVELS]
    })


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

    # Optional: unique name
    if any(l.name.lower() == norm["name"].lower() for l in LEVELS):
        return jsonify({"message": "Level name already exists"}), 409

    level = Level(
        id=str(uuid.uuid4()),
        name=norm["name"],
        score=norm["score"],
        rows=norm["rows"],
        cols=norm["cols"],
        cell=norm["cell"],
        stones=norm["stones"],
        boxes=norm["boxes"],
        finishPoints=norm["finishPoints"],
        initial=norm["initial"],
        created_by=user_id or "unknown",
        created_at=int(time.time()),
    )
    LEVELS.append(level)
    return jsonify({"level": asdict(level)}), 201

CORS(
    app,
    resources={
        r"/auth/*": {"origins": [FRONTEND_ORIGIN]},
        r"/levels": {"origins": [FRONTEND_ORIGIN]},
        r"/levels/*": {"origins": [FRONTEND_ORIGIN]},
    },
    supports_credentials=True,
)
