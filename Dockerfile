# apps/api/Dockerfile
# Place this file at: burner-point/apps/api/Dockerfile
# Railway uses this automatically when it detects it in the service root directory

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ── Install dependencies ──────────────────────────────────────────
FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production && cp -r node_modules /tmp/prod_modules
RUN npm ci

# ── Build ─────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Runtime ───────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
WORKDIR /app

# Copy production node_modules and compiled dist
COPY --from=builder /app/dist ./dist
COPY --from=builder /tmp/prod_modules ./node_modules
COPY package*.json ./

# Expose API port
EXPOSE 3001

# Health check for Railway
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "dist/main"]
