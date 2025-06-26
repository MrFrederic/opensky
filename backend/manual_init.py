#!/usr/bin/env python3
"""
Manual database initialization script for development
Can be run independently to set up the database
"""

import sys
import os
import subprocess
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.core.config import settings
from app.core.database import SessionLocal, engine
from app.models import Base
from sqlalchemy import text
from sqlalchemy.exc import OperationalError


def check_database_connection():
    """Check if database is accessible"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ Database connection successful")
        return True
    except OperationalError as e:
        print(f"❌ Database connection failed: {e}")
        print(f"   Database URL: {settings.database_url}")
        return False


def create_tables():
    """Create all database tables"""
    try:
        print("🔧 Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to create tables: {e}")
        return False


def initialize_alembic():
    """Initialize Alembic if not already done"""
    try:
        # Check if alembic is already initialized
        if not os.path.exists("alembic/versions"):
            os.makedirs("alembic/versions", exist_ok=True)
            print("📁 Created alembic versions directory")
        
        # Check for existing migrations
        migration_files = list(Path("alembic/versions").glob("*.py"))
        
        if not migration_files:
            print("📝 Creating initial Alembic migration...")
            result = subprocess.run(
                ["alembic", "revision", "--autogenerate", "-m", "Initial migration"],
                capture_output=True,
                text=True,
                cwd=project_root
            )
            
            if result.returncode == 0:
                print("✅ Initial migration created")
            else:
                print(f"⚠️  Failed to create migration: {result.stderr}")
                return False
        
        # Stamp the database with the current migration
        print("🏷️  Stamping database with current migration...")
        result = subprocess.run(
            ["alembic", "stamp", "head"],
            capture_output=True,
            text=True,
            cwd=project_root
        )
        
        if result.returncode == 0:
            print("✅ Database stamped successfully")
            return True
        else:
            print(f"⚠️  Failed to stamp database: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error initializing Alembic: {e}")
        return False


def initialize_data():
    """Initialize basic application data"""
    try:
        print("📊 Initializing basic data...")
        from init_dev_db import init_db
        init_db()
        print("✅ Basic data initialized")
        return True
    except Exception as e:
        print(f"⚠️  Failed to initialize data: {e}")
        print("   Database structure is ready, you can initialize data manually later")
        return False


def main():
    """Main initialization function"""
    print("🚀 Manual Database Initialization")
    print("=" * 40)
    
    # Check database connection
    if not check_database_connection():
        print("\n💡 Make sure PostgreSQL is running and accessible.")
        print("   For Docker: docker-compose up postgres")
        sys.exit(1)
    
    # Create tables
    if not create_tables():
        sys.exit(1)
    
    # Initialize Alembic
    if not initialize_alembic():
        print("⚠️  Alembic initialization failed, but continuing...")
    
    # Initialize data
    if not initialize_data():
        print("⚠️  Data initialization failed, but database structure is ready")
    
    print("\n✅ Database initialization completed!")
    print("   You can now start the application")


if __name__ == "__main__":
    main()
