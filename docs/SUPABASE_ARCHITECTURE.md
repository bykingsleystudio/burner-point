# Burner Point - Supabase Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                     │
│  │   Web    │  │  Mobile  │  │  Admin   │                     │
│  │  (Next)  │  │  (Expo)  │  │  Panel   │                     │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                     │
│       │             │             │                            │
│       └─────────────┼─────────────┘                            │
│                     │                                          │
│              Supabase Auth                                     │
│              - Email/Password                                  │
│              - Phone OTP                                       │
│              - OAuth (Google, Apple, Microsoft)                │
│              - JWT Tokens                                      │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ HTTPS / WebSocket
                      │
┌─────────────────────┼───────────────────────────────────────────┐
│                     │         API GATEWAY                        │
│                     │  ┌────────────────────────────────┐      │
│                     └──│  NestJS API (Railway)          │      │
│                        │  - Auth Guards                 │      │
│                        │  - Rate Limiting               │      │
│                        │  - Input Validation            │      │
│                        │  - Business Logic              │      │
│                        └────────────┬───────────────────┘      │
│                                     │                            │
└─────────────────────────────────────┼────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
        ┌───────────▼──────┐ ┌────────▼────────┐ ┌────▼──────────┐
        │  Supabase Auth   │ │  Supabase DB    │ │ Supabase      │
        │                  │ │  (Postgres)     │ │ Storage       │
        │  - Users         │ │                 │ │               │
        │  - Sessions      │ │  ┌───────────┐  │ │ - user-uploads│
        │  - OAuth         │ │  │  users    │  │ │ - media       │
        │  - RLS           │ │  └─────┬─────┘  │ │ - verification│
        │                  │ │        │        │ │               │
        │                  │ │  ┌─────▼─────┐  │ │               │
        │                  │ │  │ profiles  │  │ │               │
        │                  │ │  └─────┬─────┘  │ │               │
        │                  │ │        │        │ │               │
        │                  │ │  ┌─────▼─────┐  │ │               │
        │                  │ │  │ wallets   │  │ │               │
        │                  │ │  └─────┬─────┘  │ │               │
        │                  │ │        │        │ │               │
        │                  │ │  ┌─────▼─────────▼──┐            │
        │                  │ │  │transactions     │  │            │
        │                  │ │  └──────────────────┘  │            │
        │                  │ │                        │            │
        │                  │ │  ┌────────────────┐   │            │
        │                  │ │  │ phone_numbers  │   │            │
        │                  │ │  │ messages       │   │            │
        │                  │ │  │ calls          │   │            │
        │                  │ │  └────────────────┘   │            │
        │                  │ │                        │            │
        │                  │ │  ┌────────────────┐   │            │
        │                  │ │  │ payment_       │   │            │
        │                  │ │  │ sessions       │   │            │
        │                  │ │  └────────────────┘   │            │
        │                  │ │                        │            │
        │                  │ │  ┌────────────────┐   │            │
        │                  │ │  │ esim_orders    │   │            │
        │                  │ │  │ proxy_orders   │   │            │
        │                  │ │  │ vpn_sessions   │   │            │
        │                  │ │  └────────────────┘   │            │
        │                  │ │                        │            │
        │                  │ └────────────────────────┘            │
        │                  │         │                             │
        │                  │         │ RLS Policies                │
        │                  │         │ - User isolation            │
        │                  │         │ - Service role access       │
        │                  │         └─────────────────────────────┘
        │                  │
        │                  │ Supabase Realtime
        │                  │ - Live updates
        │                  │ - Subscriptions
        │                  │ - Presence
        │
        │         ┌────────▼──────────┐
        │         │ External Services │
        │         │                   │
        │         │ - Twilio (SMS)    │
        │         │ - Telnyx          │
        │         │ - Bandwidth       │
        │         │ - Paystack        │
        │         │ - Flutterwave     │
        │         │ - Paddle          │
        │         │ - NOWPayments     │
        │         │ - Airalo          │
        │         │ - Oxylabs         │
        │         │ - Smartproxy      │
        │         └───────────────────┘
        │
        │ Supabase Edge Functions
        │ - Webhook handlers
        │ - Payment processing
        │ - OTP verification
        │ - Order fulfillment
        │
        └─── Storage Buckets
             - user-uploads/
             - media/
             - verification-assets/
```

## Data Flow

### Authentication Flow
```
User → Supabase Auth → JWT → API (validate JWT) → Database (RLS)
```

### Database Access Flow
```
API Request → JWT Token → auth.uid() → RLS Policy → Data Access
```

### Payment Flow
```
User → Create Payment Session → Provider (Paystack, etc.)
  ↓
Webhook → Edge Function → Validate Signature
  ↓
Update Database → Wallet Transaction → Realtime Update
```

### Telecom Flow
```
User Request → API → Provider (Twilio/Telnyx)
  ↓
Provider Response → Store in Database
  ↓
Realtime Update → User Dashboard
```

## Security Layers

### Layer 1: Authentication
- Supabase Auth handles all authentication
- JWT tokens for session management
- OAuth providers secured by providers

### Layer 2: Authorization (RLS)
```sql
-- Example RLS Policy
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);
```

### Layer 3: API Guards
- JWT validation
- Rate limiting
- Input sanitization
- CORS configuration

### Layer 4: Network
- HTTPS only
- CORS restrictions
- IP whitelisting (optional)

## Database Schema

### Core Tables
```
users
├── id (UUID, PK) → auth.users.id
├── email (TEXT, UNIQUE)
├── phone_number (TEXT, UNIQUE)
├── first_name (TEXT)
├── last_name (TEXT)
├── country (TEXT)
├── role (TEXT)
├── status (TEXT)
├── email_verified (BOOLEAN)
├── phone_verified (BOOLEAN)
├── preferences (JSONB)
└── created_at (TIMESTAMPTZ)

wallets
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── balance_usd_cents (INTEGER)
├── balance_ngn_cents (INTEGER)
└── created_at (TIMESTAMPTZ)

wallet_transactions
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── wallet_id (UUID, FK → wallets.id)
├── type (TEXT) -- 'credit' | 'debit'
├── amount_cents (INTEGER)
├── status (TEXT)
└── created_at (TIMESTAMPTZ)
```

### Telecom Tables
```
phone_numbers
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── phone_number (TEXT)
├── provider (TEXT)
├── status (TEXT)
└── created_at (TIMESTAMPTZ)

messages
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── phone_number_id (UUID, FK → phone_numbers.id)
├── direction (TEXT)
├── from_number (TEXT)
├── to_number (TEXT)
├── body (TEXT)
└── created_at (TIMESTAMPTZ)
```

### Service Tables
```
esim_orders
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── provider (TEXT)
├── plan_id (TEXT)
├── iccid (TEXT)
├── status (TEXT)
└── created_at (TIMESTAMPTZ)

proxy_orders
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── provider (TEXT)
├── username (TEXT)
├── status (TEXT)
└── created_at (TIMESTAMPTZ)

vpn_sessions
├── id (UUID, PK)
├── user_id (UUID, FK → users.id)
├── provider (TEXT)
├── config_content (TEXT)
├── status (TEXT)
└── created_at (TIMESTAMPTZ)
```

## RLS Implementation

### User Data Isolation
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### Service Role Access
```sql
-- Service role can access all data (for background jobs)
CREATE POLICY "Service role has full access"
  ON users
  FOR ALL
  USING (is_service_role())
  WITH CHECK (is_service_role());
```

### Phone Number Relationships
```sql
-- Users can see their own phone numbers
CREATE POLICY "Users can view own phone numbers"
  ON phone_numbers
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = assigned_to_user_id);
```

## Realtime Architecture

### Supabase Realtime
```typescript
// Subscribe to messages
const channel = supabase
  .channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
  }, (payload) => {
    // Handle new message
  })
  .subscribe();
```

### WebSocket Flow
```
Client ──subscribe──> Supabase Realtime ──notify──> Client
       <──postgres_changes── Database INSERT/UPDATE
```

## Storage Architecture

### Bucket Structure
```
user-uploads/
├── {user_id}/
│   ├── avatar.png
│   ├── documents/
│   └── receipts/

media/
├── {user_id}/
│   ├── call_recordings/
│   └── message_media/

verification-assets/
├── {user_id}/
│   ├── id_front.jpg
│   ├── id_back.jpg
│   └── selfie.jpg
```

### Storage Policies
```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can view their own uploads
CREATE POLICY "Users can view"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'user-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Deployment Architecture

### Vercel (Frontend)
```
Next.js App
├── Static Assets
├── Server Components
├── API Routes (minimal)
└── Supabase Client
```

### Railway (Backend)
```
NestJS API
├── Auth Guards
├── Business Logic
├── External Integrations
└── Supabase Admin Client
```

### Supabase (Backend-as-a-Service)
```
Supabase Project
├── Auth (Users, Sessions)
├── Database (Postgres + RLS)
├── Storage (Files, Media)
├── Realtime (WebSocket)
└── Edge Functions (Webhooks)
```

## Scalability Considerations

### Database
- Connection pooling via Supabase
- Indexes on foreign keys
- Partitioning for large tables (future)

### API
- Stateless design
- Horizontal scaling on Railway
- Rate limiting per user/IP

### Realtime
- Channel-based subscriptions
- Efficient payload design
- Debouncing for high-frequency updates

### Storage
- CDN-backed delivery
- Signed URLs with expiry
- Lifecycle policies for cleanup

## Cost Optimization

### Supabase Tiers
- **Free**: Good for development
- **Pro** ($25/mo): Production ready
- **Team**: For larger teams

### Optimization Tips
1. Use RLS to reduce API calls
2. Cache frequently accessed data
3. Use Realtime instead of polling
4. Optimize storage with lifecycle rules
5. Monitor database size and usage

## Monitoring & Observability

### Supabase Dashboard
- Database performance
- API usage
- Storage usage
- Auth metrics

### Application Monitoring
- Sentry for errors
- PostHog for analytics
- Custom health checks

### Database Monitoring
- Slow query logging
- Connection pool metrics
- Index usage analysis

## Backup & Recovery

### Automated Backups
- Supabase daily backups (Pro tier)
- Point-in-time recovery
- Export backups weekly

### Recovery Procedures
1. Database restore from backup
2. Storage bucket backup
3. Environment variables backup
4. Code deployment rollback

## Security Best Practices

1. **Never expose service_role key**
2. **Enable 2FA for Supabase account**
3. **Use RLS on all tables**
4. **Validate all inputs**
5. **Use signed URLs for storage**
6. **Rotate secrets regularly**
7. **Monitor for suspicious activity**
8. **Keep dependencies updated**

## Future Enhancements

1. **AI/ML Integration**
   - Fraud detection
   - User behavior analysis
   - Predictive analytics

2. **Advanced Features**
   - Full-text search
   - Full audit trail
   - Advanced analytics
   - Multi-tenant support

3. **Performance**
   - Query optimization
   - Caching layer (Redis)
   - CDN for static assets

---

This architecture provides a solid foundation for Burner Point's production deployment with enterprise-grade security, scalability, and maintainability.
