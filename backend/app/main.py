from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
from app.api.auth import router as auth_router
from app.api.events import router as events_router
from app.api.users import router as users_router
from app.api.teams import router as teams_router
from app.api.submissions import router as submissions_router
from app.api.scores import router as scores_router
from app.api.announcements import router as announcements_router
from app.api.sponsors import router as sponsors_router
from app.api.certificates import router as certificates_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Hackathon Platform API",
    description="A comprehensive hackathon and event hosting platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for certificates
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# API routes
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(events_router, prefix="/api/events", tags=["Events"])
app.include_router(users_router, prefix="/api/users", tags=["Users"])
app.include_router(teams_router, prefix="/api/teams", tags=["Teams"])
app.include_router(submissions_router, prefix="/api/submissions", tags=["Submissions"])
app.include_router(scores_router, prefix="/api/scores", tags=["Scores"])
app.include_router(announcements_router, prefix="/api/announcements", tags=["Announcements"])
app.include_router(sponsors_router, prefix="/api/sponsors", tags=["Sponsors"])
app.include_router(certificates_router, prefix="/api/certificates", tags=["Certificates"])

@app.get("/")
async def root():
    return {"message": "Hackathon Platform API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
