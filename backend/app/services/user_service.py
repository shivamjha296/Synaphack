from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from app.models.sql_models import User, UserRole, LoginMethod
from app.core.security import get_password_hash
import uuid

class UserService:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        email: str,
        full_name: str,
        hashed_password: Optional[str] = None,
        role: UserRole = UserRole.PARTICIPANT,
        login_method: LoginMethod = LoginMethod.EMAIL,
        bio: Optional[str] = None,
        skills: Optional[List[str]] = None,
        social_links: Optional[Dict[str, str]] = None,
        profile_picture: Optional[str] = None
    ) -> User:
        """Create a new user"""
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            full_name=full_name,
            hashed_password=hashed_password,
            role=role,
            login_method=login_method,
            bio=bio,
            skills=skills,
            social_links=social_links,
            profile_picture=profile_picture,
            is_active=True
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID"""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.db.query(User).filter(User.email == email).first()

    def get_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users with pagination"""
        return self.db.query(User).offset(skip).limit(limit).all()

    def update(self, user_id: str, user_data: Dict[str, Any]) -> Optional[User]:
        """Update user"""
        user = self.get_by_id(user_id)
        if not user:
            return None

        for key, value in user_data.items():
            if hasattr(user, key):
                setattr(user, key, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def update_password(self, user_id: str, new_password: str) -> Optional[User]:
        """Update user password"""
        user = self.get_by_id(user_id)
        if not user:
            return None

        user.hashed_password = get_password_hash(new_password)
        self.db.commit()
        self.db.refresh(user)
        return user

    def deactivate(self, user_id: str) -> Optional[User]:
        """Deactivate user"""
        user = self.get_by_id(user_id)
        if not user:
            return None

        user.is_active = False
        self.db.commit()
        self.db.refresh(user)
        return user

    def activate(self, user_id: str) -> Optional[User]:
        """Activate user"""
        user = self.get_by_id(user_id)
        if not user:
            return None

        user.is_active = True
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user_id: str) -> bool:
        """Delete user (soft delete by deactivating)"""
        user = self.get_by_id(user_id)
        if not user:
            return False

        user.is_active = False
        self.db.commit()
        return True

    def search_users(self, query: str, role: Optional[UserRole] = None) -> List[User]:
        """Search users by name or email"""
        search_query = self.db.query(User).filter(
            (User.full_name.contains(query)) | (User.email.contains(query))
        )
        
        if role:
            search_query = search_query.filter(User.role == role)
            
        return search_query.all()

    def get_users_by_role(self, role: UserRole) -> List[User]:
        """Get all users by role"""
        return self.db.query(User).filter(User.role == role).all()

    def get_active_users(self) -> List[User]:
        """Get all active users"""
        return self.db.query(User).filter(User.is_active == True).all()
        
    def count_users(self) -> int:
        """Count total users"""
        return self.db.query(User).count()
        
    def count_active_users(self) -> int:
        """Count active users"""
        return self.db.query(User).filter(User.is_active == True).count()
