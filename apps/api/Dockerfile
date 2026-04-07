FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache libc6-compat python3 make g++

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN ./node_modules/.bin/nest build

RUN test -f dist/main.js || (echo "ERROR: dist/main.js not found after build" && exit 1)

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD sh -c "wget -qO- http://127.0.0.1:$${PORT:-3001}/health || exit 1"

CMD ["node", "dist/main.js"]
