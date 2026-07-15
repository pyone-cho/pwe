# PWE Dev Deployment

Docker-based development environment for deploying PWE on a DigitalOcean droplet.

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

The `nginx.conf` already includes full SSL configuration. After DNS points to your server:

```bash
# 1. Install certbot
apt install -y certbot python3-certbot-nginx

# 2. Get certificate (nginx must be running on port 80 for ACME challenge)
cd /opt/pwe/src/dev-deployment
docker compose -f docker-compose.dev.yml up -d nginx

# 3. Create webroot directory for ACME challenge
mkdir -p /var/www/certbot

# 4. Get certificate
certbot certonly --webroot --webroot-path=/var/www/certbot \
  --email admin@pwe-mm.site --agree-tos -d your-domain.com

# 5. Copy certs into the ssl/ directory (docker can't follow symlinks)
rm -f ssl/*
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/your-domain.com.crt
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/your-domain.com.key
chmod 644 ssl/your-domain.com.crt
chmod 600 ssl/your-domain.com.key

# 6. Update server_name in nginx.conf to match your domain

# 7. Restart nginx
docker compose -f docker-compose.dev.yml restart nginx
```

**Important:** Do NOT symlink certbot files into `ssl/` — Docker volume mounts copy files at mount time, so symlinks break. Always copy the actual cert/key files.

**Note:** Certbot auto-renewal is configured via systemd timer. Verify with:

```bash
systemctl status certbot.timer
```

After renewal, re-copy the certs into `ssl/` and restart nginx:

```bash
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/your-domain.com.crt
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/your-domain.com.key
docker compose -f docker-compose.dev.yml restart nginx
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

### Nginx SSL certificate errors

```bash
# Error: "cannot load certificate /etc/nginx/ssl/..."
# Cause: ssl/ directory is empty or has broken symlinks

# Check ssl directory
ls -la ssl/

# If empty or symlinks, copy actual cert files:
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/your-domain.com.crt
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/your-domain.com.key

# Restart nginx
docker compose -f docker-compose.dev.yml restart nginx
```

### Certbot renewal + nginx

```bash
# After certbot renews, copy new certs and restart nginx:
cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ssl/your-domain.com.crt
cp /etc/letsencrypt/live/your-domain.com/privkey.pem ssl/your-domain.com.key
docker compose -f docker-compose.dev.yml restart nginx
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
├── generate-certs.sh        # Self-signed cert generation (fallback)
├── setup-server.sh          # Droplet provisioning
├── ssl/                     # SSL certs (copy from /etc/letsencrypt)
│   ├── dev.pwe-mm.site.crt  # fullchain.pem from certbot
│   └── dev.pwe-mm.site.key  # privkey.pem from certbot
└── README.md                # This file
```
