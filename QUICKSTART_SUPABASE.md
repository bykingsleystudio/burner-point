# Burner Point - Supabase Quick START Guide

## 🚀 10-Minute Setup

### Step 1: Create Supabase Project (2 min)

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - Name: `burner-point-production`
   - Password: Generate strong password
   - Region: Choose closest (e.g., US East)
4. Click "Create project"
5. Wait 2-3 minutes for provisioning

### Step 2: Get Credentials (1 min)

1. Go to **Project Settings** (gear icon)
2. Click **API**
3. Copy these values:
   - `Project URL` → SUPABASE_URL
   - `anon public` key → SUPABASE_ANON_KEY
   - `service_role` key → SUPABASE_SERVICE_ROLE_KEY

### Step 3: Update Environment (1 min)

Edit `.env` file:

```env
# Add these lines
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Update DATABASE_URL
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.your-project-ref.supabase.co:5432/postgres
```

### Step 4: Install Supabase CLI (2 min)

```bash
# Install globally
npm install -g supabase

# Login
supabase login

# Link project (get ref from Step 2 URL)
supabase link --project-ref your-project-ref
```

### Step 5: Apply Database Schema (2 min)

```bash
# Navigate to project
cd burner-point

# Apply migrations
supabase db push
```

Or manually:
1. Go to Supabase Dashboard > SQL Editor
2. Copy contents of `supabase/migrations/0001_initial_schema.sql`
3. Paste and run
4. Copy contents of `supabase/migrations/0002_rls_policies.sql`
5. Paste and run

### Step 6: Install SDK (1 min)

```bash
# API
cd apps/api
npm install @supabase/supabase-js

# Web
cd apps/web
npm install @supabase/supabase-js @supabase/ssr

# Mobile
cd apps/mobile
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

### Step 7: Test Authentication (1 min)

Create test file `test-auth.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_ANON_KEY'
);

async function test() {
  // Test signup
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'TestPassword123!',
  });

  if (signupError) {
    console.error('Signup error:', signupError.message);
    return;
  }

  console.log('Signup successful:', signupData.user.id);

  // Test login
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'TestPassword123!',
  });

  if (loginError) {
    console.error('Login error:', loginError.message);
    return;
  }

  console.log('Login successful:', loginData.user.id);
  console.log('Session:', loginData.session);
}

test();
```

Run:
```bash
node test-auth.js
```

---

## 🎯 Next Steps (30 minutes)

### 1. Configure OAuth Providers (10 min)

In Supabase Dashboard > Authentication > Providers:

**Google:**
- Enable "Google"
- Add Client ID and Secret from Google Cloud Console
- Redirect URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`

**Apple:**
- Enable "Apple"
- Add credentials from Apple Developer
- Redirect URL: same as above

**Microsoft:**
- Enable "Microsoft"
- Add credentials from Azure AD
- Redirect URL: same as above

### 2. Update Backend Auth Service (10 min)

Replace auth service in `apps/api/src/modules/auth/auth.service.ts`:

```typescript
import { SupabaseAuthService } from './supabase-auth.service';

// Use SupabaseAuthService instead of Clerk
```

### 3. Update Frontend Auth Pages (10 min)

**Web Login (`apps/web/src/app/auth/login/page.tsx`):**

```typescript
import { supabase } from '@/lib/supabase';

const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

  router.push('/dashboard');
};
```

**Web Signup (`apps/web/src/app/auth/register/page.tsx`):**

```typescript
import { supabase } from '@/lib/supabase';

const handleSignup = async (formData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) => {
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        first_name: formData.firstName,
        last_name: formData.lastName,
      },
    },
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert('Check your email for verification link!');
};
```

---

## ✅ Validation Checklist

After 10-minute setup:

- [ ] Supabase project created
- [ ] Environment variables updated
- [ ] Database schema applied
- [ ] Test signup works
- [ ] Test login works

After 30-minute completion:

- [ ] OAuth providers configured
- [ ] Backend auth service updated
- [ ] Frontend login page updated
- [ ] Frontend signup page updated
- [ ] Dashboard protected with auth

---

## 🐛 Troubleshooting

### "Missing Supabase URL"
- Check `.env` file has `SUPABASE_URL`
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

## 📞 Get Help

- **Supabase Docs**: https://supabase.com/docs
- **Discord**: https://discord.gg/supabase
- **GitHub**: https://github.com/supabase/supabase

---

## 🎉 You're Done!

Your Burner Point platform is now powered by Supabase with:
- ✅ Secure authentication
- ✅ Row-level security
- ✅ Real-time capabilities
- ✅ Storage ready
- ✅ Production-ready infrastructure

Next: Complete the remaining tasks in `SUPABASE_MIGRATION_SUMMARY.md`
