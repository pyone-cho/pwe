# PWE Dev Deployment

Docker-based development environment for deploying PWE on a DigitalOcean droplet with SSL/TLS via Let's Encrypt.

## Architecture

```
Internet → :80/:443 nginx → /api/* → backend:3000 → db:5432
                          → /*     → frontend:5173 (Vite HMR)
```

| Service    | Port  | Description                     |
|------------|-------|---------------------------------|
| nginx      | 80, 443 | Reverse proxy, SSL, rate limiting |
| backend    | 3000  | Express API server              |
| frontend   | 5173  | React dev server (Vite HMR)     |
| db         | 5432  | PostgreSQL 16                   |

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

# 3. Generate self-signed SSL certs (for local testing)
./generate-certs.sh

# 4. Start all services
make build

# 5. Run migrations (in a new terminal)
make migrate

# 6. Seed database (optional)
make seed
```

Open https://localhost in your browser (accept self-signed cert warning).

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
FRONTEND_URL=https://your-domain.com
VITE_API_URL=https://your-domain.com/api/v1
```

### 5. Start Services

```bash
cd /opt/pwe/src/dev-deployment
make build
```

### 6. Run Migrations & Seed

```bash
make migrate
make seed
```

### 7. Setup SSL

```bash
./setup-ssl.sh
```

This will:
- Install certbot if needed
- Request a Let's Encrypt certificate
- Copy certs to Docker's ssl directory
- Install auto-renewal hook
- Restart nginx with SSL

---

## SSL/TLS (Let's Encrypt)

### Automated Setup (Recommended)

```bash
./setup-ssl.sh
```

### Manual Setup

```bash
# 1. Install certbot
apt install -y certbot python3-certbot-nginx

# 2. Create webroot directory
mkdir -p /var/www/certbot

# 3. Start nginx (needed for ACME challenge)
make up

# 4. Get certificate
certbot certonly --webroot --webroot-path=/var/www/certbot \
  --email admin@pwe-mm.site --agree-tos -d dev.pwe-mm.site

# 5. Copy certs into the ssl/ directory
cp /etc/letsencrypt/live/dev.pwe-mm.site/fullchain.pem ssl/dev.pwe-mm.site.crt
cp /etc/letsencrypt/live/dev.pwe-mm.site/privkey.pem ssl/dev.pwe-mm.site.key
chmod 644 ssl/dev.pwe-mm.site.crt
chmod 600 ssl/dev.pwe-mm.site.key

# 6. Restart nginx
make restart
```

**Important:** Do NOT symlink certbot files into `ssl/` — Docker volume mounts copy files at mount time, so symlinks break. Always copy the actual cert/key files.

### Quick SSL Fix

If SSL is broken (site not loading), use the fix script:

```bash
./fix-ssl.sh
```

### Automated Renewal

Certbot auto-renewal is configured via the hook script. Verify:

```bash
# Check certbot timer is active
systemctl status certbot.timer

# Test renewal manually
certbot renew --dry-run
```

### Manual Renewal

```bash
./renew-ssl.sh
```

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
make ssl-fix  # Fix SSL certificate issues
make ssl-renew # Renew SSL certificate manually
```

---

## Common Commands

```bash
# Start services
make up

# Stop services
make down

# Stop and remove volumes (reset database)
$(COMPOSE) down -v

# View logs
make logs

# View specific service logs
make logs-backend
make logs-frontend
make logs-nginx

# Rebuild after code changes
make build

# Access backend container shell
make shell-backend

# Run Prisma Studio (database GUI)
make studio

# Run migrations
make migrate

# Reset database and re-seed
make reset

# Fix SSL issues
make ssl-fix

# Renew SSL certificate manually
make ssl-renew
```

---

## Server Quick Reference

### First-time setup
```bash
ssh root@YOUR_DROPLET_IP
cd /opt/pwe/src/dev-deployment
./fix-ssl.sh
make build
make migrate
make seed
```

### Fix site not loading
```bash
ssh root@YOUR_DROPLET_IP
cd /opt/pwe/src/dev-deployment
./fix-ssl.sh
```

### Update deployment after git pull
```bash
ssh root@YOUR_DROPLET_IP
cd /opt/pwe
git pull
cd src/dev-deployment
make build
```

---

## Environment Variables

| Variable               | Description                    | Default                                       | Required |
|------------------------|--------------------------------|-----------------------------------------------|----------|
| `POSTGRES_DB`          | Database name                  | `pwe_dev`                                     | Yes      |
| `POSTGRES_USER`        | Database user                  | `pwe_dev`                                     | Yes      |
| `POSTGRES_PASSWORD`    | Database password              | `dev_password`                                | Yes      |
| `DATABASE_URL`         | PostgreSQL connection string   | `postgresql://pwe_dev:dev_password@db:5432/pwe_dev` | Yes |
| `JWT_SECRET`           | Access token secret            | —                                             | **Yes**  |
| `JWT_EXPIRES_IN`       | Access token expiry            | `15m`                                         | No       |
| `REFRESH_TOKEN_SECRET` | Refresh token secret           | —                                             | **Yes**  |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiry      | `7d`                                          | No       |
| `PORT`                 | Backend port                   | `3000`                                        | No       |
| `NODE_ENV`             | Environment                    | `development`                                 | No       |
| `FRONTEND_URL`         | CORS origin                    | `https://dev.pwe-mm.site`                     | Yes      |
| `VITE_API_URL`         | Frontend API base URL          | `https://dev.pwe-mm.site/api/v1`             | Yes      |

> **⚠️ Security**: `JWT_SECRET` and `REFRESH_TOKEN_SECRET` are **required** — no fallback values allowed. The application will fail to start without them. Generate secure secrets with:
> ```bash
> openssl rand -base64 64
> ```

---

## Troubleshooting

### Site not loading (SSL errors)

**Quick fix:**
```bash
./fix-ssl.sh
```

**Manual diagnosis:**
```bash
# Check if containers are running
make status

# Check nginx logs
make logs-nginx

# Check if SSL certs exist
ls -la ssl/

# Test nginx config
$(COMPOSE) exec nginx nginx -t
```

**Common SSL errors:**

| Error | Cause | Fix |
|-------|-------|-----|
| `cannot load certificate` | SSL files missing | `./fix-ssl.sh` |
| `SSL_do_handshake() failed` | Cert/key mismatch or expired | Re-copy from certbot |
| `no suitable peer certificate` | Self-signed cert in browser | Use Let's Encrypt or accept warning |
| Empty reply from server | nginx not running | `make up` |

### Container won't start

```bash
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
$(COMPOSE) logs db

# Restart db
$(COMPOSE) restart db
```

### Frontend can't reach backend

- Ensure `VITE_API_URL` in `.env` matches your domain
- Check nginx config is correct
- Verify backend is running: `curl http://localhost:3000/health`

### Prisma migration errors

```bash
# Check database is accessible
$(COMPOSE) exec db psql -U pwe_dev -d pwe_dev -c "\dt"

# Reset and re-run migrations
$(COMPOSE) exec backend npx prisma migrate reset
```

### SSL certificate expired or not trusted

```bash
# Check certificate expiry
openssl x509 -enddate -noout -in ssl/dev.pwe-mm.site.crt

# If expired, renew with certbot
certbot renew

# Copy new certs
cp /etc/letsencrypt/live/dev.pwe-mm.site/fullchain.pem ssl/dev.pwe-mm.site.crt
cp /etc/letsencrypt/live/dev.pwe-mm.site/privkey.pem ssl/dev.pwe-mm.site.key

# Restart nginx
make restart
```

---

## File Structure

```
src/dev-deployment/
├── docker-compose.dev.yml   # Service orchestration
├── nginx.conf               # Reverse proxy config (SSL + rate limiting)
├── .env.example             # Environment template
├── .env                     # Active environment config
├── .dockerignore            # Build optimization
├── Makefile                 # Convenience commands
├── generate-certs.sh        # Self-signed cert generation (fallback)
├── setup-server.sh          # Droplet provisioning
├── setup-ssl.sh             # Let's Encrypt SSL setup
├── fix-ssl.sh               # Quick SSL fix script
├── renew-ssl.sh             # Manual SSL renewal script
├── certbot-renew-hook.sh    # Auto-renewal hook for certbot
├── ssl/                     # SSL certs (copy from /etc/letsencrypt)
│   ├── dev.pwe-mm.site.crt  # fullchain.pem from certbot
│   └── dev.pwe-mm.site.key  # privkey.pem from certbot
└── README.md                # This file
```
