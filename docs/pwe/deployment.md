# Deployment Guide

> Docker setup, environment configuration, CI/CD pipeline, and backup strategy for PWE.

## Environments

| Environment | Domain | Purpose | Database |
|-------------|--------|---------|----------|
| **Local** | localhost:5173 | Development | pwe_dev |
| **Dev** | dev.pwe-mm.site | Development server | pwe_dev |
| **Test/Staging** | test.pwe-mm.site | QA, integration testing | pwe_test |
| **Production** | pwe-mm.site | Live users | pwe_prod |

---

## Local Development Setup

### Prerequisites
- Docker + Docker Compose (v2+)
- Node.js 20+ (for IDE tooling, not required to run)
- Git

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/pwe.git
cd pwe/src/dev-deployment

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker compose -f docker-compose.dev.yml up --build

# 4. Run database migrations
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate dev

# 5. Seed development data (optional)
docker compose -f docker-compose.dev.yml exec backend npx prisma db seed

# 6. Open
# Frontend: http://localhost (via nginx)
# Backend API: http://localhost/api/v1
# Prisma Studio: http://localhost:5555 (run: npx prisma studio)
```

### Stopping Services

```bash
docker compose -f docker-compose.dev.yml down          # Stop containers
docker compose -f docker-compose.dev.yml down -v        # Stop + remove volumes (reset DB)
```

---

## Docker Compose Files

### docker-compose.dev.yml (Local Development)

> Located at `src/dev-deployment/docker-compose.dev.yml`

```yaml
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pwe_dev
      POSTGRES_USER: pwe_dev
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - pgdata_dev:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pwe_dev -d pwe_dev"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://pwe_dev:dev_password@db:5432/pwe_dev
      JWT_SECRET: dev-jwt-secret-not-for-production
      REFRESH_TOKEN_SECRET: dev-refresh-secret-not-for-production
      PORT: 3000
    ports:
      - "3000:3000"
      - "5555:5555"   # Prisma Studio
    volumes:
      - ../backend/src:/app/src
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy
    command: npm run dev

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile.dev
    ports:
      - "5173:5173"
    volumes:
      - ../frontend/src:/app/src
    command: npm run dev -- --host

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend

volumes:
  pgdata_dev:
```

### docker-compose.test.yml (Staging/Test)

> **Note:** This compose file is planned but not yet created. Use `docker-compose.dev.yml` for development.

```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pwe_test
      POSTGRES_USER: pwe_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata_test:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: test
      DATABASE_URL: postgresql://pwe_user:${DB_PASSWORD}@db:5432/pwe_test
      JWT_SECRET: ${JWT_SECRET}
      REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
      PORT: 3000
    depends_on:
      - db
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

volumes:
  pgdata_test:
```

### docker-compose.prod.yml (Production)

> **Note:** This compose file is planned but not yet created. Use `docker-compose.dev.yml` for development.

```yaml
version: "3.8"

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: pwe_prod
      POSTGRES_USER: pwe_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pgdata_prod:/var/lib/postgresql/data
    restart: always
    # No port exposure — internal only

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://pwe_user:${DB_PASSWORD}@db:5432/pwe_prod
      JWT_SECRET: ${JWT_SECRET}
      REFRESH_TOKEN_SECRET: ${REFRESH_TOKEN_SECRET}
      PORT: 3000
    depends_on:
      - db
    restart: always
    # No port exposure — nginx proxies

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - backend
      - frontend
    restart: always

volumes:
  pgdata_prod:
```

---

## Environment Variables

### .env.example

```bash
# === Database ===
DB_PASSWORD=change-me-to-a-strong-password

# === Authentication ===
JWT_SECRET=change-me-to-a-random-64-char-string
REFRESH_TOKEN_SECRET=change-me-to-another-random-64-char-string

# === Application ===
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# === File Upload ===
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=5242880  # 5MB

# === Email (Future) ===
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=

# === Monitoring (Future) ===
# GRAFANA_PASSWORD=admin
```

### Generating Secrets

```bash
# Generate JWT secrets
openssl rand -base64 64
```

---

## Nginx Configuration

### nginx/nginx.conf (Full Example)

```nginx
events {
    worker_connections 1024;
}

http {
    # Gzip compression
    gzip on;
    gzip_types text/plain application/json application/javascript text/css application/xml;
    gzip_min_length 256;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    # Upstreams
    upstream backend {
        server backend:3000;
    }

    upstream frontend {
        server frontend:5173;
    }

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name pwe.example.com test.pwe.example.com;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl;
        server_name pwe.example.com test.pwe.example.com;

        # SSL certificates (Let's Encrypt)
        ssl_certificate /etc/letsencrypt/live/pwe.example.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/pwe.example.com/privkey.pem;

        # SSL settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";

        # API proxy
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Auth endpoints (stricter rate limit)
        location /api/v1/auth/ {
            limit_req zone=auth burst=5 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://backend;
            proxy_set_header Host $host;
        }

        # Frontend (React SPA with Vite HMR)
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support for Vite HMR
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

---

## CI/CD Pipeline

> **Note:** The CI/CD pipeline is planned but not yet implemented. Below is the proposed configuration.

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Lint
        run: |
          cd backend && npm run lint
          cd ../frontend && npm run lint

      - name: Type check
        run: |
          cd backend && npx tsc --noEmit
          cd ../frontend && npx tsc --noEmit

      - name: Test
        run: |
          cd backend && npm test
          cd ../frontend && npm test

  build-and-deploy:
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_KEY }}
          script: |
            cd /opt/pwe
            git pull origin main
            docker compose -f docker-compose.dev.yml build
            docker compose -f docker-compose.dev.yml up -d
            docker compose -f docker-compose.dev.yml exec -T backend npx prisma migrate deploy
```

### Branch Strategy

```
main ─────────────────────────────────→ Production
  ↑
  │ merge PR
  │
feature/* ──── feat-name
```

---

## Server Setup (DigitalOcean)

> For automated setup, use `src/dev-deployment/setup-server.sh`

### Initial Server Provisioning

```bash
# 1. Create Droplet (Ubuntu 22.04, 4GB RAM, 2 CPU)
# 2. SSH in
ssh root@<server-ip>

# 3. Run setup script
bash <(curl -s https://raw.githubusercontent.com/pyone-cho/pwe/main/src/dev-deployment/setup-server.sh)

# OR manual setup:
# 4. Create deploy user
adduser pwe
usermod -aG docker pwe
usermod -aG sudo pwe

# 5. Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker

# 6. Install Docker Compose
apt install docker-compose-plugin

# 7. Setup app directory
mkdir -p /opt/pwe
chown pwe:pwe /opt/pwe

# 8. Clone repository
su - pwe
cd /opt/pwe
git clone https://github.com/your-org/pwe.git .

# 9. Setup environment
cp src/dev-deployment/.env.example src/dev-deployment/.env
nano src/dev-deployment/.env  # Fill in production secrets

# 10. Start dev deployment
cd src/dev-deployment
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml exec -T backend npx prisma migrate deploy
```

---

## Database Backup Strategy

### Automated Daily Backup

```bash
#!/bin/bash
# /opt/pwe/src/dev-deployment/backup.sh

BACKUP_DIR="/opt/pwe/backups"
DATE=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

# Backup both databases
for DB in pwe_prod pwe_test; do
    FILE="$BACKUP_DIR/${DB}_${DATE}.sql.gz"
    docker compose -f docker-compose.prod.yml exec -T db \
        pg_dump -U pwe_user $DB | gzip > $FILE
    echo "Backed up $DB to $FILE"
done

# Remove old backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +$KEEP_DAYS -delete

# Optional: upload to remote storage
# aws s3 sync $BACKUP_DIR s3://pwe-backups/ --delete
```

### Cron Job

```bash
# Add to crontab: crontab -e
# Run backup daily at 2:00 AM
0 2 * * * /opt/pwe/src/dev-deployment/backup.sh >> /opt/pwe/logs/backup.log 2>&1
```

### Restore Procedure

```bash
# 1. Stop the backend (prevent writes)
docker compose -f docker-compose.prod.yml stop backend

# 2. Restore database
gunzip -c backups/pwe_prod_20260705_020000.sql.gz | \
    docker compose -f docker-compose.prod.yml exec -T db \
    psql -U pwe_user -d pwe_prod

# 3. Restart backend
docker compose -f docker-compose.prod.yml start backend
```

---

## Health Checks

### Backend Health Endpoint

```typescript
// GET /health
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date() });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});
```

### Docker Health Check

```yaml
# In docker-compose.dev.yml
backend:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 40s
```

---

## SSL/TLS Setup

### Let's Encrypt (Recommended)

**Step 1: Install certbot**

```bash
apt install -y certbot python3-certbot-nginx
```

**Step 2: Ensure nginx is running in HTTP-only mode**

```bash
cd /opt/pwe/src/dev-deployment
docker compose -f docker-compose.dev.yml up -d nginx
```

**Step 3: Create webroot directory and get certificate**

```bash
mkdir -p /var/www/certbot

certbot certonly --webroot --webroot-path=/var/www/certbot \
  --email admin@your-domain.com \
  --agree-tos \
  -d pwe.example.com \
  -d test.pwe.example.com
```

**Step 4: Update nginx.conf for SSL**

See the nginx configuration in the [Nginx Configuration](#nginx-configuration) section above for the full SSL server block.

**Step 5: Restart nginx**

```bash
docker compose -f docker-compose.dev.yml restart nginx
```

### Auto-Renewal

Certbot installs a systemd timer automatically. Verify it's active:

```bash
systemctl status certbot.timer
```

Or manually test renewal:

```bash
certbot renew --dry-run
```

### Certificate Files

Let's Encrypt stores certificates at:

```
/etc/letsencrypt/live/your-domain.com/
├── fullchain.pem    # Certificate + chain
├── privkey.pem      # Private key
└── README
```

### Docker Compose SSL Configuration

Update `docker-compose.dev.yml` to mount host certbot directories:

```yaml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend
```

---

## Monitoring Setup (Post-MVP)

### Prometheus + Grafana

```yaml
# Add to docker-compose.prod.yml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  environment:
    GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
```

### Key Metrics to Monitor
- Request rate (requests/second)
- Error rate (4xx, 5xx responses)
- Response time (p50, p95, p99)
- Database connection pool usage
- Memory usage
- Disk space
