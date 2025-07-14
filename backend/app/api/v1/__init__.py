from fastapi import APIRouter
from app.api.v1 import auth, users, dictionaries, files, config, jump_types, aircraft, loads, jumps, dashboard

api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(dictionaries.router, prefix="/dictionaries", tags=["dictionaries"])
api_router.include_router(files.router, prefix="/files", tags=["files"])
api_router.include_router(config.router, prefix="/config", tags=["configuration"])
api_router.include_router(jump_types.router, prefix="/jump-types", tags=["jump-types"])
api_router.include_router(aircraft.router, prefix="/aircraft", tags=["aircraft"])
api_router.include_router(loads.router, prefix="/loads", tags=["loads"])
api_router.include_router(jumps.router, prefix="/jumps", tags=["jumps"])
api_router.include_router(dashboard.router, tags=["public"])
