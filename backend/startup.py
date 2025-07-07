#!/usr/bin/env python3
"""
Database startup and migration script
Ensures database is properly initialized before starting the application
"""

import sys
import os
import time
import subprocess
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from app.core.config import settings
from app.models import Base
from app.core.database import SessionLocal, engine


def wait_for_db(max_retries=30, retry_interval=2):
    """Wait for database to be available"""
    print("🔍 Waiting for database connection...")
    
    for attempt in range(max_retries):
        try:
            # Try to connect to the database
            test_engine = create_engine(settings.database_url)
            with test_engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("✅ Database connection established")
            return True
        except OperationalError as e:
            print(f"⏳ Database not ready (attempt {attempt + 1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(retry_interval)
    
    print("❌ Failed to connect to database after maximum retries")
    return False


def run_migrations():
    """Run Alembic migrations"""
    print("🔄 Running database migrations...")
    
    try:
        # Check if migrations directory exists
        if not os.path.exists("alembic/versions"):
            print("📁 Creating migrations directory...")
            os.makedirs("alembic/versions", exist_ok=True)
        
        # Check if there are any migration files
        migration_files = [f for f in os.listdir("alembic/versions") if f.endswith('.py')]
        
        if not migration_files:
            print("📝 No migrations found, creating initial migration...")
            # Create initial migration
            result = subprocess.run(
                ["alembic", "revision", "--autogenerate", "-m", "Initial migration"],
                capture_output=True,
                text=True
            )
            
            if result.returncode != 0:
                print(f"❌ Failed to create initial migration: {result.stderr}")
                return False
            print("✅ Initial migration created")
        else:
            # Check if we need new migrations by comparing models with current database
            print("🔍 Checking if new migrations are needed...")
            check_result = subprocess.run(
                ["alembic", "revision", "--autogenerate", "-m", "Auto-generated migration", "--dry-run"],
                capture_output=True,
                text=True
            )
            
            # If there are changes detected, create a new migration
            if "Detected" in check_result.stdout and ("added table" in check_result.stdout or "added column" in check_result.stdout):
                print("📝 Database schema changes detected, creating new migration...")
                result = subprocess.run(
                    ["alembic", "revision", "--autogenerate", "-m", "Auto-generated migration"],
                    capture_output=True,
                    text=True
                )
                
                if result.returncode != 0:
                    print(f"❌ Failed to create migration: {result.stderr}")
                    return False
                print("✅ New migration created")
        
        # Run migrations
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Database migrations completed successfully")
            return True
        else:
            print(f"❌ Migration failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error running migrations: {e}")
        return False


def ensure_tables_exist():
    """Ensure all tables exist (fallback method)"""
    print("🔧 Ensuring all tables exist...")
    
    try:
        # Create all tables if they don't exist
        Base.metadata.create_all(bind=engine)
        print("✅ Tables verified/created successfully")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False


def initialize_data():
    """Initialize basic data if needed"""
    print("📊 Checking for initial data...")
    
    try:
        from app.crud.dictionaries import dictionary as dict_crud
        
        db = SessionLocal()
        try:
            # Check if any dictionaries exist
            existing_dicts = dict_crud.get_multi(db, limit=1)
            
            if not existing_dicts:
                print("📝 No initial data found")
            else:
                print("✅ Initial data already exists")
            
            return True
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"⚠️  Warning: Could not initialize data: {e}")
        # Don't fail startup if data initialization fails
        return True


def main():
    """Main startup function"""
    print("🚀 Starting Dropzone Management System Backend")
    print("=" * 50)
    
    # Step 1: Wait for database
    if not wait_for_db():
        print("❌ Cannot connect to database. Exiting.")
        sys.exit(1)
    
    # Step 2: Run migrations
    migration_success = run_migrations()
    
    # Step 3: Fallback - ensure tables exist
    if not migration_success:
        print("⚠️  Migration failed, falling back to direct table creation...")
        if not ensure_tables_exist():
            print("❌ Failed to create tables. Exiting.")
            sys.exit(1)
    
    # Step 4: Initialize basic data
    initialize_data()
    
    print("✅ Database startup completed successfully!")
    print("=" * 50)


if __name__ == "__main__":
    main()
