# Frontend Build
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Backend
FROM node:18-alpine AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/ .

# Production
FROM node:18-alpine AS production
WORKDIR /app

# Install PM2 for process management
RUN npm install -g pm2

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Copy backend
COPY --from=backend /app ./backend

# Copy frontend files
COPY index.html ./
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start application
CMD ["pm2-runtime", "start", "backend/server.js", "--name", "yolnet-api"]





