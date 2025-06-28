const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const playlistBuilder = require('../../logic/playlistBuilder');
const dataSync = require('../../services/dataSync');
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

        // TODO: Sauvegarder la playlist en base de données

        res.json({
            success: true,
            playlist: {
                id: playlist.id,
                name: playlist.name,
                description: playlist.description,
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

        // TODO: Récupérer les playlists depuis la base de données
        const playlists = [];

        res.json({
            success: true,
            playlists,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: playlists.length,
                pages: Math.ceil(playlists.length / limit)
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

        // TODO: Récupérer la playlist depuis la base de données
        const playlist = null;

        if (!playlist) {
            return res.status(404).json({
                error: 'Playlist non trouvée',
                message: 'La playlist demandée n\'existe pas'
            });
        }

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

        // TODO: Mettre à jour la playlist en base de données

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

        // TODO: Supprimer la playlist de la base de données

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

        // TODO: Ajouter les tracks à la playlist en base de données

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

        // TODO: Supprimer la track de la playlist en base de données

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

        // TODO: Réorganiser les tracks en base de données

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

        // TODO: Importer la playlist depuis le service externe
        logger.info(`Import de playlist ${service} demandé`, {
            userId,
            service,
            externalPlaylistId
        });

        res.json({
            success: true,
            message: 'Import de playlist en cours...',
            importId: `import_${Date.now()}`
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

module.exports = router;
