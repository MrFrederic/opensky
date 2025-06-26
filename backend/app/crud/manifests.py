from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.manifests import Manifest
from app.models.base import ManifestStatus
from app.schemas.manifests import ManifestCreate, ManifestUpdate


class CRUDManifest(CRUDBase[Manifest, ManifestCreate, ManifestUpdate]):
    def get_pending(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Manifest]:
        """Get pending manifests ordered by creation date (oldest first)"""
        return (
            db.query(Manifest)
            .filter(Manifest.status == ManifestStatus.PENDING)
            .order_by(Manifest.created_at.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_user(self, db: Session, *, user_id: int, skip: int = 0, limit: int = 100) -> List[Manifest]:
        """Get manifests by user"""
        return (
            db.query(Manifest)
            .filter(Manifest.user_id == user_id)
            .order_by(Manifest.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_status(self, db: Session, *, status: ManifestStatus, skip: int = 0, limit: int = 100) -> List[Manifest]:
        """Get manifests by status"""
        return (
            db.query(Manifest)
            .filter(Manifest.status == status)
            .order_by(Manifest.created_at.asc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def approve_manifest(self, db: Session, *, manifest: Manifest, updated_by: Optional[int] = None) -> Manifest:
        """Approve a manifest"""
        manifest.status = ManifestStatus.APPROVED
        if updated_by:
            manifest.updated_by = updated_by
        db.add(manifest)
        db.commit()
        db.refresh(manifest)
        return manifest

    def decline_manifest(self, db: Session, *, manifest: Manifest, reason: str, updated_by: Optional[int] = None) -> Manifest:
        """Decline a manifest with reason"""
        manifest.status = ManifestStatus.DECLINED
        manifest.decline_reason = reason
        if updated_by:
            manifest.updated_by = updated_by
        db.add(manifest)
        db.commit()
        db.refresh(manifest)
        return manifest

    def create_with_equipment(self, db: Session, *, obj_in: ManifestCreate, user_id: int, created_by: Optional[int] = None) -> Manifest:
        """Create manifest with equipment associations"""
        from app.crud.equipment import equipment as equipment_crud
        
        # Create manifest without equipment first
        manifest_data = obj_in.dict(exclude={'equipment_ids'})
        manifest_data['user_id'] = user_id
        if created_by:
            manifest_data['created_by'] = created_by
            
        manifest = Manifest(**manifest_data)
        db.add(manifest)
        db.flush()  # Flush to get the ID
        
        # Add equipment associations
        if obj_in.equipment_ids:
            for equipment_id in obj_in.equipment_ids:
                equipment_obj = equipment_crud.get(db, id=equipment_id)
                if equipment_obj:
                    manifest.equipment.append(equipment_obj)
        
        db.commit()
        db.refresh(manifest)
        return manifest


manifest = CRUDManifest(Manifest)
