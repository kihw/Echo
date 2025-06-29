# Echo Music Manager - Maintenance Script
# Usage: .\scripts\maintenance.ps1 [action] [options]

param(
    [string]$Action = "status",
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
    Write-Host "Echo Music Manager - Maintenance Script" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Usage: .\scripts\maintenance.ps1 [action] [options]" -ForegroundColor $Blue
    Write-Host ""
    Write-Host "Actions:" -ForegroundColor $Yellow
    Write-Host "  status        - Show application status (default)"
    Write-Host "  logs          - Show application logs"
    Write-Host "  backup        - Create database backup"
    Write-Host "  restore       - Restore database from backup"
    Write-Host "  cleanup       - Clean up old containers and images"
    Write-Host "  update        - Update application dependencies"
    Write-Host "  health        - Perform health check"
    Write-Host "  restart       - Restart all services"
    Write-Host "  monitor       - Show real-time monitoring"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor $Yellow
    Write-Host "  -Force        - Force action without confirmation"
    Write-Host "  -Help         - Show this help message"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Green
    Write-Host "  .\scripts\maintenance.ps1                    # Show status"
    Write-Host "  .\scripts\maintenance.ps1 logs               # Show logs"
    Write-Host "  .\scripts\maintenance.ps1 backup             # Create backup"
    Write-Host "  .\scripts\maintenance.ps1 cleanup -Force     # Force cleanup"
}

function Get-ApplicationStatus {
    Write-Info "Checking application status..."
    
    # Check Docker containers
    Write-Host ""
    Write-Host "=== CONTAINER STATUS ===" -ForegroundColor $Green
    & docker-compose ps
    
    # Check system resources
    Write-Host ""
    Write-Host "=== SYSTEM RESOURCES ===" -ForegroundColor $Green
    
    # Memory usage
    $memory = Get-WmiObject -Class Win32_OperatingSystem
    $totalMemory = [math]::Round($memory.TotalVisibleMemorySize / 1MB, 2)
    $freeMemory = [math]::Round($memory.FreePhysicalMemory / 1MB, 2)
    $usedMemory = $totalMemory - $freeMemory
    $memoryPercent = [math]::Round(($usedMemory / $totalMemory) * 100, 2)
    
    Write-Host "Memory Usage: $usedMemory GB / $totalMemory GB ($memoryPercent%)" -ForegroundColor $Blue
    
    # Disk usage
    $disk = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DeviceID -eq "C:" }
    $totalDisk = [math]::Round($disk.Size / 1GB, 2)
    $freeDisk = [math]::Round($disk.FreeSpace / 1GB, 2)
    $usedDisk = $totalDisk - $freeDisk
    $diskPercent = [math]::Round(($usedDisk / $totalDisk) * 100, 2)
    
    Write-Host "Disk Usage: $usedDisk GB / $totalDisk GB ($diskPercent%)" -ForegroundColor $Blue
    
    # Docker system info
    Write-Host ""
    Write-Host "=== DOCKER SYSTEM INFO ===" -ForegroundColor $Green
    & docker system df
}

function Show-ApplicationLogs {
    Write-Info "Showing application logs..."
    
    Write-Host "Recent logs (last 100 lines):" -ForegroundColor $Yellow
    & docker-compose logs --tail=100 -f
}

function Invoke-DatabaseBackup {
    Write-Info "Creating database backup..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "backups/echo_backup_$timestamp.sql"
    
    # Create backups directory if it doesn't exist
    if (-not (Test-Path "backups")) {
        New-Item -ItemType Directory -Path "backups" | Out-Null
        Write-Info "Created backups directory"
    }
    
    # Create database backup
    Write-Info "Backing up database to $backupFile..."
    $backupCommand = "docker-compose exec -T postgres pg_dump -U echo_user -d echo_db > $backupFile"
    
    try {
        Invoke-Expression $backupCommand
        if (Test-Path $backupFile) {
            $fileSize = (Get-Item $backupFile).Length / 1MB
            Write-Success "Database backup created: $backupFile ($('{0:N2}' -f $fileSize) MB)"
            
            # Keep only last 7 backups
            $oldBackups = Get-ChildItem "backups/echo_backup_*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 7
            if ($oldBackups) {
                Write-Info "Cleaning up old backups..."
                $oldBackups | Remove-Item -Force
                Write-Success "Removed $($oldBackups.Count) old backup(s)"
            }
        }
        else {
            Write-Error "Backup file was not created"
            return $false
        }
    }
    catch {
        Write-Error "Backup failed: $($_.Exception.Message)"
        return $false
    }
    
    return $true
}

function Invoke-DatabaseRestore {
    if (-not $Force) {
        $confirmation = Read-Host "This will restore the database and OVERWRITE existing data. Are you sure? (yes/no)"
        if ($confirmation -ne "yes") {
            Write-Warning "Database restore cancelled"
            return $true
        }
    }
    
    # List available backups
    $backups = Get-ChildItem "backups/echo_backup_*.sql" | Sort-Object LastWriteTime -Descending
    
    if (-not $backups) {
        Write-Error "No backup files found in backups/ directory"
        return $false
    }
    
    Write-Host "Available backups:" -ForegroundColor $Yellow
    for ($i = 0; $i -lt $backups.Count; $i++) {
        $backup = $backups[$i]
        $size = (Get-Item $backup.FullName).Length / 1MB
        Write-Host "  [$i] $($backup.Name) ($('{0:N2}' -f $size) MB) - $($backup.LastWriteTime)"
    }
    
    $selection = Read-Host "Select backup to restore (0-$($backups.Count - 1))"
    
    try {
        $selectedIndex = [int]$selection
        if ($selectedIndex -lt 0 -or $selectedIndex -ge $backups.Count) {
            Write-Error "Invalid selection"
            return $false
        }
        
        $selectedBackup = $backups[$selectedIndex]
        Write-Info "Restoring from $($selectedBackup.Name)..."
        
        # Restore database
        $restoreCommand = "docker-compose exec -T postgres psql -U echo_user -d echo_db < `"$($selectedBackup.FullName)`""
        Invoke-Expression $restoreCommand
        
        Write-Success "Database restored successfully from $($selectedBackup.Name)"
        return $true
    }
    catch {
        Write-Error "Database restore failed: $($_.Exception.Message)"
        return $false
    }
}

function Invoke-SystemCleanup {
    Write-Info "Performing system cleanup..."
    
    if (-not $Force) {
        $confirmation = Read-Host "This will remove unused Docker containers, networks, and images. Continue? (yes/no)"
        if ($confirmation -ne "yes") {
            Write-Warning "Cleanup cancelled"
            return $true
        }
    }
    
    # Stop containers
    Write-Info "Stopping containers..."
    & docker-compose down
    
    # Remove unused containers
    Write-Info "Removing unused containers..."
    & docker container prune -f
    
    # Remove unused networks
    Write-Info "Removing unused networks..."
    & docker network prune -f
    
    # Remove unused images
    Write-Info "Removing unused images..."
    & docker image prune -f
    
    # Remove build cache
    Write-Info "Removing build cache..."
    & docker builder prune -f
    
    Write-Success "System cleanup completed"
    return $true
}

function Invoke-ApplicationUpdate {
    Write-Info "Updating application dependencies..."
    
    # Update backend dependencies
    Write-Info "Updating backend dependencies..."
    & npm update
    
    # Update frontend dependencies
    Write-Info "Updating frontend dependencies..."
    Set-Location frontend
    & npm update
    Set-Location ..
    
    # Rebuild containers
    Write-Info "Rebuilding containers..."
    & docker-compose build --no-cache
    
    Write-Success "Application update completed"
    return $true
}

function Test-ApplicationHealth {
    Write-Info "Performing health check..."
    
    $healthStatus = @{
        Backend  = $false
        Frontend = $false
        Database = $false
        Redis    = $false
    }
    
    # Check backend
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3003/health" -Method Get -TimeoutSec 10
        if ($response.status -eq "healthy") {
            $healthStatus.Backend = $true
            Write-Success "Backend: Healthy"
        }
        else {
            Write-Error "Backend: Unhealthy - $($response.message)"
        }
    }
    catch {
        Write-Error "Backend: Unreachable - $($_.Exception.Message)"
    }
    
    # Check frontend
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3004" -Method Get -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            $healthStatus.Frontend = $true
            Write-Success "Frontend: Healthy"
        }
        else {
            Write-Error "Frontend: Unhealthy - Status Code $($response.StatusCode)"
        }
    }
    catch {
        Write-Error "Frontend: Unreachable - $($_.Exception.Message)"
    }
    
    # Check database
    try {
        $dbCheck = & docker-compose exec -T postgres pg_isready -U echo_user -d echo_db
        if ($LASTEXITCODE -eq 0) {
            $healthStatus.Database = $true
            Write-Success "Database: Healthy"
        }
        else {
            Write-Error "Database: Unhealthy"
        }
    }
    catch {
        Write-Error "Database: Unreachable - $($_.Exception.Message)"
    }
    
    # Check Redis
    try {
        $redisCheck = & docker-compose exec -T redis redis-cli ping
        if ($redisCheck -eq "PONG") {
            $healthStatus.Redis = $true
            Write-Success "Redis: Healthy"
        }
        else {
            Write-Error "Redis: Unhealthy"
        }
    }
    catch {
        Write-Error "Redis: Unreachable - $($_.Exception.Message)"
    }
    
    # Overall health
    $healthyServices = ($healthStatus.Values | Where-Object { $_ -eq $true }).Count
    $totalServices = $healthStatus.Count
    
    Write-Host ""
    Write-Host "=== HEALTH SUMMARY ===" -ForegroundColor $Green
    Write-Host "Healthy Services: $healthyServices / $totalServices" -ForegroundColor $Blue
    
    if ($healthyServices -eq $totalServices) {
        Write-Success "All services are healthy!"
        return $true
    }
    else {
        Write-Warning "Some services are unhealthy. Check logs for details."
        return $false
    }
}

function Restart-ApplicationServices {
    Write-Info "Restarting all services..."
    
    if (-not $Force) {
        $confirmation = Read-Host "This will restart all services. Continue? (yes/no)"
        if ($confirmation -ne "yes") {
            Write-Warning "Restart cancelled"
            return $true
        }
    }
    
    # Stop services
    Write-Info "Stopping services..."
    & docker-compose down
    
    # Start services
    Write-Info "Starting services..."
    & docker-compose up -d
    
    # Wait for services to be ready
    Write-Info "Waiting for services to be ready..."
    Start-Sleep -Seconds 30
    
    # Perform health check
    if (Test-ApplicationHealth) {
        Write-Success "All services restarted successfully"
        return $true
    }
    else {
        Write-Warning "Services restarted but some health checks failed"
        return $false
    }
}

function Show-MonitoringInfo {
    Write-Info "Real-time monitoring (Press Ctrl+C to stop)..."
    
    Write-Host ""
    Write-Host "=== REAL-TIME MONITORING ===" -ForegroundColor $Green
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor $Yellow
    Write-Host ""
    
    # Show real-time logs
    & docker-compose logs -f --tail=50
}

# Main execution
if ($Help) {
    Show-Help
    exit 0
}

Write-Host "=== ECHO MUSIC MANAGER MAINTENANCE ===" -ForegroundColor $Green
Write-Host "Action: $Action" -ForegroundColor $Blue
Write-Host ""

switch ($Action.ToLower()) {
    "status" { Get-ApplicationStatus }
    "logs" { Show-ApplicationLogs }
    "backup" { 
        if (-not (Invoke-DatabaseBackup)) { exit 1 }
    }
    "restore" { 
        if (-not (Invoke-DatabaseRestore)) { exit 1 }
    }
    "cleanup" { 
        if (-not (Invoke-SystemCleanup)) { exit 1 }
    }
    "update" { 
        if (-not (Invoke-ApplicationUpdate)) { exit 1 }
    }
    "health" { 
        if (-not (Test-ApplicationHealth)) { exit 1 }
    }
    "restart" { 
        if (-not (Restart-ApplicationServices)) { exit 1 }
    }
    "monitor" { Show-MonitoringInfo }
    default {
        Write-Error "Unknown action: $Action"
        Write-Info "Use -Help to see available actions"
        exit 1
    }
}

Write-Success "Maintenance task completed!"
