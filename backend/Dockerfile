# Production Dockerfile for LedgerLink Backend
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for building
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    ca-certificates

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm ci

# Copy source code
COPY . .

# Run any build steps if needed
# RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    ca-certificates \
    dumb-init \
    && update-ca-certificates

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ledgerlink -u 1001 -G nodejs

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=ledgerlink:nodejs /app .

# Remove dev dependencies and unnecessary files
RUN rm -rf .git .gitignore README.md tests/

# Create necessary directories
RUN mkdir -p uploads logs && \
    chown -R ledgerlink:nodejs uploads logs

# Switch to non-root user
USER ledgerlink

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Set Node.js environment
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]