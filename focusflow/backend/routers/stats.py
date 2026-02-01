"""
Stats Router - Handles dashboard statistics.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, timedelta

from models import StatsResponse
from database import get_db, Activity, Session, Prediction

router = APIRouter()


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: DBSession = Depends(get_db)):
    """
    Get dashboard statistics.

    Returns aggregated stats for the dashboard display.
    Calculates real stats from the database.
    """
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    # Today's focus score (average of all sessions today)
    today_sessions = db.query(Session).filter(
        Session.start_time >= today_start
    ).all()

    if today_sessions:
        valid_scores = [s.focus_score for s in today_sessions if s.focus_score is not None]
        today_focus_score = sum(valid_scores) / len(valid_scores) if valid_scores else 0.0
    else:
        today_focus_score = 0.0

    # Hours tracked today
    today_activities = db.query(Activity).filter(
        Activity.created_at >= today_start
    ).all()

    total_ms = sum(a.duration_ms for a in today_activities if a.duration_ms is not None)
    hours_tracked = total_ms / (1000 * 60 * 60)

    # Prediction accuracy (MAPE-based)
    completed_predictions = db.query(Prediction).filter(
        Prediction.actual_minutes.isnot(None)
    ).all()

    if completed_predictions:
        errors = []
        for p in completed_predictions:
            if p.actual_minutes and p.actual_minutes > 0:
                error = abs(p.predicted_minutes - p.actual_minutes) / p.actual_minutes
                errors.append(error)
        accuracy = (1 - sum(errors) / len(errors)) * 100 if errors else 0.0
        accuracy = max(0.0, min(100.0, accuracy))  # Clamp to 0-100
    else:
        # If no completed predictions, show a reasonable default
        accuracy = 0.0

    # Total sessions
    total_sessions = db.query(Session).count()

    return StatsResponse(
        today_focus_score=round(today_focus_score, 1),
        hours_tracked_today=round(hours_tracked, 2),
        prediction_accuracy_percent=round(accuracy, 1),
        total_sessions=total_sessions
    )
