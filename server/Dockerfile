# Stage 1: Build dependencies
FROM node:20-alpine AS builder

WORKDIR /build

# Copy package files from server directory
COPY server/package*.json ./

# Install dependencies (production only)
RUN npm install --only=production

# Stage 2: Production image
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory to /app (server code)
WORKDIR /app

# Copy dependencies from builder
COPY --from=builder --chown=nodejs:nodejs /build/node_modules ./node_modules

# Copy shared modules to /shared (so /app/../shared = /shared)
COPY --chown=nodejs:nodejs shared /shared

# Symlink node_modules to /shared so it can access dependencies
RUN ln -s /app/node_modules /shared/node_modules

# Symlink /server -> /app so shared can access ../../../../server/config
RUN ln -s /app /server

# Copy server application code
COPY --chown=nodejs:nodejs server .

# Create data directory for SQLite (if used)
RUN mkdir -p /app/data && chown nodejs:nodejs /app/data

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "app.js"]
