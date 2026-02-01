"""
Activity Router - Handles activity logging from the Chrome extension.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from datetime import datetime, timedelta

from models import ActivityRequest, ActivityResponse
from database import get_db, Activity, Session

router = APIRouter()


@router.post("/activity", response_model=ActivityResponse)
async def log_activity(request: ActivityRequest, db: DBSession = Depends(get_db)):
    """
    Log activity data from the Chrome extension.

    Called every 30 seconds by the extension with batched activity data.
    Stores activities and creates/updates session records.
    """
    print(f"📝 Received activity: {request.task_name}")
    print(f"   Activities: {len(request.activities)}")
    print(f"   Tab switches: {request.tab_switches}")
    print(f"   Focus score: {request.focus_score}")

    # Store each activity in the database
    total_duration_ms = 0
    earliest_start = None
    latest_end = None

    for activity_item in request.activities:
        start_time = datetime.fromtimestamp(activity_item.start_time / 1000)
        end_time = datetime.fromtimestamp(activity_item.end_time / 1000)

        activity = Activity(
            task_name=request.task_name,
            url=activity_item.url,
            domain=activity_item.domain,
            title=activity_item.title,
            duration_ms=activity_item.duration_ms,
            start_time=start_time,
            end_time=end_time,
        )
        db.add(activity)

        total_duration_ms += activity_item.duration_ms

        if earliest_start is None or start_time < earliest_start:
            earliest_start = start_time
        if latest_end is None or end_time > latest_end:
            latest_end = end_time

    # Find or create session for this task
    # Look for an existing session with the same task name within the last hour
    one_hour_ago = datetime.utcnow() - timedelta(hours=1)
    existing_session = db.query(Session).filter(
        Session.task_name == request.task_name,
        Session.start_time >= one_hour_ago
    ).order_by(Session.start_time.desc()).first()

    if existing_session:
        # Update existing session
        existing_session.end_time = latest_end or datetime.utcnow()
        existing_session.focus_score = request.focus_score
        existing_session.tab_switches = (existing_session.tab_switches or 0) + request.tab_switches
        existing_session.total_duration_ms = (existing_session.total_duration_ms or 0) + total_duration_ms
    else:
        # Create new session
        new_session = Session(
            task_name=request.task_name,
            start_time=earliest_start or datetime.utcnow(),
            end_time=latest_end or datetime.utcnow(),
            focus_score=request.focus_score,
            tab_switches=request.tab_switches,
            total_duration_ms=total_duration_ms,
        )
        db.add(new_session)

    db.commit()

    return ActivityResponse(
        status="logged",
        count=len(request.activities)
    )
