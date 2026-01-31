from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Settings
from services.prediction_engine import get_prediction
from schemas import PredictionResponse

router = APIRouter()

@router.get("/predictions", response_model=PredictionResponse)
def predict_duration(
    task_category: str = Query(..., description="Category of the task"),
    conservativity: float = Query(None, ge=0.0, le=1.0, description="Conservativity factor (optional, overrides settings)"),
    db: Session = Depends(get_db)
):
    result = get_prediction(db, task_category, conservativity)
    return result
