from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Enum, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum as PyEnum
import uuid

from app.core.database import Base

class UserRole(PyEnum):
    PARTICIPANT = "participant"
    ORGANIZER = "organizer"
    JUDGE = "judge"
    ADMIN = "admin"

class LoginMethod(PyEnum):
    EMAIL = "email"
    GOOGLE = "google"

class EventStatus(PyEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class SubmissionStatus(PyEnum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    REVIEWED = "reviewed"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=True)  # Null for OAuth users
    role = Column(Enum(UserRole), default=UserRole.PARTICIPANT)
    login_method = Column(Enum(LoginMethod), default=LoginMethod.EMAIL)
    is_active = Column(Boolean, default=True)
    profile_picture = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    skills = Column(JSON, nullable=True)  # List of skills
    social_links = Column(JSON, nullable=True)  # Dict of social media links
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organized_events = relationship("Event", back_populates="organizer")
    team_memberships = relationship("TeamMember", back_populates="user")
    submissions = relationship("Submission", back_populates="submitter")
    scores_given = relationship("Score", back_populates="judge")

class Event(Base):
    __tablename__ = "events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    short_description = Column(String(500), nullable=True)
    banner_image = Column(String(500), nullable=True)
    
    # Event details
    event_type = Column(String(50), default="hackathon")  # hackathon, workshop, competition
    mode = Column(String(20), default="hybrid")  # online, offline, hybrid
    venue = Column(String(500), nullable=True)
    max_participants = Column(Integer, nullable=True)
    max_team_size = Column(Integer, default=4)
    
    # Timeline
    registration_start = Column(DateTime(timezone=True), nullable=False)
    registration_end = Column(DateTime(timezone=True), nullable=False)
    event_start = Column(DateTime(timezone=True), nullable=False)
    event_end = Column(DateTime(timezone=True), nullable=False)
    
    # Event configuration
    tracks = Column(JSON, nullable=True)  # List of tracks/categories
    rules = Column(Text, nullable=True)
    judging_criteria = Column(JSON, nullable=True)  # List of criteria with weights
    prizes = Column(JSON, nullable=True)  # List of prizes
    
    # Status and metadata
    status = Column(Enum(EventStatus), default=EventStatus.DRAFT)
    is_public = Column(Boolean, default=True)
    registration_required = Column(Boolean, default=True)
    
    # Organizer
    organizer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    organizer = relationship("User", back_populates="organized_events")
    teams = relationship("Team", back_populates="event")
    submissions = relationship("Submission", back_populates="event")
    event_sponsors = relationship("EventSponsor", back_populates="event")

class Team(Base):
    __tablename__ = "teams"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    track = Column(String(100), nullable=True)
    
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    leader_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    event = relationship("Event", back_populates="teams")
    leader = relationship("User")
    members = relationship("TeamMember", back_populates="team")
    submissions = relationship("Submission", back_populates="team")

class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    team_id = Column(String(36), ForeignKey("teams.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    role = Column(String(50), default="member")  # leader, member
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="team_memberships")

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    
    # Links and files
    github_url = Column(String(500), nullable=True)
    demo_url = Column(String(500), nullable=True)
    video_url = Column(String(500), nullable=True)
    presentation_file = Column(String(500), nullable=True)
    additional_files = Column(JSON, nullable=True)  # List of file URLs
    
    # Submission details
    track = Column(String(100), nullable=True)
    technologies = Column(JSON, nullable=True)  # List of technologies used
    round_number = Column(Integer, default=1)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.DRAFT)
    
    # Foreign keys
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    team_id = Column(String(36), ForeignKey("teams.id"), nullable=False)
    submitter_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    event = relationship("Event", back_populates="submissions")
    team = relationship("Team", back_populates="submissions")
    submitter = relationship("User", back_populates="submissions")
    scores = relationship("Score", back_populates="submission")

class Score(Base):
    __tablename__ = "scores"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.id"), nullable=False)
    judge_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Scoring
    criteria_scores = Column(JSON, nullable=False)  # Dict of criteria: score
    total_score = Column(Float, nullable=False)
    feedback = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    submission = relationship("Submission", back_populates="scores")
    judge = relationship("User", back_populates="scores_given")

class Sponsor(Base):
    __tablename__ = "sponsors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    website_url = Column(String(500), nullable=True)
    contact_email = Column(String(255), nullable=True)
    tier = Column(String(50), default="bronze")  # platinum, gold, silver, bronze
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    event_sponsors = relationship("EventSponsor", back_populates="sponsor")

class EventSponsor(Base):
    __tablename__ = "event_sponsors"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("events.id"), nullable=False)
    sponsor_id = Column(String(36), ForeignKey("sponsors.id"), nullable=False)
    tier = Column(String(50), default="bronze")
    benefits = Column(JSON, nullable=True)  # List of benefits provided
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    event = relationship("Event", back_populates="event_sponsors")
    sponsor = relationship("Sponsor", back_populates="event_sponsors")
