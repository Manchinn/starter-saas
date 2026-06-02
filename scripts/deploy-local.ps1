# Deploy Starter SaaS Locally (PowerShell version)
# Usage: .\scripts\deploy-local.ps1

Write-Host "=== Starter SaaS - Local Deployment (Windows) ===" -ForegroundColor Cyan
Write-Host ""

# Check Docker
Write-Host "[1/6] Checking Docker..." -ForegroundColor Yellow
try {
    docker --version | Out-Null
    Write-Host "✓ Docker found" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found. Install Docker Desktop first." -ForegroundColor Red
    Write-Host "Download: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check .env file
Write-Host ""
Write-Host "[2/6] Checking environment file..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    Write-Host "✓ Creating .env from example..." -ForegroundColor Green
    Copy-Item ".env.production.example" ".env"

    Write-Host ""
    Write-Host "Generating secrets..." -ForegroundColor Cyan

    # Generate secrets using PowerShell
    function New-Secret {
        param([int]$Length = 48)
        $bytes = New-Object byte[] $Length
        [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
        return [Convert]::ToBase64String($bytes)
    }

    $jwtSecret = New-Secret -Length 48
    $jwtRefreshSecret = New-Secret -Length 48
    $redisPassword = New-Secret -Length 32
    $dbPassword = New-Secret -Length 32

    # Update .env file
    (Get-Content ".env") `
        -replace 'JWT_SECRET=.*', "JWT_SECRET=$jwtSecret" `
        -replace 'JWT_REFRESH_SECRET=.*', "JWT_REFRESH_SECRET=$jwtRefreshSecret" `
        -replace 'REDIS_PASSWORD=.*', "REDIS_PASSWORD=$redisPassword" `
        -replace 'DB_PASSWORD=.*', "DB_PASSWORD=$dbPassword" `
        -replace 'NODE_ENV=.*', 'NODE_ENV=development' `
        | Set-Content ".env"

    Write-Host "✓ Secrets generated and saved to .env" -ForegroundColor Green
} else {
    Write-Host "✓ .env file exists" -ForegroundColor Green
}

# Stop existing containers
Write-Host ""
Write-Host "[3/6] Stopping existing containers..." -ForegroundColor Yellow
docker-compose down 2>$null
Write-Host "✓ Cleaned up" -ForegroundColor Green

# Build images
Write-Host ""
Write-Host "[4/6] Building Docker images..." -ForegroundColor Yellow
Write-Host "(This may take 2-5 minutes on first run)" -ForegroundColor Gray
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Images built" -ForegroundColor Green

# Start containers
Write-Host ""
Write-Host "[5/6] Starting containers..." -ForegroundColor Yellow
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to start containers" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Containers started" -ForegroundColor Green

# Wait for services
Write-Host ""
Write-Host "[6/6] Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Health check
$maxRetries = 10
$retryCount = 0
$healthy = $false

while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {
        # Ignore errors, will retry
    }

    $retryCount++
    Write-Host "  Waiting... ($retryCount/$maxRetries)" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

Write-Host ""
if ($healthy) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ Deployment successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your application:" -ForegroundColor Cyan
    Write-Host "  API:    http://localhost:3000" -ForegroundColor White
    Write-Host "  Client: http://localhost:8080" -ForegroundColor White
    Write-Host "  Health: http://localhost:3000/api/health" -ForegroundColor White
    Write-Host ""
    Write-Host "Useful commands:" -ForegroundColor Cyan
    Write-Host "  docker-compose logs -f          # View logs" -ForegroundColor Gray
    Write-Host "  docker-compose ps               # Check status" -ForegroundColor Gray
    Write-Host "  docker-compose down             # Stop all" -ForegroundColor Gray
    Write-Host "  docker-compose restart api      # Restart API" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "⚠ Services started but health check failed" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check logs:" -ForegroundColor Cyan
    Write-Host "  docker-compose logs api" -ForegroundColor White
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Cyan
    Write-Host "  1. Database not ready yet (wait 30s)" -ForegroundColor Gray
    Write-Host "  2. Port already in use (check docker-compose ps)" -ForegroundColor Gray
    Write-Host "  3. Missing dependencies (check docker-compose logs)" -ForegroundColor Gray
    Write-Host ""
}
