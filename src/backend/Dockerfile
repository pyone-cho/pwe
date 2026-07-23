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

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# On Railway: generate Prisma client, run pending migrations, then start
CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && node dist/server.js"]
