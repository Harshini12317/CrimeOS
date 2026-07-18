"""
Exposes exactly two endpoints:
  POST /api/auth/login  -> verify credentials, return JWT + user info
  GET  /api/auth/me     -> return the current user, from the token

There is deliberately no /register or /signup route. Accounts are
created only by scripts/seed_users.py.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.db import get_db
from app.core.security import verify_password, create_access_token
from app.core.deps import get_current_user
from models.user import User
from models.auth import LoginRequest, LoginResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()

    # Same generic error whether the email doesn't exist or the password
    # is wrong — don't let the response reveal which one it was.
    if not user or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(user_id=user.id, role=user.role.value, name=user.name)
    return LoginResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut.model_validate(user)