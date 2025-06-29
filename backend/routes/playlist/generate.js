const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const playlistBuilder = require('../../logic/playlistBuilder');
const dataSync = require('../../services/dataSync');
const db = require('../../database/connection');
const { logger } = require('../../utils/logger');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

/**
 * POST /api/playlists/generate
 * Générer une nouvelle playlist intelligente
 */
router.post('/generate', async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            algorithm = 'hybrid',
            seedTracks = [],
            seedArtists = [],
            seedGenres = [],
            audioFeatures = {},
            rules = {},
            targetSize = 30,
            name,
            description
        } = req.body;

        logger.info(`Génération de playlist demandée par l'utilisateur ${userId}`, {
            algorithm,
            targetSize,
            seedsCount: seedTracks.length + seedArtists.length + seedGenres.length
        });

        // Valider les paramètres
        if (targetSize < 5 || targetSize > 100) {
            return res.status(400).json({
                error: 'Taille invalide',
                message: 'La taille de la playlist doit être entre 5 et 100 tracks'
            });
        }

        const validAlgorithms = ['similarity', 'mood', 'genre', 'tempo', 'discovery', 'history', 'hybrid'];
        if (!validAlgorithms.includes(algorithm)) {
            return res.status(400).json({
                error: 'Algorithme invalide',
                message: `Algorithme doit être un de: ${validAlgorithms.join(', ')}`
            });
        }

        // Générer la playlist
        const playlist = await playlistBuilder.generatePlaylist({
            userId,
            algorithm,
            seedTracks,
            seedArtists,
            seedGenres,
            audioFeatures,
            rules,
            targetSize
        });

        // Personnaliser le nom et la description si fournis
        if (name) playlist.name = name;
        if (description) playlist.description = description;

        // Sauvegarder la playlist en base de données
        const savedPlaylist = await db.transaction(async (client) => {
            // Insérer la playlist
            const playlistResult = await client.query(`
                INSERT INTO playlists (name, description, user_id, type, generation_rules, mood, stats)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [
                playlist.name,
                playlist.description || null,
                userId,
                'smart',
                JSON.stringify({
                    algorithm,
                    seedTracks,
                    seedArtists,
                    seedGenres,
                    audioFeatures,
                    rules,
                    targetSize
                }),
                playlist.metadata?.mood || null,
                JSON.stringify({
                    totalTracks: playlist.tracks.length,
                    totalDuration: playlist.tracks.reduce((sum, track) => sum + (track.duration || 0), 0),
                    creationMethod: 'ai_generated'
                })
            ]);

            const savedPlaylist = playlistResult.rows[0];

            // Insérer les tracks dans la playlist
            if (playlist.tracks && playlist.tracks.length > 0) {
                const trackInsertPromises = playlist.tracks.map((track, index) => {
                    return client.query(`
                        INSERT INTO playlist_tracks (playlist_id, track_id, position, metadata)
                        VALUES ($1, $2, $3, $4)
                    `, [
                        savedPlaylist.id,
                        track.id,
                        index + 1,
                        JSON.stringify({
                            reason: 'recommendation',
                            confidence: track.confidence || null,
                            ruleMatched: algorithm
                        })
                    ]);
                });

                await Promise.all(trackInsertPromises);
            }

            return savedPlaylist;
        });

        res.json({
            success: true,
            playlist: {
                id: savedPlaylist.id,
                name: savedPlaylist.name,
                description: savedPlaylist.description,
                tracks: playlist.tracks,
                metadata: playlist.metadata
            }
        });

    } catch (error) {
        logger.error('Erreur lors de la génération de playlist:', error);
        res.status(500).json({
            error: 'Erreur de génération',
            message: error.message
        });
    }
});

/**
 * GET /api/playlists
 * Obtenir les playlists de l'utilisateur
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            page = 1,
            limit = 20,
            sort = 'created_desc'
        } = req.query;

        // Récupérer les playlists depuis la base de données
        const offset = (parseInt(page) - 1) * parseInt(limit);

        // Construction de la clause ORDER BY
        let orderBy = 'created_at DESC';
        switch (sort) {
            case 'name_asc':
                orderBy = 'name ASC';
                break;
            case 'name_desc':
                orderBy = 'name DESC';
                break;
            case 'updated_desc':
                orderBy = 'updated_at DESC';
                break;
            case 'updated_asc':
                orderBy = 'updated_at ASC';
                break;
            case 'created_asc':
                orderBy = 'created_at ASC';
                break;
            default:
                orderBy = 'created_at DESC';
        }

        // Récupérer les playlists avec le nombre de tracks
        const playlistsQuery = `
            SELECT 
                p.*,
                COUNT(pt.track_id) as track_count,
                COALESCE(SUM(t.duration), 0) as total_duration
            FROM playlists p
            LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
            LEFT JOIN tracks t ON pt.track_id = t.id
            WHERE p.user_id = $1 AND p.is_active = true
            GROUP BY p.id
            ORDER BY ${orderBy}
            LIMIT $2 OFFSET $3
        `;

        const playlistsResult = await db.query(playlistsQuery, [userId, parseInt(limit), offset]);

        // Compter le total pour la pagination
        const countResult = await db.query(
            'SELECT COUNT(*) as total FROM playlists WHERE user_id = $1 AND is_active = true',
            [userId]
        );

        const playlists = playlistsResult.rows.map(playlist => ({
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            type: playlist.type,
            isPublic: playlist.is_public,
            isCollaborative: playlist.is_collaborative,
            mood: playlist.mood,
            category: playlist.category,
            trackCount: parseInt(playlist.track_count),
            totalDuration: parseInt(playlist.total_duration),
            artwork: playlist.artwork,
            createdAt: playlist.created_at,
            updatedAt: playlist.updated_at
        }));

        const total = parseInt(countResult.rows[0].total);

        res.json({
            success: true,
            playlists,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération des playlists:', error);
        res.status(500).json({
            error: 'Erreur de récupération',
            message: error.message
        });
    }
});

/**
 * GET /api/playlists/:playlistId
 * Obtenir une playlist spécifique
 */
router.get('/:playlistId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { playlistId } = req.params;

        // Récupérer la playlist depuis la base de données
        const playlistQuery = `
            SELECT 
                p.*,
                COUNT(pt.track_id) as track_count,
                COALESCE(SUM(t.duration), 0) as total_duration
            FROM playlists p
            LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
            LEFT JOIN tracks t ON pt.track_id = t.id
            WHERE p.id = $1 AND p.user_id = $2 AND p.is_active = true
            GROUP BY p.id
        `;

        const playlistResult = await db.query(playlistQuery, [playlistId, userId]);

        if (playlistResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Playlist non trouvée',
                message: 'La playlist demandée n\'existe pas'
            });
        }

        const playlistData = playlistResult.rows[0];

        // Récupérer les tracks de la playlist
        const tracksQuery = `
            SELECT 
                t.*,
                pt.position,
                pt.added_at,
                pt.metadata as track_metadata,
                a.name as artist_name,
                al.title as album_title
            FROM playlist_tracks pt
            JOIN tracks t ON pt.track_id = t.id
            LEFT JOIN artists a ON t.artist_id = a.id
            LEFT JOIN albums al ON t.album_id = al.id
            WHERE pt.playlist_id = $1
            ORDER BY pt.position ASC
        `;

        const tracksResult = await db.query(tracksQuery, [playlistId]);

        const playlist = {
            id: playlistData.id,
            name: playlistData.name,
            description: playlistData.description,
            type: playlistData.type,
            isPublic: playlistData.is_public,
            isCollaborative: playlistData.is_collaborative,
            mood: playlistData.mood,
            category: playlistData.category,
            trackCount: parseInt(playlistData.track_count),
            totalDuration: parseInt(playlistData.total_duration),
            artwork: playlistData.artwork,
            stats: playlistData.stats,
            generationRules: playlistData.generation_rules,
            tracks: tracksResult.rows.map(track => ({
                id: track.id,
                title: track.title,
                artist: {
                    id: track.artist_id,
                    name: track.artist_name
                },
                album: {
                    id: track.album_id,
                    title: track.album_title
                },
                duration: track.duration,
                position: track.position,
                addedAt: track.added_at,
                metadata: track.track_metadata
            })),
            createdAt: playlistData.created_at,
            updatedAt: playlistData.updated_at
        };

        res.json({
            success: true,
            playlist
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération de la playlist:', error);
        res.status(500).json({
            error: 'Erreur de récupération',
            message: error.message
        });
    }
});

/**
 * PUT /api/playlists/:playlistId
 * Modifier une playlist
 */
router.put('/:playlistId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { playlistId } = req.params;
        const { name, description, tracks, isPublic } = req.body;

        // Vérifier que la playlist existe et appartient à l'utilisateur
        const existingPlaylist = await db.query(
            'SELECT id FROM playlists WHERE id = $1 AND user_id = $2 AND is_active = true',
            [playlistId, userId]
        );

        if (existingPlaylist.rows.length === 0) {
            return res.status(404).json({
                error: 'Playlist non trouvée',
                message: 'La playlist demandée n\'existe pas'
            });
        }

        // Mettre à jour la playlist en base de données
        await db.transaction(async (client) => {
            // Construire la clause SET dynamiquement
            const updates = [];
            const values = [playlistId, userId];
            let paramIndex = 3;

            if (name !== undefined) {
                updates.push(`name = $${paramIndex}`);
                values.push(name);
                paramIndex++;
            }

            if (description !== undefined) {
                updates.push(`description = $${paramIndex}`);
                values.push(description);
                paramIndex++;
            }

            if (isPublic !== undefined) {
                updates.push(`is_public = $${paramIndex}`);
                values.push(isPublic);
                paramIndex++;
            }

            if (updates.length > 0) {
                updates.push('updated_at = CURRENT_TIMESTAMP');

                const updateQuery = `
                    UPDATE playlists 
                    SET ${updates.join(', ')}
                    WHERE id = $1 AND user_id = $2
                `;

                await client.query(updateQuery, values);
            }

            // Si des tracks sont fournies, mettre à jour l'ordre
            if (tracks && Array.isArray(tracks)) {
                // Supprimer tous les tracks existants
                await client.query('DELETE FROM playlist_tracks WHERE playlist_id = $1', [playlistId]);

                // Insérer les nouvelles tracks avec leur position
                if (tracks.length > 0) {
                    const trackInsertPromises = tracks.map((trackId, index) => {
                        return client.query(`
                            INSERT INTO playlist_tracks (playlist_id, track_id, position, added_by, metadata)
                            VALUES ($1, $2, $3, $4, $5)
                        `, [
                            playlistId,
                            trackId,
                            index + 1,
                            userId,
                            JSON.stringify({ reason: 'manual_update' })
                        ]);
                    });

                    await Promise.all(trackInsertPromises);
                }

                // Mettre à jour les stats de la playlist
                const statsQuery = `
                    UPDATE playlists 
                    SET stats = jsonb_set(
                        COALESCE(stats, '{}'),
                        '{totalTracks}',
                        '${tracks.length}'
                    )
                    WHERE id = $1
                `;
                await client.query(statsQuery, [playlistId]);
            }
        });

        res.json({
            success: true,
            message: 'Playlist mise à jour avec succès'
        });

    } catch (error) {
        logger.error('Erreur lors de la mise à jour de la playlist:', error);
        res.status(500).json({
            error: 'Erreur de mise à jour',
            message: error.message
        });
    }
});

/**
 * DELETE /api/playlists/:playlistId
 * Supprimer une playlist
 */
router.delete('/:playlistId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { playlistId } = req.params;

        // Vérifier que la playlist existe et appartient à l'utilisateur
        const existingPlaylist = await db.query(
            'SELECT id FROM playlists WHERE id = $1 AND user_id = $2 AND is_active = true',
            [playlistId, userId]
        );

        if (existingPlaylist.rows.length === 0) {
            return res.status(404).json({
                error: 'Playlist non trouvée',
                message: 'La playlist demandée n\'existe pas'
            });
        }

        // Supprimer la playlist de la base de données (soft delete)
        await db.query(
            'UPDATE playlists SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2',
            [playlistId, userId]
        );

        res.json({
            success: true,
            message: 'Playlist supprimée avec succès'
        });

    } catch (error) {
        logger.error('Erreur lors de la suppression de la playlist:', error);
        res.status(500).json({
            error: 'Erreur de suppression',
            message: error.message
        });
    }
});

/**
 * POST /api/playlists/:playlistId/tracks
 * Ajouter des tracks à une playlist
 */
router.post('/:playlistId/tracks', async (req, res) => {
    try {
        const userId = req.user.id;
        const { playlistId } = req.params;
        const { tracks } = req.body;

        if (!Array.isArray(tracks) || tracks.length === 0) {
            return res.status(400).json({
                error: 'Tracks invalides',
                message: 'Une liste de tracks est requise'
            });
        }

        // Vérifier que la playlist existe et appartient à l'utilisateur
        const existingPlaylist = await db.query(
            'SELECT id FROM playlists WHERE id = $1 AND user_id = $2 AND is_active = true',
            [playlistId, userId]
        );

        if (existingPlaylist.rows.length === 0) {
            return res.status(404).json({
                error: 'Playlist non trouvée',
                message: 'La playlist demandée n\'existe pas'
            });
        }

        // Ajouter les tracks à la playlist en base de données
        await db.transaction(async (client) => {
            // Obtenir la position de départ (dernière position + 1)
            const positionResult = await client.query(
                'SELECT COALESCE(MAX(position), 0) as max_position FROM playlist_tracks WHERE playlist_id = $1',
                [playlistId]
            );

            let startPosition = positionResult.rows[0].max_position + 1;

            // Insérer chaque track
            const trackInsertPromises = tracks.map((trackId, index) => {
                return client.query(`
                    INSERT INTO playlist_tracks (playlist_id, track_id, position, added_by, metadata)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (playlist_id, track_id, position) DO NOTHING
                `, [
                    playlistId,
                    trackId,
                    startPosition + index,
                    userId,
                    JSON.stringify({ reason: 'manual_add' })
                ]);
            });

            await Promise.all(trackInsertPromises);

            // Mettre à jour les stats de la playlist
            const newTrackCount = await client.query(
                'SELECT COUNT(*) as count FROM playlist_tracks WHERE playlist_id = $1',
                [playlistId]
            );

            await client.query(`
                UPDATE playlists 
                SET 
                    stats = jsonb_set(COALESCE(stats, '{}'), '{totalTracks}', $2),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [playlistId, newTrackCount.rows[0].count]);
        });

        res.json({
            success: true,
            message: `${tracks.length} track(s) ajoutée(s) à la playlist`
        });

    } catch (error) {
        logger.error('Erreur lors de l\'ajout de tracks:', error);
        res.status(500).json({
            error: 'Erreur d\'ajout',
            message: error.message
        });
    }
});

/**
 * DELETE /api/playlists/:playlistId/tracks/:trackId
 * Supprimer une track d'une playlist
 */
router.delete('/:playlistId/tracks/:trackId', async (req, res) => {
    try {
        const userId = req.user.id;
        const { playlistId, trackId } = req.params;

        // Vérifier que la playlist existe et appartient à l'utilisateur
        const existingPlaylist = await db.query(
            'SELECT id FROM playlists WHERE id = $1 AND user_id = $2 AND is_active = true',
            [playlistId, userId]
        );

        if (existingPlaylist.rows.length === 0) {
            return res.status(404).json({
                error: 'Playlist non trouvée',
                message: 'La playlist demandée n\'existe pas'
            });
        }

        // Supprimer la track de la playlist en base de données
        await db.transaction(async (client) => {
            // Supprimer la track
            const deleteResult = await client.query(
                'DELETE FROM playlist_tracks WHERE playlist_id = $1 AND track_id = $2 RETURNING position',
                [playlistId, trackId]
            );

            if (deleteResult.rows.length === 0) {
                throw new Error('Track non trouvée dans la playlist');
            }

            const removedPosition = deleteResult.rows[0].position;

            // Réorganiser les positions des tracks suivantes
            await client.query(`
                UPDATE playlist_tracks 
                SET position = position - 1 
                WHERE playlist_id = $1 AND position > $2
            `, [playlistId, removedPosition]);

            // Mettre à jour les stats de la playlist
            const newTrackCount = await client.query(
                'SELECT COUNT(*) as count FROM playlist_tracks WHERE playlist_id = $1',
                [playlistId]
            );

            await client.query(`
                UPDATE playlists 
                SET 
                    stats = jsonb_set(COALESCE(stats, '{}'), '{totalTracks}', $2),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $1
            `, [playlistId, newTrackCount.rows[0].count]);
        });

        res.json({
            success: true,
            message: 'Track supprimée de la playlist'
        });

    } catch (error) {
        logger.error('Erreur lors de la suppression de track:', error);
        res.status(500).json({
            error: 'Erreur de suppression',
            message: error.message
        });
    }
});

/**
 * POST /api/playlists/:playlistId/reorder
 * Réorganiser les tracks d'une playlist
 */
router.post('/:playlistId/reorder', async (req, res) => {
    try {
        const userId = req.user.id;
        const { playlistId } = req.params;
        const { trackOrder } = req.body;

        if (!Array.isArray(trackOrder)) {
            return res.status(400).json({
                error: 'Ordre invalide',
                message: 'Un tableau d\'ordre des tracks est requis'
            });
        }

        // Vérifier que la playlist existe et appartient à l'utilisateur
        const existingPlaylist = await db.query(
            'SELECT id FROM playlists WHERE id = $1 AND user_id = $2 AND is_active = true',
            [playlistId, userId]
        );

        if (existingPlaylist.rows.length === 0) {
            return res.status(404).json({
                error: 'Playlist non trouvée',
                message: 'La playlist demandée n\'existe pas'
            });
        }

        // Vérifier que l'ordre contient des IDs de tracks valides
        const existingTracks = await db.query(
            'SELECT track_id FROM playlist_tracks WHERE playlist_id = $1',
            [playlistId]
        );

        const existingTrackIds = new Set(existingTracks.rows.map(row => row.track_id));
        const reorderTrackIds = new Set(trackOrder);

        if (existingTrackIds.size !== reorderTrackIds.size ||
            ![...existingTrackIds].every(id => reorderTrackIds.has(id))) {
            return res.status(400).json({
                error: 'Ordre invalide',
                message: 'L\'ordre des tracks ne correspond pas aux tracks de la playlist'
            });
        }

        // Réorganiser les tracks en base de données
        await db.transaction(async (client) => {
            // Mettre à jour la position de chaque track
            const updatePromises = trackOrder.map((trackId, index) => {
                return client.query(
                    'UPDATE playlist_tracks SET position = $1 WHERE playlist_id = $2 AND track_id = $3',
                    [index + 1, playlistId, trackId]
                );
            });

            await Promise.all(updatePromises);

            // Mettre à jour le timestamp de la playlist
            await client.query(
                'UPDATE playlists SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [playlistId]
            );
        });

        res.json({
            success: true,
            message: 'Playlist réorganisée avec succès'
        });

    } catch (error) {
        logger.error('Erreur lors de la réorganisation:', error);
        res.status(500).json({
            error: 'Erreur de réorganisation',
            message: error.message
        });
    }
});

/**
 * POST /api/playlists/import
 * Importer une playlist depuis un service externe
 */
router.post('/import', async (req, res) => {
    try {
        const userId = req.user.id;
        const { service, playlistId: externalPlaylistId, name } = req.body;

        const validServices = ['spotify', 'deezer', 'youtube'];
        if (!validServices.includes(service)) {
            return res.status(400).json({
                error: 'Service invalide',
                message: `Service doit être un de: ${validServices.join(', ')}`
            });
        }

        if (!externalPlaylistId) {
            return res.status(400).json({
                error: 'ID playlist manquant',
                message: 'L\'ID de la playlist externe est requis'
            });
        }

        // Importer la playlist depuis le service externe
        logger.info(`Import de playlist ${service} demandé`, {
            userId,
            service,
            externalPlaylistId
        });

        // Lancer l'import en arrière-plan
        const importPromise = importPlaylistFromService(userId, service, externalPlaylistId, name);

        const importId = `import_${Date.now()}`;

        res.json({
            success: true,
            message: 'Import de playlist en cours...',
            importId
        });

        // Continuer l'import en arrière-plan
        importPromise.catch(error => {
            logger.error('Erreur lors de l\'import de playlist:', error);
        });

    } catch (error) {
        logger.error('Erreur lors de l\'import de playlist:', error);
        res.status(500).json({
            error: 'Erreur d\'import',
            message: error.message
        });
    }
});

/**
 * GET /api/playlists/algorithms
 * Obtenir la liste des algorithmes de génération disponibles
 */
router.get('/algorithms', async (req, res) => {
    try {
        const algorithms = [
            {
                id: 'similarity',
                name: 'Similarité',
                description: 'Basé sur la similarité musicale avec vos favoris',
                requiresSeeds: true,
                parameters: ['seedTracks', 'seedArtists']
            },
            {
                id: 'mood',
                name: 'Humeur',
                description: 'Créée pour correspondre à une humeur spécifique',
                requiresSeeds: false,
                parameters: ['audioFeatures']
            },
            {
                id: 'genre',
                name: 'Genre',
                description: 'Centrée sur des genres musicaux spécifiques',
                requiresSeeds: false,
                parameters: ['seedGenres']
            },
            {
                id: 'tempo',
                name: 'Tempo',
                description: 'Optimisée par tempo et énergie',
                requiresSeeds: false,
                parameters: ['audioFeatures']
            },
            {
                id: 'discovery',
                name: 'Découverte',
                description: 'Nouvelles découvertes personnalisées',
                requiresSeeds: false,
                parameters: []
            },
            {
                id: 'history',
                name: 'Historique',
                description: 'Basée sur votre historique d\'écoute',
                requiresSeeds: false,
                parameters: []
            },
            {
                id: 'hybrid',
                name: 'Mix Intelligent',
                description: 'Combine plusieurs algorithmes pour un résultat optimal',
                requiresSeeds: false,
                parameters: ['seedTracks', 'seedArtists', 'seedGenres', 'audioFeatures']
            }
        ];

        res.json({
            success: true,
            algorithms
        });

    } catch (error) {
        logger.error('Erreur lors de la récupération des algorithmes:', error);
        res.status(500).json({
            error: 'Erreur de récupération',
            message: error.message
        });
    }
});

/**
 * POST /api/playlists/analyze
 * Analyser une playlist existante
 */
router.post('/analyze', async (req, res) => {
    try {
        const userId = req.user.id;
        const { tracks } = req.body;

        if (!Array.isArray(tracks) || tracks.length === 0) {
            return res.status(400).json({
                error: 'Tracks manquantes',
                message: 'Une liste de tracks est requise pour l\'analyse'
            });
        }

        // Analyser les caractéristiques de la playlist
        const analysis = {
            trackCount: tracks.length,
            totalDuration: tracks.reduce((sum, track) => sum + (track.duration || 0), 0),
            uniqueArtists: new Set(tracks.map(t => t.artist?.id).filter(Boolean)).size,
            genres: {},
            audioFeatures: {
                avgEnergy: 0,
                avgValence: 0,
                avgDanceability: 0,
                avgTempo: 0
            },
            decades: {},
            popularity: {
                min: 100,
                max: 0,
                avg: 0
            }
        };

        // Calculer les statistiques
        let energySum = 0, valenceSum = 0, danceabilitySum = 0, tempoSum = 0;
        let featuresCount = 0;
        let popularitySum = 0;

        tracks.forEach(track => {
            // Genres
            if (track.artist?.genres) {
                track.artist.genres.forEach(genre => {
                    analysis.genres[genre] = (analysis.genres[genre] || 0) + 1;
                });
            }

            // Audio features
            if (track.audioFeatures) {
                energySum += track.audioFeatures.energy || 0;
                valenceSum += track.audioFeatures.valence || 0;
                danceabilitySum += track.audioFeatures.danceability || 0;
                tempoSum += track.audioFeatures.tempo || 0;
                featuresCount++;
            }

            // Popularité
            if (track.popularity !== undefined) {
                analysis.popularity.min = Math.min(analysis.popularity.min, track.popularity);
                analysis.popularity.max = Math.max(analysis.popularity.max, track.popularity);
                popularitySum += track.popularity;
            }

            // Décennies
            if (track.releaseDate) {
                const year = new Date(track.releaseDate).getFullYear();
                const decade = Math.floor(year / 10) * 10;
                analysis.decades[decade] = (analysis.decades[decade] || 0) + 1;
            }
        });

        if (featuresCount > 0) {
            analysis.audioFeatures.avgEnergy = energySum / featuresCount;
            analysis.audioFeatures.avgValence = valenceSum / featuresCount;
            analysis.audioFeatures.avgDanceability = danceabilitySum / featuresCount;
            analysis.audioFeatures.avgTempo = tempoSum / featuresCount;
        }

        if (tracks.length > 0) {
            analysis.popularity.avg = popularitySum / tracks.length;
        }

        res.json({
            success: true,
            analysis
        });

    } catch (error) {
        logger.error('Erreur lors de l\'analyse de playlist:', error);
        res.status(500).json({
            error: 'Erreur d\'analyse',
            message: error.message
        });
    }
});

/**
 * Fonction utilitaire pour importer une playlist depuis un service externe
 * @param {string} userId - ID de l'utilisateur
 * @param {string} service - Service source
 * @param {string} externalPlaylistId - ID de la playlist externe
 * @param {string} customName - Nom personnalisé (optionnel)
 */
async function importPlaylistFromService(userId, service, externalPlaylistId, customName) {
    try {
        // Cette fonction devrait être implémentée avec les services spécifiques
        // Ici on simule l'import basique

        logger.info('Début de l\'import de playlist', {
            userId,
            service,
            externalPlaylistId
        });

        // Récupérer les informations de la playlist depuis le service externe
        // (À implémenter avec les services Spotify, Deezer, etc.)

        // Créer la playlist locale
        const importedPlaylist = await db.create('playlists', {
            name: customName || `Playlist importée de ${service}`,
            description: `Importée depuis ${service}`,
            user_id: userId,
            type: 'manual',
            source: service,
            external_id: externalPlaylistId,
            sync_status: 'synced',
            last_sync_at: new Date(),
            stats: JSON.stringify({
                totalTracks: 0,
                creationMethod: 'imported'
            })
        });

        logger.info('Playlist importée avec succès', {
            playlistId: importedPlaylist.id,
            service
        });

        return importedPlaylist;

    } catch (error) {
        logger.error('Erreur lors de l\'import de playlist:', error);
        throw error;
    }
}

module.exports = router;
