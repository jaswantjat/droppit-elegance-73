# -------- Builder stage: install dev deps and build --------
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application (uses vite from devDependencies)
RUN npm run build

# -------- Runtime stage: production-only deps --------
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Environment
ENV NODE_ENV=production

# Install curl for HEALTHCHECK
RUN apk add --no-cache curl

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built assets and server file
COPY --from=builder /app/dist ./dist
COPY server.js ./server.js

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]
