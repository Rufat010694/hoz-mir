from pydantic import BaseModel, EmailStr, field_validator
from app.models.user import UserRole


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str | None = None
    email: EmailStr | None = None
    role: UserRole = UserRole.seller
    store_name: str | None = None


class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str | None
    email: str | None
    role: UserRole
    store_name: str | None
    catalog_slug: str | None
    is_active: bool

    model_config = {"from_attributes": True}

    @field_validator("id", mode="before")
    @classmethod
    def to_str(cls, v):
        return str(v) if v is not None else None
