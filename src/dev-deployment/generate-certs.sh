#!/bin/bash
set -euo pipefail

# Generate self-signed SSL certificates for dev.pwe-mm.site
# For production, use Let's Encrypt with certbot instead

DOMAIN="dev.pwe-mm.site"
SSL_DIR="$(dirname "$0")/ssl"

mkdir -p "$SSL_DIR"

echo "Generating self-signed certificate for $DOMAIN..."

# Temp files for OpenSSL config and extensions
TMP_EXT=$(mktemp)

cat > "$TMP_EXT" <<EOF
subjectAltName=DNS:${DOMAIN},DNS:localhost
EOF

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

rm -f "$TMP_EXT"

echo ""
echo "Certificates created in $SSL_DIR/"
echo "  - $DOMAIN.crt"
echo "  - $DOMAIN.key"
echo ""
echo "NOTE: These are self-signed certs for development only."
echo "For production, use Let's Encrypt: certbot certonly --webroot -w /var/www/certbot -d $DOMAIN"
