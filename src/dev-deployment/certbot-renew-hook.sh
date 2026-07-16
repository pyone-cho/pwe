#!/bin/bash
# Certbot post-renewal hook
# Place in /etc/letsencrypt/renewal-hooks/deploy/ on the server
# This runs automatically after certbot renews a certificate

set -euo pipefail

APP_DIR="/opt/pwe/src/dev-deployment"
DOMAIN="$RENEWED_DOMAINS"

echo "=== Certbot Renewal Hook ==="
echo "Renewed domains: $DOMAIN"
echo "Certificate line: $RENEWED_LINEAGE"

# Copy new certs to Docker ssl directory
cp "$RENEWED_LINEAGE/fullchain.pem" "$APP_DIR/ssl/$DOMAIN.crt"
cp "$RENEWED_LINEAGE/privkey.pem" "$APP_DIR/ssl/$DOMAIN.key"
chmod 644 "$APP_DIR/ssl/$DOMAIN.crt"
chmod 600 "$APP_DIR/ssl/$DOMAIN.key"

# Restart nginx container
cd "$APP_DIR"
docker compose -f docker-compose.dev.yml restart nginx

echo "=== nginx restarted with new certificate ==="
