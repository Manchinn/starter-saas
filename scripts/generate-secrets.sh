#!/bin/bash

# Generate secure secrets for production
# Usage: ./scripts/generate-secrets.sh

echo "=== Generating Production Secrets ==="
echo ""

echo "JWT_SECRET (copy to .env):"
openssl rand -base64 48
echo ""

echo "JWT_REFRESH_SECRET (copy to .env):"
openssl rand -base64 48
echo ""

echo "REDIS_PASSWORD (copy to .env):"
openssl rand -base64 32
echo ""

echo "DB_PASSWORD (copy to .env):"
openssl rand -base64 32
echo ""

echo "=== Done! ==="
echo "Copy these values to your .env file"
echo "NEVER commit .env to git!"
