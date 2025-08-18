#!/bin/bash

# Hackathon Platform Setup Script
# This script helps initialize the development environment

set -e  # Exit on any error

echo "🏆 Hackathon Platform Setup"
echo "=========================="
echo

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Check Node.js (for local development)
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js $NODE_VERSION is available"
else
    echo "⚠️  Node.js not found (optional for Docker setup)"
fi

# Check Python (for local development)
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo "✅ $PYTHON_VERSION is available"
else
    echo "⚠️  Python3 not found (optional for Docker setup)"
fi

echo

# Setup environment files
echo "🔧 Setting up environment files..."

# Backend environment
if [ ! -f "backend/.env" ]; then
    echo "📄 Creating backend/.env from template..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env"
    echo "⚠️  Please edit backend/.env with your configuration values"
else
    echo "✅ backend/.env already exists"
fi

# Frontend environment
if [ ! -f "frontend/.env.local" ]; then
    echo "📄 Creating frontend/.env.local from template..."
    cp frontend/.env.example frontend/.env.local
    echo "✅ Created frontend/.env.local"
    echo "⚠️  Please edit frontend/.env.local with your configuration values"
else
    echo "✅ frontend/.env.local already exists"
fi

echo

# Choose setup method
echo "🚀 Choose your setup method:"
echo "1) Docker Compose (Recommended for beginners)"
echo "2) Local Development (For active development)"
echo "3) Exit"
echo

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo
        echo "🐳 Setting up with Docker Compose..."
        echo "📥 Pulling required images..."
        
        docker-compose pull
        
        echo "🏗️  Building application images..."
        docker-compose build
        
        echo "🚀 Starting services..."
        docker-compose up -d
        
        echo "⏳ Waiting for services to be ready..."
        sleep 10
        
        echo "🗄️  Running database migrations..."
        docker-compose exec backend alembic upgrade head
        
        echo "🌱 Seeding initial data..."
        docker-compose exec backend python scripts/seed_data.py || echo "⚠️  Seed script not found (optional)"
        
        echo
        echo "✅ Setup complete!"
        echo "🌐 Frontend: http://localhost:3000"
        echo "🔧 Backend API: http://localhost:8000"
        echo "📚 API Docs: http://localhost:8000/docs"
        echo
        echo "📝 To view logs: docker-compose logs"
        echo "🛑 To stop: docker-compose down"
        ;;
    2)
        echo
        echo "💻 Setting up for local development..."
        
        # Backend setup
        echo "🐍 Setting up backend..."
        cd backend
        
        if [ ! -d "venv" ]; then
            echo "📦 Creating Python virtual environment..."
            python3 -m venv venv
        fi
        
        echo "🔌 Activating virtual environment and installing dependencies..."
        source venv/bin/activate
        pip install -r requirements.txt
        
        echo "🗄️  Please ensure your databases are running and configured in .env"
        echo "📝 Run migrations with: alembic upgrade head"
        echo "🚀 Start backend with: uvicorn app.main:app --reload"
        
        cd ..
        
        # Frontend setup
        echo "⚛️  Setting up frontend..."
        cd frontend
        
        echo "📦 Installing Node.js dependencies..."
        npm install
        
        echo "🚀 Start frontend with: npm run dev"
        
        cd ..
        
        echo
        echo "✅ Local development setup complete!"
        echo "📝 Remember to:"
        echo "   1. Configure your .env files"
        echo "   2. Start your databases (PostgreSQL, MongoDB, Redis)"
        echo "   3. Run backend migrations"
        echo "   4. Start both backend and frontend servers"
        ;;
    3)
        echo "👋 Setup cancelled"
        exit 0
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
