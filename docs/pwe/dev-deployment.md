# Development & Deployment

> Track infrastructure, services, environment variables, and deployment steps for PWE.

---

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 24 LTS (for IDE tooling outside containers)
- Git

### Quick Start
```bash
cd src/dev-deployment
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

### Services (Docker Compose)

| Service | Port | Description |
|---------|------|-------------|
| nginx | 80 | Reverse proxy, static files |
| backend | 3000 | Express API server |
| frontend | 5173 (dev) | React dev server / static build |
| db | 5432 | PostgreSQL 16 |

### Databases

| Database | Purpose |
|----------|---------|
| pwe_dev | Development data |
| pwe_test | Test suite isolation |

---

## Environment Variables

### Backend (`src/dev-deployment/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | `postgresql://pwe_dev:dev_password@db:5432/pwe_dev` |
| JWT_SECRET | Access token secret | `dev-jwt-secret-not-for-production` |
| REFRESH_TOKEN_SECRET | Refresh token secret | `dev-refresh-secret-not-for-production` |
| PORT | Server port | `3000` |
| NODE_ENV | Environment | `development` |
| FRONTEND_URL | Allowed CORS origin | `http://localhost` |

### Frontend (`src/dev-deployment/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API base URL | `http://localhost/api/v1` |

---

## Deployment

### Target
- **Provider**: DigitalOcean
- **Spec**: 4GB RAM, 2 CPU minimum
- **OS**: Ubuntu 22.04

### Production Setup
```bash
# SSH into server
ssh root@<droplet-ip>

# Clone repo
git clone <repo-url> /opt/pwe
cd /opt/pwe

# Start services
cd src/dev-deployment
docker compose -f docker-compose.dev.yml up -d --build

# Run migrations
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy

# Seed (first deploy only)
docker compose -f docker-compose.dev.yml exec backend npx prisma db seed
```

### Nginx
- Reverse proxy: `/api` → backend:3000
- Frontend: Vite dev server with HMR WebSocket support
- TLS: Let's Encrypt via certbot (webroot method)
- Rate limiting: API endpoints (100r/m), auth endpoints (5r/m)

### SSL/TLS Setup

```bash
# 1. Install certbot
apt install -y certbot python3-certbot-nginx

# 2. Create webroot directory
mkdir -p /var/www/certbot

# 3. Get certificate (nginx must be running on port 80)
certbot certonly --webroot --webroot-path=/var/www/certbot \
  --email admin@pwe-mm.site --agree-tos -d dev.pwe-mm.site

# 4. Certbot auto-renewal is via systemd timer (not cron)
systemctl status certbot.timer
```

**Note:** Nginx runs in Docker and mounts host certbot directories:
- `/etc/letsencrypt` → certificate files
- `/var/www/certbot` → ACME challenge files

---

## CI/CD (GitHub Actions)

### Pipeline

| Stage | Trigger | Actions |
|-------|---------|---------|
| Lint | Push to any branch | ESLint + Prettier check |
| Test | Push to any branch | Vitest (frontend) + Jest (backend) |
| Build | Push to `develop` | Docker image build |
| Deploy Staging | Push to `develop` | Deploy to DigitalOcean staging |
| Deploy Production | Push to `main` | Deploy to DigitalOcean production |

### Secrets Required (GitHub)
- `DEPLOY_SSH_KEY` — SSH private key for deployment
- `DEPLOY_HOST` — Server IP
- `JWT_SECRET` / `REFRESH_TOKEN_SECRET` — Production secrets
- `DATABASE_URL` — Production database URL

---

## Backups

### Database
```bash
# Manual backup
docker compose -f docker-compose.dev.yml exec db pg_dump -U pwe_dev pwe_dev > backup_$(date +%Y%m%d).sql

# Restore
cat backup.sql | docker compose -f docker-compose.dev.yml exec -T db psql -U pwe_dev pwe_dev
```

### Automated (cron on server)
```bash
# Daily backup at 2am
0 2 * * * docker compose -f /opt/pwe/src/dev-deployment/docker-compose.dev.yml exec -T db pg_dump -U pwe_dev pwe_dev | gzip > /opt/pwe/backups/db_$(date +\%Y\%m\%d).sql.gz

# Keep last 7 days
0 3 * * * find /opt/pwe/backups -name "*.sql.gz" -mtime +7 -delete
```

---

## Monitoring (Post-MVP)

- **Metrics**: Prometheus + Grafana
- **Logs**: Structured JSON → logrotate (upgrade to Loki later)
- **Uptime**: Simple cron health check → alert

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-07-13 | SSL/TLS setup for dev.pwe-mm.site (Let's Encrypt) | — |
| 2026-07-12 | DigitalOcean dev deployment setup | — |
