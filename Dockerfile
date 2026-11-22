# Multi-stage Dockerfile for Railway.app deployment

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# --- Stage 2: Build Backend ---
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npm run build

# --- Stage 3: Production Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# Install production dependencies only
COPY backend/package*.json ./
RUN npm install --only=production

# Copy compiled backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy compiled frontend into backend static public directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Data directory for SQLite database persistence
RUN mkdir -p /app/data

EXPOSE 4000

CMD ["node", "dist/index.js"]
