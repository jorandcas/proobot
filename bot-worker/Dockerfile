# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built code from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user for security
RUN addgroup -g 1001 -S botworker && \
    adduser -S botworker -u 1001 && \
    chown -R botworker:botworker /app

# Switch to non-root user
USER botworker

# Expose health check port
EXPOSE 3002

# Health check for Coolify
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

# Start server
CMD ["node", "dist/index.js"]
