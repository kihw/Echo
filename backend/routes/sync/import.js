const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const dataSync = require('../../services/dataSync');
const spotifyService = require('../../services/spotify');
const deezerService = require('../../services/deezer');
const ytmusicService = require('../../services/ytmusic');
const lidarrService = require('../../services/lidarr');
const TokenManager = require('../../services/tokenManager');
const db = require('../../database/connection');
const { logger } = require('../../utils/logger');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

/**
 * POST /api/sync/full
 * Déclencher une synchronisation complète
 */
router.post('/full', async (req, res) => {
    try {
        const userId = req.user.id;
        const { services = ['spotify', 'deezer', 'youtube', 'lidarr'] } = req.body;

        // Récupérer les tokens utilisateur depuis la base de données
        const tokens = {};

        // Récupération des tokens pour chaque service demandé
        for (const service of services) {
            let serviceKey = service;
            // Mapping des noms de services
            if (service === 'youtube') serviceKey = 'google';

            try {
                const serviceTokens = await TokenManager.refreshTokenIfNeeded(userId, serviceKey);
                if (serviceTokens) {
                    tokens[serviceKey] = serviceTokens.access_token;
                } else {
                    logger.warn(`Token manquant ou expiré pour le service ${service}`, { userId, service });
                }
            } catch (error) {
                logger.error(`Erreur lors de la récupération du token ${service}:`, error);
            }
        }

        logger.info(`Synchronisation complète demandée par l'utilisateur ${userId}`, {
            services
        });

        // Démarrer la synchronisation en arrière-plan
        const syncPromise = dataSync.syncAllUserData(userId, tokens);

        res.json({
            success: true,
            message: 'Synchronisation démarrée',
            syncId: `sync_${userId}_${Date.now()}`,
            services
        });

        // Continuer la synchronisation en arrière-plan
        syncPromise.catch(error => {
            logger.error('Erreur lors de la synchronisation complète:', error);
        });

    } catch (error) {
        logger.error('Erreur lors du démarrage de la synchronisation:', error);
        res.status(500).json({
            error: 'Erreur de synchronisation',
            message: error.message
        });
    }
});

/**
 * GET /api/sync/status
 * Obtenir le statut de la synchronisation
 */
router.get('/status', async (req, res) => {
    try {
        const status = dataSync.getSyncStatus();

        res.json({
            success: true,
            status
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération du statut:', error);
        res.status(500).json({
            error: 'Erreur de statut',
            message: error.message
        });
    }
});

/**
 * POST /api/sync/spotify
 * Synchroniser uniquement Spotify
 */
router.post('/spotify', async (req, res) => {
    try {
        const userId = req.user.id;
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({
                error: 'Token manquant',
                message: 'Le token d\'accès Spotify est requis'
            });
        }

        const results = await dataSync.syncSpotifyData(userId, accessToken);

        res.json({
            success: true,
            message: 'Synchronisation Spotify terminée',
            results
        });

    } catch (error) {
        logger.error('Erreur lors de la synchronisation Spotify:', error);
        res.status(500).json({
            error: 'Erreur de synchronisation Spotify',
            message: error.message
        });
    }
});

/**
 * POST /api/sync/deezer
 * Synchroniser uniquement Deezer
 */
router.post('/deezer', async (req, res) => {
    try {
        const userId = req.user.id;
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({
                error: 'Token manquant',
                message: 'Le token d\'accès Deezer est requis'
            });
        }

        const results = await dataSync.syncDeezerData(userId, accessToken);

        res.json({
            success: true,
            message: 'Synchronisation Deezer terminée',
            results
        });

    } catch (error) {
        logger.error('Erreur lors de la synchronisation Deezer:', error);
        res.status(500).json({
            error: 'Erreur de synchronisation Deezer',
            message: error.message
        });
    }
});

/**
 * POST /api/sync/youtube
 * Synchroniser uniquement YouTube Music
 */
router.post('/youtube', async (req, res) => {
    try {
        const userId = req.user.id;
        const { accessToken } = req.body;

        if (!accessToken) {
            return res.status(400).json({
                error: 'Token manquant',
                message: 'Le token d\'accès Google est requis'
            });
        }

        const results = await dataSync.syncYTMusicData(userId, accessToken);

        res.json({
            success: true,
            message: 'Synchronisation YouTube Music terminée',
            results
        });

    } catch (error) {
        logger.error('Erreur lors de la synchronisation YouTube Music:', error);
        res.status(500).json({
            error: 'Erreur de synchronisation YouTube Music',
            message: error.message
        });
    }
});

/**
 * POST /api/sync/lidarr
 * Synchroniser uniquement Lidarr
 */
router.post('/lidarr', async (req, res) => {
    try {
        const userId = req.user.id;

        const results = await dataSync.syncLidarrData(userId);

        res.json({
            success: true,
            message: 'Synchronisation Lidarr terminée',
            results
        });

    } catch (error) {
        logger.error('Erreur lors de la synchronisation Lidarr:', error);
        res.status(500).json({
            error: 'Erreur de synchronisation Lidarr',
            message: error.message
        });
    }
});

/**
 * POST /api/sync/test-services
 * Tester la connectivité aux services externes
 */
router.post('/test-services', async (req, res) => {
    try {
        const { tokens } = req.body;
        const results = {};

        // Test Spotify
        if (tokens?.spotify) {
            try {
                const profile = await spotifyService.getUserProfile(tokens.spotify);
                results.spotify = {
                    status: 'success',
                    user: profile.displayName,
                    id: profile.id
                };
            } catch (error) {
                results.spotify = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        // Test Deezer
        if (tokens?.deezer) {
            try {
                const profile = await deezerService.getUserProfile(tokens.deezer);
                results.deezer = {
                    status: 'success',
                    user: profile.name,
                    id: profile.id
                };
            } catch (error) {
                results.deezer = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        // Test YouTube Music
        if (tokens?.google) {
            try {
                const channel = await ytmusicService.getChannelInfo(tokens.google);
                results.youtube = {
                    status: 'success',
                    user: channel.title,
                    id: channel.id
                };
            } catch (error) {
                results.youtube = {
                    status: 'error',
                    error: error.message
                };
            }
        }

        // Test Lidarr
        try {
            const connected = await lidarrService.testConnection();
            if (connected) {
                const status = await lidarrService.getSystemStatus();
                results.lidarr = {
                    status: 'success',
                    version: status.version,
                    isProduction: status.isProduction
                };
            } else {
                results.lidarr = {
                    status: 'error',
                    error: 'Connexion impossible'
                };
            }
        } catch (error) {
            results.lidarr = {
                status: 'error',
                error: error.message
            };
        }

        res.json({
            success: true,
            services: results
        });

    } catch (error) {
        logger.error('Erreur lors du test des services:', error);
        res.status(500).json({
            error: 'Erreur de test',
            message: error.message
        });
    }
});

/**
 * GET /api/sync/history
 * Obtenir l'historique des synchronisations
 */
router.get('/history', async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 10, offset = 0 } = req.query;

        // Récupérer l'historique depuis la base de données
        const history = await db.query(`
            SELECT 
                id,
                user_id,
                service_name,
                sync_type,
                status,
                items_processed,
                items_added,
                items_updated,
                items_failed,
                error_message,
                started_at,
                completed_at,
                duration_ms
            FROM sync_history 
            WHERE user_id = $1 
            ORDER BY started_at DESC 
            LIMIT $2 OFFSET $3
        `, [userId, parseInt(limit), parseInt(offset)]);

        // Compter le total pour la pagination
        const countResult = await db.query(
            'SELECT COUNT(*) as total FROM sync_history WHERE user_id = $1',
            [userId]
        );

        res.json({
            success: true,
            history: history.rows,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: parseInt(countResult.rows[0].total)
            }
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération de l\'historique:', error);
        res.status(500).json({
            error: 'Erreur d\'historique',
            message: error.message
        });
    }
});

module.exports = router;
