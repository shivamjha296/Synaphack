from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.models.sql_models import Submission, Team, TeamMember, SubmissionStatus, UserRole
from app.models.schemas import SubmissionCreate, SubmissionResponse, UserResponse, TeamResponse
from app.services.team_service import TeamService
import uuid

class SubmissionService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, submission_data: SubmissionCreate, submitter_id: str) -> Submission:
        """Create a new submission"""
        # Get team and event info
        team = self.db.query(Team).filter(Team.id == submission_data.team_id).first()
        if not team:
            raise ValueError("Team not found")
        
        submission = Submission(
            id=str(uuid.uuid4()),
            title=submission_data.title,
            description=submission_data.description,
            github_url=submission_data.github_url,
            demo_url=submission_data.demo_url,
            video_url=submission_data.video_url,
            track=submission_data.track,
            technologies=submission_data.technologies,
            round_number=submission_data.round_number,
            event_id=team.event_id,
            team_id=submission_data.team_id,
            submitter_id=submitter_id,
            status=SubmissionStatus.DRAFT
        )
        
        self.db.add(submission)
        self.db.commit()
        self.db.refresh(submission)
        return submission

    def get_by_id(self, submission_id: str) -> Optional[Submission]:
        """Get submission by ID"""
        return (
            self.db.query(Submission)
            .options(
                joinedload(Submission.team).joinedload(Team.leader),
                joinedload(Submission.submitter),
                joinedload(Submission.event)
            )
            .filter(Submission.id == submission_id)
            .first()
        )

    def get_by_event(self, event_id: str) -> List[Submission]:
        """Get all submissions for an event"""
        return (
            self.db.query(Submission)
            .options(
                joinedload(Submission.team).joinedload(Team.leader),
                joinedload(Submission.submitter)
            )
            .filter(Submission.event_id == event_id)
            .all()
        )

    def get_by_team(self, team_id: str) -> List[Submission]:
        """Get all submissions for a team"""
        return (
            self.db.query(Submission)
            .options(
                joinedload(Submission.team).joinedload(Team.leader),
                joinedload(Submission.submitter)
            )
            .filter(Submission.team_id == team_id)
            .all()
        )

    def get_user_submissions(self, user_id: str) -> List[Submission]:
        """Get all submissions by a user"""
        return (
            self.db.query(Submission)
            .options(
                joinedload(Submission.team).joinedload(Team.leader),
                joinedload(Submission.submitter)
            )
            .filter(Submission.submitter_id == user_id)
            .all()
        )

    def get_user_event_submissions(self, user_id: str, event_id: str) -> List[Submission]:
        """Get user's submissions for a specific event"""
        return (
            self.db.query(Submission)
            .options(
                joinedload(Submission.team).joinedload(Team.leader),
                joinedload(Submission.submitter)
            )
            .join(Team, Submission.team_id == Team.id)
            .join(TeamMember, Team.id == TeamMember.team_id)
            .filter(and_(
                TeamMember.user_id == user_id,
                Submission.event_id == event_id
            ))
            .all()
        )

    def update(self, submission_id: str, submission_data: Dict[str, Any]) -> Optional[Submission]:
        """Update submission"""
        submission = self.get_by_id(submission_id)
        if not submission:
            return None

        for key, value in submission_data.items():
            if hasattr(submission, key) and value is not None:
                setattr(submission, key, value)

        self.db.commit()
        self.db.refresh(submission)
        return submission

    def delete(self, submission_id: str) -> bool:
        """Delete submission"""
        submission = self.get_by_id(submission_id)
        if not submission:
            return False

        self.db.delete(submission)
        self.db.commit()
        return True

    def submit_for_review(self, submission_id: str) -> bool:
        """Submit submission for review"""
        submission = self.get_by_id(submission_id)
        if not submission:
            return False

        if submission.status != SubmissionStatus.DRAFT:
            return False

        submission.status = SubmissionStatus.SUBMITTED
        submission.submitted_at = datetime.utcnow()
        
        self.db.commit()
        return True

    def is_user_in_team(self, user_id: str, team_id: str) -> bool:
        """Check if user is in the team"""
        return (
            self.db.query(TeamMember)
            .filter(and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id))
            .first() is not None
        )

    def can_user_access_submission(self, user_id: str, submission_id: str, user_role: UserRole) -> bool:
        """Check if user can access submission"""
        submission = self.get_by_id(submission_id)
        if not submission:
            return False

        # Admins can access everything
        if user_role == UserRole.ADMIN:
            return True

        # Judges and organizers can access submitted submissions
        if user_role in [UserRole.JUDGE, UserRole.ORGANIZER]:
            return submission.status in [SubmissionStatus.SUBMITTED, SubmissionStatus.UNDER_REVIEW, SubmissionStatus.REVIEWED]

        # Team members can access their team's submissions
        return self.is_user_in_team(user_id, submission.team_id)

    def get_submission_response(self, submission_id: str) -> SubmissionResponse:
        """Get submission with full response format"""
        submission = self.get_by_id(submission_id)
        if not submission:
            return None

        team_service = TeamService(self.db)
        team_response = team_service.get_team_response(submission.team_id)

        # Calculate average score if there are scores
        average_score = None
        if submission.scores:
            total_score = sum(score.total_score for score in submission.scores)
            average_score = total_score / len(submission.scores)

        return SubmissionResponse(
            id=submission.id,
            title=submission.title,
            description=submission.description,
            github_url=submission.github_url,
            demo_url=submission.demo_url,
            video_url=submission.video_url,
            track=submission.track,
            technologies=submission.technologies,
            event_id=submission.event_id,
            team_id=submission.team_id,
            submitter_id=submission.submitter_id,
            team=team_response,
            submitter=UserResponse.from_orm(submission.submitter),
            presentation_file=submission.presentation_file,
            additional_files=submission.additional_files,
            round_number=submission.round_number,
            status=submission.status,
            submitted_at=submission.submitted_at,
            created_at=submission.created_at,
            average_score=average_score
        )
