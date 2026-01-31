"""
Prediction Engine - Task duration prediction service.

Uses historical data to predict how long tasks will take,
adjusted by the conservativity setting.
"""

from typing import Optional
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import func
import statistics

from database import Session, Prediction
from models import PredictionResponse


class PredictionEngine:
    """Engine for predicting task durations."""

    def __init__(self, db: DBSession):
        self.db = db

    def predict(
        self,
        task_category: str,
        conservativity: float = 0.5
    ) -> PredictionResponse:
        """
        Predict duration for a task category.

        TODO: Person B - Implement real prediction logic

        Algorithm:
        1. Query historical sessions for this category
        2. Calculate median and 90th percentile durations
        3. Apply conservativity: result = median + (p90 - median) * conservativity
        4. Return prediction with confidence based on sample size

        Args:
            task_category: Category of task
            conservativity: 0=aggressive (median), 1=conservative (p90)

        Returns:
            PredictionResponse with prediction details
        """
        # TODO: Person B - Implement real prediction
        #
        # # Query historical sessions
        # sessions = self.db.query(Session).filter(
        #     Session.task_name.ilike(f"%{task_category}%")
        # ).all()
        #
        # if not sessions:
        #     return PredictionResponse(
        #         predicted_minutes=30,
        #         confidence="low",
        #         based_on_sessions=0,
        #         explanation="No historical data available. Using default estimate."
        #     )
        #
        # # Calculate durations in minutes
        # durations = [s.total_duration_ms / (1000 * 60) for s in sessions]
        #
        # # Calculate statistics
        # median = statistics.median(durations)
        # if len(durations) >= 2:
        #     p90 = statistics.quantiles(durations, n=10)[8]  # 90th percentile
        # else:
        #     p90 = median * 1.5  # Estimate if not enough data
        #
        # # Apply conservativity
        # predicted = median + (p90 - median) * conservativity
        #
        # # Determine confidence
        # if len(sessions) >= 20:
        #     confidence = "high"
        # elif len(sessions) >= 10:
        #     confidence = "medium"
        # else:
        #     confidence = "low"
        #
        # return PredictionResponse(
        #     predicted_minutes=int(predicted),
        #     confidence=confidence,
        #     based_on_sessions=len(sessions),
        #     explanation=f"Median: {median:.0f}min, P90: {p90:.0f}min. "
        #                 f"Conservativity {conservativity:.0%} = {predicted:.0f}min"
        # )

        # STUB: Return mock prediction
        return PredictionResponse(
            predicted_minutes=45,
            confidence="medium",
            based_on_sessions=15,
            explanation="Mock prediction. Implement real engine in prediction_engine.py"
        )

    def record_prediction(
        self,
        task_category: str,
        predicted_minutes: int,
        conservativity: float
    ) -> int:
        """
        Record a prediction for later accuracy tracking.

        TODO: Person B - Implement prediction recording

        Returns:
            Prediction ID
        """
        # TODO: Person B - Implement
        # prediction = Prediction(
        #     task_category=task_category,
        #     predicted_minutes=predicted_minutes,
        #     conservativity=conservativity
        # )
        # self.db.add(prediction)
        # self.db.commit()
        # return prediction.id

        # STUB
        return 0

    def update_actual_duration(
        self,
        prediction_id: int,
        actual_minutes: int
    ):
        """
        Update a prediction with the actual duration.

        TODO: Person B - Implement accuracy tracking

        Args:
            prediction_id: ID of the prediction
            actual_minutes: Actual duration in minutes
        """
        # TODO: Person B - Implement
        # prediction = self.db.query(Prediction).get(prediction_id)
        # if prediction:
        #     prediction.actual_minutes = actual_minutes
        #     self.db.commit()
        pass

    def get_accuracy(self, task_category: Optional[str] = None) -> float:
        """
        Calculate prediction accuracy.

        TODO: Person B - Implement accuracy calculation

        Args:
            task_category: Optional category filter

        Returns:
            Accuracy as percentage (0-100)
        """
        # TODO: Person B - Implement
        # query = self.db.query(Prediction).filter(
        #     Prediction.actual_minutes.isnot(None)
        # )
        # if task_category:
        #     query = query.filter(Prediction.task_category == task_category)
        #
        # predictions = query.all()
        #
        # if not predictions:
        #     return 0.0
        #
        # # Calculate Mean Absolute Percentage Error
        # errors = [
        #     abs(p.predicted_minutes - p.actual_minutes) / p.actual_minutes
        #     for p in predictions
        # ]
        # mape = sum(errors) / len(errors)
        #
        # # Convert to accuracy
        # return max(0, (1 - mape) * 100)

        # STUB
        return 82.3

    def get_category_stats(self, task_category: str) -> dict:
        """
        Get statistics for a task category.

        TODO: Person B - Implement category stats

        Args:
            task_category: Category to analyze

        Returns:
            Dict with statistics
        """
        # TODO: Person B - Implement
        # sessions = self.db.query(Session).filter(
        #     Session.task_name.ilike(f"%{task_category}%")
        # ).all()
        #
        # if not sessions:
        #     return {"count": 0}
        #
        # durations = [s.total_duration_ms / (1000 * 60) for s in sessions]
        #
        # return {
        #     "count": len(sessions),
        #     "min_minutes": min(durations),
        #     "max_minutes": max(durations),
        #     "median_minutes": statistics.median(durations),
        #     "mean_minutes": statistics.mean(durations),
        #     "std_dev": statistics.stdev(durations) if len(durations) > 1 else 0
        # }

        # STUB
        return {
            "count": 15,
            "min_minutes": 20,
            "max_minutes": 90,
            "median_minutes": 45,
            "mean_minutes": 48,
            "std_dev": 15
        }
