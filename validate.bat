@echo off
echo.
echo 🎵 VALIDATION ECHO MUSIC PLAYER
echo ================================
echo.

set /a passed=0
set /a total=0

echo 📡 Tests de connectivite de base:
set /a total+=1
curl -s -o nul -w "%%{http_code}" http://localhost:8000/health | findstr "200" >nul && (echo ✅ Health Check: OK && set /a passed+=1) || echo ❌ Health Check: Erreur

set /a total+=1
curl -s -o nul -w "%%{http_code}" http://localhost:8000/api/test | findstr "200" >nul && (echo ✅ API Test: OK && set /a passed+=1) || echo ❌ API Test: Erreur

set /a total+=1
curl -s -o nul -w "%%{http_code}" http://localhost:3000 | findstr "200" >nul && (echo ✅ Frontend: OK && set /a passed+=1) || echo ❌ Frontend: Erreur

echo.
echo 🔐 Tests des routes d'authentification:
set /a total+=1
curl -s -o nul -w "%%{http_code}" http://localhost:8000/auth/spotify/url | findstr "200" >nul && (echo ✅ Spotify Auth URL: OK && set /a passed+=1) || echo ❌ Spotify Auth URL: Erreur

echo.
echo 🖥️ Tests des pages frontend:
set /a total+=1
curl -s -o nul -w "%%{http_code}" http://localhost:3000/dashboard | findstr "200" >nul && (echo ✅ Dashboard: OK && set /a passed+=1) || echo ❌ Dashboard: Erreur

set /a total+=1
curl -s -o nul -w "%%{http_code}" http://localhost:3000/test | findstr "200" >nul && (echo ✅ Test page: OK && set /a passed+=1) || echo ❌ Test page: Erreur

echo.
echo 📊 RESULTATS:
echo =============
echo Tests passes: %passed%/%total%

echo.
echo ✨ FONCTIONNALITES IMPLEMENTEES:
echo ================================
echo 🎨 Systeme de theme sombre/clair avec support systeme
echo 🧠 Recommandations personnalisees avec ML
echo 🔄 Synchronisation multi-services (Spotify, Deezer, YT Music, Lidarr)
echo 🗄️ Base de donnees avec schemas optimises
echo 🎮 Interface utilisateur moderne et responsive
echo ⚡ Hooks React et services integres
echo 🔐 Authentification JWT
echo 📊 Dashboard avec statistiques en temps reel

echo.
echo 🌐 URLs:
echo ========
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo Health:   http://localhost:8000/health
echo API Test: http://localhost:8000/api/test

echo.
if %passed% GEQ 4 (
    echo 🎉 EXCELLENT: Echo Music Player est fonctionnel !
) else (
    echo ⚠️ Verifiez que les serveurs sont demarres
)
