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

    TODO: Person B - Replace mock with real database queries
    """
    # TODO: Person B - Calculate real stats from database
    #
    # today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    #
    # # Today's focus score (average of all sessions today)
    # today_sessions = db.query(Session).filter(
    #     Session.start_time >= today_start
    # ).all()
    # today_focus_score = sum(s.focus_score for s in today_sessions) / len(today_sessions) if today_sessions else 0
    #
    # # Hours tracked today
    # today_activities = db.query(Activity).filter(
    #     Activity.created_at >= today_start
    # ).all()
    # hours_tracked = sum(a.duration_ms for a in today_activities) / (1000 * 60 * 60)
    #
    # # Prediction accuracy
    # completed_predictions = db.query(Prediction).filter(
    #     Prediction.actual_minutes.isnot(None)
    # ).all()
    # if completed_predictions:
    #     errors = [abs(p.predicted_minutes - p.actual_minutes) / p.actual_minutes
    #               for p in completed_predictions]
    #     accuracy = (1 - sum(errors) / len(errors)) * 100
    # else:
    #     accuracy = 0
    #
    # # Total sessions
    # total_sessions = db.query(Session).count()
    #
    # return StatsResponse(
    #     today_focus_score=today_focus_score,
    #     hours_tracked_today=hours_tracked,
    #     prediction_accuracy_percent=accuracy,
    #     total_sessions=total_sessions
    # )

    # MOCK: Return realistic mock data
    return StatsResponse(
        today_focus_score=73.5,
        hours_tracked_today=4.5,
        prediction_accuracy_percent=82.3,
        total_sessions=47
    )
