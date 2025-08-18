# Hackathon Platform 🏆

A modern, full-stack hackathon & event hosting platform built with Next.js and FastAPI.

## 🚀 Features

- **Event Management**: Create and manage hackathons/events with tracks, prizes, and sponsors
- **User Authentication**: Email and Google OAuth integration
- **Team Formation**: Individual and team registration with invite system
- **Project Submission**: PDF/slide uploads + external links (GitHub, YouTube)
- **Multi-Round Judging**: Scoring with rubric and feedback system
- **Role-Based Dashboards**: Tailored experiences for organizers, participants, and judges
- **Real-Time Updates**: Announcements and notifications
- **Certificates**: Automated certificate generation
- **Sponsor Showcase**: Sponsor visibility and integration

## 🏗️ Architecture

```
hackathon-platform/
├── backend/          # FastAPI backend
├── frontend/         # Next.js frontend
├── docker-compose.yml
└── README.md
```

### Tech Stack

**Frontend:**
- Next.js 14 with TypeScript
- TailwindCSS for styling
- PWA support
- Zustand for state management

**Backend:**
- FastAPI (Python)
- Azure SQL Database
- MongoDB
- JWT Authentication
- Azure Blob Storage

**Deployment:**
- Azure App Service
- Azure Functions
- Docker containers

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+
- Python 3.9+
- Docker & Docker Compose
- Azure Account (for deployment)

### Local Development

1. **Clone the repository:**
```bash
git clone <repository-url>
cd hackathon-platform
```

2. **Backend Setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup:**
```bash
cd frontend
npm install
```

4. **Environment Variables:**

Create `.env` files in both backend and frontend directories:

**Backend (.env):**
```env
DATABASE_URL=your_azure_sql_connection_string
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET_KEY=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
AZURE_STORAGE_CONNECTION_STRING=your_azure_blob_connection_string
AZURE_STORAGE_CONTAINER_NAME=hackathon-uploads
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

5. **Database Setup:**
```bash
# Run database migrations
cd backend
alembic upgrade head

# Seed initial data
python seed_data.py
```

6. **Start Development Servers:**
```bash
# Backend (from backend directory)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (from frontend directory)
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Docker Setup

```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in production mode
docker-compose -f docker-compose.prod.yml up --build
```

## 📱 User Roles & Features

### 🎯 Organizers
- Create and manage events
- View registrations and submissions
- Send announcements
- Manage sponsors and prizes
- Access analytics dashboard

### 👥 Participants
- Register for events (individual/team)
- Form and manage teams
- Submit projects
- View deadlines and announcements
- Track submission status

### ⚖️ Judges
- View assigned submissions
- Score projects using rubrics
- Provide detailed feedback
- Access judging dashboard

## 🔐 Authentication

The platform supports:
- Email/password registration and login
- Google OAuth integration
- JWT-based session management
- Role-based access control

## 📊 Database Schema

### Azure SQL Tables
- users
- events
- teams
- team_members
- submissions
- scores
- sponsors
- event_sponsors

### MongoDB Collections
- announcements
- notifications
- qa_sessions (Phase 2)
- analytics_data

## 🚀 Deployment

### Azure App Service

1. **Build Docker images:**
```bash
docker build -t hackathon-backend ./backend
docker build -t hackathon-frontend ./frontend
```

2. **Push to Azure Container Registry:**
```bash
az acr build --registry <your-registry> --image hackathon-backend:latest ./backend
az acr build --registry <your-registry> --image hackathon-frontend:latest ./frontend
```

3. **Deploy to App Service:**
```bash
# Backend
az webapp create --resource-group <rg-name> --plan <app-plan> --name <backend-app-name> --deployment-container-image-name <registry>/hackathon-backend:latest

# Frontend
az webapp create --resource-group <rg-name> --plan <app-plan> --name <frontend-app-name> --deployment-container-image-name <registry>/hackathon-frontend:latest
```

### Environment Variables for Production

Set the following in Azure App Service Configuration:

```env
DATABASE_URL=<azure-sql-connection-string>
MONGODB_URL=<mongodb-atlas-connection-string>
JWT_SECRET_KEY=<secure-jwt-secret>
AZURE_STORAGE_CONNECTION_STRING=<blob-storage-connection>
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm run test
```

### End-to-End Tests
```bash
npm run test:e2e
```

## 📈 Phase Roadmap

### ✅ MVP (Phase 1)
- Event creation and management
- User registration and team formation
- Project submissions
- Multi-round judging system
- Role-based dashboards
- Email/Google authentication
- Certificate generation

### 🔄 Phase 1.5
- Analytics dashboard
- Advanced filtering and search
- Export functionality

### 🚧 Phase 2
- Real-time Q&A system
- Live leaderboard updates
- Plagiarism detection
- Advanced notifications

### 🌟 Phase 3
- Web3 integration
- NFT badges and certificates
- Advanced sponsor features
- AI-powered matching

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for hackathon organizers and participants
- Inspired by the need for better event management tools
- Thanks to the open-source community
