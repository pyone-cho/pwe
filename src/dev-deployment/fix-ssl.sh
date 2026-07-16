#!/bin/bash
set -euo pipefail

# Fix SSL Certificate Issues for PWE Dev Deployment
# This script diagnoses and fixes common SSL problems

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN="dev.pwe-mm.site"
DEPLOY_DIR="/opt/pwe/src/dev-deployment"

echo "=== PWE SSL Certificate Fix ==="
echo "Domain: $DOMAIN"
echo ""

# Determine SSL directory
if [ -d "$DEPLOY_DIR/ssl" ]; then
    SSL_DIR="$DEPLOY_DIR/ssl"
    COMPOSE_DIR="$DEPLOY_DIR"
else
    SSL_DIR="$SCRIPT_DIR/ssl"
    COMPOSE_DIR="$SCRIPT_DIR"
fi

# Check current state
echo "1. Checking current SSL state..."
if [ -f "$SSL_DIR/$DOMAIN.crt" ] && [ -f "$SSL_DIR/$DOMAIN.key" ]; then
    echo "   ✓ SSL files exist"
    CERT_INFO=$(openssl x509 -enddate -noout -in "$SSL_DIR/$DOMAIN.crt" 2>/dev/null || echo "Invalid certificate")
    echo "   Certificate: $CERT_INFO"
else
    echo "   ✗ SSL files missing"
fi

echo ""
echo "2. Checking Let's Encrypt certificates..."
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo "   ✓ Let's Encrypt certificates found"
    LE_CERT_INFO=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" 2>/dev/null || echo "Invalid certificate")
    echo "   Certificate: $LE_CERT_INFO"

    # Copy Let's Encrypt certs to Docker ssl directory
    echo ""
    echo "3. Copying Let's Encrypt certificates to Docker..."
    cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$SSL_DIR/$DOMAIN.crt"
    cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$SSL_DIR/$DOMAIN.key"
    chmod 644 "$SSL_DIR/$DOMAIN.crt"
    chmod 600 "$SSL_DIR/$DOMAIN.key"
    echo "   ✓ Certificates copied"
else
    echo "   ✗ Let's Encrypt certificates not found"
    echo ""
    echo "3. Generating self-signed certificate (fallback)..."

    # Generate self-signed cert
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/$DOMAIN.key" \
        -out "$SSL_DIR/$DOMAIN.crt" \
        -subj "/C=MM/ST=Yangon/L=Yangon/O=PWE/CN=$DOMAIN" \
        -extensions v3_req \
        -config <(cat <<EOCONF
[req]
distinguished_name = req_dn
prompt = no

[req_dn]
C = MM
ST = Yangon
L = Yangon
O = PWE
CN = $DOMAIN

[v3_req]
subjectAltName = DNS:${DOMAIN},DNS:localhost
EOCONF
    )
    echo "   ✓ Self-signed certificate generated"
    echo "   ⚠ For production, use Let's Encrypt: certbot certonly --webroot -w /var/www/certbot -d $DOMAIN"
fi

# Test nginx config
echo ""
echo "4. Testing nginx configuration..."
cd "$COMPOSE_DIR"
if docker compose -f docker-compose.dev.yml exec nginx nginx -t 2>&1; then
    echo "   ✓ Nginx configuration is valid"
else
    echo "   ✗ Nginx configuration has errors"
    echo "   Check nginx.conf for syntax errors"
    exit 1
fi

# Restart nginx
echo ""
echo "5. Restarting nginx..."
docker compose -f docker-compose.dev.yml restart nginx
echo "   ✓ nginx restarted"

# Verify
echo ""
echo "6. Verifying SSL..."
sleep 2
if curl -sk "https://$DOMAIN/health" > /dev/null 2>&1; then
    echo "   ✓ HTTPS is working"
else
    echo "   ✗ HTTPS is not responding"
    echo "   Check: docker compose -f docker-compose.dev.yml logs nginx"
fi

echo ""
echo "=== Fix Complete ==="
echo ""
echo "If issues persist, check logs:"
echo "  docker compose -f docker-compose.dev.yml logs nginx --tail=50"
