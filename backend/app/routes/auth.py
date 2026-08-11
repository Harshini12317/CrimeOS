"""
Authentication and authorization routes.

POST /api/auth/login
    Verify credentials, create JWT, set authentication cookie,
    and return JWT + user information.

GET /api/auth/me
    Return the currently authenticated user.

POST /api/auth/logout
    Clear the authentication cookie.

There is deliberately no /register or /signup route.
Accounts are created only by scripts/seed_users.py.
"""

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)

from sqlalchemy.orm import Session

from database.db import get_db

from app.core.security import (
    verify_password,
    create_access_token,
)

from app.core.deps import get_current_user

from models.user import User

from models.auth import (
    LoginRequest,
    LoginResponse,
    UserOut,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)


# ============================================================
# LOGIN
# ============================================================

@router.post(
    "/login",
    response_model=LoginResponse,
)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.email == payload.email.lower()
        )
        .first()
    )

    # --------------------------------------------------------
    # Verify credentials
    # --------------------------------------------------------

    if (
        not user
        or not user.is_active
        or not verify_password(
            payload.password,
            user.password_hash,
        )
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    # --------------------------------------------------------
    # Create JWT
    # --------------------------------------------------------

    token = create_access_token(
        user_id=user.id,
        role=user.role.value,
        name=user.name,
    )

    # --------------------------------------------------------
    # Store JWT in HTTP-only cookie
    # --------------------------------------------------------
    #
    # Your get_current_user() already looks for:
    #
    # request.cookies.get("crimeos_token")
    #
    # Therefore the cookie name MUST be crimeos_token.
    #

    response.set_cookie(
        key="crimeos_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=60 * 60 * 24,  # 1 day
    )

    # --------------------------------------------------------
    # Return token + user
    # --------------------------------------------------------
    #
    # Returning the token is still useful for Swagger/API
    # clients. The browser frontend will use the cookie.
    #

    return LoginResponse(
        access_token=token,
        user=UserOut.model_validate(user),
    )


# ============================================================
# CURRENT USER
# ============================================================

@router.get(
    "/me",
    response_model=UserOut,
)
def me(
    user: User = Depends(get_current_user),
):
    return UserOut.model_validate(user)


# ============================================================
# LOGOUT
# ============================================================

@router.post("/logout")
def logout(response: Response):

    response.delete_cookie(
        key="crimeos_token",
        path="/",
    )

    return {
        "message": "Logged out successfully"
    }