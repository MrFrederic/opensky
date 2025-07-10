from fastapi import APIRouter
from app.api.v1 import auth, users, dictionaries, files, config

api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(dictionaries.router, prefix="/dictionaries", tags=["dictionaries"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(config.router, prefix="/config", tags=["configuration"])
