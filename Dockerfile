# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./

<<<<<<< HEAD
# Install all dependencies (devDependencies needed for build)
RUN npm ci
=======
# Install dependencies
RUN npm ci --only=production
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11

# Copy source code
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Set working directory
WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy backend source
COPY backend/ ./

# Copy built frontend
COPY --from=builder /app/dist ./public

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
<<<<<<< HEAD
  CMD node -e "require('http').get('http://localhost:5000/api/health/live', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "server-modular.js"]
=======
  CMD node healthcheck.js

# Start the application
CMD ["node", "simple-server.js"]
>>>>>>> d16e01282458675ee948d13b88a3dc5d9dde5b11
