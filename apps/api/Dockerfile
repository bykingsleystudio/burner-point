FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build && ls -la dist/

RUN npm prune --production

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main"]
