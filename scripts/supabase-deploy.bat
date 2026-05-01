@echo off
REM Burner Point - Supabase Deployment Script (Windows)
REM This script helps deploy the Supabase migration

echo 🔥 Burner Point - Supabase Deployment
echo ======================================
echo.

REM Check if Supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase CLI not found. Installing...
    npm install -g supabase
)

REM Check if logged in
echo 🔐 Checking Supabase authentication...
supabase whoami >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo 📝 Logging in to Supabase...
    supabase login
)

REM Get project reference
set PROJECT_REF=%SUPABASE_PROJECT_REF%
if "%PROJECT_REF%"=="" (
    echo 📦 Enter your Supabase project reference:
    set /p PROJECT_REF=>
)

echo 🔗 Linking to project: %PROJECT_REF%
supabase link --project-ref %PROJECT_REF%

REM Push database migrations
echo 📊 Applying database migrations...
supabase db push

REM Generate types (optional)
echo 📝 Generating TypeScript types...
supabase gen types typescript --project-id %PROJECT_REF% > apps\api\src\types\supabase.ts

echo.
echo ✅ Deployment complete!
echo.
echo 📋 Next steps:
echo 1. Update .env with your Supabase credentials
echo 2. Configure OAuth providers in Supabase Dashboard
echo 3. Test authentication flows
echo 4. Deploy to production
echo.
echo 🎉 Migration successful!
pause
