from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.lib.colors import blue, black
from reportlab.lib.units import inch
import os
from datetime import datetime

from app.core.database import get_database
from app.models.schemas import CertificateRequest, CertificateResponse
from app.models.sql_models import User, Event
from app.services.user_service import UserService
from app.services.event_service import EventService
from app.api.auth import get_current_active_user

router = APIRouter()

def generate_certificate_pdf(user_name: str, event_title: str, certificate_type: str, event_date: str) -> str:
    """Generate a certificate PDF"""
    filename = f"certificate_{user_name.replace(' ', '_')}_{event_title.replace(' ', '_')}_{certificate_type}.pdf"
    filepath = os.path.join("static", filename)
    
    # Ensure static directory exists
    os.makedirs("static", exist_ok=True)
    
    # Create PDF
    c = canvas.Canvas(filepath, pagesize=letter)
    width, height = letter
    
    # Title
    c.setFont("Helvetica-Bold", 24)
    c.setFillColor(blue)
    c.drawCentredText(width/2, height - 2*inch, "CERTIFICATE OF ACHIEVEMENT")
    
    # Subtitle
    c.setFont("Helvetica", 16)
    c.setFillColor(black)
    certificate_text = {
        "participation": "This certifies that",
        "winner": "This certifies that",
        "runner_up": "This certifies that"
    }
    c.drawCentredText(width/2, height - 3*inch, certificate_text.get(certificate_type, "This certifies that"))
    
    # User name
    c.setFont("Helvetica-Bold", 20)
    c.setFillColor(blue)
    c.drawCentredText(width/2, height - 4*inch, user_name)
    
    # Achievement text
    c.setFont("Helvetica", 14)
    c.setFillColor(black)
    achievement_text = {
        "participation": f"has successfully participated in {event_title}",
        "winner": f"has won first place in {event_title}",
        "runner_up": f"has achieved runner-up position in {event_title}"
    }
    c.drawCentredText(width/2, height - 5*inch, achievement_text.get(certificate_type, f"has participated in {event_title}"))
    
    # Event date
    c.setFont("Helvetica", 12)
    c.drawCentredText(width/2, height - 6*inch, f"Event Date: {event_date}")
    
    # Generated date
    c.drawCentredText(width/2, height - 8*inch, f"Generated on: {datetime.now().strftime('%B %d, %Y')}")
    
    # Footer
    c.setFont("Helvetica-Oblique", 10)
    c.drawCentredText(width/2, 1*inch, "Hackathon Platform - Digital Certificate")
    
    c.save()
    return filename

@router.post("/generate", response_model=CertificateResponse)
async def generate_certificate(
    certificate_request: CertificateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Generate a certificate for a user"""
    user_service = UserService(db)
    event_service = EventService(db)
    
    # Get user and event
    user = user_service.get_by_id(certificate_request.user_id)
    event = event_service.get_by_id(certificate_request.event_id)
    
    if not user or not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User or event not found"
        )
    
    # Check permissions - user can generate their own certificate, organizers can generate for their events
    if (current_user.id != certificate_request.user_id and 
        current_user.role not in ["organizer", "admin"] and
        event.organizer_id != current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to generate this certificate"
        )
    
    # Generate certificate
    try:
        filename = generate_certificate_pdf(
            user.full_name,
            event.title,
            certificate_request.certificate_type,
            event.event_start.strftime("%B %d, %Y")
        )
        
        certificate_url = f"/static/{filename}"
        certificate_id = f"cert_{user.id}_{event.id}_{certificate_request.certificate_type}"
        
        return CertificateResponse(
            certificate_url=certificate_url,
            certificate_id=certificate_id
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate certificate: {str(e)}"
        )

@router.get("/user/{user_id}/event/{event_id}")
async def get_user_certificate(
    user_id: str,
    event_id: str,
    certificate_type: str = "participation",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_database)
):
    """Get certificate for a user and event"""
    # Check if certificate file exists
    user_service = UserService(db)
    event_service = EventService(db)
    
    user = user_service.get_by_id(user_id)
    event = event_service.get_by_id(event_id)
    
    if not user or not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User or event not found"
        )
    
    filename = f"certificate_{user.full_name.replace(' ', '_')}_{event.title.replace(' ', '_')}_{certificate_type}.pdf"
    filepath = os.path.join("static", filename)
    
    if os.path.exists(filepath):
        return {
            "certificate_url": f"/static/{filename}",
            "certificate_id": f"cert_{user_id}_{event_id}_{certificate_type}",
            "exists": True
        }
    else:
        return {
            "exists": False,
            "message": "Certificate not found. Generate one first."
        }
