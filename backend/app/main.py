from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api import router
from app.core.config import settings
from app.core.database import get_db, engine
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Dropzone Management System",
    description="API for managing dropzone operations including users, equipment, loads, and manifests",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)


@app.on_event("startup")
async def startup_event():
    """Verify database connectivity on startup"""
    try:
        logger.info("🔍 Verifying database connectivity...")
        db = next(get_db())
        
        # Test basic connectivity
        db.execute(text("SELECT 1"))
        
        # Check if essential tables exist
        result = db.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'dictionaries', 'equipment', 'manifests', 'loads')
        """))
        
        tables = [row[0] for row in result.fetchall()]
        logger.info(f"✅ Found database tables: {tables}")
        
        if len(tables) > 0:
            logger.info("✅ Database startup verification completed successfully")
        else:
            logger.warning("⚠️  No tables found - database may need initialization")
            
    except Exception as e:
        logger.error(f"❌ Database startup verification failed: {str(e)}")
        raise e
    finally:
        db.close()


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(router, prefix="/api")


@app.get("/")
def root():
    """Root endpoint"""
    return {"message": "Dropzone Management System API"}


@app.get("/health")
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db = next(get_db())
        
        # Check database connectivity
        db.execute(text("SELECT 1"))
        
        # Check if tables exist
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """))
        table_count = result.scalar()
        
        db_status = "healthy"
        db_info = f"Connected with {table_count} tables"
        
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        db_info = "Connection failed"
    finally:
        if 'db' in locals():
            db.close()
    
    return {
        "status": "healthy" if "healthy" in db_status else "unhealthy",
        "database": db_status,
        "database_info": db_info,
        "environment": settings.environment
    }
