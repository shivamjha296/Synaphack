from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_database
from app.models.schemas import ScoreCreate, ScoreUpdate, ScoreResponse, UserResponse
from app.models.sql_models import User, UserRole
from app.services.score_service import ScoreService
from app.api.auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=ScoreResponse)
async def create_score(
    score_data: ScoreCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Create a new score (judges only)"""
    if current_user.role not in [UserRole.JUDGE, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only judges can score submissions"
        )
    
    score_service = ScoreService(db)
    
    # Check if judge already scored this submission
    if score_service.has_judge_scored(score_data.submission_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already scored this submission"
        )
    
    score = score_service.create(score_data, current_user.id)
    return score_service.get_score_response(score.id)

@router.get("/{score_id}", response_model=ScoreResponse)
async def get_score(
    score_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Get score by ID"""
    score_service = ScoreService(db)
    score = score_service.get_by_id(score_id)
    
    if not score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Score not found"
        )
    
    # Check permissions
    if (current_user.role != UserRole.ADMIN and 
        score.judge_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own scores"
        )
    
    return score_service.get_score_response(score_id)

@router.put("/{score_id}", response_model=ScoreResponse)
async def update_score(
    score_id: str,
    score_data: ScoreUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Update score (original judge only)"""
    score_service = ScoreService(db)
    score = score_service.get_by_id(score_id)
    
    if not score:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Score not found"
        )
    
    # Check permissions
    if score.judge_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own scores"
        )
    
    updated_score = score_service.update(score_id, score_data.dict(exclude_unset=True))
    return score_service.get_score_response(updated_score.id)

@router.get("/submission/{submission_id}", response_model=List[ScoreResponse])
async def get_submission_scores(
    submission_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Get all scores for a submission"""
    score_service = ScoreService(db)
    
    # Check if user can view scores
    if current_user.role not in [UserRole.JUDGE, UserRole.ORGANIZER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only judges and organizers can view scores"
        )
    
    scores = score_service.get_by_submission(submission_id)
    return [score_service.get_score_response(score.id) for score in scores]
