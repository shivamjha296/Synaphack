from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from app.models.schemas import AnnouncementCreate, AnnouncementResponse

class AnnouncementService:
    def __init__(self, db: Session, mongodb):
        self.db = db
        self.mongodb = mongodb

    async def create(
        self, 
        announcement_data: AnnouncementCreate, 
        author_id: str, 
        author_name: str
    ) -> AnnouncementResponse:
        """Create a new announcement"""
        announcement_doc = {
            "_id": str(uuid.uuid4()),
            "title": announcement_data.title,
            "content": announcement_data.content,
            "priority": announcement_data.priority,
            "target_audience": announcement_data.target_audience,
            "event_id": announcement_data.event_id,
            "author_id": author_id,
            "author_name": author_name,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        # Insert into MongoDB if available, otherwise store in memory
        if self.mongodb:
            await self.mongodb.announcements.insert_one(announcement_doc)
        
        return AnnouncementResponse(
            id=announcement_doc["_id"],
            title=announcement_doc["title"],
            content=announcement_doc["content"],
            priority=announcement_doc["priority"],
            target_audience=announcement_doc["target_audience"],
            event_id=announcement_doc["event_id"],
            author_id=announcement_doc["author_id"],
            author_name=announcement_doc["author_name"],
            created_at=announcement_doc["created_at"]
        )

    async def get_by_id(self, announcement_id: str) -> Optional[AnnouncementResponse]:
        """Get announcement by ID"""
        if not self.mongodb:
            return None
            
        doc = await self.mongodb.announcements.find_one({"_id": announcement_id})
        
        if not doc:
            return None
            
        return AnnouncementResponse(
            id=doc["_id"],
            title=doc["title"],
            content=doc["content"],
            priority=doc["priority"],
            target_audience=doc["target_audience"],
            event_id=doc["event_id"],
            author_id=doc["author_id"],
            author_name=doc["author_name"],
            created_at=doc["created_at"]
        )

    async def get_by_event(self, event_id: str) -> List[AnnouncementResponse]:
        """Get all announcements for an event"""
        if not self.mongodb:
            return []

        try:
            cursor = self.mongodb.announcements.find(
                {"event_id": event_id, "is_active": True}
            ).sort("created_at", -1)

            announcements = []
            async for doc in cursor:
                announcements.append(AnnouncementResponse(
                    id=doc["_id"],
                    title=doc["title"],
                    content=doc["content"],
                    priority=doc["priority"],
                    target_audience=doc["target_audience"],
                    event_id=doc["event_id"],
                    author_id=doc["author_id"],
                    author_name=doc["author_name"],
                    created_at=doc["created_at"]
                ))

            return announcements
        except Exception as e:
            # If MongoDB is unreachable or an error occurs, log and return empty list
            print(f"Warning: Failed to read announcements from MongoDB: {e}")
            return []

    async def get_for_user(self, user_id: str, user_role: str) -> List[AnnouncementResponse]:
        """Get all announcements relevant to a user based on their role"""
        if self.mongodb is None:
            return []

        # Build query based on user role
        query = {"is_active": True}

        # Filter by target audience
        if user_role == "admin":
            # Admins see all announcements
            pass
        elif user_role == "organizer":
            query["target_audience"] = {"$in": ["all", "organizers"]}
        elif user_role == "judge":
            query["target_audience"] = {"$in": ["all", "judges"]}
        else:  # participant
            query["target_audience"] = {"$in": ["all", "participants"]}

        try:
            cursor = self.mongodb.announcements.find(query).sort("created_at", -1)
            announcements = []
            async for doc in cursor:
                announcements.append(AnnouncementResponse(
                    id=doc["_id"],
                    title=doc["title"],
                    content=doc["content"],
                    priority=doc["priority"],
                    target_audience=doc["target_audience"],
                    event_id=doc["event_id"],
                    author_id=doc["author_id"],
                    author_name=doc["author_name"],
                    created_at=doc["created_at"]
                ))

            return announcements
        except Exception as e:
            print(f"Warning: Failed to read announcements from MongoDB: {e}")
            return []

    async def delete(self, announcement_id: str) -> bool:
        """Delete announcement (soft delete)"""
        if not self.mongodb:
            return False
            
        result = await self.mongodb.announcements.update_one(
            {"_id": announcement_id},
            {"$set": {"is_active": False}}
        )
        
        return result.modified_count > 0
