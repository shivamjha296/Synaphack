from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    PARTICIPANT = "participant"
    ORGANIZER = "organizer"
    JUDGE = "judge"
    ADMIN = "admin"

class LoginMethod(str, Enum):
    EMAIL = "email"
    GOOGLE = "google"

class EventStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class SubmissionStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    REVIEWED = "reviewed"

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True

# User schemas
class UserBase(BaseSchema):
    email: EmailStr
    full_name: str
    role: UserRole = UserRole.PARTICIPANT
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    social_links: Optional[Dict[str, str]] = None

class UserCreate(UserBase):
    password: Optional[str] = None
    login_method: LoginMethod = LoginMethod.EMAIL

class UserUpdate(BaseSchema):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    social_links: Optional[Dict[str, str]] = None
    profile_picture: Optional[str] = None

class UserResponse(UserBase):
    id: str
    is_active: bool
    profile_picture: Optional[str] = None
    created_at: datetime

class UserLogin(BaseSchema):
    email: EmailStr
    password: str

class GoogleAuthRequest(BaseSchema):
    token: str

# Token schemas
class Token(BaseSchema):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseSchema):
    user_id: Optional[str] = None

# Event schemas
class EventBase(BaseSchema):
    title: str
    description: str
    short_description: Optional[str] = None
    event_type: str = "hackathon"
    mode: str = "hybrid"
    venue: Optional[str] = None
    max_participants: Optional[int] = None
    max_team_size: int = 4
    registration_start: datetime
    registration_end: datetime
    event_start: datetime
    event_end: datetime
    tracks: Optional[List[str]] = None
    rules: Optional[str] = None
    judging_criteria: Optional[List[Dict[str, Any]]] = None
    prizes: Optional[List[Dict[str, Any]]] = None
    is_public: bool = True
    registration_required: bool = True

class EventCreate(EventBase):
    pass

class EventUpdate(BaseSchema):
    title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    banner_image: Optional[str] = None
    event_type: Optional[str] = None
    mode: Optional[str] = None
    venue: Optional[str] = None
    max_participants: Optional[int] = None
    max_team_size: Optional[int] = None
    registration_start: Optional[datetime] = None
    registration_end: Optional[datetime] = None
    event_start: Optional[datetime] = None
    event_end: Optional[datetime] = None
    tracks: Optional[List[str]] = None
    rules: Optional[str] = None
    judging_criteria: Optional[List[Dict[str, Any]]] = None
    prizes: Optional[List[Dict[str, Any]]] = None
    status: Optional[EventStatus] = None
    is_public: Optional[bool] = None

class EventResponse(EventBase):
    id: str
    banner_image: Optional[str] = None
    status: EventStatus
    organizer_id: str
    organizer: UserResponse
    created_at: datetime
    participants_count: Optional[int] = 0
    teams_count: Optional[int] = 0
    is_registered: Optional[bool] = False  # Indicates if current user is registered

# Team schemas
class TeamBase(BaseSchema):
    name: str
    description: Optional[str] = None
    track: Optional[str] = None

class TeamCreate(TeamBase):
    event_id: str

class TeamUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    track: Optional[str] = None

class TeamMemberResponse(BaseSchema):
    id: str
    user: UserResponse
    role: str
    joined_at: datetime

class TeamResponse(TeamBase):
    id: str
    event_id: str
    leader_id: str
    leader: UserResponse
    members: List[TeamMemberResponse] = []
    created_at: datetime

class TeamInvite(BaseSchema):
    email: EmailStr
    message: Optional[str] = None

# Submission schemas
class SubmissionBase(BaseSchema):
    title: str
    description: str
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    video_url: Optional[str] = None
    track: Optional[str] = None
    technologies: Optional[List[str]] = None

class SubmissionCreate(SubmissionBase):
    team_id: str
    round_number: int = 1

class SubmissionUpdate(BaseSchema):
    title: Optional[str] = None
    description: Optional[str] = None
    github_url: Optional[str] = None
    demo_url: Optional[str] = None
    video_url: Optional[str] = None
    track: Optional[str] = None
    technologies: Optional[List[str]] = None
    status: Optional[SubmissionStatus] = None

class SubmissionResponse(SubmissionBase):
    id: str
    event_id: str
    team_id: str
    submitter_id: str
    team: TeamResponse
    submitter: UserResponse
    presentation_file: Optional[str] = None
    additional_files: Optional[List[str]] = None
    round_number: int
    status: SubmissionStatus
    submitted_at: Optional[datetime] = None
    created_at: datetime
    average_score: Optional[float] = None

# Score schemas
class ScoreBase(BaseSchema):
    criteria_scores: Dict[str, float]
    feedback: Optional[str] = None

class ScoreCreate(ScoreBase):
    submission_id: str

class ScoreUpdate(ScoreBase):
    pass

class ScoreResponse(ScoreBase):
    id: str
    submission_id: str
    judge_id: str
    judge: UserResponse
    total_score: float
    created_at: datetime

# Sponsor schemas
class SponsorBase(BaseSchema):
    name: str
    description: Optional[str] = None
    website_url: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    tier: str = "bronze"

class SponsorCreate(SponsorBase):
    pass

class SponsorUpdate(BaseSchema):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    tier: Optional[str] = None

class SponsorResponse(SponsorBase):
    id: str
    logo_url: Optional[str] = None
    created_at: datetime

class EventSponsorResponse(BaseSchema):
    id: str
    event_id: str
    sponsor: SponsorResponse
    tier: str
    benefits: Optional[List[str]] = None

# Announcement schemas (MongoDB)
class AnnouncementBase(BaseSchema):
    title: str
    content: str
    priority: str = "normal"  # urgent, high, normal, low
    target_audience: str = "all"  # all, participants, judges, organizers

class AnnouncementCreate(AnnouncementBase):
    event_id: str

class AnnouncementResponse(AnnouncementBase):
    id: str
    event_id: str
    author_id: str
    author_name: str
    created_at: datetime
    is_read: Optional[bool] = False

# File upload schema
class FileUploadResponse(BaseSchema):
    filename: str
    file_url: str
    file_size: int
    content_type: str

# Analytics schemas
class EventAnalytics(BaseSchema):
    total_registrations: int
    total_teams: int
    total_submissions: int
    completion_rate: float
    average_team_size: float
    track_distribution: Dict[str, int]
    daily_registrations: List[Dict[str, Any]]

# Certificate schema
class CertificateRequest(BaseSchema):
    user_id: str
    event_id: str
    certificate_type: str = "participation"  # participation, winner, runner_up

class CertificateResponse(BaseSchema):
    certificate_url: str
    certificate_id: str
