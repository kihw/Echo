#!/bin/bash

# Script pour lancer tous les tests d'Echo Music Player
# Usage: ./run-tests.sh [type]

TEST_TYPE=${1:-all}

echo "🧪 Tests d'Echo Music Player"
echo "============================"

case $TEST_TYPE in
    "unit")
        echo "📋 Tests unitaires frontend..."
        cd frontend
        npm run test:coverage
        ;;
        
    "integration")
        echo "🔗 Tests d'intégration backend..."
        cd backend
        npm run test:integration
        ;;
        
    "e2e")
        echo "🎭 Tests E2E..."
        
        # Démarrer les services de test
        echo "🚀 Démarrage des services de test..."
        docker-compose -f docker-compose.test.yml up -d
        sleep 30
        
        # Lancer les tests E2E
        cd e2e
        npm install
        npx playwright install
        npm run test
        
        # Arrêter les services
        cd ..
        docker-compose -f docker-compose.test.yml down
        ;;
        
    "all")
        echo "🎯 Tous les tests..."
        
        # Tests backend
        echo "🔧 Tests backend..."
        cd backend
        npm run test
        npm run test:integration
        cd ..
        
        # Tests frontend
        echo "⚛️  Tests frontend..."
        cd frontend
        npm run test:coverage
        npm run type-check
        npm run lint
        cd ..
        
        # Tests E2E
        echo "🎭 Tests E2E..."
        docker-compose -f docker-compose.test.yml up -d
        sleep 30
        
        cd e2e
        npm install > /dev/null 2>&1
        npx playwright install > /dev/null 2>&1
        npm run test
        cd ..
        
        docker-compose -f docker-compose.test.yml down
        
        echo ""
        echo "✅ Tous les tests terminés!"
        ;;
        
    *)
        echo "Usage: ./run-tests.sh [type]"
        echo ""
        echo "Types de tests disponibles:"
        echo "  unit        - Tests unitaires frontend uniquement"
        echo "  integration - Tests d'intégration backend uniquement"
        echo "  e2e         - Tests end-to-end uniquement"
        echo "  all         - Tous les tests (par défaut)"
        ;;
esac
