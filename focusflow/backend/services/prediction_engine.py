"""
Prediction Engine - Task duration prediction service.

Uses historical data to predict how long tasks will take,
adjusted by the conservativity setting.

Conservativity:
- 0.0 (Aggressive): Uses median duration - assumes task will go smoothly
- 1.0 (Conservative): Uses 90th percentile - accounts for unexpected delays
- 0.5 (Balanced): Midpoint between median and p90
"""

from typing import Optional
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func
import statistics

from database import Session, Prediction
from models import PredictionResponse


class PredictionEngine:
    """Engine for predicting task durations based on historical data."""

    # Default prediction when no historical data exists (in minutes)
    DEFAULT_PREDICTION = 30

    def __init__(self, db: DBSession):
        self.db = db

    def predict(
        self,
        task_category: str,
        conservativity: float = 0.5
    ) -> PredictionResponse:
        """
        Predict duration for a task category.

        Algorithm:
        1. Query historical sessions for this category
        2. Calculate median and 90th percentile durations
        3. Apply conservativity: result = median + (p90 - median) * conservativity
        4. Return prediction with confidence based on sample size

        Args:
            task_category: Category of task (matches against task_name)
            conservativity: 0=aggressive (median), 1=conservative (p90)

        Returns:
            PredictionResponse with prediction details
        """
        # Query historical sessions matching the category
        sessions = self.db.query(Session).filter(
            Session.task_name.ilike(f"%{task_category}%"),
            Session.total_duration_ms.isnot(None),
            Session.total_duration_ms > 0
        ).all()

        if not sessions:
            return PredictionResponse(
                predicted_minutes=self.DEFAULT_PREDICTION,
                confidence="low",
                based_on_sessions=0,
                explanation=f"No historical data for '{task_category}'. Using default estimate of {self.DEFAULT_PREDICTION} minutes."
            )

        # Calculate durations in minutes
        durations = [s.total_duration_ms / (1000 * 60) for s in sessions]
        durations = [d for d in durations if d > 0]  # Filter out zero durations

        if not durations:
            return PredictionResponse(
                predicted_minutes=self.DEFAULT_PREDICTION,
                confidence="low",
                based_on_sessions=0,
                explanation="No valid duration data found. Using default estimate."
            )

        # Calculate statistics
        median = statistics.median(durations)

        if len(durations) >= 2:
            # Calculate 90th percentile
            sorted_durations = sorted(durations)
            p90_index = int(len(sorted_durations) * 0.9)
            p90 = sorted_durations[min(p90_index, len(sorted_durations) - 1)]
        else:
            # Estimate p90 if not enough data
            p90 = median * 1.5

        # Apply conservativity formula:
        # - conservativity=0: predicted = median (aggressive)
        # - conservativity=1: predicted = p90 (conservative)
        # - conservativity=0.5: predicted = midpoint
        predicted = median + (p90 - median) * conservativity

        # Ensure minimum prediction of 1 minute
        predicted = max(1, predicted)

        # Determine confidence based on sample size
        if len(sessions) >= 20:
            confidence = "high"
        elif len(sessions) >= 5:
            confidence = "medium"
        else:
            confidence = "low"

        # Build explanation
        conservativity_label = "aggressive" if conservativity < 0.3 else "conservative" if conservativity > 0.7 else "balanced"
        explanation = (
            f"Based on {len(sessions)} similar sessions. "
            f"Median: {median:.0f}min, 90th percentile: {p90:.0f}min. "
            f"With {conservativity_label} setting ({conservativity:.0%}): {predicted:.0f}min."
        )

        return PredictionResponse(
            predicted_minutes=int(round(predicted)),
            confidence=confidence,
            based_on_sessions=len(sessions),
            explanation=explanation
        )

    def record_prediction(
        self,
        task_category: str,
        predicted_minutes: int,
        conservativity: float
    ) -> int:
        """
        Record a prediction for later accuracy tracking.

        Args:
            task_category: Category of task
            predicted_minutes: Predicted duration
            conservativity: Conservativity setting used

        Returns:
            Prediction ID
        """
        prediction = Prediction(
            task_category=task_category,
            predicted_minutes=predicted_minutes,
            conservativity=conservativity
        )
        self.db.add(prediction)
        self.db.commit()
        self.db.refresh(prediction)
        return prediction.id

    def update_actual_duration(
        self,
        prediction_id: int,
        actual_minutes: int
    ):
        """
        Update a prediction with the actual duration.

        Args:
            prediction_id: ID of the prediction
            actual_minutes: Actual duration in minutes
        """
        prediction = self.db.query(Prediction).filter(
            Prediction.id == prediction_id
        ).first()
        if prediction:
            prediction.actual_minutes = actual_minutes
            self.db.commit()

    def get_accuracy(self, task_category: Optional[str] = None) -> float:
        """
        Calculate prediction accuracy using MAPE.

        Args:
            task_category: Optional category filter

        Returns:
            Accuracy as percentage (0-100)
        """
        query = self.db.query(Prediction).filter(
            Prediction.actual_minutes.isnot(None),
            Prediction.actual_minutes > 0
        )
        if task_category:
            query = query.filter(Prediction.task_category == task_category)

        predictions = query.all()

        if not predictions:
            return 0.0

        # Calculate Mean Absolute Percentage Error
        errors = []
        for p in predictions:
            if p.actual_minutes and p.actual_minutes > 0:
                error = abs(p.predicted_minutes - p.actual_minutes) / p.actual_minutes
                errors.append(error)

        if not errors:
            return 0.0

        mape = sum(errors) / len(errors)

        # Convert to accuracy (0-100)
        accuracy = max(0, (1 - mape) * 100)
        return round(accuracy, 1)

    def get_category_stats(self, task_category: str) -> dict:
        """
        Get statistics for a task category.

        Args:
            task_category: Category to analyze

        Returns:
            Dict with statistics
        """
        sessions = self.db.query(Session).filter(
            Session.task_name.ilike(f"%{task_category}%"),
            Session.total_duration_ms.isnot(None),
            Session.total_duration_ms > 0
        ).all()

        if not sessions:
            return {"count": 0}

        durations = [s.total_duration_ms / (1000 * 60) for s in sessions]
        durations = [d for d in durations if d > 0]

        if not durations:
            return {"count": 0}

        return {
            "count": len(sessions),
            "min_minutes": round(min(durations), 1),
            "max_minutes": round(max(durations), 1),
            "median_minutes": round(statistics.median(durations), 1),
            "mean_minutes": round(statistics.mean(durations), 1),
            "std_dev": round(statistics.stdev(durations), 1) if len(durations) > 1 else 0
        }
