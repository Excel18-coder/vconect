#!/bin/bash

# V-Market Full Stack Startup Script
echo "🚀 Starting V-Market Full Stack Application"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install npm first.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ is required. Current version: $(node --version)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi

# Check for environment files
echo -e "${YELLOW}🔧 Checking environment configuration...${NC}"

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Backend .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
    echo -e "${RED}🚨 IMPORTANT: Please configure your .env file with proper values:${NC}"
    echo -e "${YELLOW}   - DATABASE_URL (Neon Postgres)${NC}"
    echo -e "${YELLOW}   - JWT_SECRET (Strong random secret)${NC}"
    echo -e "${YELLOW}   - CLOUDINARY_* (Cloudinary credentials)${NC}"
    echo ""
    read -p "Press Enter after configuring .env file to continue..."
fi

cd ..

if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  Frontend .env file not found. Copying from .env.example...${NC}"
    cp .env.example .env
fi

# Run database migrations (if backend .env is configured)
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
cd backend

if grep -q "DATABASE_URL=postgresql" .env; then
    npm run migrate
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database migrations completed${NC}"
        
        echo -e "${YELLOW}🌱 Seeding initial data...${NC}"
        npm run seed
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Database seeding completed${NC}"
        else
            echo -e "${YELLOW}⚠️  Database seeding failed (this is optional)${NC}"
        fi
    else
        echo -e "${RED}❌ Database migrations failed. Please check your DATABASE_URL${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  DATABASE_URL not configured. Skipping migrations.${NC}"
    echo -e "${YELLOW}   Please configure your Neon database URL and run 'npm run migrate' in the backend directory${NC}"
fi

cd ..

# Start both servers
echo -e "${GREEN}🚀 Starting V-Market application...${NC}"
echo -e "${YELLOW}   Backend will run on: http://localhost:5000${NC}"
echo -e "${YELLOW}   Frontend will run on: http://localhost:5173${NC}"
echo ""

# Function to cleanup background processes
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down servers...${NC}"
    jobs -p | xargs kill 2>/dev/null
    exit 0
}

# Set trap for cleanup
trap cleanup SIGINT SIGTERM

# Start backend server in background
echo -e "${YELLOW}🔧 Starting backend server...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server in background
echo -e "${YELLOW}🎨 Starting frontend server...${NC}"
cd ..
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
echo -e "${GREEN}✅ V-Market application is running!${NC}"
echo -e "${GREEN}   📚 Backend API: http://localhost:5000/api${NC}"
echo -e "${GREEN}   🌐 Frontend App: http://localhost:5173${NC}"
echo -e "${GREEN}   🏥 Health Check: http://localhost:5000/health${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"

# Wait for all background jobs
wait
