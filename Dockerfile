# Render.com için basit Dockerfile
FROM node:18-alpine

WORKDIR /app

# Backend dependencies
COPY backend/package*.json ./backend/
RUN npm install --prefix backend

# Frontend build
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 10000

# Start backend
CMD ["node", "backend/server-modular.js"]