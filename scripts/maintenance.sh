#!/bin/bash

# Script de maintenance pour Echo Music Player
# Usage: ./maintenance.sh [action]

ACTION=${1:-status}
PROJECT_DIR="/opt/echo-music-player"

case $ACTION in
    "status")
        echo "📊 Statut des services Echo Music Player"
        echo "========================================"
        
        cd $PROJECT_DIR
        docker-compose -f docker-compose.prod.yml ps
        
        echo ""
        echo "🔋 Utilisation des ressources:"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
        
        echo ""
        echo "💾 Espace disque:"
        df -h | grep -E "(Filesystem|/dev/)"
        
        echo ""
        echo "🗄️  Taille des bases de données:"
        docker exec echo-postgres psql -U echo_user -d echo_production -c "SELECT pg_size_pretty(pg_database_size('echo_production')) as size;"
        ;;
        
    "logs")
        echo "📋 Logs des services"
        echo "==================="
        
        SERVICE=${2:-all}
        
        cd $PROJECT_DIR
        if [ "$SERVICE" = "all" ]; then
            docker-compose -f docker-compose.prod.yml logs --tail=100 -f
        else
            docker-compose -f docker-compose.prod.yml logs $SERVICE --tail=100 -f
        fi
        ;;
        
    "backup")
        echo "💾 Sauvegarde des données"
        echo "========================"
        
        BACKUP_DIR="$PROJECT_DIR/backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p $BACKUP_DIR
        
        # Backup PostgreSQL
        echo "Sauvegarde PostgreSQL..."
        docker exec echo-postgres pg_dump -U echo_user echo_production > $BACKUP_DIR/postgres.sql
        
        # Backup Redis
        echo "Sauvegarde Redis..."
        docker exec echo-redis redis-cli --rdb $BACKUP_DIR/redis.rdb
        
        # Backup uploads
        echo "Sauvegarde des fichiers..."
        tar -czf $BACKUP_DIR/uploads.tar.gz -C $PROJECT_DIR uploads/
        
        # Backup configuration
        echo "Sauvegarde de la configuration..."
        cp $PROJECT_DIR/.env.production $BACKUP_DIR/
        cp $PROJECT_DIR/docker-compose.prod.yml $BACKUP_DIR/
        
        echo "✅ Sauvegarde terminée: $BACKUP_DIR"
        ;;
        
    "restore")
        BACKUP_PATH=${2}
        if [ -z "$BACKUP_PATH" ]; then
            echo "❌ Veuillez spécifier le chemin de sauvegarde"
            echo "Usage: ./maintenance.sh restore /path/to/backup"
            exit 1
        fi
        
        echo "🔄 Restauration depuis: $BACKUP_PATH"
        echo "⚠️  ATTENTION: Cette opération va écraser les données actuelles!"
        read -p "Continuer? (y/N): " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cd $PROJECT_DIR
            
            # Arrêt des services
            docker-compose -f docker-compose.prod.yml down
            
            # Restauration PostgreSQL
            if [ -f "$BACKUP_PATH/postgres.sql" ]; then
                echo "Restauration PostgreSQL..."
                docker-compose -f docker-compose.prod.yml up -d postgres
                sleep 10
                docker exec -i echo-postgres psql -U echo_user -d echo_production < $BACKUP_PATH/postgres.sql
            fi
            
            # Restauration des fichiers
            if [ -f "$BACKUP_PATH/uploads.tar.gz" ]; then
                echo "Restauration des fichiers..."
                tar -xzf $BACKUP_PATH/uploads.tar.gz -C $PROJECT_DIR
            fi
            
            # Redémarrage des services
            docker-compose -f docker-compose.prod.yml up -d
            
            echo "✅ Restauration terminée"
        else
            echo "❌ Restauration annulée"
        fi
        ;;
        
    "clean")
        echo "🧹 Nettoyage du système"
        echo "======================"
        
        cd $PROJECT_DIR
        
        # Nettoyage Docker
        echo "Nettoyage des images Docker..."
        docker image prune -af
        docker volume prune -f
        docker network prune -f
        
        # Nettoyage des logs anciens
        echo "Nettoyage des logs anciens..."
        find $PROJECT_DIR/logs -name "*.log" -mtime +30 -delete
        
        # Nettoyage des sauvegardes anciennes
        echo "Nettoyage des sauvegardes anciennes..."
        find $PROJECT_DIR/backups -name "*.sql" -mtime +7 -delete
        find $PROJECT_DIR/backups -name "*.tar.gz" -mtime +7 -delete
        
        echo "✅ Nettoyage terminé"
        ;;
        
    "update")
        echo "🔄 Mise à jour d'Echo Music Player"
        echo "=================================="
        
        cd $PROJECT_DIR
        
        # Backup avant mise à jour
        ./scripts/maintenance.sh backup
        
        # Mise à jour du code
        git fetch --all
        git pull origin main
        
        # Rebuild et redémarrage
        docker-compose -f docker-compose.prod.yml down
        docker-compose -f docker-compose.prod.yml build --no-cache
        docker-compose -f docker-compose.prod.yml up -d
        
        echo "✅ Mise à jour terminée"
        ;;
        
    "ssl")
        echo "🔒 Renouvellement SSL"
        echo "===================="
        
        # Utiliser Let's Encrypt
        certbot renew --nginx --quiet
        
        # Redémarrage Nginx
        docker-compose -f docker-compose.prod.yml restart nginx
        
        echo "✅ Certificats SSL renouvelés"
        ;;
        
    "health")
        echo "🏥 Vérification de santé"
        echo "========================"
        
        ERRORS=0
        
        # Test frontend
        if curl -f http://localhost/health > /dev/null 2>&1; then
            echo "✅ Frontend: OK"
        else
            echo "❌ Frontend: KO"
            ERRORS=$((ERRORS+1))
        fi
        
        # Test backend
        if curl -f http://localhost/api/health > /dev/null 2>&1; then
            echo "✅ Backend: OK"
        else
            echo "❌ Backend: KO"
            ERRORS=$((ERRORS+1))
        fi
        
        # Test PostgreSQL
        if docker exec echo-postgres pg_isready -U echo_user -d echo_production > /dev/null 2>&1; then
            echo "✅ PostgreSQL: OK"
        else
            echo "❌ PostgreSQL: KO"
            ERRORS=$((ERRORS+1))
        fi
        
        # Test Redis
        if docker exec echo-redis redis-cli ping > /dev/null 2>&1; then
            echo "✅ Redis: OK"
        else
            echo "❌ Redis: KO"
            ERRORS=$((ERRORS+1))
        fi
        
        if [ $ERRORS -eq 0 ]; then
            echo "🎉 Tous les services sont en bonne santé!"
            exit 0
        else
            echo "⚠️  $ERRORS erreur(s) détectée(s)"
            exit 1
        fi
        ;;
        
    *)
        echo "Usage: ./maintenance.sh [action]"
        echo ""
        echo "Actions disponibles:"
        echo "  status    - Afficher le statut des services"
        echo "  logs      - Afficher les logs (usage: logs [service])"
        echo "  backup    - Créer une sauvegarde complète"
        echo "  restore   - Restaurer depuis une sauvegarde"
        echo "  clean     - Nettoyer le système"
        echo "  update    - Mettre à jour l'application"
        echo "  ssl       - Renouveler les certificats SSL"
        echo "  health    - Vérifier la santé des services"
        ;;
esac
