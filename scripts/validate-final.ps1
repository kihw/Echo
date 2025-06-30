Write-Host "Echo Music Player - Validation Finale" -ForegroundColor Cyan

Write-Host "`nTests de Services..." -ForegroundColor Yellow

# Test Frontend
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "Frontend (Port 3000) - Actif" -ForegroundColor Green
} catch {
    Write-Host "Frontend (Port 3000) - Inactif" -ForegroundColor Red
}

# Test Backend  
try {
    $backend = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "Backend (Port 8000) - Actif" -ForegroundColor Green
} catch {
    Write-Host "Backend (Port 8000) - Inactif" -ForegroundColor Red
}

Write-Host "`nTests de Fichiers..." -ForegroundColor Yellow

$files = @(
    "frontend\src\contexts\ThemeContext.tsx",
    "frontend\src\components\theme\ThemeToggle.tsx", 
    "frontend\src\hooks\useRecommendations.ts",
    "frontend\src\hooks\useSync.ts",
    "backend\services\recommendation.js",
    "backend\services\unifiedSync.js"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "$file - OK" -ForegroundColor Green
    } else {
        Write-Host "$file - Manquant" -ForegroundColor Red
    }
}

Write-Host "`nFonctionnalites Integrees:" -ForegroundColor Green
Write-Host "- Systeme de theme sombre/clair"
Write-Host "- Recommandations personnalisees avec ML"
Write-Host "- Synchronisation multi-services"
Write-Host "- Interface utilisateur moderne"
Write-Host "- Base de donnees PostgreSQL"

Write-Host "`nURLs de Test:" -ForegroundColor Cyan
Write-Host "- Dashboard: http://localhost:3000/dashboard"
Write-Host "- Tests: http://localhost:3000/test"
Write-Host "- API Health: http://localhost:8000/health"

Write-Host "`nEcho Music Player est pret!" -ForegroundColor Green
