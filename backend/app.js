const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Configuration de l'environnement
require('dotenv').config({ path: './config/secrets.env' });

// Import de la base de données
const db = require('../database/connection');

// Import des middlewares
const { authMiddleware } = require('./middleware/auth');

// Import des routes
const loginAuthRoute = require('./routes/auth/login');
const spotifyAuthRoute = require('./routes/auth/spotify');
const deezerAuthRoute = require('./routes/auth/deezer');
const googleAuthRoute = require('./routes/auth/google');
const userProfileRoute = require('./routes/user/profile');
const userHistoryRoute = require('./routes/user/history');
const musicPlayerRoute = require('./routes/music/player');
const playlistGenerateRoute = require('./routes/playlist/generate');
const playlistManageRoute = require('./routes/playlist/manage');
const syncRoute = require('./routes/sync/import');
const dashboardRoute = require('./routes/dashboard/stats');
// Import des nouvelles routes
const recommendationsRoute = require('./routes/recommendations');
const unifiedSyncRoute = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 8000;

// Configuration des logs
const logDirectory = path.join(__dirname, 'logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// Middleware de sécurité
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            mediaSrc: ["'self'", "blob:", "https:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "https://api.spotify.com", "https://api.deezer.com"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },
    crossOriginEmbedderPolicy: false
}));

// Compression des réponses
app.use(compression());

// Configuration CORS
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        error: 'Trop de requêtes, veuillez réessayer plus tard',
        code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            error: 'Trop de requêtes',
            message: 'Limite de taux dépassée, veuillez réessayer plus tard',
            retryAfter: Math.round(limiter.windowMs / 1000)
        });
    }
});

app.use('/api/', limiter);

// Logging des requêtes
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('combined', {
        stream: fs.createWriteStream(path.join(logDirectory, 'access.log'), { flags: 'a' })
    }));
}

// Parsing du body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware pour les informations de requête
app.use((req, res, next) => {
    req.requestId = require('uuid').v4();
    req.startTime = Date.now();

    // Log de la requête entrante
    if (process.env.LOG_LEVEL === 'debug') {
        console.log(`🔍 [${req.requestId}] ${req.method} ${req.originalUrl}`);
    }

    // Middleware pour logger le temps de réponse
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        if (process.env.LOG_LEVEL === 'debug') {
            console.log(`⏱️  [${req.requestId}] Réponse envoyée en ${duration}ms - Status: ${res.statusCode}`);
        }
    });

    next();
});

// Route de santé
app.get('/health', async (req, res) => {
    try {
        // Test de la base de données
        const dbHealthy = await db.testConnection();

        const health = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            service: 'Echo Music Player API',
            version: require('../package.json').version,
            environment: process.env.NODE_ENV,
            database: dbHealthy ? 'connected' : 'disconnected',
            uptime: process.uptime(),
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
            },
            pool: db.getStats()
        };

        const statusCode = dbHealthy ? 200 : 503;
        res.status(statusCode).json(health);
    } catch (error) {
        res.status(503).json({
            status: 'ERROR',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

// Route d'information de l'API
app.get('/api', (req, res) => {
    res.json({
        name: 'Echo Music Player API',
        version: require('../package.json').version,
        description: 'API pour lecteur de musique intelligent avec recommandations personnalisées',
        endpoints: {
            health: '/health',
            auth: '/api/auth/*',
            users: '/api/users/*',
            tracks: '/api/tracks/*',
            playlists: '/api/playlists/*',
            history: '/api/history/*',
            search: '/api/search/*'
        },
        documentation: '/api/docs'
    });
});

// Routes API temporaires (en attendant les vrais contrôleurs)
app.get('/api/test', (req, res) => {
    res.json({
        message: 'Echo API fonctionne !',
        timestamp: new Date().toISOString(),
        requestId: req.requestId
    });
});

// Route de test base de données
app.get('/api/test/db', async (req, res) => {
    try {
        const result = await db.query('SELECT COUNT(*) as user_count FROM users');
        res.json({
            message: 'Connexion base de données OK',
            userCount: parseInt(result.rows[0].user_count),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'Erreur de base de données',
            message: error.message
        });
    }
});

// Servir les fichiers statiques en développement
if (process.env.NODE_ENV === 'development') {
    app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
}

// Routes d'authentification OAuth
app.use('/api/auth', loginAuthRoute);
app.use('/api/auth/spotify', spotifyAuthRoute);
app.use('/api/auth/deezer', deezerAuthRoute);
app.use('/api/auth/google', googleAuthRoute);

// Routes API utilisateur
app.use('/api/user', authMiddleware, userProfileRoute);
app.use('/api/user', authMiddleware, userHistoryRoute);

// Routes API musique
app.use('/api/music', authMiddleware, musicPlayerRoute);

// Routes API playlists
app.use('/api/playlists/generate', authMiddleware, playlistGenerateRoute);
app.use('/api/playlists', authMiddleware, playlistManageRoute);

// Routes API synchronisation
app.use('/api/sync', authMiddleware, unifiedSyncRoute);

// Routes API recommandations
app.use('/api/recommendations', authMiddleware, recommendationsRoute);
app.use('/api/sync', authMiddleware, unifiedSyncRoute);

// Routes API tableau de bord
app.use('/api/dashboard', authMiddleware, dashboardRoute);

// Routes API recommandations
app.use('/api/recommendations', authMiddleware, recommendationsRoute);

// Middleware de gestion d'erreur 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route non trouvée',
        message: `La route ${req.method} ${req.originalUrl} n'existe pas`,
        availableRoutes: ['/health', '/api', '/api/test', '/api/test/db']
    });
});

// Middleware de gestion d'erreur globale
app.use((error, req, res, next) => {
    console.error('❌ Erreur non gérée:', error);

    // Erreur de validation
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Erreur de validation',
            message: error.message,
            details: error.details
        });
    }

    // Erreur de base de données
    if (error.code && error.code.startsWith('23')) {
        return res.status(400).json({
            error: 'Erreur de base de données',
            message: 'Violation de contrainte de données'
        });
    }

    // Erreur JWT
    if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Token invalide',
            message: 'Token d\'authentification invalide'
        });
    }

    // Erreur générique
    const statusCode = error.statusCode || error.status || 500;
    const message = process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne du serveur';

    res.status(statusCode).json({
        error: 'Erreur serveur',
        message,
        requestId: req.requestId,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// Fonction de démarrage du serveur
async function startServer() {
    try {
        // Test de la connexion à la base de données (temporairement désactivé)
        console.log('🔍 Test de la connexion à la base de données...');
        // const dbConnected = await db.testConnection();
        const dbConnected = true; // Temporaire pour le développement

        if (!dbConnected) {
            console.error('❌ Impossible de se connecter à la base de données');
            // process.exit(1); // Commenté temporairement
        }

        // Démarrage du serveur
        const server = app.listen(PORT, () => {
            console.log(`🎵 Echo Music Player API démarrée sur le port ${PORT}`);
            console.log(`🌍 URL: http://localhost:${PORT}`);
            console.log(`📊 Environnement: ${process.env.NODE_ENV}`);
            console.log(`🏥 Health check: http://localhost:${PORT}/health`);
            console.log(`🔧 Test API: http://localhost:${PORT}/api/test`);
        });

        // Gestion de l'arrêt propre
        const gracefulShutdown = (signal) => {
            console.log(`\n🛑 Signal ${signal} reçu, arrêt en cours...`);

            server.close(async () => {
                console.log('🔒 Serveur HTTP fermé');

                try {
                    await db.close();
                    console.log('🔒 Connexions base de données fermées');
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Erreur lors de la fermeture:', error);
                    process.exit(1);
                }
            });

            // Force l'arrêt après 10 secondes
            setTimeout(() => {
                console.error('⏰ Arrêt forcé après timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

        return server;

    } catch (error) {
        console.error('❌ Erreur lors du démarrage du serveur:', error);
        process.exit(1);
    }
}

// Démarrage du serveur si ce fichier est exécuté directement
if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };
