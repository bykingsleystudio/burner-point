#!/bin/bash
#
# Burner Point Production Schema Verification
# 
# This script checks the current state of the production database schema
# to confirm whether the identity migration has been applied.
#

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Burner Point Schema Verification${NC}"
echo -e "${BLUE}========================================${NC}"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}Note: psql not available. Install PostgreSQL client to run full checks.${NC}"
    echo "For Supabase dashboard: Go to SQL Editor and run these queries:"
    echo ""
    echo "-- Check email nullability:"
    echo 'SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = '"'"'users'"'"' AND column_name = '"'"'email'"'"';'
    echo ""
    echo "-- Check constraints:"
    echo 'SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = '"'"'users'"'"';'
    echo ""
    exit 0
fi

# Database connection details from .env
SUPABASE_URL=$(grep "SUPABASE_URL=" .env | cut -d'=' -f2)
DIRECT_DATABASE_URL=$(grep "DIRECT_DATABASE_URL=" .env | cut -d'=' -f2)

if [ -z "$DIRECT_DATABASE_URL" ]; then
    echo -e "${RED}Error: DIRECT_DATABASE_URL not found in .env${NC}"
    exit 1
fi

echo -e "${YELLOW}Testing database connection...${NC}"

# Test 1: Check email column nullability
echo -e "\n${BLUE}▶ Checking email column properties${NC}"
EMAIL_NULLABLE=$(psql "$DIRECT_DATABASE_URL" -t -c "SELECT is_nullable FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email';" 2>/dev/null)

if [ "$EMAIL_NULLABLE" = "YES" ]; then
    echo -e "${GREEN}✓ Email column is NULLABLE (correct)${NC}"
else
    echo -e "${RED}✗ Email column is NOT NULL (migration not applied)${NC}"
fi

# Test 2: Check for users_requires_identity constraint
echo -e "\n${BLUE}▶ Checking identity constraint${NC}"
CONSTRAINT_EXISTS=$(psql "$DIRECT_DATABASE_URL" -t -c "SELECT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'users' AND constraint_name = 'users_requires_identity');" 2>/dev/null)

if [ "$CONSTRAINT_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ users_requires_identity constraint exists (correct)${NC}"
else
    echo -e "${RED}✗ users_requires_identity constraint missing (migration not applied)${NC}"
fi

# Test 3: Check for partial unique indexes
echo -e "\n${BLUE}▶ Checking partial unique indexes${NC}"
EMAIL_INDEX=$(psql "$DIRECT_DATABASE_URL" -t -c "SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE table name = 'users' AND index name = 'idx_users_email_unique');" 2>/dev/null)

if [ "$EMAIL_INDEX" = "t" ]; then
    echo -e "${GREEN}✓ Partial email unique index exists${NC}"
else
    echo -e "${RED}✗ Partial email unique index missing${NC}"
fi

# Test 4: Check constraint definition
echo -e "\n${BLUE}▶ Checking constraint details${NC}"
CONSTRAINT_DEF=$(psql "$DIRECT_DATABASE_URL" -t -c "SELECT check_clause FROM information_schema.check_constraints WHERE constraint_name = 'users_requires_identity';" 2>/dev/null)

if [ -n "$CONSTRAINT_DEF" ]; then
    echo -e "${GREEN}✓ Constraint definition: $CONSTRAINT_DEF${NC}"
else
    echo -e "${RED}✗ Could not retrieve constraint definition${NC}"
fi

echo -e "\n${BLUE}========================================${NC}"

# Summary
if [ "$EMAIL_NULLABLE" = "YES" ] && [ "$CONSTRAINT_EXISTS" = "t" ]; then
    echo -e "${GREEN}✓ MIGRATION APPLIED - Schema is correct${NC}"
    echo "All authentication features should work:"
    echo "  • Email-only users"
    echo "  • Phone-only users"
    echo "  • Email + Phone users"
    echo "  • OAuth with any identity provider"
else
    echo -e "${RED}✗ MIGRATION NOT APPLIED - Schema needs update${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Go to Supabase Dashboard → SQL Editor"
    echo "2. Execute the migration from:"
    echo "   supabase/migrations/20260816150000_auth_identity_model_v2.sql"
    echo "3. Re-run this script to verify"
    echo ""
    echo "Expected result after migration:"
    echo "  • email column: nullable"
    echo "  • users_requires_identity constraint: present"
    echo "  • Partial unique indexes: present"
fi

echo -e "${BLUE}========================================${NC}"
