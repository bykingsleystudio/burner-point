# Burner Point - Supabase Migration Guide

## Overview

This document provides complete instructions for migrating Burner Point from Clerk + Neon Postgres to **Supabase Auth + Supabase Postgres** with full Row Level Security (RLS).

## Migration Status

- [x] Supabase environment variables configuration
- [x] Database schema with all tables
- [x] Row Level Security (RLS) policies
- [x] Supabase client configuration
- [x] Supabase Auth service implementation
- [ ] Clerk removal from dependencies
- [ ] Frontend Supabase integration
- [ ] Testing and validation

---

## 1. Supabase Project Setup

### Step 1: Create Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - **Name**: `burner-point-production`
   - **Database Password**: Generate a strong password (store securely)
   - **Region**: Choose closest to your users (e.g., US East)
   - **Pricing Plan**: Select appropriate plan (Pro for production)

### Step 2: Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Or use winget (Windows)
winget install Supabase.CLI

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF
```

### Step 3: Apply Database Migrations

```bash
# Navigate to project
cd burner-point

# Apply migrations
supabase db push

# Or run SQL directly in Supabase SQL Editor
```

Copy and run:
- `supabase/migrations/0001_initial_schema.sql`
- `supabase/migrations/0002_rls_policies.sql`

### Step 4: Configure Authentication Providers

In Supabase Dashboard > Authentication > Providers:

#### Enable Email/Password
- ✅ Enable "Email" provider
- Set email templates (optional)
- Configure email confirmation if needed

#### Enable Phone OTP
- ✅ Enable "Phone" provider
- Configure Twilio integration (optional, for custom SMS)
- Or use Supabase's built-in OTP

#### Enable OAuth Providers

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add redirect URL: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
4. Copy Client ID and Secret to Supabase

**Apple OAuth:**
1. Go to [Apple Developer](https://developer.apple.com/)
2. Create Sign in with Apple service
3. Configure redirect URL
4. Copy credentials to Supabase

**Microsoft OAuth:**
1. Go to [Azure AD](https://portal.azure.com/)
2. Register application
3. Add redirect URL
4. Copy credentials to Supabase

### Step 5: Configure Storage Buckets

Create these buckets in Supabase > Storage:

```bash
# user-uploads (private)
# - User avatars, documents, receipts
# - Private by default
# - Signed URLs only

# media (private)
# - Media files, recordings
# - Private by default

# verification-assets (private)
# - Verification documents
# - Strictly private
# - Short expiry signed URLs
```

**Bucket Policies:**

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own uploads
CREATE POLICY "Users can view own uploads"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

---

## 2. Environment Variables Setup

### Copy `.env.example` to `.env`

```bash
cp .env.example .env
```

### Fill in Supabase Variables

Get these from Supabase Dashboard > Project Settings > API:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
SUPABASE_JWT_SECRET=your-jwt-secret

# Database URLs (from Project Settings > Database)
DATABASE_URL=<supabase-runtime-postgres-url>
DIRECT_DATABASE_URL=<supabase-direct-postgres-url>
POOLER_URL=<supabase-pooled-postgres-url>
```

### Update All Environment Files

Update these files with Supabase configuration:

- `.env` (root)
- `apps/api/.env`
- `apps/web/.env.local`
- `apps/mobile/.env`
- `.vercel/.env.production.local`
- Railway environment variables
- Vercel environment variables

---

## 3. Backend Migration (NestJS API)

### Install Dependencies

```bash
cd apps/api
npm install @supabase/supabase-js
npm install --save-dev @types/node
```

### Update package.json

Remove Clerk:
```bash
npm uninstall @clerk/backend @clerk/clerk-sdk-node
```

Add Supabase:
```bash
npm install @supabase/supabase-js
```

### Update Auth Module

Replace `auth.service.ts` with Supabase implementation:

```typescript
// apps/api/src/modules/auth/auth.service.ts
import { SupabaseAuthService } from './supabase-auth.service';

// Use SupabaseAuthService for all auth operations
```

### Update Auth Controller

```typescript
// apps/api/src/modules/auth/auth.controller.ts
import { Controller, Post, Body, Req } from '@nestjs/common';
import { SupabaseAuthService } from './supabase-auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: SupabaseAuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, req.ip);
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, req.ip);
  }

  @Post('logout')
  async logout(@Body('refreshToken') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }

  @Post('otp/send')
  async sendOtp(@Body('phone') phone: string) {
    return this.authService.sendPhoneOtp(phone);
  }

  @Post('otp/verify')
  async verifyOtp(@Body('phone') phone: string, @Body('otp') otp: string) {
    return this.authService.verifyPhoneOtp(phone, otp);
  }

  @Post('password/reset')
  async resetPassword(@Body('email') email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post('oauth/:provider')
  async oauthLogin(@Param('provider') provider: 'google' | 'apple' | 'microsoft') {
    return this.authService.oauthLogin(provider);
  }
}
```

---

## 4. Frontend Migration (Next.js Web)

### Install Dependencies

```bash
cd apps/web
npm install @supabase/supabase-js @supabase/ssr
npm uninstall @clerk/nextjs
```

### Create Supabase Client

```typescript
// apps/web/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

### Update Auth Provider

```typescript
// apps/web/src/app/layout.tsx
import { supabase } from '@/lib/supabase';

// Remove ClerkProvider
// Wrap app with Supabase if needed (optional)
```

### Update Sign In Page

```typescript
// apps/web/src/app/auth/login/page.tsx
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Handle error
      return;
    }

    // Redirect to dashboard
    router.push('/dashboard');
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple' | 'microsoft') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  // Render login form
}
```

### Update Sign Up Page

```typescript
// apps/web/src/app/auth/register/page.tsx
import { supabase } from '@/lib/supabase';

export default function RegisterPage() {
  const handleRegister = async (formData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phone,
        },
      },
    });

    if (error) {
      // Handle error
      return;
    }

    // Redirect to verification or dashboard
    router.push('/auth/verify');
  };
}
```

### Update Auth Callback

```typescript
// apps/web/src/app/auth/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
```

### Update Dashboard Auth Protection

```typescript
// apps/web/src/app/dashboard/layout.tsx
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  return <>{children}</>;
}
```

---

## 5. Mobile Migration (Expo/React Native)

### Install Dependencies

```bash
cd apps/mobile
npm install @supabase/supabase-js @react-native-async-storage/async-storage
npm uninstall @clerk/clerk-expo
```

### Create Supabase Client

```typescript
// apps/mobile/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});
```

### Update Auth Provider

```typescript
// apps/mobile/src/app/_layout.tsx
import { supabase } from '@/lib/supabase';

// Remove ClerkProvider
// Use supabase auth state listener
```

### Update Login Screen

```typescript
// apps/mobile/src/app/auth/login.tsx
import { supabase } from '@/lib/supabase';

const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    Alert.alert('Error', error.message);
    return;
  }

  navigation.navigate('(tabs)');
};
```

---

## 6. Payment Webhooks Setup

### Create Edge Functions for Webhooks

```bash
# Create webhook handler
supabase functions new webhook-paystack
supabase functions new webhook-flutterwave
supabase functions new webhook-paddle
supabase functions new webhook-nowpayments
```

### Example: Paystack Webhook Edge Function

```typescript
// supabase/functions/webhook-paystack/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Verify signature
  const signature = req.headers.get('X-Paystack-Signature');
  const body = await req.text();

  // Process webhook
  const event = JSON.parse(body);

  // Update payment session
  const { error } = await supabase
    .from('payment_sessions')
    .update({
      status: 'completed',
      provider_session_id: event.data.authorization?.authorization_code,
      updated_at: new Date().toISOString(),
    })
    .eq('id', event.data.metadata?.session_id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
  });
});
```

---

## 7. Realtime Setup (Supabase Realtime)

### Enable Realtime on Tables

```sql
-- Enable realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE wallet_transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_sessions;
```

### Frontend Realtime Subscription

```typescript
// apps/web/src/lib/realtime.ts
import { supabase } from './supabase';

// Subscribe to messages
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
    },
    (payload) => {
      // Handle new message
      console.log('New message:', payload.new);
    }
  )
  .subscribe();

// Subscribe to wallet updates
const walletChannel = supabase
  .channel('wallet')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'wallet_transactions',
    },
    (payload) => {
      // Handle wallet update
    }
  )
  .subscribe();
```

---

## 8. Security Checklist

### Database Security

- [x] RLS enabled on ALL tables
- [x] Users can only access their own data
- [x] Service role has full access (for background jobs)
- [x] No direct database access from frontend

### Authentication Security

- [ ] Rate limiting on auth endpoints
- [ ] Account lockout after failed attempts
- [ ] Secure password hashing (bcrypt)
- [ ] JWT token expiration
- [ ] Refresh token revocation

### API Security

- [ ] CORS configured correctly
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitization)
- [ ] CSRF protection

### Environment Variables

- [ ] All secrets in `.env` (gitignored)
- [ ] No hardcoded secrets in code
- [ ] Service role key kept secret
- [ ] Anon key safe for frontend

---

## 9. Testing Checklist

### Authentication Flows

- [ ] User can sign up with email/password
- [ ] User can sign in with email/password
- [ ] User can sign in with phone OTP
- [ ] User can sign in with Google OAuth
- [ ] User can sign in with Apple OAuth
- [ ] User can sign in with Microsoft OAuth
- [ ] User can reset password
- [ ] User session persists on refresh
- [ ] User can logout

### Database Operations

- [ ] User can only access their own data
- [ ] User cannot access other users' data
- [ ] Wallet created automatically on signup
- [ ] Transactions recorded correctly
- [ ] Phone numbers owned by user only
- [ ] Messages visible to owner only

### Payment Flows

- [ ] Payment session created
- [ ] Webhook received and processed
- [ ] Wallet balance updated
- [ ] Transaction recorded
- [ ] Failed payments handled

### Realtime Features

- [ ] Messages update in real-time
- [ ] Wallet balance updates live
- [ ] Payment status updates live
- [ ] Dashboard reflects changes

---

## 10. Deployment Checklist

### Pre-Deployment

- [ ] All environment variables set in Vercel
- [ ] All environment variables set in Railway
- [ ] Database migrations applied
- [ ] Storage buckets created
- [ ] OAuth providers configured
- [ ] Webhook URLs configured in provider dashboards

### Post-Deployment

- [ ] Landing page loads
- [ ] Sign up works
- [ ] Sign in works
- [ ] Dashboard loads with real data
- [ ] OTP sent and verified
- [ ] Payments processed correctly
- [ ] Webhooks received
- [ ] Realtime updates working

### Monitoring

- [ ] Error logging configured (Sentry)
- [ ] Uptime monitoring active
- [ ] Database backups scheduled
- [ ] Logs accessible

---

## 11. Rollback Plan

If migration fails:

1. **Revert Database**: Use Supabase backup/restore
2. **Revert Code**: Git checkout previous version
3. **Revert Environment**: Restore old environment variables
4. **Revert Frontend**: Deploy previous Vercel version

---

## 12. Support & Resources

### Supabase Documentation

- [Supabase Docs](https://supabase.com/docs)
- [Auth Documentation](https://supabase.com/docs/guides/auth)
- [Database Documentation](https://supabase.com/docs/guides/database)
- [Storage Documentation](https://supabase.com/docs/guides/storage)
- [Realtime Documentation](https://supabase.com/docs/guides/realtime)

### Migration Support

- [Supabase Discord](https://discord.gg/supabase)
- [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)

---

## 13. Next Steps

1. **Complete Backend Migration**: Update all auth services
2. **Complete Frontend Migration**: Update all auth components
3. **Test Thoroughly**: Run through all test scenarios
4. **Deploy to Staging**: Test in staging environment
5. **Deploy to Production**: Migrate production users
6. **Monitor**: Watch for issues post-migration

---

## 14. Contact

For migration support, contact the development team or open an issue in the project repository.
