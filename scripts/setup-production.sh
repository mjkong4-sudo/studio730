#!/bin/bash

# Production Setup Script for Studio 730
# This script helps set up the production database

echo "🚀 Setting up Studio 730 for production..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    echo "Please set it to your PostgreSQL connection string"
    exit 1
fi

echo "✅ DATABASE_URL is set"

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run migrations
echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure NEXTAUTH_URL is set to your production URL"
echo "2. Make sure NEXTAUTH_SECRET is set to a secure random string"
echo "3. Deploy your application"
