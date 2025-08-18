@echo off
setlocal enabledelayedexpansion

:: Hackathon Platform Setup Script for Windows
:: This script helps initialize the development environment

echo 🏆 Hackathon Platform Setup
echo ==========================
echo.

:: Check prerequisites
echo 📋 Checking prerequisites...

:: Check Docker
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker first.
    pause
    exit /b 1
)

:: Check Docker Compose
docker-compose --version >nul 2>&1
if errorlevel 1 (
    docker compose version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker Compose is not installed. Please install Docker Compose first.
        pause
        exit /b 1
    )
)

echo ✅ Docker and Docker Compose are available

:: Check Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Node.js not found (optional for Docker setup)
) else (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js !NODE_VERSION! is available
)

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Python not found (optional for Docker setup)
) else (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo ✅ !PYTHON_VERSION! is available
)

echo.

:: Setup environment files
echo 🔧 Setting up environment files...

:: Backend environment
if not exist "backend\.env" (
    echo 📄 Creating backend\.env from template...
    copy "backend\.env.example" "backend\.env" >nul
    echo ✅ Created backend\.env
    echo ⚠️  Please edit backend\.env with your configuration values
) else (
    echo ✅ backend\.env already exists
)

:: Frontend environment
if not exist "frontend\.env.local" (
    echo 📄 Creating frontend\.env.local from template...
    copy "frontend\.env.example" "frontend\.env.local" >nul
    echo ✅ Created frontend\.env.local
    echo ⚠️  Please edit frontend\.env.local with your configuration values
) else (
    echo ✅ frontend\.env.local already exists
)

echo.

:: Choose setup method
echo 🚀 Choose your setup method:
echo 1) Docker Compose (Recommended for beginners)
echo 2) Local Development (For active development)
echo 3) Exit
echo.

set /p choice="Enter your choice (1-3): "

if "%choice%"=="1" (
    echo.
    echo 🐳 Setting up with Docker Compose...
    echo 📥 Pulling required images...
    
    docker-compose pull
    
    echo 🏗️  Building application images...
    docker-compose build
    
    echo 🚀 Starting services...
    docker-compose up -d
    
    echo ⏳ Waiting for services to be ready...
    timeout /t 10 /nobreak >nul
    
    echo 🗄️  Running database migrations...
    docker-compose exec backend alembic upgrade head
    
    echo 🌱 Seeding initial data...
    docker-compose exec backend python scripts/seed_data.py || echo ⚠️  Seed script not found (optional)
    
    echo.
    echo ✅ Setup complete!
    echo 🌐 Frontend: http://localhost:3000
    echo 🔧 Backend API: http://localhost:8000
    echo 📚 API Docs: http://localhost:8000/docs
    echo.
    echo 📝 To view logs: docker-compose logs
    echo 🛑 To stop: docker-compose down
    
) else if "%choice%"=="2" (
    echo.
    echo 💻 Setting up for local development...
    
    :: Backend setup
    echo 🐍 Setting up backend...
    cd backend
    
    if not exist "venv" (
        echo 📦 Creating Python virtual environment...
        python -m venv venv
    )
    
    echo 🔌 Activating virtual environment and installing dependencies...
    call venv\Scripts\activate.bat
    pip install -r requirements.txt
    
    echo 🗄️  Please ensure your databases are running and configured in .env
    echo 📝 Run migrations with: alembic upgrade head
    echo 🚀 Start backend with: uvicorn app.main:app --reload
    
    cd ..
    
    :: Frontend setup
    echo ⚛️  Setting up frontend...
    cd frontend
    
    echo 📦 Installing Node.js dependencies...
    npm install
    
    echo 🚀 Start frontend with: npm run dev
    
    cd ..
    
    echo.
    echo ✅ Local development setup complete!
    echo 📝 Remember to:
    echo    1. Configure your .env files
    echo    2. Start your databases (PostgreSQL, MongoDB, Redis)
    echo    3. Run backend migrations
    echo    4. Start both backend and frontend servers
    
) else if "%choice%"=="3" (
    echo 👋 Setup cancelled
    exit /b 0
) else (
    echo ❌ Invalid choice
    pause
    exit /b 1
)

echo.
echo Press any key to exit...
pause >nul
