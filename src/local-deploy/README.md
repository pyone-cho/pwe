# PWE Local Deployment

Docker-based local development environment for PWE.

## Prerequisites

- Docker + Docker Compose v2+
- Git

## Quick Start

```bash
# Clone and enter directory
git clone https://github.com/pyone-cho/pwe.git
cd pwe/src/dev-deployment/local-deploy

# Setup environment
cp .env.example .env

# Start services
docker compose up --build

# Run migrations (in another terminal)
docker compose exec backend npx prisma migrate deploy

# Seed database (optional)
docker compose exec backend npx prisma db seed
```

Open http://localhost in your browser.

## Using Make

```bash
cd pwe/src/dev-deployment/local-deploy

make build    # Build and start all services
make up       # Start without building
make down     # Stop all services
make logs     # Follow all logs
make migrate  # Run database migrations
make seed     # Seed the database
make reset    # Wipe DB, re-migrate, re-seed
make help     # See all commands
```

## Services

| Service    | URL                        | Description                  |
|------------|----------------------------|------------------------------|
| Frontend   | http://localhost            | React dev server (Vite HMR)  |
| Backend    | http://localhost/api/v1     | Express API server           |
| Swagger    | http://localhost/docs       | API documentation            |
| Prisma     | http://localhost:5555       | Database GUI                 |
| PostgreSQL | localhost:5432             | Database                     |

## Test Credentials

| Email              | Password | Role  |
|--------------------|----------|-------|
| admin@eventhub.com | admin123 | Admin |
| staff@eventhub.com | admin123 | Staff |

## Common Commands

```bash
# View logs
docker compose logs -f
docker compose logs -f backend

# Rebuild after code changes
docker compose up --build

# Open psql
docker compose exec db psql -U pwe_dev -d pwe_dev

# Reset database
docker compose down -v
docker compose up -d
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma db seed
```

## Troubleshooting

```bash
# Check container status
docker compose ps

# Check backend health
curl http://localhost/health

# Check logs for errors
docker compose logs backend
```
