#!/bin/bash

# Deploy to VPS (Ubuntu/Debian)
# Usage: ./scripts/deploy-vps.sh

set -e

echo "=== Starter SaaS - VPS Deployment Script ==="
echo ""

# Configuration
VPS_HOST="${VPS_HOST:-your-vps-ip}"
VPS_USER="${VPS_USER:-root}"
VPS_PORT="${VPS_PORT:-22}"
DEPLOY_DIR="/opt/starter-saas"

echo "Deploying to: $VPS_USER@$VPS_HOST:$VPS_PORT"
echo "Deploy directory: $DEPLOY_DIR"
echo ""

# Check if SSH key is configured
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "Error: SSH key not found. Generate one with: ssh-keygen -t rsa -b 4096"
    exit 1
fi

echo "Step 1: Copying files to VPS..."
ssh -p $VPS_PORT $VPS_USER@$VPS_HOST "mkdir -p $DEPLOY_DIR"

rsync -avz --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'data' \
    --exclude 'logs' \
    --exclude '.env' \
    -e "ssh -p $VPS_PORT" \
    ./ $VPS_USER@$VPS_HOST:$DEPLOY_DIR/

echo ""
echo "Step 2: Installing Docker (if not installed)..."
ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << 'ENDSSH'
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
else
    echo "Docker already installed"
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "Docker Compose already installed"
fi
ENDSSH

echo ""
echo "Step 3: Setting up environment..."
ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
cd $DEPLOY_DIR

# Create .env if not exists
if [ ! -f .env ]; then
    echo "Creating .env from example..."
    cp .env.production.example .env
    echo ""
    echo "WARNING: Please edit .env and set your secrets!"
    echo "Run: nano $DEPLOY_DIR/.env"
    echo ""
fi

# Create data directories
mkdir -p data logs
chmod 755 data logs
ENDSSH

echo ""
echo "Step 4: Building and starting containers..."
ssh -p $VPS_PORT $VPS_USER@$VPS_HOST << ENDSSH
cd $DEPLOY_DIR

# Pull latest images (if using Docker Hub)
# docker-compose pull

# Build and start
docker-compose up -d --build

# Wait for services to be healthy
echo "Waiting for services to start..."
sleep 30

# Show status
docker-compose ps
ENDSSH

echo ""
echo "Step 5: Health check..."
sleep 10
HEALTH_URL="http://$VPS_HOST:3000/api/health"
if curl -f $HEALTH_URL > /dev/null 2>&1; then
    echo "✓ API is healthy!"
else
    echo "✗ API health check failed. Check logs with:"
    echo "  ssh $VPS_USER@$VPS_HOST 'cd $DEPLOY_DIR && docker-compose logs api'"
fi

echo ""
echo "=== Deployment Complete! ==="
echo ""
echo "Access your application:"
echo "  API: http://$VPS_HOST:3000"
echo "  Client: http://$VPS_HOST:8080"
echo ""
echo "Useful commands:"
echo "  View logs: ssh $VPS_USER@$VPS_HOST 'cd $DEPLOY_DIR && docker-compose logs -f'"
echo "  Restart: ssh $VPS_USER@$VPS_HOST 'cd $DEPLOY_DIR && docker-compose restart'"
echo "  Stop: ssh $VPS_USER@$VPS_HOST 'cd $DEPLOY_DIR && docker-compose down'"
echo ""
