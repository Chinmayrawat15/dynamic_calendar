from sqlalchemy.orm import Session
from database import Task, Settings
import logging

logger = logging.getLogger(__name__)

def calculate_percentile(data, percentile):
    if not data:
        return 0
    data.sort()
    index = (len(data) - 1) * percentile / 100
    lower = int(index)
    upper = lower + 1
    weight = index - lower
    if upper >= len(data):
        return data[lower]
    return data[lower] * (1 - weight) + data[upper] * weight

def get_prediction(db: Session, category: str, conservativity_override: float = None):
    # Fetch settings for conservativity if not overridden
    if conservativity_override is not None:
        conservativity = conservativity_override
    else:
        settings = db.query(Settings).filter(Settings.id == 1).first()
        conservativity = settings.conservativity if settings else 0.5

    # Fetch historical data for the category
    # We use 'tasks' table which has 'total_duration_ms'
    tasks = db.query(Task).filter(Task.category == category).all()
    durations = [t.total_duration_ms for t in tasks if t.total_duration_ms > 0]

    count = len(durations)
    
    if count == 0:
        return {
            "predicted_duration_ms": 1800000, # Default 30 mins
            "confidence": "low",
            "explanation": "No historical data available for this category."
        }

    median = calculate_percentile(durations, 50)
    p90 = calculate_percentile(durations, 90)

    # Formula: prediction = median + (p90 - median) * conservativity
    # If conservativity is 0, we predict median (optimistic)
    # If conservativity is 1, we predict p90 (pessimistic/safe)
    predicted_ms = median + (p90 - median) * conservativity

    confidence = "low"
    if count > 15:
        confidence = "high"
    elif count >= 5:
        confidence = "medium"

    explanation = (
        f"Based on {count} past sessions. "
        f"Median: {int(median/60000)}m, P90: {int(p90/60000)}m. "
        f"Conservativity factor: {conservativity:.2f}."
    )

    return {
        "predicted_duration_ms": int(predicted_ms),
        "confidence": confidence,
        "explanation": explanation
    }
