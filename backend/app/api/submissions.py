from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_database
from app.models.schemas import (
    SubmissionCreate,
    SubmissionUpdate,
    SubmissionResponse,
    UserResponse,
    TeamResponse
)
from app.models.sql_models import User, UserRole
from app.services.submission_service import SubmissionService
from app.api.auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=SubmissionResponse)
async def create_submission(
    submission_data: SubmissionCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Create a new submission"""
    submission_service = SubmissionService(db)
    
    # Check if user is in the team
    if not submission_service.is_user_in_team(current_user.id, submission_data.team_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a team member to create submissions"
        )
    
    submission = submission_service.create(submission_data, current_user.id)
    return submission_service.get_submission_response(submission.id)

@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Get submission by ID"""
    submission_service = SubmissionService(db)
    submission = submission_service.get_by_id(submission_id)
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Check access permissions
    if not submission_service.can_user_access_submission(current_user.id, submission_id, current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this submission"
        )
    
    return submission_service.get_submission_response(submission_id)

@router.put("/{submission_id}", response_model=SubmissionResponse)
async def update_submission(
    submission_id: str,
    submission_data: SubmissionUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Update submission"""
    submission_service = SubmissionService(db)
    submission = submission_service.get_by_id(submission_id)
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Check if user can edit this submission
    if not submission_service.is_user_in_team(current_user.id, submission.team_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your team's submissions"
        )
    
    updated_submission = submission_service.update(submission_id, submission_data.dict(exclude_unset=True))
    return submission_service.get_submission_response(updated_submission.id)

@router.delete("/{submission_id}")
async def delete_submission(
    submission_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Delete submission"""
    submission_service = SubmissionService(db)
    submission = submission_service.get_by_id(submission_id)
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Check permissions
    if not submission_service.is_user_in_team(current_user.id, submission.team_id) and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your team's submissions"
        )
    
    success = submission_service.delete(submission_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete submission"
        )
    
    return {"message": "Submission deleted successfully"}

@router.get("/event/{event_id}", response_model=List[SubmissionResponse])
async def get_event_submissions(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Get all submissions for an event"""
    submission_service = SubmissionService(db)
    
    # Only judges, organizers, and admins can view all submissions
    if current_user.role not in [UserRole.JUDGE, UserRole.ORGANIZER, UserRole.ADMIN]:
        # Participants can only see their own team's submissions
        submissions = submission_service.get_user_event_submissions(current_user.id, event_id)
    else:
        submissions = submission_service.get_by_event(event_id)
    
    return [submission_service.get_submission_response(sub.id) for sub in submissions]

@router.get("/team/{team_id}", response_model=List[SubmissionResponse])
async def get_team_submissions(
    team_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Get all submissions for a team"""
    submission_service = SubmissionService(db)
    
    # Check if user has access to view team submissions
    if (not submission_service.is_user_in_team(current_user.id, team_id) and 
        current_user.role not in [UserRole.JUDGE, UserRole.ORGANIZER, UserRole.ADMIN]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view these submissions"
        )
    
    submissions = submission_service.get_by_team(team_id)
    return [submission_service.get_submission_response(sub.id) for sub in submissions]

@router.post("/{submission_id}/submit")
async def submit_submission(
    submission_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Submit a submission for review"""
    submission_service = SubmissionService(db)
    submission = submission_service.get_by_id(submission_id)
    
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )
    
    # Check if user can submit this submission
    if not submission_service.is_user_in_team(current_user.id, submission.team_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit your team's submissions"
        )
    
    success = submission_service.submit_for_review(submission_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submission cannot be submitted in its current state"
        )
    
    return {"message": "Submission submitted for review successfully"}
