#!/usr/bin/env bash
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "\n${CYAN}╔═══════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  BurnerPoint — Local Setup             ║${NC}"
echo -e "${CYAN}║  Privacy is not a feature.             ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════╝${NC}\n"

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js >= 20 required${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker required${NC}"; exit 1; }

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo -e "${RED}❌ Node.js >= 20 required (current: v${NODE_VERSION})${NC}"
  exit 1
fi

# Copy .env
if [ ! -f .env ]; then
  echo -e "${YELLOW}📄 Creating .env from .env.example...${NC}"
  cp .env.example .env
  echo -e "${GREEN}✅ .env created — fill in your credentials before starting${NC}"
else
  echo -e "${GREEN}✅ .env already exists${NC}"
fi

# Install dependencies
echo -e "\n${CYAN}📦 Installing dependencies...${NC}"
npm install

# Start infrastructure
echo -e "\n${CYAN}🐳 Starting Docker services (Postgres + Redis)...${NC}"
docker compose up -d postgres redis
echo -e "${GREEN}✅ Database and Redis starting...${NC}"

# Wait for Postgres
echo -e "\n${CYAN}⏳ Waiting for Postgres...${NC}"
until docker compose exec -T postgres pg_isready -U burnerpoint >/dev/null 2>&1; do
  sleep 2
  echo -n "."
done
echo -e "\n${GREEN}✅ Postgres ready${NC}"

echo -e "\n${GREEN}╔═══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Setup complete! 🎉                    ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  API:    npm run dev (apps/api)       ║${NC}"
echo -e "${GREEN}║  Web:    npm run dev (apps/web)       ║${NC}"
echo -e "${GREEN}║  Mobile: npm run start (apps/mobile)  ║${NC}"
echo -e "${GREEN}╠═══════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  API:    http://localhost:3001         ║${NC}"
echo -e "${GREEN}║  Docs:   http://localhost:3001/api/docs║${NC}"
echo -e "${GREEN}║  Web:    http://localhost:3000         ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}\n"
echo -e "${YELLOW}⚠️  Fill in .env with your API keys before running!${NC}\n"
