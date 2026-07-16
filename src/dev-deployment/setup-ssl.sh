#!/bin/bash
set -euo pipefail

# SSL Setup Script for PWE Dev Deployment
# Sets up Let's Encrypt SSL with certbot for Docker nginx

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="dev.pwe-mm.site"
EMAIL="admin@pwe-mm.site"

echo "=== PWE SSL Setup ==="
echo "Domain: $DOMAIN"
echo ""

# Check if running on server
if [ ! -d "/etc/letsencrypt" ]; then
    echo "ERROR: certbot/letsencrypt not found."
    echo "Install first: apt install -y certbot python3-certbot-nginx"
    exit 1
fi

# Create ssl directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/ssl"

# Create webroot directory for ACME challenge
echo "1. Creating webroot directory for ACME challenge..."
mkdir -p /var/www/certbot

# Ensure nginx is running for ACME challenge
echo "2. Starting nginx for ACME challenge..."
cd "$SCRIPT_DIR"
docker compose -f docker-compose.dev.yml up -d nginx
sleep 3

# Get certificate
echo "3. Requesting SSL certificate from Let's Encrypt..."
certbot certonly --webroot --webroot-path=/var/www/certbot \
    --email "$EMAIL" --agree-tos -d "$DOMAIN" \
    --non-interactive

# Copy certs to Docker ssl directory
echo "4. Copying certificates to Docker..."
cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SCRIPT_DIR/ssl/$DOMAIN.crt"
cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SCRIPT_DIR/ssl/$DOMAIN.key"
chmod 644 "$SCRIPT_DIR/ssl/$DOMAIN.crt"
chmod 600 "$SCRIPT_DIR/ssl/$DOMAIN.key"

# Install certbot renewal hook
echo "5. Installing auto-renewal hook..."
chmod +x "$SCRIPT_DIR/certbot-renew-hook.sh"
ln -sf "$SCRIPT_DIR/certbot-renew-hook.sh" /etc/letsencrypt/renewal-hooks/deploy/pwe-renew.sh

# Restart nginx with new certs
echo "6. Restarting nginx with SSL..."
docker compose -f docker-compose.dev.yml restart nginx

# Verify
echo ""
echo "7. Verifying SSL..."
sleep 2
if curl -sk "https://$DOMAIN/health" > /dev/null 2>&1; then
    echo "   ✓ HTTPS is working"
else
    echo "   ✗ HTTPS is not responding"
    echo "   Check: docker compose -f docker-compose.dev.yml logs nginx"
fi

# Check certbot timer
echo ""
echo "8. Checking certbot renewal timer..."
if systemctl is-active certbot.timer &>/dev/null; then
    echo "   ✓ certbot.timer is active"
else
    echo "   ⚠ certbot.timer is not active"
    echo "   Enable with: systemctl enable --now certbot.timer"
fi

echo ""
echo "=== SSL Setup Complete ==="
echo ""
echo "Certificate valid until: $(openssl x509 -enddate -noout -in "$SCRIPT_DIR/ssl/$DOMAIN.crt" | cut -d= -f2)"
echo ""
echo "Auto-renewal is configured via certbot hook."
echo "Test renewal: certbot renew --dry-run"
