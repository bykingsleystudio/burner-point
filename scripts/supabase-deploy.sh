#!/bin/bash

# Burner Point - Supabase Deployment Script
# This script helps deploy the Supabase migration

set -e

echo "🔥 Burner Point - Supabase Deployment"
echo "======================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if logged in
echo "🔐 Checking Supabase authentication..."
if ! supabase whoami &> /dev/null; then
    echo "📝 Logging in to Supabase..."
    supabase login
fi

# Get project reference
PROJECT_REF=${SUPABASE_PROJECT_REF:-""}
if [ -z "$PROJECT_REF" ]; then
    echo "📦 Enter your Supabase project reference:"
    read -p "> " PROJECT_REF
fi

echo "🔗 Linking to project: $PROJECT_REF"
supabase link --project-ref "$PROJECT_REF"

# Push database migrations
echo "📊 Applying database migrations..."
supabase db push

# Generate types (optional)
echo "📝 Generating TypeScript types..."
supabase gen types typescript --project-id "$PROJECT_REF" > apps/api/src/types/supabase.ts

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update .env with your Supabase credentials"
echo "2. Configure OAuth providers in Supabase Dashboard"
echo "3. Test authentication flows"
echo "4. Deploy to production"
echo ""
echo "🎉 Migration successful!"
