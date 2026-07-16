#!/bin/bash
set -euo pipefail

# SSL Certificate Renewal Script for Docker nginx
# Copies renewed certs from /etc/letsencrypt/ to ./ssl/ and restarts nginx
#
# Usage:
#   ./renew-ssl.sh                    # Use default domain from nginx.conf
#   ./renew-ssl.sh dev.pwe-mm.site    # Specify domain explicitly

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="${1:-}"
DEPLOY_DIR="/opt/pwe/src/dev-deployment"

# Auto-detect domain from nginx.conf if not provided
if [ -z "$DOMAIN" ]; then
    DOMAIN=$(grep -oP 'server_name\s+\K[^;]+' "$SCRIPT_DIR/nginx.conf" | head -1)
    if [ -z "$DOMAIN" ]; then
        echo "ERROR: Could not detect domain from nginx.conf"
        exit 1
    fi
fi

echo "=== SSL Renewal for $DOMAIN ==="

# Source directory (where certbot saves certs)
SRC_DIR="/etc/letsencrypt/live/$DOMAIN"

# Check if certs exist
if [ ! -f "$SRC_DIR/fullchain.pem" ] || [ ! -f "$SRC_DIR/privkey.pem" ]; then
    echo "ERROR: Certificate files not found at $SRC_DIR"
    exit 1
fi

# Use /opt/pwe if running on server, otherwise use script directory
if [ -d "$DEPLOY_DIR" ] && [ "$(pwd)" != "$SCRIPT_DIR" ]; then
    SSL_DIR="$DEPLOY_DIR/ssl"
    COMPOSE_DIR="$DEPLOY_DIR"
else
    SSL_DIR="$SCRIPT_DIR/ssl"
    COMPOSE_DIR="$SCRIPT_DIR"
fi

echo "Copying certificates..."
cp "$SRC_DIR/fullchain.pem" "$SSL_DIR/$DOMAIN.crt"
cp "$SRC_DIR/privkey.pem" "$SSL_DIR/$DOMAIN.key"
chmod 644 "$SSL_DIR/$DOMAIN.crt"
chmod 600 "$SSL_DIR/$DOMAIN.key"

echo "Restarting nginx..."
cd "$COMPOSE_DIR"
docker compose -f docker-compose.dev.yml restart nginx

echo "=== SSL Renewal Complete ==="
echo "Certificate valid until: $(openssl x509 -enddate -noout -in "$SSL_DIR/$DOMAIN.crt" | cut -d= -f2)"
