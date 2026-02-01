from sqlalchemy.orm import Session
from backend.database import Activity, Settings
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

def get_prediction(db: Session, category: str, conservativity_override: float = None, task_name: str = None):
    # Fetch settings for conservativity if not overridden
    if conservativity_override is not None:
        conservativity = conservativity_override
    else:
        settings = db.query(Settings).filter(Settings.id == 1).first()
        conservativity = settings.conservativity if settings else 0.5

    # Fetch historical data
    durations = []
    used_task_name = False
    
    if task_name:
        activities = db.query(Activity).filter(Activity.task_name == task_name).all()
        durations = [a.duration_ms for a in activities if a.duration_ms and a.duration_ms > 0]
        if durations:
            used_task_name = True

    if not durations:
        # Fallback to category
        activities = db.query(Activity).filter(Activity.category == category).all()
        durations = [a.duration_ms for a in activities if a.duration_ms and a.duration_ms > 0]

    count = len(durations)
    
    if count == 0:
        return {
            "predicted_duration_ms": 1800000, # Default 30 mins
            "confidence_percent": 0,
            "confidence_label": "Low",
            "explanation": "No historical data available for this category."
        }

    median = calculate_percentile(durations, 50)
    p90 = calculate_percentile(durations, 90)

    # Formula: prediction = median + (p90 - median) * conservativity
    predicted_ms = median + (p90 - median) * conservativity

    # Confidence calculation
    confidence_percent = min(100, count * 8)
    
    if confidence_percent < 30:
        confidence_label = "Low"
    elif confidence_percent < 70:
        confidence_label = "Medium"
    else:
        confidence_label = "High"

    if used_task_name:
        explanation = (
            f"{confidence_percent}% confident — based on {count} past sessions of '{task_name}'. "
            f"Median: {int(median/60000)}m, P90: {int(p90/60000)}m. "
            f"Conservativity: {conservativity:.2f}."
        )
    else:
        explanation = (
            f"{confidence_percent}% confident — based on {count} sessions in '{category}'. "
            f"Median: {int(median/60000)}m, P90: {int(p90/60000)}m. "
            f"Conservativity: {conservativity:.2f}."
        )

    return {
        "predicted_duration_ms": int(predicted_ms),
        "confidence_percent": confidence_percent,
        "confidence_label": confidence_label,
        "explanation": explanation
    }
