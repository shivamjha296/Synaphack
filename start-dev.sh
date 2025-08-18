#!/bin/bash

# HackPlatform Development Startup Script
# This script sets up and starts both backend and frontend for development

set -e

echo "🚀 Starting HackPlatform Development Environment"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is required but not installed.${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is required but not installed.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is required but not installed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites found${NC}"

# Setup Backend
echo -e "\n${YELLOW}Setting up backend...${NC}"
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit backend/.env with your actual configuration${NC}"
fi

# Run database migrations (if database is available)
echo "Running database migrations..."
if alembic upgrade head 2>/dev/null; then
    echo -e "${GREEN}✅ Database migrations completed${NC}"
else
    echo -e "${YELLOW}⚠️  Database migrations failed - please check your database connection${NC}"
fi

cd ..

# Setup Frontend
echo -e "\n${YELLOW}Setting up frontend...${NC}"
cd frontend

# Install Node dependencies
echo "Installing Node.js dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file from example..."
    cp .env.example .env.local
    echo -e "${YELLOW}⚠️  Please edit frontend/.env.local with your actual configuration${NC}"
fi

cd ..

# Start Services
echo -e "\n${GREEN}🎉 Setup complete!${NC}"
echo "=============================================="
echo "Starting development servers..."
echo ""
echo "Backend API will be available at: http://localhost:8000"
echo "Frontend will be available at: http://localhost:3000"
echo "API Documentation: http://localhost:8000/docs"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Start backend in background
echo "Starting backend server..."
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for user to stop
wait_for_stop() {
    echo -e "\n${GREEN}✅ Both servers are running!${NC}"
    echo "Visit http://localhost:3000 to access the application"
    echo ""
    echo "To stop all services, press Ctrl+C"
    
    # Set up trap to clean up processes
    trap cleanup SIGINT SIGTERM
    
    # Wait for user interrupt
    while true; do
        sleep 1
    done
}

# Cleanup function
cleanup() {
    echo -e "\n\n${YELLOW}Stopping services...${NC}"
    
    if [ ! -z "$BACKEND_PID" ]; then
        echo "Stopping backend server..."
        kill $BACKEND_PID 2>/dev/null || true
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "Stopping frontend server..."
        kill $FRONTEND_PID 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Start waiting for user input
wait_for_stop
