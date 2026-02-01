from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Settings
from schemas import SettingsUpdate, SettingsResponse

router = APIRouter()

@router.get("/settings", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(Settings).filter(Settings.id == 1).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings

@router.put("/settings", response_model=SettingsResponse)
def update_settings(update_data: SettingsUpdate, db: Session = Depends(get_db)):
    settings = db.query(Settings).filter(Settings.id == 1).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    settings.conservativity = update_data.conservativity
    if update_data.tracked_sites is not None:
        settings.tracked_sites = update_data.tracked_sites
        
    db.commit()
    db.refresh(settings)
    return settings
