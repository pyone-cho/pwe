# PWE Dev Deployment

Docker-based development environment for deploying PWE on a DigitalOcean droplet.

## Architecture

```
Internet → :80 nginx → /api/* → backend:3000 → db:5432
                     → /*     → frontend:5173 (Vite HMR)
```

| Service    | Port | Description                     |
|------------|------|---------------------------------|
| nginx      | 80   | Reverse proxy, rate limiting    |
| backend    | 3000 | Express API server              |
| frontend   | 5173 | React dev server (Vite HMR)     |
| db         | 5432 | PostgreSQL 16                   |

---

## Prerequisites

- Docker + Docker Compose (v2+)
- Git

---

## Quick Start (Local)

```bash
# 1. Clone and enter directory
git clone https://github.com/pyone-cho/pwe.git
cd pwe/src/dev-deployment

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker compose -f docker-compose.dev.yml up --build

# 4. Run migrations (in a new terminal)
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy

# 5. Seed database (optional)
docker compose -f docker-compose.dev.yml exec backend npx prisma db seed
```

Open http://localhost in your browser.

### Test Credentials

| Email                | Password | Role  |
|----------------------|----------|-------|
| admin@eventhub.com   | admin123 | Admin |
| staff@eventhub.com   | admin123 | Staff |

---

## DigitalOcean Droplet Setup

### 1. Create Droplet

- **Image**: Ubuntu 22.04 (or 24.04)
- **Plan**: Basic - 4GB RAM / 2 CPU (recommended)
- **Region**: Closest to your users

### 2. Point Domain

Create an A record pointing your domain to the droplet's public IP:

```
Type: A
Name: @ (or subdomain)
Value: YOUR_DROPLET_IP
TTL: 3600
```

### 3. Run Setup Script

SSH into your droplet as root and run:

```bash
bash <(curl -s https://raw.githubusercontent.com/pyone-cho/pwe/main/src/dev-deployment/setup-server.sh)
```

Or manually:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker

# Install Docker Compose plugin
apt install -y docker-compose-plugin

# Configure firewall
apt install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create deploy user
adduser --disabled-password --gecos "" pwe
usermod -aG docker pwe

# Clone repo
mkdir -p /opt/pwe && chown pwe:pwe /opt/pwe
su - pwe
git clone https://github.com/pyone-cho/pwe.git /opt/pwe
```

### 4. Configure Environment

```bash
cd /opt/pwe/src/dev-deployment
cp .env.example .env
nano .env
```

Generate secure secrets:

```bash
openssl rand -base64 64
```

Required changes from defaults:

```env
POSTGRES_PASSWORD=<strong-random-password>
JWT_SECRET=<generated-secret>
REFRESH_TOKEN_SECRET=<generated-secret>
FRONTEND_URL=http://your-domain.com
VITE_API_URL=http://your-domain.com/api/v1
```

### 5. Start Services

```bash
cd /opt/pwe/src/dev-deployment
docker compose -f docker-compose.dev.yml up -d --build
```

### 6. Run Migrations & Seed

```bash
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.dev.yml exec backend npx prisma db seed
```

### 7. Verify

```bash
# Check all containers are running
docker compose -f docker-compose.dev.yml ps

# Check backend health
curl http://localhost/health

# Check API through nginx
curl http://localhost/api/v1/health
```

---

## SSL/TLS (Let's Encrypt)

After DNS is configured and pointing to your server:

```bash
# 1. Install certbot
apt install -y certbot python3-certbot-nginx

# 2. Ensure nginx is running (HTTP only)
cd /opt/pwe/src/dev-deployment
docker compose -f docker-compose.dev.yml up -d nginx

# 3. Create webroot directory for ACME challenge
mkdir -p /var/www/certbot

# 4. Get certificate
certbot certonly --webroot --webroot-path=/var/www/certbot \
  --email admin@pwe-mm.site --agree-tos -d your-domain.com

# 5. Update nginx.conf with SSL configuration (see below)

# 6. Restart nginx
docker compose -f docker-compose.dev.yml restart nginx
```

**Note:** Certbot auto-renewal is configured via systemd timer (`certbot.timer`). Verify with:

```bash
systemctl status certbot.timer
```

### SSL nginx.conf Block

Add this to your `nginx.conf` for HTTPS support:

```nginx
# HTTP -> HTTPS redirect
server {
    listen 80;
    server_name your-domain.com;

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
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # ... rest of your proxy configs
}
```

### Docker Compose Update

Update `docker-compose.dev.yml` to mount host certbot directories:

```yaml
nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
      - /var/www/certbot:/var/www/certbot:ro
```

See [deployment.md](../../docs/pwe/deployment.md) for full SSL configuration.

---

## Common Commands

```bash
# Start services
docker compose -f docker-compose.dev.yml up -d

# Stop services
docker compose -f docker-compose.dev.yml down

# Stop and remove volumes (reset database)
docker compose -f docker-compose.dev.yml down -v

# View logs
docker compose -f docker-compose.dev.yml logs -f

# View specific service logs
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend

# Rebuild after code changes
docker compose -f docker-compose.dev.yml up --build

# Access backend container shell
docker compose -f docker-compose.dev.yml exec backend sh

# Run Prisma Studio (database GUI)
docker compose -f docker-compose.dev.yml exec backend npx prisma studio

# Run migrations
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy

# Reset database and re-seed
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate deploy
docker compose -f docker-compose.dev.yml exec backend npx prisma db seed
```

---

## Environment Variables

| Variable               | Description                    | Default                                       |
|------------------------|--------------------------------|-----------------------------------------------|
| `POSTGRES_DB`          | Database name                  | `pwe_dev`                                     |
| `POSTGRES_USER`        | Database user                  | `pwe_dev`                                     |
| `POSTGRES_PASSWORD`    | Database password              | `dev_password`                                |
| `DATABASE_URL`         | PostgreSQL connection string   | `postgresql://pwe_dev:dev_password@db:5432/pwe_dev` |
| `JWT_SECRET`           | Access token secret            | `dev-jwt-secret-not-for-production`           |
| `JWT_EXPIRES_IN`       | Access token expiry            | `15m`                                         |
| `REFRESH_TOKEN_SECRET` | Refresh token secret           | `dev-refresh-secret-not-for-production`       |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiry      | `7d`                                          |
| `PORT`                 | Backend port                   | `3000`                                        |
| `NODE_ENV`             | Environment                    | `development`                                 |
| `FRONTEND_URL`         | CORS origin                    | `http://localhost`                             |
| `VITE_API_URL`         | Frontend API base URL          | `http://localhost/api/v1`                     |

---

## Troubleshooting

### Container won't start

```bash
# Check logs for errors
docker compose -f docker-compose.dev.yml logs <service-name>

# Check if port is already in use
lsof -i :80
lsof -i :3000
lsof -i :5432
```

### Database connection refused

```bash
# Verify db container is healthy
docker compose -f docker-compose.dev.yml ps

# Check db logs
docker compose -f docker-compose.dev.yml logs db

# Restart db
docker compose -f docker-compose.dev.yml restart db
```

### Frontend can't reach backend

- Ensure `VITE_API_URL` in `.env` matches your domain
- Check nginx config is correct
- Verify backend is running: `curl http://localhost:3000/health`

### Prisma migration errors

```bash
# Check database is accessible
docker compose -f docker-compose.dev.yml exec db psql -U pwe_dev -d pwe_dev -c "\dt"

# Reset and re-run migrations
docker compose -f docker-compose.dev.yml exec backend npx prisma migrate reset
```

---

## File Structure

```
src/dev-deployment/
├── docker-compose.dev.yml   # Service orchestration
├── Dockerfile.dev           # Frontend dev container
├── nginx.conf               # Reverse proxy config
├── .env.example             # Environment template
├── .dockerignore            # Build optimization
├── setup-server.sh          # Droplet provisioning
└── README.md                # This file
```
