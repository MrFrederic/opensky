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

# Import all models to ensure they're available for Alembic autogenerate
from app.models.users import User, UserRoleAssignment
from app.models.dictionaries import Dictionary, DictionaryValue
from app.models.auth import RefreshToken


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
    """Run Alembic migrations with improved change detection and error handling"""
    print("🔄 Running database migrations...")
    
    try:
        # Ensure Alembic is properly configured
        if not os.path.exists("alembic.ini"):
            print("❌ alembic.ini not found")
            return False
            
        # Check if migrations directory exists
        if not os.path.exists("alembic/versions"):
            print("📁 Creating migrations directory...")
            os.makedirs("alembic/versions", exist_ok=True)
        
        # Get current database revision
        print("🔍 Checking current database revision...")
        current_rev_result = subprocess.run(
            ["alembic", "current"],
            capture_output=True,
            text=True
        )
        
        if current_rev_result.returncode != 0:
            print("📝 Database not initialized, creating initial migration...")
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
            current_revision = current_rev_result.stdout.strip()
            print(f"📝 Current database revision: {current_revision}")
            
            # Check if database is at head revision
            head_result = subprocess.run(
                ["alembic", "heads"],
                capture_output=True,
                text=True
            )
            
            if head_result.returncode == 0:
                head_revision = head_result.stdout.strip()
                if current_revision and head_revision and current_revision.split()[0] == head_revision:
                    print("✅ Database is up to date")
                    return True
            
            # Check if we need new migrations by trying to create one
            print("🔍 Checking for model changes...")
            temp_migration_result = subprocess.run(
                ["alembic", "revision", "--autogenerate", "-m", "temp_check", "--splice"],
                capture_output=True,
                text=True
            )
            
            if temp_migration_result.returncode == 0:
                # Read the generated migration file to see if it has any changes
                migration_files = [f for f in os.listdir("alembic/versions") if f.startswith("temp_check") or "temp_check" in f]
                if migration_files:
                    latest_migration = max(migration_files, key=lambda x: os.path.getctime(os.path.join("alembic/versions", x)))
                    migration_path = os.path.join("alembic/versions", latest_migration)
                    
                    with open(migration_path, 'r') as f:
                        migration_content = f.read()
                    
                    # Check if migration has actual changes (not just empty upgrade/downgrade functions)
                    if ("op.add_column" in migration_content or 
                        "op.create_table" in migration_content or 
                        "op.drop_column" in migration_content or 
                        "op.drop_table" in migration_content or
                        "op.alter_column" in migration_content):
                        
                        print("📝 Database schema changes detected!")
                        # Rename the temp migration to a proper name
                        new_name = migration_path.replace("temp_check", "auto_migration")
                        os.rename(migration_path, new_name)
                        print(f"✅ New migration created: {os.path.basename(new_name)}")
                    else:
                        print("✅ No schema changes detected")
                        # Remove the empty migration file
                        os.remove(migration_path)
                else:
                    print("✅ No schema changes detected")
        
        # Always run migrations to ensure we're up to date
        print("🔄 Applying migrations...")
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            print("✅ Database migrations completed successfully")
            return True
        else:
            # Check if this is a "table already exists" error or similar
            error_output = result.stderr.lower()
            if ("already exists" in error_output or 
                "duplicate" in error_output):
                print("⚠️  Some database objects already exist, attempting to sync migration state...")
                
                # Try to identify which migration should be marked as applied
                # This is a best-effort attempt to recover from partial migration states
                sync_result = _attempt_migration_sync()
                if sync_result:
                    print("✅ Migration state synchronized")
                    return True
                else:
                    print("❌ Could not synchronize migration state")
                    return False
            else:
                print(f"❌ Migration failed: {result.stderr}")
                return False
            
    except Exception as e:
        print(f"❌ Error running migrations: {e}")
        return False


def _attempt_migration_sync():
    """Attempt to synchronize migration state when objects already exist"""
    try:
        # Get list of migration files
        version_files = []
        if os.path.exists("alembic/versions"):
            version_files = [f for f in os.listdir("alembic/versions") if f.endswith('.py') and f != '__init__.py']
        
        if version_files:
            # Sort by creation time to get the latest
            latest_file = max(version_files, key=lambda x: os.path.getctime(os.path.join("alembic/versions", x)))
            # Extract revision ID from filename (first part before underscore)
            revision_id = latest_file.split('_')[0]
            
            print(f"🔄 Attempting to mark migration {revision_id} as applied...")
            result = subprocess.run(
                ["alembic", "stamp", revision_id],
                capture_output=True,
                text=True
            )
            
            return result.returncode == 0
        
        return False
        
    except Exception as e:
        print(f"❌ Error during migration sync: {e}")
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


def initialize_minio():
    """Initialize MinIO bucket and set up file storage"""
    print("🗄️  Initializing MinIO file storage...")
    
    try:
        from minio import Minio
        from minio.error import S3Error
        
        # Create MinIO client
        client = Minio(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure
        )
        
        # Wait for MinIO to be available
        max_retries = 30
        for attempt in range(max_retries):
            try:
                # Test connection by listing buckets
                client.list_buckets()
                print("✅ MinIO connection established")
                break
            except Exception as e:
                print(f"⏳ MinIO not ready (attempt {attempt + 1}/{max_retries}): {e}")
                if attempt < max_retries - 1:
                    time.sleep(2)
                else:
                    print("❌ Failed to connect to MinIO after maximum retries")
                    return False
        
        # Create bucket if it doesn't exist
        bucket_name = settings.minio_bucket_name
        if not client.bucket_exists(bucket_name):
            client.make_bucket(bucket_name)
            print(f"✅ Created MinIO bucket: {bucket_name}")
        else:
            print(f"✅ MinIO bucket already exists: {bucket_name}")
        
        # Set bucket policy to allow public read access for files
        # This allows direct access to uploaded files through the nginx proxy
        policy = f'''{{
            "Version": "2012-10-17",
            "Statement": [
                {{
                    "Effect": "Allow",
                    "Principal": {{"AWS": ["*"]}},
                    "Action": ["s3:GetObject"],
                    "Resource": ["arn:aws:s3:::{bucket_name}/*"]
                }}
            ]
        }}'''
        
        try:
            client.set_bucket_policy(bucket_name, policy)
            print("✅ Set bucket policy for public read access")
        except S3Error as e:
            print(f"⚠️  Could not set bucket policy: {e}")
            print("   Files will still work but may require authentication")
        
        return True
        
    except ImportError:
        print("❌ MinIO library not installed. Install with: pip install minio")
        return False
    except Exception as e:
        print(f"❌ MinIO initialization failed: {e}")
        return False


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
    
    # Step 4: Initialize MinIO storage
    minio_success = initialize_minio()
    if not minio_success:
        print("⚠️  MinIO initialization failed, file uploads may not work properly")
    
    # Step 5: Initialize basic data
    initialize_data()
    
    print("✅ Database startup completed successfully!")
    print("=" * 50)


if __name__ == "__main__":
    main()
