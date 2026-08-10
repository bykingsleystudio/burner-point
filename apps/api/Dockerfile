FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./

RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "const port = process.env.PORT || 3001; require('http').get(`http://127.0.0.1:${port}/health`, (r) => { process.exit(r.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Start the application
CMD ["node", "dist/main.js"]
