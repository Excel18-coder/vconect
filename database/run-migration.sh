#!/bin/bash

# Messages Table Migration Script
# This script helps run the messages table migration on Neon PostgreSQL

echo "========================================="
echo "Messages Table Migration Script"
echo "========================================="
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable not set"
  echo ""
  echo "Please set your Neon database URL:"
  echo "export DATABASE_URL='postgresql://neondb_owner:your_password@ep-dark-hat-ad5h8dd0.us-east-2.aws.neon.tech/neondb?sslmode=require'"
  echo ""
  exit 1
fi

echo "✓ DATABASE_URL found"
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo "❌ Error: psql not found"
  echo ""
  echo "Please install PostgreSQL client:"
  echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
  echo "  macOS: brew install postgresql"
  echo ""
  echo "Or use the Neon Console instead (see MESSAGES_MIGRATION_GUIDE.md)"
  exit 1
fi

echo "✓ psql found"
echo ""

# Confirm before running
echo "This will create the messages table in your database."
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Migration cancelled"
  exit 0
fi

echo ""
echo "Running migration..."
echo ""

# Run the migration
psql "$DATABASE_URL" -f database/migrations/create_messages_table.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "========================================="
  echo "✅ Migration completed successfully!"
  echo "========================================="
  echo ""
  echo "Next steps:"
  echo "1. Backend will auto-deploy from GitHub (wait 2-3 minutes)"
  echo "2. Or manually redeploy at: https://dashboard.render.com/"
  echo "3. Test Messages tab at: https://vconect.vercel.app"
  echo ""
else
  echo ""
  echo "========================================="
  echo "❌ Migration failed"
  echo "========================================="
  echo ""
  echo "Please check:"
  echo "1. DATABASE_URL is correct"
  echo "2. You have permission to create tables"
  echo "3. The messages table doesn't already exist"
  echo ""
  echo "Or use Neon Console (see MESSAGES_MIGRATION_GUIDE.md)"
  echo ""
  exit 1
fi
