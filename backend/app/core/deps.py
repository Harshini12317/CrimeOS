"""
Dependencies to protect any route by login, or by login + role.

Usage in a route file:

    from app.core.deps import get_current_user, require_role
    from models.user import Role

    @router.get("/investigations")
    def list_investigations(user: User = Depends(get_current_user)):
        ...

    @router.post("/legal-requests/{id}/approve")
    def approve(id: int, user: User = Depends(require_role(Role.LEGAL_ADVISOR))):
        ...
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

from database.db import get_db
from app.core.security import decode_access_token
from models.user import User, Role

# tokenUrl is just for the OpenAPI docs "Authorize" button — the actual
# login route lives at /api/auth/login (see routes/auth.py)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    if not token:
        raise credentials_error

    try:
        payload = decode_access_token(token)
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise credentials_error

    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise credentials_error

    return user


def require_role(*allowed_roles: Role):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role for this action.",
            )
        return user
    return dependency