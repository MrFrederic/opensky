from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/config")
async def get_config():
    """
    Get public configuration that can be safely exposed to the frontend.
    """
    return {
        "telegram_bot_username": settings.telegram_bot_username
    }
