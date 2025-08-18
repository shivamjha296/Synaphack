#!/usr/bin/env python3
"""
Create a test user for development purposes
"""
import sys
import os

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import engine, get_database
from app.core.security import get_password_hash
from app.models.sql_models import User, LoginMethod, UserRole

def create_test_user():
    """Create a test user for development"""
    db = Session(bind=engine)
    
    try:
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == "test@example.com").first()
        if existing_user:
            print("Test user already exists!")
            return
        
        # Create test user
        test_user = User(
            email="test@example.com",
            full_name="Test User",
            hashed_password=get_password_hash("password123"),
            role=UserRole.PARTICIPANT,
            login_method=LoginMethod.EMAIL,
            is_active=True,
            bio="Test user for development",
            skills=["Python", "FastAPI"],
            social_links={}
        )
        
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        print(f"✅ Test user created successfully!")
        print(f"Email: test@example.com")
        print(f"Password: password123")
        print(f"Role: {test_user.role}")
        
    except Exception as e:
        print(f"❌ Error creating test user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_user()
