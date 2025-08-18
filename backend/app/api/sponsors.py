from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_database
from app.models.schemas import SponsorCreate, SponsorUpdate, SponsorResponse, EventSponsorResponse
from app.models.sql_models import User, UserRole
from app.services.sponsor_service import SponsorService
from app.api.auth import get_current_active_user

router = APIRouter()

@router.post("/", response_model=SponsorResponse)
async def create_sponsor(
    sponsor_data: SponsorCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Create a new sponsor (admins only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create sponsors"
        )
    
    sponsor_service = SponsorService(db)
    sponsor = sponsor_service.create(sponsor_data)
    return SponsorResponse.from_orm(sponsor)

@router.get("/", response_model=List[SponsorResponse])
async def get_sponsors(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_database)
):
    """Get all sponsors"""
    sponsor_service = SponsorService(db)
    sponsors = sponsor_service.get_all(skip=skip, limit=limit)
    return [SponsorResponse.from_orm(sponsor) for sponsor in sponsors]

@router.get("/{sponsor_id}", response_model=SponsorResponse)
async def get_sponsor(
    sponsor_id: str,
    db: Session = Depends(get_database)
):
    """Get sponsor by ID"""
    sponsor_service = SponsorService(db)
    sponsor = sponsor_service.get_by_id(sponsor_id)
    
    if not sponsor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sponsor not found"
        )
    
    return SponsorResponse.from_orm(sponsor)

@router.put("/{sponsor_id}", response_model=SponsorResponse)
async def update_sponsor(
    sponsor_id: str,
    sponsor_data: SponsorUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Update sponsor (admins only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can update sponsors"
        )
    
    sponsor_service = SponsorService(db)
    sponsor = sponsor_service.update(sponsor_id, sponsor_data.dict(exclude_unset=True))
    
    if not sponsor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sponsor not found"
        )
    
    return SponsorResponse.from_orm(sponsor)

@router.delete("/{sponsor_id}")
async def delete_sponsor(
    sponsor_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Delete sponsor (admins only)"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can delete sponsors"
        )
    
    sponsor_service = SponsorService(db)
    success = sponsor_service.delete(sponsor_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sponsor not found"
        )
    
    return {"message": "Sponsor deleted successfully"}

@router.get("/event/{event_id}", response_model=List[EventSponsorResponse])
async def get_event_sponsors(
    event_id: str,
    db: Session = Depends(get_database)
):
    """Get all sponsors for an event"""
    sponsor_service = SponsorService(db)
    event_sponsors = sponsor_service.get_event_sponsors(event_id)
    return event_sponsors

@router.post("/event/{event_id}/sponsor/{sponsor_id}")
async def add_sponsor_to_event(
    event_id: str,
    sponsor_id: str,
    tier: str = "bronze",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Add sponsor to event (organizers only)"""
    if current_user.role not in [UserRole.ORGANIZER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizers can add sponsors to events"
        )
    
    sponsor_service = SponsorService(db)
    success = sponsor_service.add_sponsor_to_event(event_id, sponsor_id, tier)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add sponsor to event"
        )
    
    return {"message": "Sponsor added to event successfully"}
