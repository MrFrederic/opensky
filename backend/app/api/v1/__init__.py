from fastapi import APIRouter
from app.api.v1 import auth, users, tandems, manifests, loads, equipment, dictionaries

api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(tandems.router, prefix="/tandems", tags=["tandems"])
api_router.include_router(manifests.router, prefix="/manifests", tags=["manifests"])
api_router.include_router(loads.router, prefix="", tags=["loads"])  # loads and jumps
api_router.include_router(equipment.router, prefix="/equipment", tags=["equipment"])
api_router.include_router(dictionaries.router, prefix="/dictionaries", tags=["dictionaries"])
