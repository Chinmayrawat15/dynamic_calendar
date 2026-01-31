from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db, Activity, Task, Prediction
from backend.schemas import StatsResponse
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    start_of_day = datetime(today.year, today.month, today.day)
    
    # 1. Today's stats from activities
    # We aggregate all activities created today
    todays_activities = db.query(Activity).filter(Activity.created_at >= start_of_day).all()
    
    total_duration_ms = sum(a.duration_ms for a in todays_activities)
    hours_tracked_today = total_duration_ms / (1000 * 60 * 60)
    
    if total_duration_ms > 0:
        # Weighted average focus score
        weighted_score = sum(a.focus_score * a.duration_ms for a in todays_activities)
        today_focus_score = weighted_score / total_duration_ms
    else:
        today_focus_score = 0.0
        
    # 2. Prediction accuracy
    predictions = db.query(Prediction).filter(Prediction.was_accurate != None).all()
    if predictions:
        accurate_count = sum(1 for p in predictions if p.was_accurate)
        prediction_accuracy_percent = (accurate_count / len(predictions)) * 100
    else:
        prediction_accuracy_percent = 0.0
        
    # 3. Total sessions
    # Using 'tasks' table session_count
    total_sessions = db.query(func.sum(Task.session_count)).scalar() or 0
    
    return {
        "today_focus_score": round(today_focus_score, 2),
        "hours_tracked_today": round(hours_tracked_today, 2),
        "prediction_accuracy_percent": round(prediction_accuracy_percent, 1),
        "total_sessions": total_sessions
    }
