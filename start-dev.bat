@echo off
REM HackPlatform Development Startup Script for Windows
REM This script sets up and starts both backend and frontend for development

echo 🚀 Starting HackPlatform Development Environment
echo ==============================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is required but not installed.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is required but not installed.
    pause
    exit /b 1
)

echo ✅ All prerequisites found

REM Setup Backend
echo.
echo Setting up backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from example...
    copy .env.example .env
    echo ⚠️  Please edit backend\.env with your actual configuration
)

REM Run database migrations
echo Running database migrations...
alembic upgrade head
if %errorlevel% neq 0 (
    echo ⚠️  Database migrations failed - please check your database connection
)

cd ..

REM Setup Frontend
echo.
echo Setting up frontend...
cd frontend

REM Install Node dependencies
echo Installing Node.js dependencies...
npm install

REM Check if .env.local exists
if not exist ".env.local" (
    echo Creating .env.local file from example...
    copy .env.example .env.local
    echo ⚠️  Please edit frontend\.env.local with your actual configuration
)

cd ..

REM Start Services
echo.
echo 🎉 Setup complete!
echo ==============================================
echo Starting development servers...
echo.
echo Backend API will be available at: http://localhost:8000
echo Frontend will be available at: http://localhost:3000
echo API Documentation: http://localhost:8000/docs
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start backend in new window
echo Starting backend server...
start "HackPlatform Backend" cmd /k "cd backend && venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend in new window
echo Starting frontend server...
start "HackPlatform Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ Both servers are starting in separate windows!
echo Visit http://localhost:3000 to access the application
echo.
echo This window can be closed safely.
pause
