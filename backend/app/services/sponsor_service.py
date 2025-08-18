from sqlalchemy.orm import Session, joinedload
from typing import List, Optional, Dict, Any

from app.models.sql_models import Sponsor, EventSponsor, Event
from app.models.schemas import SponsorCreate, SponsorResponse, EventSponsorResponse
import uuid

class SponsorService:
    def __init__(self, db: Session):
        self.db = db

    def create(self, sponsor_data: SponsorCreate) -> Sponsor:
        """Create a new sponsor"""
        sponsor = Sponsor(
            id=str(uuid.uuid4()),
            name=sponsor_data.name,
            description=sponsor_data.description,
            website_url=sponsor_data.website_url,
            contact_email=sponsor_data.contact_email,
            tier=sponsor_data.tier
        )
        
        self.db.add(sponsor)
        self.db.commit()
        self.db.refresh(sponsor)
        return sponsor

    def get_by_id(self, sponsor_id: str) -> Optional[Sponsor]:
        """Get sponsor by ID"""
        return self.db.query(Sponsor).filter(Sponsor.id == sponsor_id).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[Sponsor]:
        """Get all sponsors"""
        return self.db.query(Sponsor).offset(skip).limit(limit).all()

    def update(self, sponsor_id: str, sponsor_data: Dict[str, Any]) -> Optional[Sponsor]:
        """Update sponsor"""
        sponsor = self.get_by_id(sponsor_id)
        if not sponsor:
            return None

        for key, value in sponsor_data.items():
            if hasattr(sponsor, key) and value is not None:
                setattr(sponsor, key, value)

        self.db.commit()
        self.db.refresh(sponsor)
        return sponsor

    def delete(self, sponsor_id: str) -> bool:
        """Delete sponsor"""
        sponsor = self.get_by_id(sponsor_id)
        if not sponsor:
            return False

        self.db.delete(sponsor)
        self.db.commit()
        return True

    def get_event_sponsors(self, event_id: str) -> List[EventSponsorResponse]:
        """Get all sponsors for an event"""
        event_sponsors = (
            self.db.query(EventSponsor)
            .options(joinedload(EventSponsor.sponsor))
            .filter(EventSponsor.event_id == event_id)
            .all()
        )
        
        return [
            EventSponsorResponse(
                id=es.id,
                event_id=es.event_id,
                sponsor=SponsorResponse.from_orm(es.sponsor),
                tier=es.tier,
                benefits=es.benefits
            )
            for es in event_sponsors
        ]

    def add_sponsor_to_event(self, event_id: str, sponsor_id: str, tier: str = "bronze") -> bool:
        """Add sponsor to event"""
        # Check if sponsor and event exist
        sponsor = self.get_by_id(sponsor_id)
        event = self.db.query(Event).filter(Event.id == event_id).first()
        
        if not sponsor or not event:
            return False

        # Check if already associated
        existing = (
            self.db.query(EventSponsor)
            .filter(EventSponsor.event_id == event_id, EventSponsor.sponsor_id == sponsor_id)
            .first()
        )
        
        if existing:
            return False

        event_sponsor = EventSponsor(
            id=str(uuid.uuid4()),
            event_id=event_id,
            sponsor_id=sponsor_id,
            tier=tier
        )
        
        self.db.add(event_sponsor)
        self.db.commit()
        return True

    def remove_sponsor_from_event(self, event_id: str, sponsor_id: str) -> bool:
        """Remove sponsor from event"""
        event_sponsor = (
            self.db.query(EventSponsor)
            .filter(EventSponsor.event_id == event_id, EventSponsor.sponsor_id == sponsor_id)
            .first()
        )
        
        if not event_sponsor:
            return False

        self.db.delete(event_sponsor)
        self.db.commit()
        return True
