from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_database
from app.models.schemas import (
    EventCreate, 
    EventUpdate, 
    EventResponse, 
    EventAnalytics,
    UserResponse
)
from app.models.sql_models import User, UserRole, EventStatus
from app.services.event_service import EventService
from app.api.auth import get_current_active_user, get_current_user_optional

router = APIRouter()

@router.post("/", response_model=EventResponse)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Create a new event (organizers only)"""
    if current_user.role not in [UserRole.ORGANIZER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can create events"
        )
    
    event_service = EventService(db)
    event = event_service.create(event_data, current_user.id)
    
    # Convert to response format with organizer info
    event_response = EventResponse.from_orm(event)
    event_response.organizer = UserResponse.from_orm(event.organizer)
    event_response.participants_count = event_service.get_participants_count(event.id)
    event_response.teams_count = event_service.get_teams_count(event.id)
    
    return event_response

@router.get("/", response_model=List[EventResponse])
async def get_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    status: Optional[EventStatus] = None,
    organizer_id: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_database)
):
    """Get all events with filtering and pagination"""
    event_service = EventService(db)
    events = event_service.get_all(
        skip=skip, 
        limit=limit, 
        status=status, 
        organizer_id=organizer_id,
        search=search
    )
    
    response_events = []
    for event in events:
        event_response = EventResponse.from_orm(event)
        event_response.organizer = UserResponse.from_orm(event.organizer)
        event_response.participants_count = event_service.get_participants_count(event.id)
        event_response.teams_count = event_service.get_teams_count(event.id)
        # Set registration status if user is authenticated
        if current_user:
            event_response.is_registered = event_service.is_user_registered(event.id, current_user.id)
        else:
            event_response.is_registered = False
        response_events.append(event_response)
    
    return response_events

@router.get("/my-events", response_model=List[EventResponse])
async def get_my_events(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Get current user's events"""
    event_service = EventService(db)
    
    if current_user.role in [UserRole.ORGANIZER, UserRole.ADMIN]:
        # Get events organized by user
        events = event_service.get_by_organizer(current_user.id)
    else:
        # Get events user is participating in
        events = event_service.get_user_events(current_user.id)
    
    response_events = []
    for event in events:
        event_response = EventResponse.from_orm(event)
        event_response.organizer = UserResponse.from_orm(event.organizer)
        event_response.participants_count = event_service.get_participants_count(event.id)
        event_response.teams_count = event_service.get_teams_count(event.id)
        # For user's own events, they are always considered "registered" in some sense
        event_response.is_registered = event_service.is_user_registered(event.id, current_user.id)
        response_events.append(event_response)
    
    return response_events

@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_database)
):
    """Get event by ID"""
    event_service = EventService(db)
    event = event_service.get_by_id(event_id)
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Check if event is public or user has access
    if not event.is_public:
        # For now, allow access to all events. In production, add proper access control
        pass
    
    event_response = EventResponse.from_orm(event)
    event_response.organizer = UserResponse.from_orm(event.organizer)
    event_response.participants_count = event_service.get_participants_count(event.id)
    event_response.teams_count = event_service.get_teams_count(event.id)
    # Set registration status if user is authenticated
    if current_user:
        event_response.is_registered = event_service.is_user_registered(event.id, current_user.id)
    else:
        event_response.is_registered = False
    
    return event_response

@router.put("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: str,
    event_data: EventUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Update event (organizer or admin only)"""
    event_service = EventService(db)
    event = event_service.get_by_id(event_id)
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own events"
        )
    
    updated_event = event_service.update(event_id, event_data.dict(exclude_unset=True))
    
    event_response = EventResponse.from_orm(updated_event)
    event_response.organizer = UserResponse.from_orm(updated_event.organizer)
    event_response.participants_count = event_service.get_participants_count(updated_event.id)
    event_response.teams_count = event_service.get_teams_count(updated_event.id)
    
    return event_response

@router.delete("/{event_id}")
async def delete_event(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Delete event (organizer or admin only)"""
    event_service = EventService(db)
    event = event_service.get_by_id(event_id)
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own events"
        )
    
    success = event_service.delete(event_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete event"
        )
    
    return {"message": "Event deleted successfully"}

@router.post("/{event_id}/register")
async def register_for_event(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Register current user for an event"""
    event_service = EventService(db)
    event = event_service.get_by_id(event_id)
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Check if registration is open
    from datetime import datetime
    now = datetime.utcnow()
    if now < event.registration_start or now > event.registration_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration is not currently open for this event"
        )
    
    # Check if already registered
    if event_service.is_user_registered(event_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already registered for this event"
        )
    
    # Check capacity
    if event.max_participants:
        participants_count = event_service.get_participants_count(event_id)
        if participants_count >= event.max_participants:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Event is full"
            )
    
    success = event_service.register_user(event_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register for event"
        )
    
    return {"message": "Successfully registered for event"}

@router.delete("/{event_id}/register")
async def unregister_from_event(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Unregister current user from an event"""
    event_service = EventService(db)
    event = event_service.get_by_id(event_id)
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    if not event_service.is_user_registered(event_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not registered for this event"
        )
    
    success = event_service.unregister_user(event_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unregister from event"
        )
    
    return {"message": "Successfully unregistered from event"}

@router.get("/{event_id}/analytics", response_model=EventAnalytics)
async def get_event_analytics(
    event_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Get event analytics (organizer or admin only)"""
    event_service = EventService(db)
    event = event_service.get_by_id(event_id)
    
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )
    
    # Check permissions
    if current_user.role != UserRole.ADMIN and event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view analytics for your own events"
        )
    
    analytics = event_service.get_analytics(event_id)
    return analytics
