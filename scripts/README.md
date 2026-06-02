# Deployment Scripts

## Windows (PowerShell)

```powershell
# Local deployment
.\scripts\deploy-local.ps1

# View logs
docker-compose logs -f

# Stop all
docker-compose down
```

## Linux/macOS (Bash)

```bash
# Local deployment
./scripts/deploy-local.sh

# VPS deployment
./scripts/deploy-vps.sh

# DigitalOcean deployment
./scripts/deploy-digitalocean.sh
```

## Requirements

### Windows
- Docker Desktop (running)
- PowerShell 5.1+

### Linux/macOS
- Docker
- Docker Compose
- Bash

## Troubleshooting

### Windows: "docker: command not found"
- Install Docker Desktop: https://www.docker.com/products/docker-desktop
- Restart PowerShell after installation

### Windows: "Docker is not running"
- Start Docker Desktop
- Wait for Docker to fully start (check system tray icon)

### WSL: "Cannot connect to Docker daemon"
- Don't run from WSL — use PowerShell instead
- Docker Desktop runs on Windows, not inside WSL

### Port already in use
```powershell
# Check what's using the port
netstat -ano | findstr :3000

# Stop existing containers
docker-compose down
```

### Health check fails
```powershell
# Check logs
docker-compose logs api

# Wait longer (database might be initializing)
Start-Sleep -Seconds 30
Invoke-WebRequest http://localhost:3000/api/health
```
