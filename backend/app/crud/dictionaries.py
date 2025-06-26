from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.base import Dictionary, DictionaryValue
from app.schemas.dictionaries import DictionaryCreate, DictionaryUpdate, DictionaryValueCreate, DictionaryValueUpdate


class CRUDDictionary(CRUDBase[Dictionary, DictionaryCreate, DictionaryUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[Dictionary]:
        """Get dictionary by name"""
        return db.query(Dictionary).filter(Dictionary.name == name).first()

    def get_active(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Dictionary]:
        """Get active dictionaries"""
        return (
            db.query(Dictionary)
            .filter(Dictionary.is_active == True)
            .offset(skip)
            .limit(limit)
            .all()
        )


class CRUDDictionaryValue(CRUDBase[DictionaryValue, DictionaryValueCreate, DictionaryValueUpdate]):
    def get_by_dictionary(self, db: Session, *, dictionary_id: int, active_only: bool = True) -> List[DictionaryValue]:
        """Get values for a dictionary"""
        query = db.query(DictionaryValue).filter(DictionaryValue.dictionary_id == dictionary_id)
        if active_only:
            query = query.filter(DictionaryValue.is_active == True)
        return query.order_by(DictionaryValue.value).all()

    def get_by_dictionary_name(self, db: Session, *, dictionary_name: str, active_only: bool = True) -> List[DictionaryValue]:
        """Get values by dictionary name"""
        query = (
            db.query(DictionaryValue)
            .join(Dictionary)
            .filter(Dictionary.name == dictionary_name)
        )
        if active_only:
            query = query.filter(DictionaryValue.is_active == True)
        return query.order_by(DictionaryValue.value).all()

    def get_system_values(self, db: Session, *, dictionary_id: int) -> List[DictionaryValue]:
        """Get system values (cannot be deleted)"""
        return (
            db.query(DictionaryValue)
            .filter(DictionaryValue.dictionary_id == dictionary_id)
            .filter(DictionaryValue.is_system == True)
            .all()
        )

    def remove(self, db: Session, *, id: int) -> Optional[DictionaryValue]:
        """Delete a dictionary value (only if not system)"""
        obj = db.query(DictionaryValue).get(id)
        if obj and not obj.is_system:
            db.delete(obj)
            db.commit()
            return obj
        return None


dictionary = CRUDDictionary(Dictionary)
dictionary_value = CRUDDictionaryValue(DictionaryValue)
