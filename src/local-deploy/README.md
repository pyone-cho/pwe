# PWE Local Deployment

Docker-based local development environment for PWE. Runs all services behind an nginx reverse proxy on `http://localhost`.

## Architecture

```
Internet → :80 nginx → /api/* → backend:3000 → db:5432
                      → /*     → frontend:5173 (Vite HMR)
```

| Service    | Port  | Description                     |
|------------|-------|---------------------------------|
| nginx      | 80    | Reverse proxy                   |
| backend    | 3000  | Express API server              |
| frontend   | 5173  | React dev server (Vite HMR)     |
| db         | 5432  | PostgreSQL 16                   |

---

## Prerequisites

- Docker + Docker Compose v2+
- Git

---

## Quick Start

```bash
# Clone and enter directory
git clone https://github.com/pyone-cho/pwe.git
cd pwe/src/local-deploy

# Setup environment
cp .env.example .env

# Start services
make build

# Run migrations (in another terminal)
make migrate

# Seed database (optional)
make seed
```

Open http://localhost in your browser.

---

## Using Make

```bash
make help     # See all commands
make build    # Build and start all services
make up       # Start without building
make down     # Stop all services
make logs     # Follow all logs
make migrate  # Run database migrations
make seed     # Seed the database
make reset    # Wipe DB, re-migrate, re-seed
```

---

## Services

| Service    | URL                        | Description                  |
|------------|----------------------------|------------------------------|
| Frontend   | http://localhost            | React dev server (Vite HMR)  |
| Backend    | http://localhost/api/v1     | Express API server           |
| Swagger    | http://localhost/api/v1/docs| API documentation            |
| Prisma     | http://localhost:5555       | Database GUI                 |
| PostgreSQL | localhost:5432             | Database                     |

---

## Test Credentials

| Email              | Password | Role  |
|--------------------|----------|-------|
| admin@eventhub.com | admin123 | Admin |
| staff@eventhub.com | admin123 | Staff |

---

## Environment Variables

| Variable               | Description                    | Default                                       | Required |
|------------------------|--------------------------------|-----------------------------------------------|----------|
| `POSTGRES_DB`          | Database name                  | `pwe_dev`                                     | Yes      |
| `POSTGRES_USER`        | Database user                  | `pwe_dev`                                     | Yes      |
| `POSTGRES_PASSWORD`    | Database password              | `dev_password`                                | Yes      |
| `DATABASE_URL`         | PostgreSQL connection string   | `postgresql://pwe_dev:dev_password@db:5432/pwe_dev` | Yes |
| `JWT_SECRET`           | Access token secret            | `dev-jwt-secret-not-for-production`           | **Yes**  |
| `JWT_EXPIRES_IN`       | Access token expiry            | `15m`                                         | No       |
| `REFRESH_TOKEN_SECRET` | Refresh token secret           | `dev-refresh-secret-not-for-production`       | **Yes**  |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiry      | `7d`                                          | No       |
| `PORT`                 | Backend port                   | `3000`                                        | No       |
| `NODE_ENV`             | Environment                    | `development`                                 | No       |
| `FRONTEND_URL`         | CORS origin                    | `http://localhost`                            | Yes      |
| `VITE_API_URL`         | Frontend API base URL          | `/api/v1`                                     | Yes      |

---

## Common Commands

```bash
# View logs
make logs
make logs-backend
make logs-frontend

# Rebuild after code changes
make build

# Open psql
make shell-db

# Open backend shell
make shell-backend

# Reset database
make reset

# Check container status
make status
```

---

## Troubleshooting

### Container won't start

```bash
# Check container status
make status

# Check logs for errors
make logs-backend

# Check if port is already in use
lsof -i :80
lsof -i :3000
lsof -i :5432
```

### Database connection refused

```bash
# Verify db container is healthy
make status

# Check db logs
docker compose logs db

# Restart db
docker compose restart db
```

### Frontend can't reach backend

- Ensure nginx is running: `make status`
- Check nginx logs: `make logs-nginx`
- Verify backend is running: `curl http://localhost/api/v1/health`

### Prisma migration errors

```bash
# Check database is accessible
make shell-db

# Reset and re-run migrations
make reset
```

---

## Recent Changes

| Date | Change | Details |
|------|--------|---------|
| 2026-07-17 | JWT Security Fix | Removed weak fallback secrets; `JWT_SECRET` and `REFRESH_TOKEN_SECRET` are now required |
| 2026-07-17 | Validation Fixes | Phone validation, member filter/search, signup and member creation error feedback |
| 2026-07-17 | Axios Fixes | Correct token refresh response path and use configured `api` instance |

---

## File Structure

```
src/local-deploy/
├── docker-compose.yml    # Service orchestration
├── nginx.conf            # Reverse proxy config
├── .env.example          # Environment template
├── .env                  # Active environment config
├── Makefile              # Convenience commands
└── README.md             # This file
```
