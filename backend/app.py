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
CORS(app, resources={r"/auth/*": {"origins": [FRONTEND_ORIGIN]}}, supports_credentials=True)

app.logger.setLevel(logging.INFO)  # DEBUG / INFO / WARNING / ERROR


# ---- In-memory "DB" (replace with real DB) ----
@dataclass
class User:
    id: str
    username: str
    password_hash: str
    user_type: str = "player"         # <-- NEW: default user type

USERS_BY_USERNAME: Dict[str, User] = {}

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
