#!/usr/bin/env python3
"""
Development initialization script
Creates basic dictionaries and an admin user for testing
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import Base
from app.crud.dictionaries import dictionary as dict_crud, dictionary_value as dict_value_crud
from app.crud.users import user as user_crud
from app.schemas.dictionaries import DictionaryCreate, DictionaryValueCreate
from app.schemas.users import UserCreate
from app.models.base import UserStatus

def init_db():
    """Initialize database with basic data"""
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create dictionaries
        dictionaries_data = [
            ("jump_type", [
                ("tandem", True),
                ("sport", True), 
                ("aff", True),
                ("aff_instructor", True)
            ]),
            ("equipment_type", [
                ("main_parachute", True),
                ("reserve_parachute", True),
                ("safety_device", True),
                ("harness", True),
                ("helmet", True)
            ]),
            ("equipment_name", [
                ("Д1-5-У", False),
                ("ПКУ", False),
                ("Cypres 2", False),
                ("Vigil+", False),
                ("Student Harness", False)
            ]),
            ("equipment_status", [
                ("available", True),
                ("maintenance", True),
                ("out_of_service", True),
                ("reserved", True)
            ]),
            ("load_status", [
                ("planned", True),
                ("boarding", True),
                ("airborne", True),
                ("completed", True),
                ("cancelled", True)
            ]),
            ("payment_status", [
                ("pending", True),
                ("paid", True),
                ("free", True),
                ("waived", True)
            ])
        ]
        
        for dict_name, values in dictionaries_data:
            # Check if dictionary exists
            existing_dict = dict_crud.get_by_name(db, name=dict_name)
            if not existing_dict:
                # Create dictionary
                dict_create = DictionaryCreate(name=dict_name, is_active=True)
                new_dict = dict_crud.create(db, obj_in=dict_create)
                
                # Add values
                for value, is_system in values:
                    value_create = DictionaryValueCreate(
                        dictionary_id=new_dict.id,
                        value=value,
                        is_system=is_system,
                        is_active=True
                    )
                    dict_value_crud.create(db, obj_in=value_create)
                
                print(f"Created dictionary: {dict_name}")
            else:
                print(f"Dictionary already exists: {dict_name}")
        
        # Create admin user
        admin_telegram_id = "123456789"  # Test Telegram ID
        existing_admin = user_crud.get_by_telegram_id(db, telegram_id=admin_telegram_id)
        
        if not existing_admin:
            admin_create = UserCreate(
                telegram_id=admin_telegram_id,
                first_name="Admin",
                last_name="User",
                username="admin",
                email="admin@dropzone.local",
                status=UserStatus.INSTRUCTOR,
                is_admin=True
            )
            admin_user = user_crud.create(db, obj_in=admin_create)
            print(f"Created admin user: {admin_user.first_name} {admin_user.last_name}")
        else:
            print("Admin user already exists")
        
        print("Database initialization completed!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
