-- Verification queries for auth identity model migration
-- Execute this against production database

-- Check 1: Email column nullability
SELECT 'Email nullability' as check, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'email';

-- Check 2: Identity constraint
SELECT 'Identity constraint' as check, constraint_name 
FROM information_schema.table_constraints 
WHERE table_name = 'users' AND constraint_name = 'users_requires_identity';

-- Check 3: Partial unique indexes
SELECT 'Partial indexes' as check, indexname 
FROM pg_indexes 
WHERE tablename = 'users' AND indexname LIKE 'idx_users_%'
ORDER BY indexname;

-- Check 4: Trigger
SELECT 'Trigger on_auth_user_created' as check, trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created' AND event_object_table = 'users';

-- Check 5: Constraint definition
SELECT 'Constraint definition' as check, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'users_requires_identity';
