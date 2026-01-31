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
    - 0.0: Use median (optimistic, assumes good conditions)
    - 1.0: Use 90th percentile (accounts for interruptions, bad days)

    TODO: Person B - Replace mock with real prediction engine
    """
    # STUB: Log the request
    print(f"🔮 Prediction request: category={task_category}, conservativity={conservativity}")

    # TODO: Person B - Use real prediction engine
    # engine = PredictionEngine(db)
    # prediction = engine.predict(task_category, conservativity)
    # return prediction

    # MOCK: Return realistic predictions based on category
    category_predictions = {
        "coding": {"base": 45, "sessions": 23},
        "writing": {"base": 30, "sessions": 15},
        "meeting": {"base": 55, "sessions": 31},
        "research": {"base": 40, "sessions": 12},
        "design": {"base": 50, "sessions": 8},
        "review": {"base": 25, "sessions": 19},
    }

    # Get base prediction or default
    category_data = category_predictions.get(
        task_category.lower(),
        {"base": 35, "sessions": 5}
    )

    base_minutes = category_data["base"]
    sessions = category_data["sessions"]

    # Apply conservativity adjustment
    # Conservative adds buffer for interruptions
    buffer = int(20 * conservativity)  # Up to 20 minutes buffer
    predicted_minutes = base_minutes + buffer

    # Determine confidence based on session count
    if sessions >= 20:
        confidence = "high"
    elif sessions >= 10:
        confidence = "medium"
    else:
        confidence = "low"

    return PredictionResponse(
        predicted_minutes=predicted_minutes,
        confidence=confidence,
        based_on_sessions=sessions,
        explanation=f"Based on {sessions} previous '{task_category}' sessions. "
                    f"Median duration: {base_minutes}min. "
                    f"Conservativity {conservativity:.0%} adds {buffer}min buffer."
    )
