# 🚀 Quick Start Guide

Welcome to the Hackathon Platform! This guide will get you up and running in minutes.

## 🎯 What You've Built

A complete hackathon hosting platform with:

- **Frontend**: Modern React/Next.js application with TypeScript
- **Backend**: FastAPI server with comprehensive APIs
- **Databases**: PostgreSQL + MongoDB + Redis
- **Authentication**: JWT + Google OAuth
- **File Storage**: Azure Blob Storage integration
- **Deployment**: Docker containerization ready

## ⚡ Fastest Way to Start

### Option 1: Docker Compose (Recommended)

```bash
# 1. Set up environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# 2. Edit the environment files with your settings
# (At minimum, update the JWT secret and database passwords)

# 3. Start everything
docker-compose up -d

# 4. Run database migrations
docker-compose exec backend alembic upgrade head

# 5. Open your browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Option 2: Use Setup Scripts

**Windows:**
```cmd
setup.bat
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

## 🔑 Essential Configuration

### Backend Environment (backend/.env)
```env
# Database - Update with your actual credentials
DATABASE_URL=postgresql://hackathon_user:hackathon_pass@postgres:5432/hackathon_db
MONGODB_URL=mongodb://mongo:27017/hackathon_announcements
REDIS_URL=redis://redis:6379/0

# Security - CHANGE THESE!
JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Storage - Add your Azure credentials
AZURE_STORAGE_CONNECTION_STRING=your-azure-storage-connection-string
```

### Frontend Environment (frontend/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

## 👥 User Roles & Access

The platform supports 4 user roles:

1. **Participant** - Join events, form teams, submit projects
2. **Organizer** - Create and manage events
3. **Judge** - Evaluate submissions and provide scores
4. **Admin** - Platform administration

### Default Test Users

After running the setup, you can create test accounts or use these roles:

- Register normally and your first account becomes an admin
- Create additional accounts for testing different roles

## 🌐 Key URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Alternative API Docs**: http://localhost:8000/redoc

## 🔧 Development Commands

### Docker Commands
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up --build

# Run database migrations
docker-compose exec backend alembic upgrade head

# Access backend shell
docker-compose exec backend bash

# Access database
docker-compose exec postgres psql -U hackathon_user -d hackathon_db
```

### Local Development
```bash
# Backend (from /backend directory)
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn app.main:app --reload

# Frontend (from /frontend directory)
npm run dev

# Database migrations
alembic upgrade head
alembic revision --autogenerate -m "Description"
```

## 🧪 Testing Your Setup

### Quick Health Check
```bash
# Use the health check script
./health-check.sh  # Mac/Linux
# Or manually check:
curl http://localhost:3000  # Frontend
curl http://localhost:8000/health  # Backend
```

### Test User Workflows

1. **Visit** http://localhost:3000
2. **Register** a new account (becomes admin by default)
3. **Create an event** from the organizer dashboard
4. **Register another user** as a participant
5. **Form a team** and invite members
6. **Submit a project** for the event
7. **Test judging** by adding a judge role

## 📱 Platform Features

### For Event Organizers
- ✅ Create and manage hackathon events
- ✅ Set up tracks, prizes, and sponsorships
- ✅ View participant registrations
- ✅ Send announcements to participants
- ✅ Monitor submissions and teams
- ✅ Manage judges and scoring

### For Participants  
- ✅ Browse and register for events
- ✅ Create or join teams
- ✅ Submit projects with files and links
- ✅ Receive real-time announcements
- ✅ Track submission status
- ✅ View event schedules and deadlines

### For Judges
- ✅ Access assigned submissions
- ✅ Score projects using custom criteria
- ✅ Provide detailed feedback
- ✅ View team information and project details

### For Platform Admins
- ✅ Manage all users and events
- ✅ Platform-wide analytics
- ✅ System configuration
- ✅ User role management

## 🚨 Troubleshooting

### Common Issues

**Frontend won't load:**
- Check if http://localhost:3000 is accessible
- Verify `NEXT_PUBLIC_API_URL` in frontend/.env.local

**Backend API errors:**
- Check if http://localhost:8000 responds
- Verify database connections in backend/.env
- Check Docker containers: `docker-compose ps`

**Database connection errors:**
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify credentials match docker-compose.yml

**Authentication issues:**
- Verify JWT_SECRET_KEY is set
- Check Google OAuth configuration
- Ensure frontend/backend URLs match

### Getting Help

1. **Check logs**: `docker-compose logs servicename`
2. **Restart services**: `docker-compose restart`
3. **Fresh start**: `docker-compose down && docker-compose up`
4. **Database reset**: Remove Docker volumes and restart

## 🎯 Next Steps

Now that your platform is running:

1. **Customize branding** - Update logos and colors in the frontend
2. **Configure external services** - Set up Azure Blob Storage, Google OAuth
3. **Add SSL/HTTPS** - Configure for production deployment
4. **Set up monitoring** - Add logging and analytics
5. **Deploy to production** - Use Azure App Services or your preferred platform

## 📞 Support

- 📖 **Full Documentation**: See README.md
- 🐳 **Docker Issues**: Check docker-compose logs
- 🌐 **API Reference**: http://localhost:8000/docs
- 🔧 **Configuration**: Review .env files

---

**🎉 Congratulations! Your hackathon platform is ready to host amazing events!**
