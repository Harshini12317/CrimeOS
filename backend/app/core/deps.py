"""
Authentication and authorization dependencies.

Supports authentication through:

1. Authorization: Bearer <JWT>
   - Used by Swagger / API clients

2. crimeos_token cookie
   - Used by the Next.js frontend

Usage:

    from app.core.deps import get_current_user, require_role
    from models.user import User, Role

    @router.get("/something")
    def something(
        user: User = Depends(get_current_user)
    ):
        ...

    @router.get("/io-only")
    def io_only(
        user: User = Depends(require_role(Role.IO))
    ):
        ...
"""

from fastapi import (
    Depends,
    HTTPException,
    Request,
    status,
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)

from jose import JWTError
from sqlalchemy.orm import Session

from database.db import get_db
from app.core.security import decode_access_token
from models.user import User, Role


# ============================================================
# HTTP BEARER AUTHENTICATION
# ============================================================

# Used by Swagger/OpenAPI.
#
# Swagger will show an "Authorize" button where you can paste
# the JWT returned by /api/auth/login.
#
# The actual application can still authenticate through the
# crimeos_token cookie below.
#
bearer_scheme = HTTPBearer(
    auto_error=False
)


# ============================================================
# GET CURRENT USER
# ============================================================

def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
) -> User:

    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    token = None

    # --------------------------------------------------------
    # 1. Try Authorization: Bearer <JWT>
    #
    # This is used by Swagger and API clients.
    # --------------------------------------------------------

    if credentials:
        token = credentials.credentials

    # --------------------------------------------------------
    # 2. If Bearer token isn't present, try the cookie.
    #
    # This is used by your Next.js website.
    # --------------------------------------------------------

    if not token:
        token = request.cookies.get("crimeos_token")

    # --------------------------------------------------------
    # 3. No token at all
    # --------------------------------------------------------

    if not token:
        raise credentials_error

    # --------------------------------------------------------
    # 4. Decode JWT
    # --------------------------------------------------------

    try:
        payload = decode_access_token(token)

        user_id_raw = payload.get("sub")

        if user_id_raw is None:
            raise credentials_error

        user_id = int(user_id_raw)

    except (
        JWTError,
        TypeError,
        ValueError,
    ):
        raise credentials_error

    # --------------------------------------------------------
    # 5. Find user in database
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    # --------------------------------------------------------
    # 6. User doesn't exist / inactive
    # --------------------------------------------------------

    if not user:
        raise credentials_error

    if not user.is_active:
        raise credentials_error

    # --------------------------------------------------------
    # 7. Return actual SQLAlchemy User object
    # --------------------------------------------------------

    return user


# ============================================================
# ROLE AUTHORIZATION
# ============================================================

def require_role(*allowed_roles: Role):

    def dependency(
        user: User = Depends(get_current_user)
    ) -> User:

        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient role for this action.",
            )

        return user

    return dependency