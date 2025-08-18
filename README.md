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

- Node.js 18+ (LTS recommended)
- npm 9+ or Yarn/Pnpm
- Python 3.9+
- Docker & Docker Compose (recommended for full-stack local dev)
- Optional: Azure account for production deployment

If you just cloned the repo and want the simplest way to run everything, use Docker Compose (recommended). If you prefer to develop locally without containers, follow the Local Development steps below.

Quick checklist for cloners:

- Create GitHub personal access token (if you plan to push to remote)
- Install Git LFS if you plan to add large binary assets (see note below)
- Copy `.env` example files for backend and frontend before starting

### Option A — Recommended: Start with Docker Compose (fast & reproducible)

1. Copy environment file templates and edit values:

```powershell
cd hackathon-platform
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

Edit `backend/.env` and `frontend/.env.local` to set database credentials, JWT secret, and OAuth keys.

2. Start services with Docker Compose:

```powershell
docker-compose up -d
```

3. Initialize the database and seed data (one-time):

```powershell
docker-compose exec backend alembic upgrade head
docker-compose exec backend python scripts/seed_data.py  # optional
```

4. Open the app and API docs:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

Notes:
- On Windows PowerShell, prefix `docker-compose` commands with `&` if you run into execution parsing issues.

### Option B — Local Development (without Docker)

Follow this if you want to run the frontend/backend directly on your machine.

1) Clone the repo:

```bash
git clone https://github.com/<your-org-or-username>/<repo>.git
cd hackathon-platform
```

2) Backend setup (Unix/macOS):

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit .env with your connection strings and secrets
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

On Windows (PowerShell):

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# edit backend\.env
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3) Frontend setup:

```bash
cd frontend
npm install
copy .env.example .env.local
# edit frontend/.env.local
npm run dev
```

On Windows (PowerShell):

```powershell
cd frontend
npm install
copy .env.example .env.local
# edit frontend\.env.local
npm run dev
```

Visit the same URLs as above once both servers are running.

### Git LFS note (for large binaries)

If you plan to commit large binaries (for example compiled native modules), enable Git LFS and track those files before adding them to the repo:

```powershell
git lfs install
git lfs track "*.node"
git add .gitattributes
git commit -m "chore: enable git lfs for large binaries"
```

Do NOT commit `node_modules/` or compiled artifacts — they should be ignored by `.gitignore`.

### Troubleshooting common issues

- Error: Cannot find module '@tailwindcss/forms' — run `npm install` inside `frontend`.
- Push rejected due to large files (>100MB) — remove the file from git history or use Git LFS as explained above.
- Next.js build errors after dependency changes — remove `node_modules` and reinstall:

```powershell
cd frontend
rm -r node_modules package-lock.json  # use Remove-Item on PowerShell if needed
npm install
```

### Docker cleanup & rebuild (if things look stale)

```powershell
docker-compose down --volumes --remove-orphans
docker-compose up --build -d
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
