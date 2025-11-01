#!/bin/bash

# V-Market Deployment Script for Render
# This script helps automate the deployment process

set -e  # Exit on error

echo "🚀 V-Market Deployment Script"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠️  Warning: You are not on main branch (current: $BRANCH)${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Deployment cancelled${NC}"
        exit 1
    fi
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}📝 Uncommitted changes detected:${NC}"
    git status -s
    echo ""
    read -p "Commit changes? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Commit message: " MESSAGE
        if [ -z "$MESSAGE" ]; then
            MESSAGE="Update for deployment $(date +%Y-%m-%d)"
        fi
        echo -e "${BLUE}📦 Committing changes...${NC}"
        git add .
        git commit -m "$MESSAGE"
        echo -e "${GREEN}✅ Changes committed${NC}"
    fi
fi

# Run tests if available
if [ -f "backend/package.json" ] && grep -q "\"test\"" backend/package.json; then
    echo -e "${BLUE}🧪 Running backend tests...${NC}"
    cd backend
    npm test || {
        echo -e "${RED}❌ Backend tests failed${NC}"
        read -p "Continue deployment anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ Deployment cancelled${NC}"
            exit 1
        fi
    }
    cd ..
fi

# Check if .env files exist
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env.production not found${NC}"
    echo "Creating .env.production..."
    echo "VITE_API_BASE_URL=https://v-market-backend.onrender.com/api" > .env.production
    echo -e "${GREEN}✅ Created .env.production${NC}"
fi

if [ ! -f "backend/.env.render.example" ]; then
    echo -e "${YELLOW}⚠️  Warning: backend/.env.render.example not found${NC}"
    echo "You'll need to configure environment variables manually on Render"
fi

# Push to GitHub
echo ""
echo -e "${BLUE}📤 Pushing to GitHub...${NC}"
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to GitHub${NC}"
    echo ""
    echo -e "${GREEN}🎉 Deployment triggered on Render!${NC}"
    echo ""
    echo -e "${BLUE}Monitor deployment:${NC}"
    echo "  Backend:  https://dashboard.render.com/web/v-market-backend"
    echo "  Frontend: https://dashboard.render.com/static/v-market-frontend"
    echo ""
    echo -e "${BLUE}Your app will be live at:${NC}"
    echo "  Frontend: https://v-market.onrender.com"
    echo "  Backend:  https://v-market-backend.onrender.com"
    echo ""
    echo -e "${YELLOW}⏱️  Deployment takes approximately 10-15 minutes${NC}"
    echo ""
    echo -e "${BLUE}Health check commands:${NC}"
    echo "  curl https://v-market-backend.onrender.com/health"
    echo "  curl https://v-market.onrender.com"
    echo ""
    echo -e "${GREEN}🚀 Deployment initiated successfully!${NC}"
else
    echo ""
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    echo "Please check your network connection and try again"
    exit 1
fi
