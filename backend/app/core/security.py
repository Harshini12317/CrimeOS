"""
pip install bcrypt python-jose python-dotenv

JWT_SECRET_KEY must be identical to the one your Next.js middleware.ts
verifies against (env var of the same name on that side).
"""
import os
from datetime import datetime, timedelta

import bcrypt
from dotenv import load_dotenv
from jose import jwt

load_dotenv()  # don't rely on some other module having loaded .env first

JWT_SECRET_KEY = os.environ["JWT_SECRET_KEY"]
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = 8  # a police shift, roughly


def hash_password(raw_password: str) -> str:
    hashed = bcrypt.hashpw(raw_password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(raw_password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(raw_password.encode("utf-8"), password_hash.encode("utf-8"))


def create_access_token(user_id: int, role: str, name: str) -> str:
    payload = {
        "sub": str(user_id),
        "role": role,
        "name": name,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Raises jose.JWTError if invalid/expired — caller should catch it."""
    return jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])