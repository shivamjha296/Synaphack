import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal, init_db
from app.models.sql_models import User, Event, Team, Sponsor, UserRole, EventStatus, LoginMethod
from app.core.security import get_password_hash
from app.services.user_service import UserService
from app.services.event_service import EventService
from app.services.sponsor_service import SponsorService
from datetime import datetime, timedelta
import uuid

async def create_seed_data():
    """Create seed data for development"""
    print("Initializing database...")
    await init_db()
    
    db = SessionLocal()
    try:
        user_service = UserService(db)
        event_service = EventService(db)
        sponsor_service = SponsorService(db)
        
        print("Creating seed users...")
        
        # Create admin user
        admin = user_service.create(
            email="admin@hackathon.com",
            full_name="Admin User",
            hashed_password=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            bio="Platform administrator"
        )
        print(f"Created admin user: {admin.email}")
        
        # Create organizer
        organizer = user_service.create(
            email="organizer@hackathon.com",
            full_name="Event Organizer",
            hashed_password=get_password_hash("organizer123"),
            role=UserRole.ORGANIZER,
            bio="Hackathon organizer and event manager"
        )
        print(f"Created organizer user: {organizer.email}")
        
        # Create judge
        judge = user_service.create(
            email="judge@hackathon.com",
            full_name="Judge Smith",
            hashed_password=get_password_hash("judge123"),
            role=UserRole.JUDGE,
            bio="Experienced software engineer and hackathon judge"
        )
        print(f"Created judge user: {judge.email}")
        
        # Create participants
        participants = []
        for i in range(5):
            participant = user_service.create(
                email=f"participant{i+1}@hackathon.com",
                full_name=f"Participant {i+1}",
                hashed_password=get_password_hash("participant123"),
                role=UserRole.PARTICIPANT,
                bio=f"Passionate developer and hackathon participant #{i+1}",
                skills=["Python", "JavaScript", "React", "Machine Learning"][:i+2]
            )
            participants.append(participant)
            print(f"Created participant: {participant.email}")
        
        print("Creating seed sponsors...")
        
        # Create sponsors
        sponsors_data = [
            {
                "name": "TechCorp",
                "description": "Leading technology company",
                "website_url": "https://techcorp.com",
                "contact_email": "contact@techcorp.com",
                "tier": "platinum"
            },
            {
                "name": "StartupHub",
                "description": "Supporting innovative startups",
                "website_url": "https://startuphub.com",
                "contact_email": "hello@startuphub.com",
                "tier": "gold"
            },
            {
                "name": "DevTools Inc",
                "description": "Developer tools and services",
                "website_url": "https://devtools.com",
                "contact_email": "info@devtools.com",
                "tier": "silver"
            }
        ]
        
        sponsors = []
        for sponsor_data in sponsors_data:
            from app.models.schemas import SponsorCreate
            sponsor = sponsor_service.create(SponsorCreate(**sponsor_data))
            sponsors.append(sponsor)
            print(f"Created sponsor: {sponsor.name}")
        
        print("Creating seed events...")
        
        # Create events
        now = datetime.utcnow()
        
        # Upcoming event
        from app.models.schemas import EventCreate
        upcoming_event_data = EventCreate(
            title="AI Innovation Hackathon 2024",
            description="A 48-hour hackathon focused on artificial intelligence and machine learning innovations. Build the next generation of AI-powered applications and compete for amazing prizes!",
            short_description="48-hour AI/ML hackathon with $10,000 in prizes",
            event_type="hackathon",
            mode="hybrid",
            venue="Tech Innovation Center, San Francisco",
            max_participants=200,
            max_team_size=4,
            registration_start=now - timedelta(days=10),
            registration_end=now + timedelta(days=20),
            event_start=now + timedelta(days=30),
            event_end=now + timedelta(days=32),
            tracks=["AI/ML", "Web Applications", "Mobile Apps", "IoT", "Blockchain"],
            rules="Teams of 1-4 members. Original code only. No pre-existing projects.",
            judging_criteria=[
                {"criteria": "Innovation", "weight": 30},
                {"criteria": "Technical Implementation", "weight": 25},
                {"criteria": "User Experience", "weight": 20},
                {"criteria": "Business Impact", "weight": 15},
                {"criteria": "Presentation", "weight": 10}
            ],
            prizes=[
                {"position": "1st Place", "prize": "$5,000 + Internship Opportunity"},
                {"position": "2nd Place", "prize": "$3,000 + Mentorship Program"},
                {"position": "3rd Place", "prize": "$2,000 + Tech Goodies"},
                {"position": "Best AI Innovation", "prize": "$1,000 + AWS Credits"}
            ],
            is_public=True,
            registration_required=True
        )
        
        upcoming_event = event_service.create(upcoming_event_data, organizer.id)
        print(f"Created upcoming event: {upcoming_event.title}")
        
        # Add sponsors to event
        for sponsor in sponsors:
            sponsor_service.add_sponsor_to_event(upcoming_event.id, sponsor.id, sponsor.tier)
        
        # Past event
        past_event_data = EventCreate(
            title="Web Development Challenge 2023",
            description="A completed hackathon focused on web development and user experience design.",
            short_description="Completed web development hackathon",
            event_type="hackathon",
            mode="online",
            max_participants=150,
            max_team_size=3,
            registration_start=now - timedelta(days=60),
            registration_end=now - timedelta(days=40),
            event_start=now - timedelta(days=30),
            event_end=now - timedelta(days=28),
            tracks=["Frontend", "Backend", "Full Stack", "UI/UX"],
            rules="Teams of 1-3 members. Must use provided APIs.",
            judging_criteria=[
                {"criteria": "Design", "weight": 40},
                {"criteria": "Functionality", "weight": 35},
                {"criteria": "Code Quality", "weight": 25}
            ],
            prizes=[
                {"position": "1st Place", "prize": "$3,000"},
                {"position": "2nd Place", "prize": "$2,000"},
                {"position": "3rd Place", "prize": "$1,000"}
            ],
            is_public=True,
            registration_required=True
        )
        
        past_event = event_service.create(past_event_data, organizer.id)
        past_event.status = EventStatus.COMPLETED
        db.commit()
        print(f"Created past event: {past_event.title}")
        
        print("Seed data created successfully!")
        print("\nLogin Credentials:")
        print("Admin: admin@hackathon.com / admin123")
        print("Organizer: organizer@hackathon.com / organizer123")
        print("Judge: judge@hackathon.com / judge123")
        print("Participants: participant1@hackathon.com to participant5@hackathon.com / participant123")
        
    except Exception as e:
        print(f"Error creating seed data: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(create_seed_data())
