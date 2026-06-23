"""Authentication routes: register, login."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import Token, UserRegister, UserResponse
from app.services.auth import (
    authenticate_user,
    create_access_token,
    create_user,
    get_user_by_email,
    get_user_by_username,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: UserRegister, db: Annotated[Session, Depends(get_db)]):
    """Create a new user account."""
    if get_user_by_email(db, payload.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    if get_user_by_username(db, payload.username):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")

    user = create_user(db, payload.email, payload.username, payload.password)
    return user


@router.post("/login", response_model=Token)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[Session, Depends(get_db)],
):
    """
    OAuth2-compatible login. Use email as username field.
    Returns JWT access token.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token(user.id)
    return Token(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    """Return the currently authenticated user."""
    return current_user


@router.post("/logout")
def logout():
    """Stateless JWT logout — client should discard the token."""
    return {"message": "Successfully logged out. Please discard your token on the client."}
