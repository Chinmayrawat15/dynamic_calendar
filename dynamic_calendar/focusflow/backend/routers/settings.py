"""
Settings Router - Handles user settings management.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DBSession
import json

from models import SettingsResponse, SettingsUpdateRequest, SettingsUpdateResponse
from database import get_db, Setting

router = APIRouter()


@router.get("/settings", response_model=SettingsResponse)
async def get_settings(db: DBSession = Depends(get_db)):
    """
    Get current user settings.

    TODO: Person B - This works but may need optimization
    """
    # Get conservativity setting
    conservativity_setting = db.query(Setting).filter(Setting.key == "conservativity").first()
    conservativity = float(conservativity_setting.value) if conservativity_setting else 0.5

    # Get tracked sites
    tracked_sites_setting = db.query(Setting).filter(Setting.key == "tracked_sites").first()
    tracked_sites = json.loads(tracked_sites_setting.value) if tracked_sites_setting else []

    return SettingsResponse(
        conservativity=conservativity,
        tracked_sites=tracked_sites
    )


@router.put("/settings", response_model=SettingsUpdateResponse)
async def update_settings(
    request: SettingsUpdateRequest,
    db: DBSession = Depends(get_db)
):
    """
    Update user settings.

    Partial updates supported - only provided fields are updated.

    TODO: Person B - This works but may need optimization
    """
    # Update conservativity if provided
    if request.conservativity is not None:
        setting = db.query(Setting).filter(Setting.key == "conservativity").first()
        if setting:
            setting.value = str(request.conservativity)
        else:
            db.add(Setting(key="conservativity", value=str(request.conservativity)))
        print(f"⚙️ Updated conservativity: {request.conservativity}")

    # Update tracked sites if provided
    if request.tracked_sites is not None:
        setting = db.query(Setting).filter(Setting.key == "tracked_sites").first()
        if setting:
            setting.value = json.dumps(request.tracked_sites)
        else:
            db.add(Setting(key="tracked_sites", value=json.dumps(request.tracked_sites)))
        print(f"⚙️ Updated tracked sites: {request.tracked_sites}")

    db.commit()

    return SettingsUpdateResponse(status="updated")
