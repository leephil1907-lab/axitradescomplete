# Multi-stage Dockerfile for Axi Forex & CFD Trading Application

# Stage 1: Build Frontend and Server
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install all dependencies (including devDependencies for Vite and esbuild)
RUN npm ci

# Copy full application codebase
COPY . .

# Build Vite static assets and bundle server.ts -> dist/server.cjs
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled build output from builder stage
COPY --from=builder /app/dist ./dist

# Expose port for Cloud Run ingress
EXPOSE 8080

# Launch production CommonJS server
CMD ["node", "dist/server.cjs"]
