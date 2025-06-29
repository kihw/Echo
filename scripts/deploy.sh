#!/bin/bash

# Script de déploiement pour Echo Music Player
# Usage: ./deploy.sh [environment] [version]

set -e

ENVIRONMENT=${1:-production}
VERSION=${2:-latest}
PROJECT_DIR="/opt/echo-music-player"

echo "🚀 Déploiement d'Echo Music Player"
echo "Environnement: $ENVIRONMENT"
echo "Version: $VERSION"

# Vérifications préalables
if [ ! -f "$PROJECT_DIR/.env.$ENVIRONMENT" ]; then
    echo "❌ Fichier .env.$ENVIRONMENT manquant"
    exit 1
fi

# Backup de la base de données
echo "📦 Backup de la base de données..."
mkdir -p $PROJECT_DIR/backups
docker exec echo-postgres pg_dump -U echo_user echo_production > $PROJECT_DIR/backups/backup_$(date +%Y%m%d_%H%M%S).sql

# Arrêt gracieux des services
echo "⏹️  Arrêt des services..."
cd $PROJECT_DIR
docker-compose -f docker-compose.prod.yml down --timeout 30

# Nettoyage des anciennes images
echo "🧹 Nettoyage des anciennes images..."
docker image prune -f
docker volume prune -f

# Mise à jour du code
echo "📥 Récupération du code..."
git fetch --all
git checkout main
git pull origin main

# Variables d'environnement
export $(cat .env.$ENVIRONMENT | xargs)

# Build et démarrage des nouveaux services
echo "🔨 Build et démarrage des services..."
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Attendre que les services démarrent
echo "⏳ Attente du démarrage des services..."
sleep 60

# Tests de santé
echo "🔍 Vérification de la santé des services..."

# Test frontend
if curl -f http://localhost/health > /dev/null 2>&1; then
    echo "✅ Frontend OK"
else
    echo "❌ Frontend KO"
    exit 1
fi

# Test backend
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Backend OK"
else
    echo "❌ Backend KO"
    exit 1
fi

# Test base de données
if docker exec echo-postgres pg_isready -U echo_user -d echo_production > /dev/null 2>&1; then
    echo "✅ Base de données OK"
else
    echo "❌ Base de données KO"
    exit 1
fi

# Migration de la base de données
echo "🔄 Migrations de la base de données..."
docker exec echo-backend node scripts/migrate.js

# Nettoyage post-déploiement
echo "🧽 Nettoyage..."
docker system prune -af --volumes

# Logs de déploiement
echo "📝 Logs de déploiement..."
echo "$(date): Déploiement $VERSION réussi" >> $PROJECT_DIR/logs/deployment.log

# Notification
if [ ! -z "$SLACK_WEBHOOK" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data '{"text":"🚀 Echo Music Player déployé avec succès\nEnvironnement: '$ENVIRONMENT'\nVersion: '$VERSION'\nHeure: '$(date)'"}' \
        $SLACK_WEBHOOK
fi

echo "✅ Déploiement terminé avec succès!"
echo "🌐 Application disponible sur: https://echo-music.com"
