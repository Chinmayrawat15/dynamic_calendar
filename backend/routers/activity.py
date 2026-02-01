from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.database import get_db, Activity, CATEGORIES
from backend.schemas import ActivityLog, ActivityResponse
from datetime import datetime, timedelta

router = APIRouter()

def categorize_domain(domain: str) -> str:
    for category, domains in CATEGORIES.items():
        if any(d in domain for d in domains):
            return category
    return "uncategorized"

def derive_event_times(log: ActivityLog) -> tuple[datetime, datetime]:
    if log.start_time and log.end_time:
        return log.start_time, log.end_time

    if log.start_time and log.duration_ms:
        end_time = log.start_time + timedelta(milliseconds=log.duration_ms)
        return log.start_time, end_time

    if log.end_time and log.duration_ms:
        start_time = log.end_time - timedelta(milliseconds=log.duration_ms)
        return start_time, log.end_time

    if log.timestamp:
        end_time = log.timestamp
        start_time = end_time - timedelta(milliseconds=log.duration_ms)
        return start_time, end_time

    end_time = datetime.utcnow()
    start_time = end_time - timedelta(milliseconds=log.duration_ms)
    return start_time, end_time

@router.post("/activity", response_model=ActivityResponse)
def log_activity(log: ActivityLog, db: Session = Depends(get_db)):
    # 1. Categorize
    category = categorize_domain(log.domain)
    
    # 2. Store in activities table
    # Privacy: raw URLs/titles never leave local backend (they are here, in the backend)
    # We store them in the DB.
    
    start_time, end_time = derive_event_times(log)
    title = log.summary or log.title or log.task_name or log.domain

    distractions_count = log.distractions_count if log.distractions_count is not None else log.tab_switches
    distractions_total_time_ms = log.distractions_total_time_ms or 0

    new_activity = Activity(
        event_id=log.event_id,
        user_id=log.user_id or "default",
        event_date=start_time.date(),
        task_name=log.task_name,
        domain=log.domain,
        title=title,
        description=log.description,
        start_time=start_time,
        end_time=end_time,
        duration_ms=log.duration_ms,
        focus_score=log.focus_score,
        tab_switches=log.tab_switches,
        distractions_count=distractions_count,
        distractions_total_time_ms=distractions_total_time_ms,
        source="extension",
        status="recorded",
        category=category,
        created_at=log.timestamp or datetime.utcnow()
    )
    db.add(new_activity)
    
    db.commit()
    
    return {"status": "logged", "count": 1}
