from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db, Activity, CATEGORIES
from schemas import ActivityLog, ActivityResponse
from datetime import datetime

router = APIRouter()

def categorize_domain(domain: str) -> str:
    for category, domains in CATEGORIES.items():
        if any(d in domain for d in domains):
            return category
    return "uncategorized"

@router.post("/activity", response_model=ActivityResponse)
def log_activity(log: ActivityLog, db: Session = Depends(get_db)):
    # 1. Categorize
    category = categorize_domain(log.domain)
    
    # 2. Store in activities table
    # Privacy: raw URLs/titles never leave local backend (they are here, in the backend)
    # We store them in the DB.
    
    new_activity = Activity(
        task_name=log.task_name,
        domain=log.domain,
        title=log.title,
        duration_ms=log.duration_ms,
        focus_score=log.focus_score,
        tab_switches=log.tab_switches,
        category=category,
        created_at=log.timestamp or datetime.utcnow()
    )
    db.add(new_activity)
    
    db.commit()
    
    return {"status": "logged", "count": 1}
