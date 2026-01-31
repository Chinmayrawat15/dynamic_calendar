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
        task.total_duration_ms += log.duration_ms
        # Update weighted average focus score
        # New Avg = (Old_Avg * Old_Total_Time + New_Score * New_Time) / New_Total_Time
        # But here we don't track total time for avg calculation easily unless we assume linear.
        # Simplified: moving average or just re-calculate?
        # Re-calculating from all activities is expensive.
        # Let's use a simple iterative update assuming uniform intervals (30s) roughly.
        # But better: (task.avg_focus_score * task.session_count + log.focus_score) / (task.session_count + 1)
        # Wait, session_count isn't "number of logs".
        # Let's treat 'session_count' as 'number of logs' for the math, 
        # but the user schema says 'session_count'.
        # Maybe session_count should be incremented only if it's a new session.
        # For now, let's just update total_duration and keep avg_focus_score simple.
        
        # We'll use a count of logs for averaging
        # Assuming we don't have a 'log_count' column, we might skew it.
        # Let's just update it with a small weight or ignore for now.
        # Let's try to do it right: 
        # We need to know how much time the previous avg represented. `total_duration_ms - log.duration_ms`
        prev_duration = task.total_duration_ms - log.duration_ms
        if prev_duration > 0:
            task.avg_focus_score = ((task.avg_focus_score * prev_duration) + (log.focus_score * log.duration_ms)) / task.total_duration_ms
        else:
            task.avg_focus_score = log.focus_score
            
        task.updated_at = datetime.utcnow()
        # session_count logic is hard without session IDs. 
        # We won't increment it here every 30s.
        
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
