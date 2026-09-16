# ===================================================
# Multi-stage Dockerfile for Angular Frontend
# ===================================================

# High-availability mirrors (AWS ECR Public) immune to Docker Hub rate limits and timeouts
ARG NODE_IMAGE=public.ecr.aws/docker/library/node:20-alpine
ARG NGINX_IMAGE=public.ecr.aws/docker/library/nginx:1.27-alpine

# 1. Build Stage
FROM ${NODE_IMAGE} AS builder

WORKDIR /usr/app

# Force development mode during build stage so devDependencies are always installed
ENV NODE_ENV=development

# Ensure local node_modules/.bin is always on PATH
ENV PATH="/usr/app/node_modules/.bin:${PATH}"

# Configure npm network resilience against ECONNRESET and dropouts
RUN npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-timeout 300000

# Copy package and lock files to leverage Docker layer caching
COPY package*.json ./

# Install dependencies including dev tools needed for compilation
RUN npm install --legacy-peer-deps --include=dev

# Copy source code
COPY . .

# Build production Angular bundle
RUN npm run build

# 2. Production Runtime Stage (Nginx)
FROM ${NGINX_IMAGE}

COPY default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /usr/app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
