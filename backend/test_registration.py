#!/usr/bin/env python3
"""
Test script to check registration status and test the API
"""
import sqlite3
import sys
import os

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

def check_registration_status():
    print("=== Registration Status Check ===")
    
    # Connect to database
    conn = sqlite3.connect('hackathon_platform.db')
    cursor = conn.cursor()
    
    # Get the event info
    event_id = "86e9acb3-e309-4329-8915-dcd0a6930079"
    cursor.execute("SELECT id, title, status FROM events WHERE id = ?", (event_id,))
    event = cursor.fetchone()
    
    if event:
        print(f"Event: {event[1]} (Status: {event[2]})")
    else:
        print("Event not found!")
        return
    
    # Check who is registered for this event
    cursor.execute("""
        SELECT u.email, u.full_name, tm.role, t.name as team_name, t.id as team_id
        FROM team_members tm
        JOIN teams t ON tm.team_id = t.id
        JOIN users u ON tm.user_id = u.id
        WHERE t.event_id = ?
    """, (event_id,))
    
    registrations = cursor.fetchall()
    print(f"\nCurrent registrations ({len(registrations)}):")
    for reg in registrations:
        print(f"  - {reg[0]} ({reg[1]}) - Role: {reg[2]} - Team: {reg[3]} ({reg[4]})")
    
    # Check if participant1@hackathon.com is registered
    cursor.execute("""
        SELECT u.email, t.id as team_id, t.name as team_name
        FROM users u
        JOIN team_members tm ON u.id = tm.user_id
        JOIN teams t ON tm.team_id = t.id
        WHERE u.email = ? AND t.event_id = ?
    """, ("participant1@hackathon.com", event_id))
    
    participant_reg = cursor.fetchone()
    if participant_reg:
        print(f"\n❌ participant1@hackathon.com IS already registered in team {participant_reg[2]} ({participant_reg[1]})")
        print("This is why the registration API returns 400 - user is already registered!")
    else:
        print(f"\n✅ participant1@hackathon.com is NOT registered for this event")
    
    conn.close()

def test_event_service():
    print("\n=== Testing EventService.is_user_registered ===")
    
    try:
        from app.core.database import get_database
        from app.services.event_service import EventService
        from app.services.user_service import UserService
        
        # Get database session
        db = next(get_database())
        
        # Get services
        event_service = EventService(db)
        user_service = UserService(db)
        
        # Get user
        user = user_service.get_by_email("participant1@hackathon.com")
        if not user:
            print("❌ User participant1@hackathon.com not found")
            return
        
        # Check registration status
        event_id = "86e9acb3-e309-4329-8915-dcd0a6930079"
        is_registered = event_service.is_user_registered(event_id, user.id)
        
        print(f"EventService.is_user_registered result: {is_registered}")
        
        if is_registered:
            print("✅ EventService correctly detects user is registered")
        else:
            print("❌ EventService incorrectly thinks user is NOT registered")
            
        db.close()
        
    except Exception as e:
        print(f"Error testing EventService: {e}")

if __name__ == "__main__":
    check_registration_status()
    test_event_service()
