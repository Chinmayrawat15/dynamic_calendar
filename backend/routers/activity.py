from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from backend.database import get_db, Activity, Task, CATEGORIES
from backend.schemas import ActivityLog, ActivityResponse
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
    
    # 3. Update tasks aggregate
    # We identify a task by 'task_name'. If not present, use domain.
    task_identifier = log.task_name if log.task_name else log.domain
    
    task = db.query(Task).filter(Task.name == task_identifier).first()
    
    if task:
        # Update existing task
        prev_duration = task.total_duration_ms
        task.total_duration_ms += log.duration_ms
        
        # Update weighted average focus score
        if task.total_duration_ms > 0:
            task.avg_focus_score = (
                (task.avg_focus_score * prev_duration) + 
                (log.focus_score * log.duration_ms)
            ) / task.total_duration_ms
            
        task.updated_at = datetime.utcnow()
        
    else:
        # Create new task
        task = Task(
            name=task_identifier,
            category=category,
            total_duration_ms=log.duration_ms,
            session_count=1, # First session
            avg_focus_score=log.focus_score,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(task)
    
    db.commit()
    
    return {"status": "logged", "count": 1}
