#!/bin/bash

# Deploy to DigitalOcean Droplet
# Usage: ./scripts/deploy-digitalocean.sh

set -e

echo "=== Starter SaaS - DigitalOcean Deployment ==="
echo ""

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "Error: doctl CLI not found. Install it from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Configuration
DROPLET_NAME="${DROPLET_NAME:-starter-saas-prod}"
REGION="${DO_REGION:-sgp1}"
SIZE="${DO_SIZE:-s-2vcpu-4gb}"
IMAGE="${DO_IMAGE:-ubuntu-22-04-x64}"

echo "Creating DigitalOcean Droplet..."
echo "  Name: $DROPLET_NAME"
echo "  Region: $REGION"
echo "  Size: $SIZE"
echo ""

# Create droplet
doctl compute droplet create $DROPLET_NAME \
    --region $REGION \
    --size $SIZE \
    --image $IMAGE \
    --ssh-keys $(doctl compute ssh-key list --format ID --no-header | head -1) \
    --wait

# Get droplet IP
DROPLET_IP=$(doctl compute droplet list $DROPLET_NAME --format PublicIPv4 --no-header)

echo ""
echo "Droplet created! IP: $DROPLET_IP"
echo "Waiting for SSH to be ready..."
sleep 30

# Deploy using VPS script
export VPS_HOST=$DROPLET_IP
export VPS_USER=root
./scripts/deploy-vps.sh

echo ""
echo "=== DigitalOcean Deployment Complete! ==="
echo ""
echo "Droplet IP: $DROPLET_IP"
echo "Access your application:"
echo "  API: http://$DROPLET_IP:3000"
echo "  Client: http://$DROPLET_IP:8080"
echo ""
echo "Next steps:"
echo "  1. Point your domain to $DROPLET_IP"
echo "  2. Setup SSL with Let's Encrypt (see docs/DEPLOYMENT.md)"
echo "  3. Configure firewall rules"
echo ""
