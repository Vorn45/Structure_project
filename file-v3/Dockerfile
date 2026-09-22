FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build
RUN cp -r src/view dist/view 2>/dev/null || true

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

# Create public and uploads directories inside container
RUN mkdir -p /app/public/uploads

EXPOSE 5000

CMD ["node", "dist/main.js"]
