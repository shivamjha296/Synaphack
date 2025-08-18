#!/bin/bash

# Health Check Script for Hackathon Platform
# Verifies that all services are running correctly

echo "🏥 Hackathon Platform Health Check"
echo "=================================="
echo

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local name=$2
    local expected_status=${3:-200}
    
    echo -n "🔍 Checking $name ($url)... "
    
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    else
        # Fallback using wget
        response=$(wget --spider -S "$url" 2>&1 | grep "HTTP/" | awk '{print $2}' | tail -1 || echo "000")
    fi
    
    if [ "$response" = "$expected_status" ]; then
        echo "✅ OK ($response)"
        return 0
    else
        echo "❌ FAILED ($response)"
        return 1
    fi
}

# Function to check Docker service
check_docker_service() {
    local service=$1
    echo -n "🐳 Checking Docker service '$service'... "
    
    if docker-compose ps | grep -q "$service.*Up"; then
        echo "✅ Running"
        return 0
    else
        echo "❌ Not running"
        return 1
    fi
}

# Check if Docker Compose is being used
if [ -f "docker-compose.yml" ] && docker-compose ps >/dev/null 2>&1; then
    echo "📋 Docker Compose Services:"
    echo "----------------------------"
    
    # Check individual services
    check_docker_service "frontend"
    check_docker_service "backend" 
    check_docker_service "postgres"
    check_docker_service "mongo"
    check_docker_service "redis"
    
    echo
fi

# Check HTTP endpoints
echo "🌐 HTTP Endpoints:"
echo "------------------"

frontend_healthy=true
backend_healthy=true
api_docs_healthy=true

# Check frontend
if ! check_endpoint "http://localhost:3000" "Frontend"; then
    frontend_healthy=false
fi

# Check backend API
if ! check_endpoint "http://localhost:8000/health" "Backend Health" 200; then
    # Fallback to root endpoint
    if ! check_endpoint "http://localhost:8000" "Backend Root"; then
        backend_healthy=false
    fi
fi

# Check API documentation
if ! check_endpoint "http://localhost:8000/docs" "API Documentation"; then
    api_docs_healthy=false
fi

echo

# Database connectivity (if backend is running)
echo "🗄️  Database Connectivity:"
echo "--------------------------"

if [ "$backend_healthy" = true ]; then
    echo -n "🔍 Checking PostgreSQL connection... "
    
    # Try to get a response from a backend endpoint that requires DB
    if check_endpoint "http://localhost:8000/api/auth/me" "Database Test" >/dev/null 2>&1; then
        echo "✅ Connected"
    else
        # This might fail due to auth, but if we get a proper HTTP response, DB is likely OK
        echo "⚠️  Cannot verify (endpoint requires authentication)"
    fi
    
    echo -n "🔍 Checking MongoDB connection... "
    # Similar check for MongoDB
    echo "⚠️  Cannot verify (requires backend inspection)"
else
    echo "❌ Backend not responding - cannot check database connectivity"
fi

echo

# Summary
echo "📊 Health Check Summary:"
echo "------------------------"

total_checks=0
passed_checks=0

# Count and report
if [ "$frontend_healthy" = true ]; then
    echo "✅ Frontend: Healthy"
    ((passed_checks++))
else
    echo "❌ Frontend: Unhealthy"
fi
((total_checks++))

if [ "$backend_healthy" = true ]; then
    echo "✅ Backend: Healthy"
    ((passed_checks++))
else
    echo "❌ Backend: Unhealthy"
fi
((total_checks++))

if [ "$api_docs_healthy" = true ]; then
    echo "✅ API Docs: Accessible"
    ((passed_checks++))
else
    echo "❌ API Docs: Inaccessible"
fi
((total_checks++))

echo
echo "📈 Overall Health: $passed_checks/$total_checks checks passed"

if [ $passed_checks -eq $total_checks ]; then
    echo "🎉 All systems operational!"
    exit 0
elif [ $passed_checks -gt 0 ]; then
    echo "⚠️  Some issues detected. Check the logs for details."
    echo "💡 Try: docker-compose logs"
    exit 1
else
    echo "🚨 System appears to be down. Please check your setup."
    echo "💡 Try: docker-compose ps"
    echo "💡 Try: docker-compose up"
    exit 1
fi
