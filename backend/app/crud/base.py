from typing import Generic, TypeVar, Type, List, Optional, Union, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import asc, desc
from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        """
        Base CRUD class with default methods to Create, Read, Update, Delete (CRUD).
        """
        self.model = model

    def get(self, db: Session, id: Any, include_deleted: bool = False) -> Optional[ModelType]:
        """Get a single record by id"""
        query = db.query(self.model).filter(self.model.id == id)
        if not include_deleted and hasattr(self.model, 'deleted_at'):
            query = query.filter(self.model.deleted_at.is_(None))
        return query.first()

    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        order_by: Optional[str] = None,
        desc_order: bool = False,
        include_deleted: bool = False
    ) -> List[ModelType]:
        """Get multiple records with pagination and ordering"""
        query = db.query(self.model)
        
        # Exclude soft-deleted records by default
        if not include_deleted and hasattr(self.model, 'deleted_at'):
            query = query.filter(self.model.deleted_at.is_(None))
        
        if order_by and hasattr(self.model, order_by):
            order_column = getattr(self.model, order_by)
            if desc_order:
                query = query.order_by(desc(order_column))
            else:
                query = query.order_by(asc(order_column))
        
        return query.offset(skip).limit(limit).all()

    def create(self, db: Session, *, obj_in: CreateSchemaType, created_by: Optional[int] = None) -> ModelType:
        """Create a new record"""
        obj_in_data = obj_in.dict() if hasattr(obj_in, 'dict') else obj_in.model_dump()
        if created_by is not None and hasattr(self.model, 'created_by'):
            obj_in_data['created_by'] = created_by
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]],
        updated_by: Optional[int] = None
    ) -> ModelType:
        """Update an existing record"""
        obj_data = db_obj.__dict__
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True) if hasattr(obj_in, 'dict') else obj_in.model_dump(exclude_unset=True)
        
        if updated_by is not None and hasattr(self.model, 'updated_by'):
            update_data['updated_by'] = updated_by
            
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int, deleted_by: Optional[int] = None) -> ModelType:
        """Delete a record"""
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj

    def soft_delete(self, db: Session, *, id: int, deleted_by: Optional[int] = None) -> Optional[ModelType]:
        """Soft delete a record by setting deleted_at timestamp"""
        obj = self.get(db, id=id, include_deleted=False)
        if not obj:
            return None
            
        if hasattr(obj, 'deleted_at'):
            obj.deleted_at = datetime.utcnow()
            if deleted_by is not None and hasattr(obj, 'deleted_by'):
                obj.deleted_by = deleted_by
            db.add(obj)
            db.commit()
            db.refresh(obj)
            return obj
        return None

    def restore(self, db: Session, *, id: int) -> ModelType:
        """Restore a soft-deleted record by clearing deleted_at timestamp"""
        obj = self.get(db, id=id, include_deleted=True)
        if not obj:
            return None
            
        if hasattr(obj, 'deleted_at'):
            obj.deleted_at = None
            if hasattr(obj, 'deleted_by'):
                obj.deleted_by = None
            db.add(obj)
            db.commit()
            db.refresh(obj)
        return obj
