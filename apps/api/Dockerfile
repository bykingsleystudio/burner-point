FROM node:20-alpine AS dependencies

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY apps/api/package*.json ./
RUN npm ci --build-from-source

FROM dependencies AS build

WORKDIR /app
COPY apps/api/ ./
RUN npm run build
RUN npm prune --omit=dev

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3001; require('http').get(`http://127.0.0.1:${port}/health`, (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

USER node
CMD ["node", "dist/main.js"]
