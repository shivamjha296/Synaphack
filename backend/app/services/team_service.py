from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, func
from typing import List, Optional, Dict, Any

from app.models.sql_models import Team, TeamMember, User
from app.models.schemas import TeamResponse, TeamMemberResponse, UserResponse
from app.services.user_service import UserService
import uuid

class TeamService:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        name: str,
        event_id: str,
        leader_id: str,
        description: Optional[str] = None,
        track: Optional[str] = None
    ) -> Team:
        """Create a new team"""
        team = Team(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            track=track,
            event_id=event_id,
            leader_id=leader_id
        )
        
        self.db.add(team)
        self.db.flush()  # Get the team ID
        
        # Add leader as first member
        team_member = TeamMember(
            id=str(uuid.uuid4()),
            team_id=team.id,
            user_id=leader_id,
            role="leader"
        )
        self.db.add(team_member)
        
        self.db.commit()
        self.db.refresh(team)
        return team

    def get_by_id(self, team_id: str) -> Optional[Team]:
        """Get team by ID"""
        return (
            self.db.query(Team)
            .options(joinedload(Team.leader))
            .filter(Team.id == team_id)
            .first()
        )

    def get_by_event(self, event_id: str) -> List[Team]:
        """Get all teams for an event"""
        return (
            self.db.query(Team)
            .options(joinedload(Team.leader))
            .filter(Team.event_id == event_id)
            .all()
        )

    def get_user_teams(self, user_id: str) -> List[Team]:
        """Get all teams where user is a member"""
        return (
            self.db.query(Team)
            .options(joinedload(Team.leader))
            .join(TeamMember, Team.id == TeamMember.team_id)
            .filter(TeamMember.user_id == user_id)
            .all()
        )

    def update(self, team_id: str, team_data: Dict[str, Any]) -> Optional[Team]:
        """Update team"""
        team = self.get_by_id(team_id)
        if not team:
            return None

        for key, value in team_data.items():
            if hasattr(team, key) and value is not None:
                setattr(team, key, value)

        self.db.commit()
        self.db.refresh(team)
        return team

    def delete(self, team_id: str) -> bool:
        """Delete team and all memberships"""
        team = self.get_by_id(team_id)
        if not team:
            return False

        # Delete all team memberships first
        self.db.query(TeamMember).filter(TeamMember.team_id == team_id).delete()
        
        # Delete the team
        self.db.delete(team)
        self.db.commit()
        return True

    def add_member(self, team_id: str, user_id: str) -> bool:
        """Add a member to the team"""
        # Check if user is already in the team
        if self.is_user_in_team(user_id, team_id):
            return False

        team_member = TeamMember(
            id=str(uuid.uuid4()),
            team_id=team_id,
            user_id=user_id,
            role="member"
        )
        
        self.db.add(team_member)
        self.db.commit()
        return True

    def remove_member(self, team_id: str, user_id: str) -> bool:
        """Remove a member from the team"""
        team_member = (
            self.db.query(TeamMember)
            .filter(and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id))
            .first()
        )
        
        if not team_member:
            return False

        self.db.delete(team_member)
        
        # If this was the last member, delete the team
        remaining_members = (
            self.db.query(func.count(TeamMember.id))
            .filter(TeamMember.team_id == team_id)
            .scalar()
        )
        
        if remaining_members == 1:  # Will be 0 after commit
            team = self.get_by_id(team_id)
            if team:
                self.db.delete(team)
        
        self.db.commit()
        return True

    def transfer_leadership(self, team_id: str, new_leader_id: str) -> bool:
        """Transfer team leadership"""
        team = self.get_by_id(team_id)
        if not team:
            return False

        # Update team leader
        team.leader_id = new_leader_id
        
        # Update old leader's role to member
        old_leader_membership = (
            self.db.query(TeamMember)
            .filter(and_(TeamMember.team_id == team_id, TeamMember.user_id == team.leader_id))
            .first()
        )
        if old_leader_membership:
            old_leader_membership.role = "member"
        
        # Update new leader's role to leader
        new_leader_membership = (
            self.db.query(TeamMember)
            .filter(and_(TeamMember.team_id == team_id, TeamMember.user_id == new_leader_id))
            .first()
        )
        if new_leader_membership:
            new_leader_membership.role = "leader"
        
        self.db.commit()
        return True

    def is_user_in_team(self, user_id: str, team_id: str) -> bool:
        """Check if user is in the specific team"""
        return (
            self.db.query(TeamMember)
            .filter(and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id))
            .first() is not None
        )

    def is_user_in_event_team(self, user_id: str, event_id: str) -> bool:
        """Check if user is in any team for the event"""
        return (
            self.db.query(TeamMember)
            .join(Team, TeamMember.team_id == Team.id)
            .filter(and_(Team.event_id == event_id, TeamMember.user_id == user_id))
            .first() is not None
        )

    def get_team_size(self, team_id: str) -> int:
        """Get number of members in the team"""
        return (
            self.db.query(func.count(TeamMember.id))
            .filter(TeamMember.team_id == team_id)
            .scalar() or 0
        )

    def get_team_members(self, team_id: str) -> List[TeamMember]:
        """Get all members of a team"""
        return (
            self.db.query(TeamMember)
            .options(joinedload(TeamMember.user))
            .filter(TeamMember.team_id == team_id)
            .all()
        )

    def invite_user(self, team_id: str, email: str, message: Optional[str] = None) -> bool:
        """Invite a user to the team by email"""
        user_service = UserService(self.db)
        user = user_service.get_by_email(email)
        
        if not user:
            # In a real app, send invitation email to non-registered users
            return False
        
        team = self.get_by_id(team_id)
        if not team:
            return False
        
        # Check if user is already in a team for this event
        if self.is_user_in_event_team(user.id, team.event_id):
            return False
        
        # In a real app, send invitation notification/email
        # For now, we'll just add them directly (simplified)
        return self.add_member(team_id, user.id)

    def get_team_response(self, team_id: str) -> TeamResponse:
        """Get team with full response format"""
        team = self.get_by_id(team_id)
        if not team:
            return None
        
        members = self.get_team_members(team_id)
        member_responses = []
        
        for member in members:
            member_response = TeamMemberResponse(
                id=member.id,
                user=UserResponse.from_orm(member.user),
                role=member.role,
                joined_at=member.joined_at
            )
            member_responses.append(member_response)
        
        return TeamResponse(
            id=team.id,
            name=team.name,
            description=team.description,
            track=team.track,
            event_id=team.event_id,
            leader_id=team.leader_id,
            leader=UserResponse.from_orm(team.leader),
            members=member_responses,
            created_at=team.created_at
        )
