"""
Predictions Router - Handles task duration predictions.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as DBSession

from models import PredictionResponse
from database import get_db
from services.prediction_engine import PredictionEngine

router = APIRouter()


@router.get("/predictions", response_model=PredictionResponse)
async def get_prediction(
    task_category: str = Query(..., description="Category of task to predict"),
    conservativity: float = Query(0.5, ge=0, le=1, description="0=aggressive, 1=conservative"),
    db: DBSession = Depends(get_db)
):
    """
    Get duration prediction for a task category.

    The conservativity parameter adjusts predictions:
    - 0.0 (Aggressive): Use median - optimistic, assumes smooth execution
    - 0.5 (Balanced): Midpoint between median and 90th percentile
    - 1.0 (Conservative): Use 90th percentile - accounts for interruptions
    """
    print(f"🔮 Prediction request: category={task_category}, conservativity={conservativity}")

    engine = PredictionEngine(db)
    prediction = engine.predict(task_category, conservativity)

    # Also record this prediction for accuracy tracking
    if prediction.based_on_sessions > 0:
        engine.record_prediction(
            task_category=task_category,
            predicted_minutes=prediction.predicted_minutes,
            conservativity=conservativity
        )

    return prediction
