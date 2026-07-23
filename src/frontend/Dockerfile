# ── Build stage ──────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the app
RUN npm run build

# ── Nginx stage ─────────────────────────────────────
FROM nginx:stable-alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx config template
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

# Set default backend URL (overridden by Railway service variables)
ENV BACKEND_URL=http://localhost:3000

EXPOSE 80

# Nginx will substitute env vars in the template
CMD ["nginx", "-g", "daemon off;"]
