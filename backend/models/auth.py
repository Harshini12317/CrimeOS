from pydantic import BaseModel, EmailStr

from models.user import Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: Role

    class Config:
        from_attributes = True  # lets this build directly from the SQLAlchemy model


class LoginResponse(BaseModel):
    access_token: str
    user: UserOut