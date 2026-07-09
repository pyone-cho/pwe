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
docker compose up
```

### Services (Docker Compose)

| Service | Port | Description |
|---------|------|-------------|
| nginx | 80, 443 | Reverse proxy, static files |
| backend | 3001 | Express API server |
| frontend | 5173 (dev) | React dev server / static build |
| db | 5432 | PostgreSQL 16 |

### Databases

| Database | Purpose |
|----------|---------|
| pwe | Production data |
| pwe_test | Test suite isolation |

---

## Environment Variables

### Backend (`apps/backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | `postgresql://pwe_user:pwe_pass@db:5432/pwe` |
| JWT_SECRET | Access token secret | — |
| JWT_REFRESH_SECRET | Refresh token secret | — |
| PORT | Server port | `3001` |
| NODE_ENV | Environment | `development` |
| CORS_ORIGIN | Allowed origin | `http://localhost:5173` |

### Frontend (`apps/frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | Backend API base URL | `http://localhost:3001/api/v1` |

---

## Deployment

### Target
- **Provider**: Linode (Akamai)
- **Spec**: 4GB RAM, 2 CPU minimum
- **OS**: Ubuntu 24.04

### Production Setup
```bash
# SSH into server
ssh root@<linode-ip>

# Clone repo
git clone <repo-url> /opt/pwe
cd /opt/pwe

# Start services
docker compose -f docker-compose.prod.yml up -d

# Run migrations
docker compose exec backend npx prisma migrate deploy

# Seed (first deploy only)
docker compose exec backend npx prisma db seed
```

### Nginx
- Reverse proxy: `/api` → backend:3001
- Static files: frontend build served directly
- TLS: Let's Encrypt via certbot
- Rate limiting: API endpoints

### SSL/TLS
```bash
# Initial cert setup
certbot --nginx -d your-domain.com

# Auto-renewal (cron)
0 0 1 * * certbot renew --quiet
```

---

## CI/CD (GitHub Actions)

### Pipeline

| Stage | Trigger | Actions |
|-------|---------|---------|
| Lint | Push to any branch | ESLint + Prettier check |
| Test | Push to any branch | Jest backend + Vitest frontend |
| Build | Push to `develop` | Docker image build |
| Deploy Staging | Push to `develop` | Deploy to Linode staging |
| Deploy Production | Push to `main` | Deploy to Linode production |

### Secrets Required (GitHub)
- `LINODE_SSH_KEY` — SSH private key for deployment
- `LINODE_HOST` — Server IP
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — Production secrets
- `DATABASE_URL` — Production database URL

---

## Backups

### Database
```bash
# Manual backup
docker compose exec db pg_dump -U pwe_user pwe > backup_$(date +%Y%m%d).sql

# Restore
cat backup.sql | docker compose exec -T db psql -U pwe_user pwe
```

### Automated (cron on server)
```bash
# Daily backup at 2am
0 2 * * * docker compose exec -T db pg_dump -U pwe_user pwe | gzip > /opt/pwe/backups/db_$(date +\%Y\%m\%d).sql.gz

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
| — | Initial setup | — |
