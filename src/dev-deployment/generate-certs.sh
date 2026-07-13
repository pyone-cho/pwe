#!/bin/bash
set -euo pipefail

# Generate self-signed SSL certificates for dev.pwe-mm.site
# For production, use Let's Encrypt with certbot instead

DOMAIN="dev.pwe-mm.site"
SSL_DIR="$(dirname "$0")/ssl"

mkdir -p "$SSL_DIR"

echo "Generating self-signed certificate for $DOMAIN..."

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout "$SSL_DIR/$DOMAIN.key" \
    -out "$SSL_DIR/$DOMAIN.crt" \
    -subj "/C=MM/ST=Yangon/L=Yangon/O=PWE/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,DNS=localhost"

echo ""
echo "Certificates created in $SSL_DIR/"
echo "  - $DOMAIN.crt"
echo "  - $DOMAIN.key"
echo ""
echo "NOTE: These are self-signed certs for development only."
echo "For production, use Let's Encrypt: certbot certonly --webroot -w /var/www/certbot -d $DOMAIN"
