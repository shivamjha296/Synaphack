from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_database, get_mongodb
from app.models.schemas import AnnouncementCreate, AnnouncementResponse
from app.models.sql_models import User, UserRole
from app.services.announcement_service import AnnouncementService
from app.api.auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=AnnouncementResponse)
async def create_announcement(
    announcement_data: AnnouncementCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Create a new announcement (organizers only)"""
    if current_user.role not in [UserRole.ORGANIZER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can create announcements"
        )
    
    mongodb = await get_mongodb()
    announcement_service = AnnouncementService(db, mongodb)
    
    announcement = await announcement_service.create(announcement_data, current_user.id, current_user.full_name)
    return announcement

@router.get("/event/{event_id}", response_model=List[AnnouncementResponse])
async def get_event_announcements(
    event_id: str,
    db: Session = Depends(get_database)
):
    """Get all announcements for an event"""
    mongodb = await get_mongodb()
    announcement_service = AnnouncementService(db, mongodb)
    
    announcements = await announcement_service.get_by_event(event_id)
    return announcements

@router.get("/{announcement_id}", response_model=AnnouncementResponse)
async def get_announcement(
    announcement_id: str,
    db: Session = Depends(get_database)
):
    """Get announcement by ID"""
    mongodb = await get_mongodb()
    announcement_service = AnnouncementService(db, mongodb)
    
    announcement = await announcement_service.get_by_id(announcement_id)
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    return announcement

@router.delete("/{announcement_id}")
async def delete_announcement(
    announcement_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Delete announcement (author or admin only)"""
    mongodb = await get_mongodb()
    announcement_service = AnnouncementService(db, mongodb)
    
    announcement = await announcement_service.get_by_id(announcement_id)
    
    if not announcement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Announcement not found"
        )
    
    # Check permissions
    if announcement.author_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own announcements"
        )
    
    success = await announcement_service.delete(announcement_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete announcement"
        )
    
    return {"message": "Announcement deleted successfully"}
