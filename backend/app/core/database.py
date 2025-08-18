from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings

# SQL Database
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# MongoDB (will be imported when needed)
mongodb_client = None
mongodb_database = None

def get_database() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def init_db():
    """Initialize databases"""
    # Create SQL tables
    Base.metadata.create_all(bind=engine)
    
    # Initialize MongoDB - import here to avoid startup issues
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        global mongodb_client, mongodb_database
        mongodb_client = AsyncIOMotorClient(settings.MONGODB_URL)
        # Verify connection by issuing a ping; if it fails, disable MongoDB features
        try:
            await mongodb_client.admin.command('ping')
            mongodb_database = mongodb_client[settings.MONGODB_DATABASE]
        except Exception as e:
            print(f"Warning: Could not connect to MongoDB at {settings.MONGODB_URL}: {e}")
            mongodb_client = None
            mongodb_database = None
    except ImportError:
        print("Warning: motor not installed, MongoDB features will be disabled")

async def get_mongodb():
    """Get MongoDB database"""
    return mongodb_database

async def close_db():
    """Close database connections"""
    if mongodb_client:
        mongodb_client.close()
