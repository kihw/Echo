# Echo Music Manager - Deployment Script
# Usage: .\scripts\deploy.ps1 [environment] [options]

param(
    [string]$Environment = "production",
    [switch]$BuildOnly,
    [switch]$SkipTests,
    [switch]$Force,
    [switch]$Help
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Show-Help {
    Write-Host "Echo Music Manager - Deployment Script" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Usage: .\scripts\deploy.ps1 [environment] [options]" -ForegroundColor $Blue
    Write-Host ""
    Write-Host "Environments:" -ForegroundColor $Yellow
    Write-Host "  development   - Deploy to development environment"
    Write-Host "  staging       - Deploy to staging environment"
    Write-Host "  production    - Deploy to production environment (default)"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $Yellow
    Write-Host "  -BuildOnly    - Only build, don't deploy"
    Write-Host "  -SkipTests    - Skip test execution"
    Write-Host "  -Force        - Force deployment without confirmation"
    Write-Host "  -Help         - Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Green
    Write-Host "  .\scripts\deploy.ps1                         # Deploy to production"
    Write-Host "  .\scripts\deploy.ps1 staging                 # Deploy to staging"
    Write-Host "  .\scripts\deploy.ps1 production -Force       # Force production deployment"
    Write-Host "  .\scripts\deploy.ps1 development -SkipTests  # Deploy to dev without tests"
}

function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check Docker
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker is not installed or not in PATH"
        return $false
    }
    
    # Check Docker Compose
    if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
        Write-Error "Docker Compose is not installed or not in PATH"
        return $false
    }
    
    # Check Node.js
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js is not installed or not in PATH"
        return $false
    }
    
    # Check npm
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error "npm is not installed or not in PATH"
        return $false
    }
    
    Write-Success "All prerequisites are met"
    return $true
}

function Run-Tests {
    if ($SkipTests) {
        Write-Warning "Skipping tests as requested"
        return $true
    }
    
    Write-Info "Running tests..."
    
    # Backend tests
    Write-Info "Running backend tests..."
    if (-not (Test-Path "package.json")) {
        Write-Error "Backend package.json not found"
        return $false
    }
    
    $backendTestResult = & npm test
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Backend tests failed"
        return $false
    }
    
    # Frontend tests
    Write-Info "Running frontend tests..."
    if (-not (Test-Path "frontend/package.json")) {
        Write-Error "Frontend package.json not found"
        return $false
    }
    
    Set-Location frontend
    $frontendTestResult = & npm test -- --watchAll=false --coverage
    Set-Location ..
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Frontend tests failed"
        return $false
    }
    
    Write-Success "All tests passed"
    return $true
}

function Build-Application {
    Write-Info "Building application for $Environment environment..."
    
    # Copy environment file
    $envFile = "config/secrets.env.$Environment"
    if (Test-Path $envFile) {
        Copy-Item $envFile "config/secrets.env" -Force
        Write-Success "Environment file copied: $envFile"
    }
    else {
        Write-Warning "Environment file not found: $envFile"
        Write-Warning "Using default environment configuration"
    }
    
    # Build with Docker Compose
    Write-Info "Building Docker images..."
    $buildResult = & docker-compose -f docker-compose.yml -f "docker-compose.$Environment.yml" build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker build failed"
        return $false
    }
    
    Write-Success "Application built successfully"
    return $true
}

function Deploy-Application {
    if ($BuildOnly) {
        Write-Info "Build-only mode, skipping deployment"
        return $true
    }
    
    Write-Info "Deploying to $Environment environment..."
    
    # Stop existing containers
    Write-Info "Stopping existing containers..."
    & docker-compose down
    
    # Start new containers
    Write-Info "Starting new containers..."
    $deployResult = & docker-compose -f docker-compose.yml -f "docker-compose.$Environment.yml" up -d
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Deployment failed"
        return $false
    }
    
    # Wait for services to be ready
    Write-Info "Waiting for services to be ready..."
    Start-Sleep -Seconds 30
    
    # Health check
    Write-Info "Performing health check..."
    $healthCheckPassed = $true
    
    # Check backend health
    try {
        $backendResponse = Invoke-RestMethod -Uri "http://localhost:3003/health" -Method Get -TimeoutSec 10
        if ($backendResponse.status -eq "healthy") {
            Write-Success "Backend health check passed"
        }
        else {
            Write-Error "Backend health check failed"
            $healthCheckPassed = $false
        }
    }
    catch {
        Write-Error "Backend health check failed: $($_.Exception.Message)"
        $healthCheckPassed = $false
    }
    
    # Check frontend health
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3004" -Method Get -TimeoutSec 10
        if ($frontendResponse.StatusCode -eq 200) {
            Write-Success "Frontend health check passed"
        }
        else {
            Write-Error "Frontend health check failed"
            $healthCheckPassed = $false
        }
    }
    catch {
        Write-Error "Frontend health check failed: $($_.Exception.Message)"
        $healthCheckPassed = $false
    }
    
    if (-not $healthCheckPassed) {
        Write-Error "Health checks failed. Deployment may have issues."
        return $false
    }
    
    Write-Success "Application deployed successfully to $Environment"
    return $true
}

function Show-DeploymentInfo {
    Write-Host ""
    Write-Host "=== DEPLOYMENT INFORMATION ===" -ForegroundColor $Green
    Write-Host "Environment: $Environment" -ForegroundColor $Blue
    Write-Host "Backend URL: http://localhost:3003" -ForegroundColor $Blue
    Write-Host "Frontend URL: http://localhost:3004" -ForegroundColor $Blue
    Write-Host ""
    Write-Host "Useful Commands:" -ForegroundColor $Yellow
    Write-Host "  docker-compose logs -f          # View logs"
    Write-Host "  docker-compose ps               # View running containers"
    Write-Host "  docker-compose down             # Stop all containers"
    Write-Host "  .\scripts\maintenance.ps1       # Run maintenance tasks"
    Write-Host ""
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Write-Host "=== ECHO MUSIC MANAGER DEPLOYMENT ===" -ForegroundColor $Green
Write-Host "Environment: $Environment" -ForegroundColor $Blue
Write-Host "Build Only: $BuildOnly" -ForegroundColor $Blue
Write-Host "Skip Tests: $SkipTests" -ForegroundColor $Blue
Write-Host ""

# Confirmation for production
if ($Environment -eq "production" -and -not $Force) {
    $confirmation = Read-Host "Are you sure you want to deploy to PRODUCTION? (yes/no)"
    if ($confirmation -ne "yes") {
        Write-Warning "Deployment cancelled"
        exit 0
    }
}

# Check prerequisites
if (-not (Test-Prerequisites)) {
    Write-Error "Prerequisites check failed"
    exit 1
}

# Run tests
if (-not (Run-Tests)) {
    Write-Error "Tests failed"
    exit 1
}

# Build application
if (-not (Build-Application)) {
    Write-Error "Build failed"
    exit 1
}

# Deploy application
if (-not (Deploy-Application)) {
    Write-Error "Deployment failed"
    exit 1
}

Show-DeploymentInfo
Write-Success "Deployment completed successfully!"
