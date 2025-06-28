const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const db = require('../../../database/connection');
const { logger } = require('../../utils/logger');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

/**
 * GET /api/user/history
 * Obtenir l'historique d'écoute de l'utilisateur
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            page = 1,
            limit = 50,
            startDate,
            endDate,
            artistId,
            trackId,
            includeSkipped = true
        } = req.query;

        const offset = (page - 1) * limit;

        // Construire la requête avec filtres
        let whereConditions = ['user_id = $1'];
        let queryParams = [userId];
        let paramIndex = 2;

        if (startDate) {
            whereConditions.push(`played_at >= $${paramIndex}`);
            queryParams.push(new Date(startDate));
            paramIndex++;
        }

        if (endDate) {
            whereConditions.push(`played_at <= $${paramIndex}`);
            queryParams.push(new Date(endDate));
            paramIndex++;
        }

        if (artistId) {
            whereConditions.push(`artist_id = $${paramIndex}`);
            queryParams.push(artistId);
            paramIndex++;
        }

        if (trackId) {
            whereConditions.push(`track_id = $${paramIndex}`);
            queryParams.push(trackId);
            paramIndex++;
        }

        if (!includeSkipped) {
            whereConditions.push('completion_percentage >= 0.5');
        }

        const whereClause = whereConditions.join(' AND ');

        // Requête pour récupérer l'historique
        const historyQuery = `
            SELECT 
                h.id,
                h.track_id,
                h.artist_id,
                h.played_at,
                h.duration_played,
                h.completion_percentage,
                h.source,
                h.device_type,
                h.context_type,
                h.context_id,
                t.title as track_title,
                t.duration as track_duration,
                t.external_ids,
                a.name as artist_name,
                a.external_ids as artist_external_ids
            FROM history h
            LEFT JOIN tracks t ON h.track_id = t.id
            LEFT JOIN artists a ON h.artist_id = a.id
            WHERE ${whereClause}
            ORDER BY h.played_at DESC
            LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
        `;

        queryParams.push(parseInt(limit), offset);

        // Requête pour compter le total
        const countQuery = `
            SELECT COUNT(*) as total
            FROM history h
            WHERE ${whereClause}
        `;

        const [historyResult, countResult] = await Promise.all([
            db.query(historyQuery, queryParams),
            db.query(countQuery, queryParams.slice(0, -2)) // Exclure limit et offset pour le count
        ]);

        const history = historyResult.rows;
        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            history,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération de l\'historique:', error);
        res.status(500).json({
            error: 'Erreur de récupération',
            message: error.message
        });
    }
});

/**
 * POST /api/user/history
 * Ajouter une entrée à l'historique d'écoute
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            trackId,
            artistId,
            durationPlayed,
            completionPercentage,
            source = 'web',
            deviceType = 'web',
            contextType,
            contextId
        } = req.body;

        if (!trackId || !artistId || durationPlayed === undefined) {
            return res.status(400).json({
                error: 'Données manquantes',
                message: 'trackId, artistId et durationPlayed sont requis'
            });
        }

        const insertQuery = `
            INSERT INTO history (
                user_id, track_id, artist_id, played_at, 
                duration_played, completion_percentage, source, 
                device_type, context_type, context_id
            ) VALUES ($1, $2, $3, NOW(), $4, $5, $6, $7, $8, $9)
            RETURNING id, played_at
        `;

        const result = await db.query(insertQuery, [
            userId, trackId, artistId, durationPlayed,
            completionPercentage, source, deviceType, contextType, contextId
        ]);

        res.json({
            success: true,
            message: 'Entrée ajoutée à l\'historique',
            historyId: result.rows[0].id,
            playedAt: result.rows[0].played_at
        });

    } catch (error) {
        logger.error('Erreur lors de l\'ajout à l\'historique:', error);
        res.status(500).json({
            error: 'Erreur d\'ajout',
            message: error.message
        });
    }
});

/**
 * GET /api/user/history/stats
 * Obtenir les statistiques d'écoute de l'utilisateur
 */
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id;
        const { period = '30d' } = req.query;

        // Calculer la date de début selon la période
        let startDate = new Date();
        switch (period) {
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(startDate.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(startDate.getDate() - 30);
        }

        // Requêtes pour les statistiques
        const queries = {
            totalTracks: `
                SELECT COUNT(*) as total
                FROM history 
                WHERE user_id = $1 AND played_at >= $2
            `,
            totalPlayTime: `
                SELECT SUM(duration_played) as total_ms
                FROM history 
                WHERE user_id = $1 AND played_at >= $2
            `,
            topArtists: `
                SELECT 
                    a.name,
                    a.external_ids,
                    COUNT(*) as play_count,
                    SUM(h.duration_played) as total_play_time
                FROM history h
                JOIN artists a ON h.artist_id = a.id
                WHERE h.user_id = $1 AND h.played_at >= $2
                GROUP BY a.id, a.name, a.external_ids
                ORDER BY play_count DESC
                LIMIT 10
            `,
            topTracks: `
                SELECT 
                    t.title,
                    t.external_ids,
                    a.name as artist_name,
                    COUNT(*) as play_count,
                    AVG(h.completion_percentage) as avg_completion
                FROM history h
                JOIN tracks t ON h.track_id = t.id
                JOIN artists a ON h.artist_id = a.id
                WHERE h.user_id = $1 AND h.played_at >= $2
                GROUP BY t.id, t.title, t.external_ids, a.name
                ORDER BY play_count DESC
                LIMIT 10
            `,
            listeningPatterns: `
                SELECT 
                    EXTRACT(hour FROM played_at) as hour,
                    COUNT(*) as track_count
                FROM history
                WHERE user_id = $1 AND played_at >= $2
                GROUP BY EXTRACT(hour FROM played_at)
                ORDER BY hour
            `,
            skipRate: `
                SELECT 
                    COUNT(CASE WHEN completion_percentage < 0.5 THEN 1 END)::float / COUNT(*)::float as skip_rate
                FROM history
                WHERE user_id = $1 AND played_at >= $2
            `
        };

        const results = await Promise.all([
            db.query(queries.totalTracks, [userId, startDate]),
            db.query(queries.totalPlayTime, [userId, startDate]),
            db.query(queries.topArtists, [userId, startDate]),
            db.query(queries.topTracks, [userId, startDate]),
            db.query(queries.listeningPatterns, [userId, startDate]),
            db.query(queries.skipRate, [userId, startDate])
        ]);

        const stats = {
            period,
            totalTracks: parseInt(results[0].rows[0].total),
            totalPlayTime: parseInt(results[1].rows[0].total_ms) || 0,
            topArtists: results[2].rows,
            topTracks: results[3].rows,
            listeningPatterns: results[4].rows,
            skipRate: parseFloat(results[5].rows[0].skip_rate) || 0
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            error: 'Erreur de statistiques',
            message: error.message
        });
    }
});

/**
 * GET /api/user/history/recent
 * Obtenir les dernières écoutes de l'utilisateur
 */
router.get('/recent', async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20 } = req.query;

        const query = `
            SELECT 
                h.id,
                h.track_id,
                h.played_at,
                h.completion_percentage,
                h.source,
                t.title as track_title,
                t.duration as track_duration,
                t.external_ids as track_external_ids,
                a.name as artist_name,
                a.external_ids as artist_external_ids
            FROM history h
            LEFT JOIN tracks t ON h.track_id = t.id
            LEFT JOIN artists a ON h.artist_id = a.id
            WHERE h.user_id = $1
            ORDER BY h.played_at DESC
            LIMIT $2
        `;

        const result = await db.query(query, [userId, parseInt(limit)]);

        res.json({
            success: true,
            recentTracks: result.rows
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération des écoutes récentes:', error);
        res.status(500).json({
            error: 'Erreur de récupération',
            message: error.message
        });
    }
});

/**
 * DELETE /api/user/history/:historyId
 * Supprimer une entrée de l'historique
 */
router.delete('/:historyId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { historyId } = req.params;

        const deleteQuery = `
            DELETE FROM history 
            WHERE id = $1 AND user_id = $2
            RETURNING id
        `;

        const result = await db.query(deleteQuery, [historyId, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Entrée non trouvée',
                message: 'L\'entrée d\'historique n\'existe pas ou ne vous appartient pas'
            });
        }

        res.json({
            success: true,
            message: 'Entrée supprimée de l\'historique'
        });

    } catch (error) {
        logger.error('Erreur lors de la suppression de l\'historique:', error);
        res.status(500).json({
            error: 'Erreur de suppression',
            message: error.message
        });
    }
});

/**
 * DELETE /api/user/history
 * Vider l'historique d'écoute de l'utilisateur
 */
router.delete('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { confirm } = req.body;

        if (!confirm) {
            return res.status(400).json({
                error: 'Confirmation manquante',
                message: 'La confirmation est requise pour vider l\'historique'
            });
        }

        const deleteQuery = `
            DELETE FROM history 
            WHERE user_id = $1
        `;

        const result = await db.query(deleteQuery, [userId]);

        res.json({
            success: true,
            message: `${result.rowCount} entrées supprimées de l'historique`
        });

    } catch (error) {
        logger.error('Erreur lors du vidage de l\'historique:', error);
        res.status(500).json({
            error: 'Erreur de suppression',
            message: error.message
        });
    }
});

module.exports = router;
