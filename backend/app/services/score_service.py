from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any

from app.models.sql_models import Score, Submission
from app.models.schemas import ScoreCreate, ScoreResponse, UserResponse
import uuid

class ScoreService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, score_data: ScoreCreate, judge_id: str) -> Score:
        """Create a new score"""
        # Calculate total score
        total_score = sum(score_data.criteria_scores.values())
        
        score = Score(
            id=str(uuid.uuid4()),
            submission_id=score_data.submission_id,
            judge_id=judge_id,
            criteria_scores=score_data.criteria_scores,
            total_score=total_score,
            feedback=score_data.feedback
        )
        
        self.db.add(score)
        self.db.commit()
        self.db.refresh(score)
        return score

    def get_by_id(self, score_id: str) -> Optional[Score]:
        """Get score by ID"""
        return (
            self.db.query(Score)
            .options(joinedload(Score.judge), joinedload(Score.submission))
            .filter(Score.id == score_id)
            .first()
        )

    def get_by_submission(self, submission_id: str) -> List[Score]:
        """Get all scores for a submission"""
        return (
            self.db.query(Score)
            .options(joinedload(Score.judge))
            .filter(Score.submission_id == submission_id)
            .all()
        )

    def get_by_judge(self, judge_id: str) -> List[Score]:
        """Get all scores by a judge"""
        return (
            self.db.query(Score)
            .options(joinedload(Score.submission))
            .filter(Score.judge_id == judge_id)
            .all()
        )

    def update(self, score_id: str, score_data: Dict[str, Any]) -> Optional[Score]:
        """Update score"""
        score = self.get_by_id(score_id)
        if not score:
            return None

        for key, value in score_data.items():
            if hasattr(score, key) and value is not None:
                setattr(score, key, value)

        # Recalculate total score if criteria_scores updated
        if 'criteria_scores' in score_data:
            score.total_score = sum(score.criteria_scores.values())

        self.db.commit()
        self.db.refresh(score)
        return score

    def delete(self, score_id: str) -> bool:
        """Delete score"""
        score = self.get_by_id(score_id)
        if not score:
            return False

        self.db.delete(score)
        self.db.commit()
        return True

    def has_judge_scored(self, submission_id: str, judge_id: str) -> bool:
        """Check if judge has already scored this submission"""
        return (
            self.db.query(Score)
            .filter(Score.submission_id == submission_id, Score.judge_id == judge_id)
            .first() is not None
        )

    def get_score_response(self, score_id: str) -> ScoreResponse:
        """Get score with full response format"""
        score = self.get_by_id(score_id)
        if not score:
            return None

        return ScoreResponse(
            id=score.id,
            submission_id=score.submission_id,
            judge_id=score.judge_id,
            judge=UserResponse.from_orm(score.judge),
            criteria_scores=score.criteria_scores,
            total_score=score.total_score,
            feedback=score.feedback,
            created_at=score.created_at
        )
