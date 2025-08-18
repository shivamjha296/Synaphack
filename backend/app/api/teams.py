from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_database
from app.models.schemas import (
    TeamCreate,
    TeamUpdate, 
    TeamResponse,
    TeamInvite,
    UserResponse,
    TeamMemberResponse
)
from app.models.sql_models import User, UserRole, Team
from app.services.team_service import TeamService
from app.api.auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=TeamResponse)
async def create_team(
    team_data: TeamCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Create a new team"""
    team_service = TeamService(db)
    
    # Check if user is already in a team for this event
    if team_service.is_user_in_event_team(current_user.id, team_data.event_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already part of a team for this event"
        )
    
    team = team_service.create(
        name=team_data.name,
        description=team_data.description,
        event_id=team_data.event_id,
        leader_id=current_user.id,
        track=team_data.track
    )
    
    return team_service.get_team_response(team.id)

@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(
    team_id: str,
    db: Session = Depends(get_database)
):
    """Get team by ID"""
    team_service = TeamService(db)
    team = team_service.get_by_id(team_id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    return team_service.get_team_response(team_id)

@router.put("/{team_id}", response_model=TeamResponse)
async def update_team(
    team_id: str,
    team_data: TeamUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Update team (leader only)"""
    team_service = TeamService(db)
    team = team_service.get_by_id(team_id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if user is team leader
    if team.leader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team leaders can update team details"
        )
    
    updated_team = team_service.update(team_id, team_data.dict(exclude_unset=True))
    return team_service.get_team_response(updated_team.id)

@router.delete("/{team_id}")
async def delete_team(
    team_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Delete team (leader only)"""
    team_service = TeamService(db)
    team = team_service.get_by_id(team_id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if user is team leader
    if team.leader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team leaders can delete the team"
        )
    
    success = team_service.delete(team_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete team"
        )
    
    return {"message": "Team deleted successfully"}

@router.post("/{team_id}/invite")
async def invite_to_team(
    team_id: str,
    invite_data: TeamInvite,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Invite user to team (leader only)"""
    team_service = TeamService(db)
    team = team_service.get_by_id(team_id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if user is team leader
    if team.leader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team leaders can invite members"
        )
    
    # Check team size limit
    from app.services.event_service import EventService
    event_service = EventService(db)
    event = event_service.get_by_id(team.event_id)
    
    current_size = team_service.get_team_size(team_id)
    if current_size >= event.max_team_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team is already at maximum size ({event.max_team_size})"
        )
    
    success = team_service.invite_user(team_id, invite_data.email, invite_data.message)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to send invitation"
        )
    
    return {"message": "Invitation sent successfully"}

@router.post("/{team_id}/join")
async def join_team(
    team_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Join a team"""
    team_service = TeamService(db)
    team = team_service.get_by_id(team_id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if user is already in a team for this event
    if team_service.is_user_in_event_team(current_user.id, team.event_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already part of a team for this event"
        )
    
    # Check team size limit
    from app.services.event_service import EventService
    event_service = EventService(db)
    event = event_service.get_by_id(team.event_id)
    
    current_size = team_service.get_team_size(team_id)
    if current_size >= event.max_team_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team is already at maximum size ({event.max_team_size})"
        )
    
    success = team_service.add_member(team_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to join team"
        )
    
    return {"message": "Successfully joined team"}

@router.post("/{team_id}/leave")
async def leave_team(
    team_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Leave a team"""
    team_service = TeamService(db)
    team = team_service.get_by_id(team_id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if user is in the team
    if not team_service.is_user_in_team(current_user.id, team_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not a member of this team"
        )
    
    # Team leaders cannot leave unless they transfer leadership
    if team.leader_id == current_user.id:
        team_size = team_service.get_team_size(team_id)
        if team_size > 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team leaders must transfer leadership before leaving, or delete the team"
            )
    
    success = team_service.remove_member(team_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to leave team"
        )
    
    return {"message": "Successfully left team"}

@router.post("/{team_id}/transfer-leadership/{user_id}")
async def transfer_leadership(
    team_id: str,
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Transfer team leadership (current leader only)"""
    team_service = TeamService(db)
    team = team_service.get_by_id(team_id)
    
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Team not found"
        )
    
    # Check if user is current team leader
    if team.leader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only current team leaders can transfer leadership"
        )
    
    # Check if target user is in the team
    if not team_service.is_user_in_team(user_id, team_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target user is not a member of this team"
        )
    
    success = team_service.transfer_leadership(team_id, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to transfer leadership"
        )
    
    return {"message": "Leadership transferred successfully"}

@router.get("/event/{event_id}", response_model=List[TeamResponse])
async def get_event_teams(
    event_id: str,
    db: Session = Depends(get_database)
):
    """Get all teams for an event"""
    team_service = TeamService(db)
    teams = team_service.get_by_event(event_id)
    
    return [team_service.get_team_response(team.id) for team in teams]
