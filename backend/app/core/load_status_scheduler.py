from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.enums import LoadStatus
from app.models.loads import Load
from app.crud.loads import load as crud_load
import logging

logger = logging.getLogger(__name__)


def update_load_statuses():
    db = next(get_db())
    now = datetime.utcnow()
    five_min_later = now + timedelta(minutes=5)
    try:
        # 1. Set loads in FORMING to ON_CALL if within 5 minutes of departure
        forming_loads = db.query(Load).filter(
            Load.status == LoadStatus.FORMING,
            Load.departure <= five_min_later + timedelta(minutes=1),
            Load.departure >= five_min_later,
        ).all()
        for l in forming_loads:
            logger.info(f"Setting Load {l.id} to ON_CALL (departure at {l.departure})")
            crud_load.update_status(db, db_obj=l, new_status=LoadStatus.ON_CALL)

        # 2. Set any load to DEPARTED if departure time has passed and not already departed
        not_departed_loads = db.query(Load).filter(
            Load.status != LoadStatus.DEPARTED,
            Load.departure <= now + timedelta(minutes=1),
            Load.departure >= now,
        ).all()
        for l in not_departed_loads:
            logger.info(f"Setting Load {l.id} to DEPARTED (departure at {l.departure})")
            crud_load.update_status(db, db_obj=l, new_status=LoadStatus.DEPARTED)
        db.commit()
    except Exception as e:
        logger.error(f"Error updating load statuses: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(update_load_statuses, 'interval', seconds=30)
    scheduler.start()
    logger.info("Started load status update scheduler.")
