#!/bin/bash
set -euo pipefail

# PWE DigitalOcean Droplet Setup Script
# Run as root on a fresh Ubuntu 22.04+ droplet

APP_DIR="/opt/pwe"
DEPLOY_USER="pwe"
REPO_URL="https://github.com/pyone-cho/pwe.git"

echo "=== PWE Server Setup ==="

# 1. Update system
echo "[1/8] Updating system packages..."
apt update && apt upgrade -y

# 2. Install Docker
echo "[2/8] Installing Docker..."
curl -fsSL https://get.docker.com | sh
systemctl enable docker

# 3. Install Docker Compose plugin
echo "[3/8] Installing Docker Compose plugin..."
apt install -y docker-compose-plugin

# 4. Configure firewall
echo "[4/8] Configuring firewall (ufw)..."
apt install -y ufw
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# 5. Create deploy user
echo "[5/8] Creating deploy user..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
    usermod -aG docker "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
fi

# 6. Setup app directory
echo "[6/8] Setting up application directory..."
mkdir -p "$APP_DIR"
chown "$DEPLOY_USER":"$DEPLOY_USER" "$APP_DIR"

# 7. Clone repository
echo "[7/8] Cloning repository..."
su - "$DEPLOY_USER" -c "
    cd $APP_DIR
    if [ ! -d .git ]; then
        git clone $REPO_URL .
    else
        git pull
    fi
"

# 8. Setup environment
echo "[8/8] Setting up environment..."
if [ ! -f "$APP_DIR/src/dev-deployment/.env" ]; then
    cp "$APP_DIR/src/dev-deployment/.env.example" "$APP_DIR/src/dev-deployment/.env"
    echo ""
    echo "=== IMPORTANT ==="
    echo "Edit $APP_DIR/src/dev-deployment/.env with your actual secrets:"
    echo "  - Generate JWT secrets: openssl rand -base64 64"
    echo "  - Set a strong POSTGRES_PASSWORD"
    echo ""
fi

# 9. Generate SSL certificates
echo "[9/9] Generating SSL certificates..."
cd "$APP_DIR/src/dev-deployment"
chmod +x generate-certs.sh
./generate-certs.sh

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit environment: sudo nano $APP_DIR/src/dev-deployment/.env"
echo "  2. Start services:   cd $APP_DIR/src/dev-deployment && make build"
echo "  3. Run migrations:   cd $APP_DIR/src/dev-deployment && make migrate"
echo "  4. Seed database:    cd $APP_DIR/src/dev-deployment && make seed"
echo "  5. Setup SSL:        cd $APP_DIR/src/dev-deployment && ./setup-ssl.sh"
echo ""
echo "Services will be available at:"
echo "  - Frontend: https://dev.pwe-mm.site"
echo "  - API:      https://dev.pwe-mm.site/api/v1"
echo ""
