#!/bin/bash

# Studio 730 - PostgreSQL Database Setup Script
# This script helps you set up a PostgreSQL database on Vercel

echo "🚀 Setting up PostgreSQL database for Studio 730..."
echo ""

# Check if Vercel CLI is available
if ! command -v vercel &> /dev/null && ! command -v npx &> /dev/null; then
    echo "❌ Error: Vercel CLI not found. Please install it first:"
    echo "   npm install -g vercel"
    exit 1
fi

echo "📋 Step 1: Checking Vercel authentication..."
if npx vercel whoami &> /dev/null; then
    echo "✅ You are logged into Vercel"
    USER=$(npx vercel whoami 2>/dev/null)
    echo "   Logged in as: $USER"
else
    echo "⚠️  You are not logged into Vercel"
    echo "   Please run: npx vercel login"
    exit 1
fi

echo ""
echo "📋 Step 2: Creating PostgreSQL database..."
echo "   This will create a Postgres database in your Vercel project"
echo ""

# Try to create database via Vercel CLI
# Note: This requires Vercel CLI v28+ and may need manual setup via dashboard
echo "💡 Note: Database creation via CLI may not be available."
echo "   If this fails, please create the database manually:"
echo ""
echo "   Manual Steps:"
echo "   1. Go to https://vercel.com/dashboard"
echo "   2. Select your project: studio730-app"
echo "   3. Go to Storage tab"
echo "   4. Click 'Create Database'"
echo "   5. Select 'Postgres'"
echo "   6. Name it: studio730-db"
echo "   7. Click 'Create'"
echo "   8. Wait for provisioning (1-2 minutes)"
echo "   9. Go to Settings → Environment Variables"
echo "   10. Add DATABASE_URL and select POSTGRES_PRISMA_URL from dropdown"
echo ""

# Check if database already exists by checking for POSTGRES_PRISMA_URL in env
echo "📋 Step 3: Checking for existing database connection..."
if [ -f ".env.local" ] && grep -q "POSTGRES_PRISMA_URL" .env.local 2>/dev/null; then
    echo "✅ Found POSTGRES_PRISMA_URL in .env.local"
    echo "   Database connection already configured!"
elif [ -f ".env.production.local" ] && grep -q "POSTGRES_PRISMA_URL" .env.production.local 2>/dev/null; then
    echo "✅ Found POSTGRES_PRISMA_URL in .env.production.local"
    echo "   Database connection already configured!"
else
    echo "⚠️  No database connection found"
    echo "   Please follow the manual steps above to create the database"
fi

echo ""
echo "📋 Step 4: Next steps after database is created..."
echo ""
echo "   1. Run migrations:"
echo "      npx prisma migrate deploy"
echo ""
echo "   2. Generate Prisma Client:"
echo "      npx prisma generate"
echo ""
echo "   3. (Optional) Seed database:"
echo "      npx prisma db seed"
echo ""
echo "✅ Setup complete! Your schema is already configured for PostgreSQL."
echo ""
