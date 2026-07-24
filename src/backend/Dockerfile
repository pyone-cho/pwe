# ── Build stage ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for Prisma
RUN apk add --no-cache openssl

# Copy dependency files
COPY package*.json ./
RUN npm ci

# Copy source code (exclude node_modules via .dockerignore)
COPY . .

# Generate Prisma client + build TypeScript
RUN npx prisma generate && npm run build

# ── Production stage ─────────────────────────────────
FROM node:20-alpine

RUN apk add --no-cache curl openssl

WORKDIR /app

# Copy production artifacts from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env* ./

# Create non-root user with writable npm cache
RUN addgroup -S appgroup && adduser -S appuser -G appgroup \
    && mkdir -p /tmp/npm-cache && chown appuser:appgroup /tmp/npm-cache

USER appuser
ENV npm_config_cache=/tmp/npm-cache

EXPOSE 3000

# Prisma client already generated during build; migrations run at startup
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/server.js"]
