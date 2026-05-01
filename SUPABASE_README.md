# 🔥 Burner Point × Supabase - Complete Migration Guide

## 🎯 Overview

Burner Point has been successfully migrated from **Cerk + Neon Postgres** to **Supabase Auth + Supabase Postgres** with full Row Level Security (RLS).

**Status:** ✅ 100% Complete - Production Ready

---

## 📋 What Changed

### Before (Clerk + Neon)
- Authentication: Clerk
- Database: Neon Postgres
- Session: Clerk sessions
- OAuth: Clerk providers

### After (Supabase)
- Authentication: Supabase Auth ✅
- Database: Supabase Postgres with RLS ✅
- Session: Supabase sessions ✅
- OAuth: Supabase providers ✅
- Real-time: Supabase Realtime ✅
- Storage: Supabase Storage ✅

---

## 🚀 Quick Start (5 Minutes)

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link Project
```bash
supabase link --project-ref sdjcavvwramruehjdhpb
```

### 4. Apply Migrations
```bash
supabase db push
```

### 5. Start Development
```bash
npm run dev
```

---

## 📁 Key Files

### Backend
- `apps/api/src/config/supabase.ts` - Supabase client config
- `apps/api/src/modules/auth/supabase-auth.service.ts` - Auth service
- `apps/api/src/modules/auth/auth.controller.ts` - Auth endpoints

### Frontend
- `apps/web/utils/supabase/client.ts` - Browser client
- `apps/web/utils/supabase/server.ts` - Server client
- `apps/web/middleware.ts` - Route protection
- `apps/web/src/app/auth/login/page.tsx` - Login page
- `apps/web/src/app/auth/register/page.tsx` - Register page

### Database
- `supabase/migrations/0001_initial_schema.sql` - Complete schema
- `supabase/migrations/0002_rls_policies.sql` - RLS policies

---

## 🔐 Authentication Flows

### Email/Password
```typescript
import { supabase } from '@/lib/supabase';

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe',
    },
  },
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password',
});

// Sign out
await supabase.auth.signOut();
```

### OAuth (Google, Apple, Microsoft)
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
  },
});
```

---

## 🗄️ Database Schema

### Core Tables (25+ total)
- `users` - User accounts
- `profiles` - Public profiles
- `wallets` - User wallets
- `wallet_transactions` - Transaction history
- `phone_numbers` - Virtual numbers
- `messages` - SMS messages
- `calls` - Call records
- `payment_sessions` - Payment tracking
- `esim_orders` - eSIM orders
- `proxy_orders` - Proxy orders
- `vpn_sessions` - VPN sessions
- `support_tickets` - Support tickets
- `audit_logs` - Activity logs
- And more...

### RLS Policies
All tables have Row Level Security enabled:
- Users can only access their own data
- Service role has full access for background jobs
- Proper isolation between tenants

---

## 🔒 Security Features

### Row Level Security (RLS)
```sql
-- Example: Users can only view their own data
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);
```

### Protected Routes
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session && isProtectedRoute) {
    return NextResponse.redirect('/auth/login');
  }
}
```

---

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh tokens
- `POST /auth/otp/send` - Send OTP
- `POST /auth/otp/verify` - Verify OTP
- `POST /auth/password/reset` - Password reset
- `POST /auth/oauth/:provider` - OAuth login

---

## 🧪 Testing

### Test Signup
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
```

---

## 📦 Environment Variables

### Required Variables
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://sdjcavvwramruehjdhpb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=
APPLE_SERVICES_ID=
MICROSOFT_TENANT_ID=
```

---

## 🚨 Troubleshooting

### "Missing Supabase URL"
- Check `.env.local` has `NEXT_PUBLIC_SUPABASE_URL`
- Restart development server

### "Invalid API key"
- Use `anon` key for frontend
- Use `service_role` key for backend only
- Never expose `service_role` key in frontend

### "Database does not exist"
- Run `supabase db push`
- Or manually apply migrations in SQL Editor

### "Row level security policy violation"
- Check RLS policies in database
- Ensure user is authenticated
- Use service role for background jobs

---

## 📚 Documentation

- **Migration Guide:** `docs/SUPABASE_MIGRATION.md`
- **Architecture:** `docs/SUPABASE_ARCHITECTURE.md`
- **Quick Start:** `QUICKSTART_SUPABASE.md`
- **Final Status:** `SUPABASE_FINAL_STATUS.md`

---

## 🎉 Success!

Your Burner Point platform is now fully powered by Supabase with:
- ✅ Secure authentication
- ✅ Row-level security
- ✅ Real-time capabilities
- ✅ Storage ready
- ✅ Production-ready infrastructure

**Next:** Configure OAuth providers in Supabase Dashboard and deploy to production!

---

**Questions?** Check the documentation or contact the development team.
