"""Authentication schemas."""

from pydantic import BaseModel, EmailStr, Field, field_validator


class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("username")
    @classmethod
    def username_alphanumeric(cls, value: str) -> str:
        if not value.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username may only contain letters, numbers, hyphens, and underscores")
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    email: str
    username: str

    model_config = {"from_attributes": True}
