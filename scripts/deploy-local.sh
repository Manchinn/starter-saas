#!/bin/bash

# Local Docker deployment (for testing production setup)
# Usage: ./scripts/deploy-local.sh

set -e

echo "=== Starter SaaS - Local Docker Deployment ==="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker Desktop."
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from example..."
    cp .env.production.example .env

    echo ""
    echo "⚠️  WARNING: Using default secrets!"
    echo "For production, generate secure secrets with:"
    echo "  ./scripts/generate-secrets.sh"
    echo ""

    # Generate random secrets for local testing
    JWT_SECRET=$(openssl rand -base64 48)
    JWT_REFRESH_SECRET=$(openssl rand -base64 48)
    REDIS_PASSWORD=$(openssl rand -base64 32)
    DB_PASSWORD=$(openssl rand -base64 32)

    # Update .env with generated secrets
    sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" .env
    sed -i.bak "s|JWT_REFRESH_SECRET=.*|JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET|" .env
    sed -i.bak "s|REDIS_PASSWORD=.*|REDIS_PASSWORD=$REDIS_PASSWORD|" .env
    sed -i.bak "s|DB_PASSWORD=.*|DB_PASSWORD=$DB_PASSWORD|" .env
    rm .env.bak

    echo "✓ Generated random secrets for local testing"
fi

echo "Step 1: Building Docker images..."
docker-compose build

echo ""
echo "Step 2: Starting services..."
docker-compose up -d

echo ""
echo "Step 3: Waiting for services to be healthy..."
sleep 30

# Check health
echo ""
echo "Step 4: Health check..."
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✓ API is healthy!"
else
    echo "✗ API health check failed. Checking logs..."
    docker-compose logs api | tail -20
fi

if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✓ Client is healthy!"
else
    echo "✗ Client health check failed. Checking logs..."
    docker-compose logs client | tail -20
fi

echo ""
echo "=== Deployment Complete! ==="
echo ""
echo "Access your application:"
echo "  API: http://localhost:3000"
echo "  Client: http://localhost:8080"
echo ""
echo "Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  View API logs: docker-compose logs -f api"
echo "  View Client logs: docker-compose logs -f client"
echo "  Restart: docker-compose restart"
echo "  Stop: docker-compose down"
echo "  Stop & remove volumes: docker-compose down -v"
echo ""
