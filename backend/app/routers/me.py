from fastapi import APIRouter, Depends
from app.models.user import User
from app.schemas.auth import UserResponse
from app.services.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
