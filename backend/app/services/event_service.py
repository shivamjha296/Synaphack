from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime

from app.models.sql_models import Event, User, Team, TeamMember, Submission, EventStatus
from app.models.schemas import EventCreate, EventAnalytics
import uuid

class EventService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, event_data: EventCreate, organizer_id: str) -> Event:
        """Create a new event"""
        event = Event(
            id=str(uuid.uuid4()),
            title=event_data.title,
            description=event_data.description,
            short_description=event_data.short_description,
            event_type=event_data.event_type,
            mode=event_data.mode,
            venue=event_data.venue,
            max_participants=event_data.max_participants,
            max_team_size=event_data.max_team_size,
            registration_start=event_data.registration_start,
            registration_end=event_data.registration_end,
            event_start=event_data.event_start,
            event_end=event_data.event_end,
            tracks=event_data.tracks,
            rules=event_data.rules,
            judging_criteria=event_data.judging_criteria,
            prizes=event_data.prizes,
            is_public=event_data.is_public,
            registration_required=event_data.registration_required,
            organizer_id=organizer_id,
            status=EventStatus.PUBLISHED  # Auto-publish new events
        )
        
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def get_by_id(self, event_id: str) -> Optional[Event]:
        """Get event by ID with organizer loaded"""
        return (
            self.db.query(Event)
            .options(joinedload(Event.organizer))
            .filter(Event.id == event_id)
            .first()
        )

    def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[EventStatus] = None,
        organizer_id: Optional[str] = None,
        search: Optional[str] = None
    ) -> List[Event]:
        """Get all events with filtering"""
        query = self.db.query(Event).options(joinedload(Event.organizer))
        
        # Apply filters
        if status:
            query = query.filter(Event.status == status)
        if organizer_id:
            query = query.filter(Event.organizer_id == organizer_id)
        if search:
            query = query.filter(
                or_(
                    Event.title.contains(search),
                    Event.description.contains(search),
                    Event.short_description.contains(search)
                )
            )
        
        # Only show public events or add proper access control later
        query = query.filter(Event.is_public == True)
        
        return query.offset(skip).limit(limit).all()

    def get_by_organizer(self, organizer_id: str) -> List[Event]:
        """Get all events by organizer"""
        return (
            self.db.query(Event)
            .options(joinedload(Event.organizer))
            .filter(Event.organizer_id == organizer_id)
            .all()
        )

    def get_user_events(self, user_id: str) -> List[Event]:
        """Get events where user is participating"""
        # This would require a user_registrations table in a full implementation
        # For now, return events where user has teams
        return (
            self.db.query(Event)
            .options(joinedload(Event.organizer))
            .join(Team, Event.id == Team.event_id)
            .join(TeamMember, Team.id == TeamMember.team_id)
            .filter(TeamMember.user_id == user_id)
            .distinct()
            .all()
        )

    def update(self, event_id: str, event_data: Dict[str, Any]) -> Optional[Event]:
        """Update event"""
        event = self.get_by_id(event_id)
        if not event:
            return None

        for key, value in event_data.items():
            if hasattr(event, key) and value is not None:
                setattr(event, key, value)

        self.db.commit()
        self.db.refresh(event)
        return event

    def delete(self, event_id: str) -> bool:
        """Delete event"""
        event = self.get_by_id(event_id)
        if not event:
            return False

        self.db.delete(event)
        self.db.commit()
        return True

    def get_participants_count(self, event_id: str) -> int:
        """Get number of participants in event"""
        # Count unique users in teams for this event
        return (
            self.db.query(func.count(func.distinct(TeamMember.user_id)))
            .join(Team, TeamMember.team_id == Team.id)
            .filter(Team.event_id == event_id)
            .scalar() or 0
        )

    def get_teams_count(self, event_id: str) -> int:
        """Get number of teams in event"""
        return (
            self.db.query(func.count(Team.id))
            .filter(Team.event_id == event_id)
            .scalar() or 0
        )

    def is_user_registered(self, event_id: str, user_id: str) -> bool:
        """Check if user is registered for event"""
        # Check if user is in any team for this event
        return (
            self.db.query(TeamMember)
            .join(Team, TeamMember.team_id == Team.id)
            .filter(and_(Team.event_id == event_id, TeamMember.user_id == user_id))
            .first() is not None
        )

    def register_user(self, event_id: str, user_id: str) -> bool:
        """Register user for event (create individual team)"""
        # For individual registration, create a single-member team
        from app.services.team_service import TeamService
        team_service = TeamService(self.db)
        
        # Create team with user as leader and only member
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            return False
            
        team = team_service.create(
            name=f"{user.full_name}'s Team",
            description="Individual participant",
            event_id=event_id,
            leader_id=user_id
        )
        
        return team is not None

    def unregister_user(self, event_id: str, user_id: str) -> bool:
        """Unregister user from event"""
        # Remove user from all teams in this event where they are not the only member
        # If they are the only member, delete the team
        teams = (
            self.db.query(Team)
            .join(TeamMember, Team.id == TeamMember.team_id)
            .filter(and_(Team.event_id == event_id, TeamMember.user_id == user_id))
            .all()
        )
        
        for team in teams:
            members_count = (
                self.db.query(func.count(TeamMember.id))
                .filter(TeamMember.team_id == team.id)
                .scalar()
            )
            
            if members_count == 1:
                # Delete the team if user is the only member
                self.db.query(TeamMember).filter(TeamMember.team_id == team.id).delete()
                self.db.delete(team)
            else:
                # Just remove the user from the team
                self.db.query(TeamMember).filter(
                    and_(TeamMember.team_id == team.id, TeamMember.user_id == user_id)
                ).delete()
                
                # If user was the leader, assign new leader
                if team.leader_id == user_id:
                    new_leader = (
                        self.db.query(TeamMember)
                        .filter(TeamMember.team_id == team.id)
                        .first()
                    )
                    if new_leader:
                        team.leader_id = new_leader.user_id
        
        self.db.commit()
        return True

    def get_analytics(self, event_id: str) -> EventAnalytics:
        """Get event analytics"""
        # Get basic counts
        participants_count = self.get_participants_count(event_id)
        teams_count = self.get_teams_count(event_id)
        
        submissions_count = (
            self.db.query(func.count(Submission.id))
            .filter(Submission.event_id == event_id)
            .scalar() or 0
        )
        
        # Calculate completion rate (teams that submitted / total teams)
        completion_rate = (submissions_count / teams_count * 100) if teams_count > 0 else 0
        
        # Calculate average team size
        avg_team_size = (participants_count / teams_count) if teams_count > 0 else 0
        
        # Get track distribution
        track_distribution = {}
        track_data = (
            self.db.query(Team.track, func.count(Team.id))
            .filter(Team.event_id == event_id)
            .group_by(Team.track)
            .all()
        )
        
        for track, count in track_data:
            track_name = track or "No Track"
            track_distribution[track_name] = count
        
        # For daily registrations, we'd need a registrations table
        # For now, return empty data
        daily_registrations = []
        
        return EventAnalytics(
            total_registrations=participants_count,
            total_teams=teams_count,
            total_submissions=submissions_count,
            completion_rate=completion_rate,
            average_team_size=avg_team_size,
            track_distribution=track_distribution,
            daily_registrations=daily_registrations
        )

    def get_published_events(self) -> List[Event]:
        """Get all published events"""
        return (
            self.db.query(Event)
            .options(joinedload(Event.organizer))
            .filter(Event.status == EventStatus.PUBLISHED)
            .filter(Event.is_public == True)
            .all()
        )

    def get_ongoing_events(self) -> List[Event]:
        """Get all ongoing events"""
        now = datetime.utcnow()
        return (
            self.db.query(Event)
            .options(joinedload(Event.organizer))
            .filter(Event.status == EventStatus.ONGOING)
            .filter(Event.event_start <= now)
            .filter(Event.event_end >= now)
            .all()
        )
