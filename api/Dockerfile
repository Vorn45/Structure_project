# ===================================================
# Multi-stage Dockerfile for NestJS API
# ===================================================

# 1. Build Stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install build dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Prune dev dependencies for lean production image
RUN npm prune --production

# 2. Production Stage
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PORT=3000

# Copy only production dependencies and compiled artifacts
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/package*.json ./
COPY --from=builder /usr/src/app/src/database ./dist/src/database

# Expose API port
EXPOSE 3000

# Start NestJS production server
CMD ["node", "dist/src/main.js"]
