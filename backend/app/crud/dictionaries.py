from typing import List, Optional, Union
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.dictionaries import Dictionary, DictionaryValue
from app.schemas.dictionaries import DictionaryCreate, DictionaryUpdate, DictionaryValueCreate, DictionaryValueUpdate


class CRUDDictionary(CRUDBase[Dictionary, DictionaryCreate, DictionaryUpdate]):
    def get_dictionary(
        self,
        db: Session,
        *,
        id: Optional[int] = None,
        name: Optional[str] = None,
        is_active: Optional[bool] = None,
        is_system: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Union[Optional[Dictionary], List[Dictionary]]:
        """Get dictionary by id or filter dictionaries by name, is_active, is_system"""
        query = db.query(Dictionary)
        
        # If ID is provided, return specific dictionary
        if id is not None:
            return query.filter(Dictionary.id == id).first()
        
        # Apply filters
        if name is not None:
            query = query.filter(Dictionary.name == name)
        if is_active is not None:
            query = query.filter(Dictionary.is_active == is_active)
        if is_system is not None:
            query = query.filter(Dictionary.is_system == is_system)
        
        return query.offset(skip).limit(limit).all()

    def create_dictionary(self, db: Session, *, obj_in: DictionaryCreate, created_by: Optional[int] = None) -> Dictionary:
        """Create a new dictionary (always is_system=false)"""
        obj_in_data = obj_in.model_dump()
        obj_in_data['is_system'] = False  # Always set to false for new dictionaries
        if created_by is not None:
            obj_in_data['created_by'] = created_by
        
        db_obj = Dictionary(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_dictionary(self, db: Session, *, id: int, name: str, updated_by: Optional[int] = None) -> Optional[Dictionary]:
        """Update dictionary name"""
        obj = db.query(Dictionary).filter(Dictionary.id == id).first()
        if obj:
            obj.name = name
            if updated_by is not None:
                obj.updated_by = updated_by
            db.add(obj)
            db.commit()
            db.refresh(obj)
        return obj

    def delete_dictionary(self, db: Session, *, id: int, updated_by: Optional[int] = None) -> Optional[Dictionary]:
        """Toggle is_active status for a dictionary (soft delete/restore), but block deletion if is_system=True"""
        obj = db.query(Dictionary).filter(Dictionary.id == id).first()
        if obj:
            # Block deletion of system dictionaries
            if obj.is_system:
                return None  # Signal that deletion is blocked
            
            obj.is_active = not obj.is_active  # Toggle the active status
            if updated_by is not None:
                obj.updated_by = updated_by
            db.add(obj)
            db.commit()
            db.refresh(obj)
        return obj


class CRUDDictionaryValue(CRUDBase[DictionaryValue, DictionaryValueCreate, DictionaryValueUpdate]):
    def get_dictionary_value(
        self,
        db: Session,
        *,
        id: Optional[int] = None,
        dictionary_id: Optional[int] = None,
        dictionary_name: Optional[str] = None,
        value: Optional[str] = None,
        is_active: Optional[bool] = True,
        is_system: Optional[bool] = None,
        skip: int = 0,
        limit: int = 100
    ) -> Union[Optional[DictionaryValue], List[DictionaryValue]]:
        """Get dictionary value by id or filter dictionary values by various parameters"""
        query = db.query(DictionaryValue)
        
        # If ID is provided, return specific dictionary value
        if id is not None:
            return query.filter(DictionaryValue.id == id).first()
        
        # Apply filters
        if dictionary_id is not None:
            query = query.filter(DictionaryValue.dictionary_id == dictionary_id)
        if dictionary_name is not None:
            query = query.join(Dictionary).filter(Dictionary.name == dictionary_name)
        if value is not None:
            query = query.filter(DictionaryValue.value == value)
        if is_active is not None:
            query = query.filter(DictionaryValue.is_active == is_active)
        if is_system is not None:
            query = query.filter(DictionaryValue.is_system == is_system)
        
        return query.order_by(DictionaryValue.value).offset(skip).limit(limit).all()

    def create_dictionary_value(self, db: Session, *, obj_in: DictionaryValueCreate, created_by: Optional[int] = None) -> DictionaryValue:
        """Create a new dictionary value (always is_system=false)"""
        obj_in_data = obj_in.model_dump()
        obj_in_data['is_system'] = False  # Always set to false for new dictionary values
        if created_by is not None:
            obj_in_data['created_by'] = created_by
        
        db_obj = DictionaryValue(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_dictionary_value(self, db: Session, *, id: int, value: str, updated_by: Optional[int] = None) -> Optional[DictionaryValue]:
        """Update dictionary value"""
        obj = db.query(DictionaryValue).filter(DictionaryValue.id == id).first()
        if obj:
            obj.value = value
            if updated_by is not None:
                obj.updated_by = updated_by
            db.add(obj)
            db.commit()
            db.refresh(obj)
        return obj

    def delete_dictionary_value(self, db: Session, *, id: int, updated_by: Optional[int] = None) -> Optional[DictionaryValue]:
        """Toggle is_active status for a dictionary value (soft delete/restore), but block deletion if is_system=True"""
        obj = db.query(DictionaryValue).filter(DictionaryValue.id == id).first()
        if obj:
            # Block deletion of system dictionary values
            if obj.is_system:
                return None  # Signal that deletion is blocked
            
            obj.is_active = not obj.is_active  # Toggle the active status
            if updated_by is not None:
                obj.updated_by = updated_by
            db.add(obj)
            db.commit()
            db.refresh(obj)
        return obj


dictionary = CRUDDictionary(Dictionary)
dictionary_value = CRUDDictionaryValue(DictionaryValue)
