const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const db = require('../../../database/connection');
const { logger } = require('../../utils/logger');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

/**
 * GET /api/dashboard
 * Récupérer toutes les données du dashboard en une seule requête
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;

        // Récupérer les statistiques générales
        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM playlists WHERE user_id = $1) as total_playlists,
                (SELECT COUNT(*) FROM tracks t 
                 JOIN playlist_tracks pt ON t.id = pt.track_id 
                 JOIN playlists p ON pt.playlist_id = p.id 
                 WHERE p.user_id = $1) as total_tracks,
                (SELECT COUNT(DISTINCT artist) FROM tracks t 
                 JOIN playlist_tracks pt ON t.id = pt.track_id 
                 JOIN playlists p ON pt.playlist_id = p.id 
                 WHERE p.user_id = $1) as total_artists,
                (SELECT COALESCE(SUM(duration_ms), 0) FROM listening_history WHERE user_id = $1) as total_listening_time,
                (SELECT COUNT(*) FROM (
                    SELECT CASE 
                        WHEN spotify_id IS NOT NULL THEN 1 
                        WHEN deezer_id IS NOT NULL THEN 1 
                        WHEN youtube_id IS NOT NULL THEN 1 
                        ELSE 0 
                    END
                    FROM users WHERE id = $1
                ) as services WHERE services.case > 0) as synced_services
        `;

        const statsResult = await db.query(statsQuery, [userId]);
        const stats = statsResult.rows[0];

        // Récupérer les playlists récentes
        const playlistsQuery = `
            SELECT 
                id, name, description, track_count, total_duration, 
                cover_image_url, updated_at, is_public
            FROM playlists 
            WHERE user_id = $1 
            ORDER BY updated_at DESC 
            LIMIT 6
        `;
        const playlistsResult = await db.query(playlistsQuery, [userId]);

        // Récupérer l'historique d'écoute récent
        const historyQuery = `
            SELECT 
                lh.id, lh.track_id, t.title as track_name, t.artist as artist_name, 
                t.album as album_name, lh.duration_ms, lh.played_at, lh.completion_percentage
            FROM listening_history lh
            JOIN tracks t ON lh.track_id = t.id
            WHERE lh.user_id = $1
            ORDER BY lh.played_at DESC
            LIMIT 10
        `;
        const historyResult = await db.query(historyQuery, [userId]);

        // Récupérer les top tracks (basé sur l'historique d'écoute)
        const topTracksQuery = `
            SELECT 
                t.id, t.title as name, t.artist, t.album,
                COUNT(lh.id) as play_count,
                SUM(lh.duration_ms) as total_duration,
                t.artwork->>'medium' as cover_url
            FROM tracks t
            JOIN listening_history lh ON t.id = lh.track_id
            WHERE lh.user_id = $1 
                AND lh.played_at >= NOW() - INTERVAL '30 days'
            GROUP BY t.id, t.title, t.artist, t.album, t.artwork
            ORDER BY play_count DESC, total_duration DESC
            LIMIT 10
        `;
        const topTracksResult = await db.query(topTracksQuery, [userId]);

        // Récupérer les top artists
        const topArtistsQuery = `
            SELECT 
                t.artist as name,
                COUNT(lh.id) as play_count,
                SUM(lh.duration_ms) as total_duration,
                STRING_AGG(DISTINCT t.genre, ', ') as genres
            FROM tracks t
            JOIN listening_history lh ON t.id = lh.track_id
            WHERE lh.user_id = $1 
                AND lh.played_at >= NOW() - INTERVAL '30 days'
            GROUP BY t.artist
            ORDER BY play_count DESC, total_duration DESC
            LIMIT 10
        `;
        const topArtistsResult = await db.query(topArtistsQuery, [userId]);

        // Récupérer la dernière synchronisation
        const lastSyncQuery = `
            SELECT completed_at 
            FROM sync_history 
            WHERE user_id = $1 AND status = 'completed'
            ORDER BY completed_at DESC 
            LIMIT 1
        `;
        const lastSyncResult = await db.query(lastSyncQuery, [userId]);

        const dashboardData = {
            stats: {
                totalPlaylists: parseInt(stats.total_playlists) || 0,
                totalTracks: parseInt(stats.total_tracks) || 0,
                totalListeningTime: parseInt(stats.total_listening_time) || 0,
                totalArtists: parseInt(stats.total_artists) || 0,
                syncedServices: parseInt(stats.synced_services) || 0,
                lastSyncTime: lastSyncResult.rows[0]?.completed_at || null
            },
            recentPlaylists: playlistsResult.rows.map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                trackCount: p.track_count || 0,
                totalDuration: p.total_duration || 0,
                coverImageUrl: p.cover_image_url,
                updatedAt: p.updated_at,
                isPublic: p.is_public
            })),
            listeningHistory: historyResult.rows.map(h => ({
                id: h.id,
                trackId: h.track_id,
                trackName: h.track_name,
                artistName: h.artist_name,
                albumName: h.album_name,
                duration: h.duration_ms,
                playedAt: h.played_at,
                completionPercentage: h.completion_percentage
            })),
            topTracks: topTracksResult.rows.map(t => ({
                id: t.id,
                name: t.name,
                artist: t.artist,
                album: t.album,
                playCount: parseInt(t.play_count),
                totalDuration: parseInt(t.total_duration),
                coverUrl: t.cover_url
            })),
            topArtists: topArtistsResult.rows.map((a, index) => ({
                id: `artist_${userId}_${index}`,
                name: a.name,
                playCount: parseInt(a.play_count),
                totalDuration: parseInt(a.total_duration),
                genres: a.genres ? a.genres.split(', ') : []
            }))
        };

        res.json(dashboardData);

    } catch (error) {
        logger.error('Erreur lors de la récupération des données dashboard:', error);
        res.status(500).json({
            error: 'Erreur dashboard',
            message: error.message
        });
    }
});

/**
 * GET /api/dashboard/stats
 * Récupérer uniquement les statistiques
 */
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.id;

        const statsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM playlists WHERE user_id = $1) as total_playlists,
                (SELECT COUNT(*) FROM tracks t 
                 JOIN playlist_tracks pt ON t.id = pt.track_id 
                 JOIN playlists p ON pt.playlist_id = p.id 
                 WHERE p.user_id = $1) as total_tracks,
                (SELECT COUNT(DISTINCT artist) FROM tracks t 
                 JOIN playlist_tracks pt ON t.id = pt.track_id 
                 JOIN playlists p ON pt.playlist_id = p.id 
                 WHERE p.user_id = $1) as total_artists,
                (SELECT COALESCE(SUM(duration_ms), 0) FROM listening_history WHERE user_id = $1) as total_listening_time
        `;

        const result = await db.query(statsQuery, [userId]);
        const stats = result.rows[0];

        // Compter les services synchronisés
        const userResult = await db.query(
            'SELECT spotify_id, deezer_id, youtube_id FROM users WHERE id = $1',
            [userId]
        );

        let syncedServices = 0;
        if (userResult.rows[0]) {
            const user = userResult.rows[0];
            if (user.spotify_id) syncedServices++;
            if (user.deezer_id) syncedServices++;
            if (user.youtube_id) syncedServices++;
        }

        const lastSyncQuery = `
            SELECT completed_at 
            FROM sync_history 
            WHERE user_id = $1 AND status = 'completed'
            ORDER BY completed_at DESC 
            LIMIT 1
        `;
        const lastSyncResult = await db.query(lastSyncQuery, [userId]);

        res.json({
            totalPlaylists: parseInt(stats.total_playlists) || 0,
            totalTracks: parseInt(stats.total_tracks) || 0,
            totalListeningTime: parseInt(stats.total_listening_time) || 0,
            totalArtists: parseInt(stats.total_artists) || 0,
            syncedServices,
            lastSyncTime: lastSyncResult.rows[0]?.completed_at || null
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération des stats:', error);
        res.status(500).json({
            error: 'Erreur stats',
            message: error.message
        });
    }
});

module.exports = router;
