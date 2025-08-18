#!/usr/bin/env python3
"""
Create demo users: organizer, judge, participant
"""
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import engine
from app.core.security import get_password_hash
from app.models.sql_models import User, LoginMethod, UserRole

USERS = [
    ("organizer@hackathon.com", "organizer123", UserRole.ORGANIZER),
    ("judge@hackathon.com", "judge123", UserRole.JUDGE),
    ("participant1@hackathon.com", "participant123", UserRole.PARTICIPANT),
]


def create_demo_users():
    db = Session(bind=engine)
    try:
        for email, password, role in USERS:
            existing = db.query(User).filter(User.email == email).first()
            if existing:
                print(f"User {email} already exists, skipping")
                continue
            user = User(
                email=email,
                full_name=email.split('@')[0].capitalize(),
                hashed_password=get_password_hash(password),
                role=role,
                login_method=LoginMethod.EMAIL,
                is_active=True,
                bio="Demo account",
                skills=[],
                social_links={}
            )
            db.add(user)
        db.commit()
        print("✅ Demo users created/verified successfully")
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating demo users: {e}")
    finally:
        db.close()

if __name__ == '__main__':
    create_demo_users()
