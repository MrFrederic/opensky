from typing import Generic, TypeVar, Type, List, Optional, Union, Dict, Any
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

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """Get a single record by id"""
        return db.query(self.model).filter(self.model.id == id).first()

    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        order_by: Optional[str] = None,
        desc_order: bool = False
    ) -> List[ModelType]:
        """Get multiple records with pagination and ordering"""
        query = db.query(self.model)
        
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

    def remove(self, db: Session, *, id: int) -> ModelType:
        """Delete a record"""
        obj = db.query(self.model).get(id)
        db.delete(obj)
        db.commit()
        return obj
