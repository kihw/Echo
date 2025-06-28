const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const pool = require('../../../database/connection');
const { logger } = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

/**
 * GET /api/playlists
 * Récupérer toutes les playlists de l'utilisateur
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, offset = 0, search = '', sortBy = 'created_at', sortOrder = 'DESC' } = req.query;

        let query = `
            SELECT 
                p.id, p.name, p.description, p.algorithm_used, p.is_public,
                p.created_at, p.updated_at, p.track_count, p.total_duration,
                p.cover_image_url, p.spotify_id, p.deezer_id, p.ytmusic_id,
                COUNT(pt.track_id) as actual_track_count
            FROM playlists p
            LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
            WHERE p.user_id = $1
        `;
        const queryParams = [userId];
        let paramIndex = 2;

        // Filtrage par recherche
        if (search) {
            query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
            queryParams.push(`%${search}%`);
            paramIndex++;
        }

        query += ` GROUP BY p.id`;

        // Tri
        const validSortFields = ['name', 'created_at', 'updated_at', 'track_count', 'total_duration'];
        const validSortOrders = ['ASC', 'DESC'];

        if (validSortFields.includes(sortBy) && validSortOrders.includes(sortOrder.toUpperCase())) {
            query += ` ORDER BY p.${sortBy} ${sortOrder.toUpperCase()}`;
        } else {
            query += ` ORDER BY p.created_at DESC`;
        }

        // Pagination
        query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        queryParams.push(parseInt(limit), parseInt(offset));

        const result = await pool.query(query, queryParams);

        // Compter le total pour la pagination
        const countQuery = `
            SELECT COUNT(*) as total
            FROM playlists p
            WHERE p.user_id = $1
            ${search ? `AND (p.name ILIKE $2 OR p.description ILIKE $2)` : ''}
        `;
        const countParams = search ? [userId, `%${search}%`] : [userId];
        const countResult = await pool.query(countQuery, countParams);

        res.json({
            playlists: result.rows.map(playlist => ({
                ...playlist,
                track_count: parseInt(playlist.actual_track_count) || 0
            })),
            pagination: {
                total: parseInt(countResult.rows[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: parseInt(offset) + parseInt(limit) < parseInt(countResult.rows[0].total)
            }
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération des playlists:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de récupérer les playlists'
        });
    }
});

/**
 * GET /api/playlists/:id
 * Récupérer une playlist spécifique avec ses tracks
 */
router.get('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const playlistId = req.params.id;

        // Récupérer la playlist
        const playlistQuery = `
            SELECT 
                p.id, p.name, p.description, p.algorithm_used, p.is_public,
                p.created_at, p.updated_at, p.track_count, p.total_duration,
                p.cover_image_url, p.spotify_id, p.deezer_id, p.ytmusic_id,
                p.generation_params, p.audio_features
            FROM playlists p
            WHERE p.id = $1 AND (p.user_id = $2 OR p.is_public = true)
        `;

        const playlistResult = await pool.query(playlistQuery, [playlistId, userId]);

        if (playlistResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Playlist non trouvée',
                message: 'Cette playlist n\'existe pas ou vous n\'y avez pas accès'
            });
        }

        const playlist = playlistResult.rows[0];

        // Récupérer les tracks de la playlist
        const tracksQuery = `
            SELECT 
                t.id, t.title, t.artist, t.album, t.duration, t.spotify_id,
                t.deezer_id, t.ytmusic_id, t.preview_url, t.cover_image_url,
                t.audio_features, pt.position, pt.added_at
            FROM tracks t
            JOIN playlist_tracks pt ON t.id = pt.track_id
            WHERE pt.playlist_id = $1
            ORDER BY pt.position ASC
        `;

        const tracksResult = await pool.query(tracksQuery, [playlistId]);

        res.json({
            ...playlist,
            tracks: tracksResult.rows
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération de la playlist:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de récupérer la playlist'
        });
    }
});

/**
 * POST /api/playlists
 * Créer une nouvelle playlist manuelle
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description = '', is_public = false, tracks = [] } = req.body;

        if (!name || name.trim().length === 0) {
            return res.status(400).json({
                error: 'Nom requis',
                message: 'Le nom de la playlist est requis'
            });
        }

        const playlistId = uuidv4();
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Créer la playlist
            const insertPlaylistQuery = `
                INSERT INTO playlists (
                    id, user_id, name, description, is_public, algorithm_used,
                    track_count, total_duration, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                RETURNING *
            `;

            const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);

            const playlistResult = await client.query(insertPlaylistQuery, [
                playlistId, userId, name.trim(), description.trim(), is_public,
                'manual', tracks.length, totalDuration
            ]);

            // Ajouter les tracks s'il y en a
            if (tracks.length > 0) {
                for (let i = 0; i < tracks.length; i++) {
                    const track = tracks[i];

                    // Insérer ou récupérer la track
                    const upsertTrackQuery = `
                        INSERT INTO tracks (id, title, artist, album, duration, spotify_id, deezer_id, ytmusic_id, preview_url, cover_image_url, audio_features)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                        ON CONFLICT (spotify_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            artist = EXCLUDED.artist,
                            album = EXCLUDED.album,
                            duration = EXCLUDED.duration,
                            preview_url = EXCLUDED.preview_url,
                            cover_image_url = EXCLUDED.cover_image_url,
                            audio_features = EXCLUDED.audio_features
                        RETURNING id
                    `;

                    const trackId = track.id || uuidv4();
                    await client.query(upsertTrackQuery, [
                        trackId,
                        track.title,
                        track.artist,
                        track.album,
                        track.duration,
                        track.spotify_id,
                        track.deezer_id,
                        track.ytmusic_id,
                        track.preview_url,
                        track.cover_image_url,
                        track.audio_features
                    ]);

                    // Lier la track à la playlist
                    const insertPlaylistTrackQuery = `
                        INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
                        VALUES ($1, $2, $3, NOW())
                    `;

                    await client.query(insertPlaylistTrackQuery, [playlistId, trackId, i]);
                }
            }

            await client.query('COMMIT');

            logger.info(`Nouvelle playlist créée: ${playlistId} par l'utilisateur ${userId}`);

            res.status(201).json({
                message: 'Playlist créée avec succès',
                playlist: playlistResult.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        logger.error('Erreur lors de la création de la playlist:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de créer la playlist'
        });
    }
});

/**
 * PUT /api/playlists/:id
 * Mettre à jour une playlist
 */
router.put('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const playlistId = req.params.id;
        const { name, description, is_public } = req.body;

        // Vérifier que la playlist appartient à l'utilisateur
        const checkOwnershipQuery = `
            SELECT id FROM playlists WHERE id = $1 AND user_id = $2
        `;
        const ownershipResult = await pool.query(checkOwnershipQuery, [playlistId, userId]);

        if (ownershipResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Playlist non trouvée',
                message: 'Cette playlist n\'existe pas ou ne vous appartient pas'
            });
        }

        // Construire la requête de mise à jour dynamiquement
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) {
            if (!name || name.trim().length === 0) {
                return res.status(400).json({
                    error: 'Nom invalide',
                    message: 'Le nom de la playlist ne peut pas être vide'
                });
            }
            updates.push(`name = $${paramIndex}`);
            values.push(name.trim());
            paramIndex++;
        }

        if (description !== undefined) {
            updates.push(`description = $${paramIndex}`);
            values.push(description.trim());
            paramIndex++;
        }

        if (is_public !== undefined) {
            updates.push(`is_public = $${paramIndex}`);
            values.push(Boolean(is_public));
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({
                error: 'Aucune modification',
                message: 'Aucun champ à mettre à jour n\'a été fourni'
            });
        }

        updates.push(`updated_at = NOW()`);
        values.push(playlistId, userId);

        const updateQuery = `
            UPDATE playlists 
            SET ${updates.join(', ')}
            WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
            RETURNING *
        `;

        const result = await pool.query(updateQuery, values);

        logger.info(`Playlist mise à jour: ${playlistId} par l'utilisateur ${userId}`);

        res.json({
            message: 'Playlist mise à jour avec succès',
            playlist: result.rows[0]
        });

    } catch (error) {
        logger.error('Erreur lors de la mise à jour de la playlist:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de mettre à jour la playlist'
        });
    }
});

/**
 * DELETE /api/playlists/:id
 * Supprimer une playlist
 */
router.delete('/:id', async (req, res) => {
    try {
        const userId = req.user.id;
        const playlistId = req.params.id;

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Vérifier que la playlist appartient à l'utilisateur
            const checkOwnershipQuery = `
                SELECT id, name FROM playlists WHERE id = $1 AND user_id = $2
            `;
            const ownershipResult = await client.query(checkOwnershipQuery, [playlistId, userId]);

            if (ownershipResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Playlist non trouvée',
                    message: 'Cette playlist n\'existe pas ou ne vous appartient pas'
                });
            }

            const playlistName = ownershipResult.rows[0].name;

            // Supprimer les liens playlist-tracks
            await client.query('DELETE FROM playlist_tracks WHERE playlist_id = $1', [playlistId]);

            // Supprimer la playlist
            await client.query('DELETE FROM playlists WHERE id = $1', [playlistId]);

            await client.query('COMMIT');

            logger.info(`Playlist supprimée: ${playlistId} (${playlistName}) par l'utilisateur ${userId}`);

            res.json({
                message: 'Playlist supprimée avec succès',
                playlistId: playlistId,
                name: playlistName
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        logger.error('Erreur lors de la suppression de la playlist:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de supprimer la playlist'
        });
    }
});

/**
 * POST /api/playlists/:id/tracks
 * Ajouter des tracks à une playlist
 */
router.post('/:id/tracks', async (req, res) => {
    try {
        const userId = req.user.id;
        const playlistId = req.params.id;
        const { tracks } = req.body;

        if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
            return res.status(400).json({
                error: 'Tracks manquantes',
                message: 'Un tableau de tracks est requis'
            });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Vérifier que la playlist appartient à l'utilisateur
            const checkOwnershipQuery = `
                SELECT id, track_count FROM playlists WHERE id = $1 AND user_id = $2
            `;
            const ownershipResult = await client.query(checkOwnershipQuery, [playlistId, userId]);

            if (ownershipResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Playlist non trouvée',
                    message: 'Cette playlist n\'existe pas ou ne vous appartient pas'
                });
            }

            const currentTrackCount = ownershipResult.rows[0].track_count || 0;

            // Ajouter les tracks
            let addedCount = 0;
            let totalDurationAdded = 0;

            for (const track of tracks) {
                // Insérer ou récupérer la track
                const upsertTrackQuery = `
                    INSERT INTO tracks (id, title, artist, album, duration, spotify_id, deezer_id, ytmusic_id, preview_url, cover_image_url, audio_features)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    ON CONFLICT (spotify_id) DO UPDATE SET
                        title = EXCLUDED.title,
                        artist = EXCLUDED.artist,
                        album = EXCLUDED.album,
                        duration = EXCLUDED.duration,
                        preview_url = EXCLUDED.preview_url,
                        cover_image_url = EXCLUDED.cover_image_url,
                        audio_features = EXCLUDED.audio_features
                    RETURNING id
                `;

                const trackId = track.id || uuidv4();
                await client.query(upsertTrackQuery, [
                    trackId,
                    track.title,
                    track.artist,
                    track.album,
                    track.duration || 0,
                    track.spotify_id,
                    track.deezer_id,
                    track.ytmusic_id,
                    track.preview_url,
                    track.cover_image_url,
                    track.audio_features
                ]);

                // Vérifier si la track n'est pas déjà dans la playlist
                const checkExistingQuery = `
                    SELECT id FROM playlist_tracks 
                    WHERE playlist_id = $1 AND track_id = $2
                `;
                const existingResult = await client.query(checkExistingQuery, [playlistId, trackId]);

                if (existingResult.rows.length === 0) {
                    // Ajouter la track à la playlist
                    const insertPlaylistTrackQuery = `
                        INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
                        VALUES ($1, $2, $3, NOW())
                    `;

                    await client.query(insertPlaylistTrackQuery, [
                        playlistId,
                        trackId,
                        currentTrackCount + addedCount
                    ]);

                    addedCount++;
                    totalDurationAdded += track.duration || 0;
                }
            }

            // Mettre à jour les statistiques de la playlist
            const updatePlaylistQuery = `
                UPDATE playlists 
                SET track_count = track_count + $1,
                    total_duration = total_duration + $2,
                    updated_at = NOW()
                WHERE id = $3
            `;

            await client.query(updatePlaylistQuery, [addedCount, totalDurationAdded, playlistId]);

            await client.query('COMMIT');

            logger.info(`${addedCount} tracks ajoutées à la playlist ${playlistId} par l'utilisateur ${userId}`);

            res.json({
                message: `${addedCount} tracks ajoutées avec succès`,
                addedCount,
                skippedCount: tracks.length - addedCount
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        logger.error('Erreur lors de l\'ajout des tracks:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible d\'ajouter les tracks à la playlist'
        });
    }
});

/**
 * DELETE /api/playlists/:id/tracks/:trackId
 * Supprimer une track d'une playlist
 */
router.delete('/:id/tracks/:trackId', async (req, res) => {
    try {
        const userId = req.user.id;
        const playlistId = req.params.id;
        const trackId = req.params.trackId;

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Vérifier que la playlist appartient à l'utilisateur
            const checkOwnershipQuery = `
                SELECT id FROM playlists WHERE id = $1 AND user_id = $2
            `;
            const ownershipResult = await client.query(checkOwnershipQuery, [playlistId, userId]);

            if (ownershipResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Playlist non trouvée',
                    message: 'Cette playlist n\'existe pas ou ne vous appartient pas'
                });
            }

            // Récupérer la position et durée de la track
            const getTrackQuery = `
                SELECT pt.position, t.duration
                FROM playlist_tracks pt
                JOIN tracks t ON pt.track_id = t.id
                WHERE pt.playlist_id = $1 AND pt.track_id = $2
            `;
            const trackResult = await client.query(getTrackQuery, [playlistId, trackId]);

            if (trackResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Track non trouvée',
                    message: 'Cette track n\'est pas dans la playlist'
                });
            }

            const removedPosition = trackResult.rows[0].position;
            const removedDuration = trackResult.rows[0].duration || 0;

            // Supprimer la track de la playlist
            await client.query(
                'DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2',
                [playlistId, trackId]
            );

            // Réorganiser les positions des tracks suivantes
            await client.query(
                'UPDATE playlist_tracks SET position = position - 1 WHERE playlist_id = $1 AND position > $2',
                [playlistId, removedPosition]
            );

            // Mettre à jour les statistiques de la playlist
            await client.query(`
                UPDATE playlists 
                SET track_count = track_count - 1,
                    total_duration = total_duration - $1,
                    updated_at = NOW()
                WHERE id = $2
            `, [removedDuration, playlistId]);

            await client.query('COMMIT');

            logger.info(`Track ${trackId} supprimée de la playlist ${playlistId} par l'utilisateur ${userId}`);

            res.json({
                message: 'Track supprimée avec succès de la playlist'
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        logger.error('Erreur lors de la suppression de la track:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de supprimer la track de la playlist'
        });
    }
});

/**
 * PUT /api/playlists/:id/tracks/reorder
 * Réorganiser les tracks dans une playlist
 */
router.put('/:id/tracks/reorder', async (req, res) => {
    try {
        const userId = req.user.id;
        const playlistId = req.params.id;
        const { trackId, newPosition } = req.body;

        if (!trackId || newPosition === undefined) {
            return res.status(400).json({
                error: 'Paramètres manquants',
                message: 'trackId et newPosition sont requis'
            });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Vérifier que la playlist appartient à l'utilisateur
            const checkOwnershipQuery = `
                SELECT id FROM playlists WHERE id = $1 AND user_id = $2
            `;
            const ownershipResult = await client.query(checkOwnershipQuery, [playlistId, userId]);

            if (ownershipResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Playlist non trouvée',
                    message: 'Cette playlist n\'existe pas ou ne vous appartient pas'
                });
            }

            // Récupérer la position actuelle de la track
            const getCurrentPositionQuery = `
                SELECT position FROM playlist_tracks 
                WHERE playlist_id = $1 AND track_id = $2
            `;
            const currentResult = await client.query(getCurrentPositionQuery, [playlistId, trackId]);

            if (currentResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Track non trouvée',
                    message: 'Cette track n\'est pas dans la playlist'
                });
            }

            const currentPosition = currentResult.rows[0].position;
            const targetPosition = parseInt(newPosition);

            if (currentPosition === targetPosition) {
                return res.json({
                    message: 'Track déjà à la position demandée'
                });
            }

            // Réorganiser les positions
            if (currentPosition < targetPosition) {
                // Déplacer vers le bas - décaler les tracks entre currentPosition et targetPosition
                await client.query(`
                    UPDATE playlist_tracks 
                    SET position = position - 1 
                    WHERE playlist_id = $1 AND position > $2 AND position <= $3
                `, [playlistId, currentPosition, targetPosition]);
            } else {
                // Déplacer vers le haut - décaler les tracks entre targetPosition et currentPosition
                await client.query(`
                    UPDATE playlist_tracks 
                    SET position = position + 1 
                    WHERE playlist_id = $1 AND position >= $2 AND position < $3
                `, [playlistId, targetPosition, currentPosition]);
            }

            // Mettre à jour la position de la track déplacée
            await client.query(`
                UPDATE playlist_tracks 
                SET position = $1 
                WHERE playlist_id = $2 AND track_id = $3
            `, [targetPosition, playlistId, trackId]);

            // Mettre à jour la date de modification de la playlist
            await client.query(
                'UPDATE playlists SET updated_at = NOW() WHERE id = $1',
                [playlistId]
            );

            await client.query('COMMIT');

            logger.info(`Track ${trackId} déplacée de la position ${currentPosition} à ${targetPosition} dans la playlist ${playlistId}`);

            res.json({
                message: 'Track réorganisée avec succès',
                oldPosition: currentPosition,
                newPosition: targetPosition
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        logger.error('Erreur lors de la réorganisation de la track:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de réorganiser la track'
        });
    }
});

/**
 * POST /api/playlists/:id/duplicate
 * Dupliquer une playlist
 */
router.post('/:id/duplicate', async (req, res) => {
    try {
        const userId = req.user.id;
        const sourcePlaylistId = req.params.id;
        const { name } = req.body;

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Récupérer la playlist source
            const getSourceQuery = `
                SELECT * FROM playlists 
                WHERE id = $1 AND (user_id = $2 OR is_public = true)
            `;
            const sourceResult = await client.query(getSourceQuery, [sourcePlaylistId, userId]);

            if (sourceResult.rows.length === 0) {
                return res.status(404).json({
                    error: 'Playlist non trouvée',
                    message: 'Cette playlist n\'existe pas ou vous n\'y avez pas accès'
                });
            }

            const sourcePlaylist = sourceResult.rows[0];
            const newPlaylistId = uuidv4();
            const newName = name || `${sourcePlaylist.name} (Copie)`;

            // Créer la nouvelle playlist
            const createPlaylistQuery = `
                INSERT INTO playlists (
                    id, user_id, name, description, algorithm_used, is_public,
                    track_count, total_duration, generation_params, audio_features,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                RETURNING *
            `;

            const newPlaylistResult = await client.query(createPlaylistQuery, [
                newPlaylistId,
                userId,
                newName,
                sourcePlaylist.description,
                sourcePlaylist.algorithm_used,
                false, // Nouvelle playlist privée par défaut
                sourcePlaylist.track_count,
                sourcePlaylist.total_duration,
                sourcePlaylist.generation_params,
                sourcePlaylist.audio_features
            ]);

            // Copier les tracks
            const copyTracksQuery = `
                INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
                SELECT $1, track_id, position, NOW()
                FROM playlist_tracks
                WHERE playlist_id = $2
                ORDER BY position
            `;

            await client.query(copyTracksQuery, [newPlaylistId, sourcePlaylistId]);

            await client.query('COMMIT');

            logger.info(`Playlist ${sourcePlaylistId} dupliquée vers ${newPlaylistId} par l'utilisateur ${userId}`);

            res.status(201).json({
                message: 'Playlist dupliquée avec succès',
                playlist: newPlaylistResult.rows[0]
            });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

    } catch (error) {
        logger.error('Erreur lors de la duplication de la playlist:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Impossible de dupliquer la playlist'
        });
    }
});

module.exports = router;
