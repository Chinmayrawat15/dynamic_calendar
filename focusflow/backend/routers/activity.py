"""
Activity Router - Handles activity logging from the Chrome extension.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
from datetime import datetime

from models import ActivityRequest, ActivityResponse
from database import get_db, Activity, Session

router = APIRouter()


@router.post("/activity", response_model=ActivityResponse)
async def log_activity(request: ActivityRequest, db: DBSession = Depends(get_db)):
    """
    Log activity data from the Chrome extension.

    Called every 30 seconds by the extension with batched activity data.

    TODO: Person B - Replace mock implementation with real database storage
    """
    # STUB: Log the incoming data
    print(f"📝 Received activity: {request.task_name}")
    print(f"   Activities: {len(request.activities)}")
    print(f"   Tab switches: {request.tab_switches}")
    print(f"   Focus score: {request.focus_score}")

    # TODO: Person B - Store activities in database
    # for activity_item in request.activities:
    #     activity = Activity(
    #         task_name=request.task_name,
    #         url=activity_item.url,
    #         domain=activity_item.domain,
    #         title=activity_item.title,
    #         duration_ms=activity_item.duration_ms,
    #         start_time=datetime.fromtimestamp(activity_item.start_time / 1000),
    #         end_time=datetime.fromtimestamp(activity_item.end_time / 1000),
    #     )
    #     db.add(activity)
    # db.commit()

    # TODO: Person B - Create or update session record
    # session = Session(
    #     task_name=request.task_name,
    #     focus_score=request.focus_score,
    #     tab_switches=request.tab_switches,
    #     ...
    # )

    return ActivityResponse(
        status="logged",
        count=len(request.activities)
    )
