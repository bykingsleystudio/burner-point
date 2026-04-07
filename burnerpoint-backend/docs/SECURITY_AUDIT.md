# BurnerPoint Security Audit Checklist
# Run before every production deployment

## ════ CRITICAL — Must pass before going live ════

### API Keys & Secrets
```
[ ] No API keys in any .tsx/.ts/.js file (grep check below)
[ ] No API keys in git history
[ ] No API keys in environment variables starting with NEXT_PUBLIC_*
    EXCEPTION: NEXT_PUBLIC_PADDLE_CLIENT_TOKEN (public key, safe)
[ ] All secrets in .env (not .env.local committed to git)
[ ] .env is in .gitignore
[ ] ENCRYPTION_KEY saved to password manager before launch
[ ] JWT secrets are 64+ characters of random hex
```

PowerShell check for hardcoded secrets:
```powershell
# Search entire codebase for potential hardcoded secrets
$patterns = @(
  'sk_live_', 'sk_test_', 'pk_live_', 'pk_test_',
  'FLWSECK', 'FLWPUBK', 'sandbox_sk_', 'whsec_',
  'AIza', 're_', 'sk-proj-', 'ACxxxxxxxx',
  'bearer\s+[a-zA-Z0-9._-]{20,}'
)
$files = Get-ChildItem -Recurse -Include *.ts,*.tsx,*.js,*.jsx,*.json -Exclude node_modules,dist,.next
foreach ($f in $files) {
  $content = Get-Content $f -Raw
  foreach ($pattern in $patterns) {
    if ($content -match $pattern) {
      Write-Host "⚠️  Possible secret in: $($f.FullName)"
      break
    }
  }
}
```

### Authentication
```
[ ] Passwords hashed with bcrypt (cost factor >= 12)
[ ] JWT access tokens expire in 15 minutes
[ ] JWT refresh tokens expire in 30 days
[ ] Refresh tokens stored in Redis and revoked on logout
[ ] Account locks after 5 failed login attempts (10 min)
[ ] No session tokens stored in localStorage (use httpOnly cookies or memory)
[ ] 2FA available for sensitive accounts
[ ] Password reset tokens expire after 1 hour
[ ] Email verification required before accessing paid features
```

### Input Validation
```
[ ] All DTOs use class-validator decorators
[ ] ValidationPipe has whitelist: true (strips extra fields)
[ ] ValidationPipe has forbidNonWhitelisted: true
[ ] No raw string interpolation in SQL queries (use TypeORM parameters)
[ ] File upload endpoints check MIME type and file size
[ ] Phone numbers validated to E.164 format before use
[ ] Email addresses validated before storing
[ ] All string inputs have max length defined
```

### Rate Limiting
```
[ ] Global rate limit: 60 req/min per IP
[ ] Auth routes: 5 attempts / 10 minutes per IP
[ ] Payment routes: 10 inits / minute per IP
[ ] OTP send: 3 per 10 minutes per phone number
[ ] API developer keys: custom limits per key
[ ] Webhook routes excluded from rate limiting
[ ] Rate limit headers returned (X-RateLimit-Limit, X-RateLimit-Remaining)
```

### Security Headers (verify with https://securityheaders.com)
```
[ ] Content-Security-Policy configured
[ ] Strict-Transport-Security (HSTS) with preload
[ ] X-Frame-Options: SAMEORIGIN
[ ] X-Content-Type-Options: nosniff
[ ] Referrer-Policy: strict-origin-when-cross-origin
[ ] Permissions-Policy configured
[ ] No X-Powered-By header
```

### CORS
```
[ ] CORS origin allowlist contains only your domains
[ ] CORS_ORIGINS env var populated correctly in Railway
[ ] No wildcard (*) origin in production
[ ] Credentials: true (for auth cookies)
```

### Database
```
[ ] DB_SYNCHRONIZE=false in production
[ ] No direct SQL queries with unparameterised user input
[ ] Sensitive columns (passwordHash, twoFactorSecret) have select: false
[ ] Soft deletes used for user accounts (deletedAt timestamp)
[ ] Database connection uses SSL in production
[ ] Regular automated backups configured (Railway does this automatically)
```

### Payment Security
```
[ ] All payment initialization is server-side only
[ ] Webhook signatures verified for ALL gateways:
    [ ] Paddle: HMAC-SHA256 with paddle-signature header
    [ ] NOWPayments: HMAC-SHA512 with x-nowpayments-sig header
    [ ] Paystack: HMAC-SHA512 with x-paystack-signature header
    [ ] Flutterwave: hash comparison with verif-hash header
[ ] Webhook deduplication table prevents double-crediting
[ ] rawBody: true in main.ts (required for HMAC verification)
[ ] Credit fulfillment idempotent (status: completed check before processing)
```

### AI Kill Switch
```
[ ] AI_KILL_SWITCH env var defined in Railway
[ ] Setting AI_KILL_SWITCH=true disables all OpenAI calls instantly
[ ] Fallback classification logic works when AI is disabled
[ ] Admin endpoint to check AI status: GET /admin/ai/status
```

### File Uploads (if applicable)
```
[ ] Accepted MIME types allowlisted (no .exe, .sh, .bat, etc.)
[ ] File size limited at middleware level (1MB for docs, 5MB for images)
[ ] Files stored in cloud storage (S3/R2), not on application server
[ ] Uploaded filenames sanitised (no path traversal)
[ ] Access control on uploaded files (presigned URLs only)
```

## ════ Recommended — Ship before v1.0 ════

```
[ ] Sentry error monitoring configured (SENTRY_DSN in .env)
[ ] Health check endpoint: GET /health returns {"status":"ok"}
[ ] Structured logging (Winston or Pino — not console.log in production)
[ ] Request ID middleware (trace ID for debugging)
[ ] Database query timeout configured (prevent long-running queries)
[ ] Redis connection health check in startup
[ ] Graceful shutdown handling (SIGTERM)
[ ] OpenAPI/Swagger disabled in production (NODE_ENV=production check in main.ts ✅)
```

## ════ Post-launch monitoring ════

```
[ ] Set up uptime monitoring (UptimeRobot or Better Uptime for free)
[ ] Alert on: API errors > 5% rate, response time > 2s P99
[ ] Alert on: unusual payment failure rates
[ ] Alert on: rate limit hits > 100/hour (possible attack)
[ ] Review abuse_events table weekly
[ ] Rotate API keys every 90 days
[ ] Check Twilio fraud alerts dashboard
[ ] Review Railway logs for anomalies weekly
```

## ════ Quick security scan commands ════

```powershell
# 1. Check for TODO/FIXME that might hide security issues
Select-String -Recurse -Path apps -Include *.ts,*.tsx -Pattern "TODO|FIXME|HACK|TEMP|INSECURE"

# 2. Find any console.log that might expose sensitive data
Select-String -Recurse -Path apps/api/src -Include *.ts -Pattern "console\.log.*(?:password|token|secret|key|hash)"

# 3. Verify no Stripe/Coinbase references remain
Select-String -Recurse -Path . -Include *.ts,*.tsx,*.js -Pattern "stripe|coinbase" -Exclude *.md

# 4. Check for any direct DB queries (should use TypeORM repository pattern)
Select-String -Recurse -Path apps/api/src -Include *.ts -Pattern "\.query\("

# 5. Verify all auth routes have @UseGuards(JwtAuthGuard)
Select-String -Recurse -Path apps/api/src -Include *.controller.ts -Pattern "@Get|@Post|@Put|@Delete|@Patch" | Where-Object {
  $line = $_.Line
  # Flag routes that don't have UseGuards in the next few lines
  $_ | Select-Object Filename, LineNumber, Line
}
```
