#!/usr/bin/env bash
# ============================================================
# Family Heritage Platform – Local Development Startup Script
# ============================================================
# Usage: ./scripts/setup.sh

set -e

echo ""
echo "🚀 Family Heritage Platform – Local Setup"
echo "=========================================="

# --- Docker ---
echo ""
echo "▶ Starting Docker containers..."
docker compose -f docker/docker-compose.yml up -d

echo "⏳ Waiting for MySQL to be ready (15s)..."
sleep 15

# --- Composer ---
echo ""
echo "▶ Installing backend dependencies..."
docker exec fhp-php composer install --no-interaction --prefer-dist

# --- JWT Keys (if not already generated) ---
if [ ! -f backend/config/jwt/private.pem ]; then
    echo ""
    echo "▶ Generating JWT keys..."
    mkdir -p backend/config/jwt
    openssl genrsa -aes256 \
        -passout pass:family_heritage_jwt_passphrase \
        -out backend/config/jwt/private.pem 4096
    openssl rsa -pubout \
        -passin pass:family_heritage_jwt_passphrase \
        -in backend/config/jwt/private.pem \
        -out backend/config/jwt/public.pem
    echo "✅ JWT keys generated."
else
    echo "✅ JWT keys already exist."
fi

# --- Doctrine Migrations ---
echo ""
echo "▶ Running database migrations..."
docker exec fhp-php php bin/console doctrine:migrations:migrate --no-interaction

echo ""
echo "=========================================="
echo "✅ Setup complete!"
echo ""
echo "  API:        http://localhost:8000"
echo "  API Docs:   http://localhost:8000/api/docs"
echo "  phpMyAdmin: http://localhost:8080"
echo ""

