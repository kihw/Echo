const { logger } = require('../utils/logger');
const db = require('../../database/connection');

/**
 * Moteur de génération de playlists intelligentes
 * Utilise les données utilisateur et les algorithmes de recommandation pour créer des playlists
 */
class PlaylistBuilder {
    constructor() {
        this.algorithms = {
            SIMILARITY: 'similarity',
            MOOD: 'mood',
            GENRE: 'genre',
            TEMPO: 'tempo',
            DISCOVERY: 'discovery',
            LISTENING_HISTORY: 'history',
            HYBRID: 'hybrid'
        };

        this.defaultRules = {
            minSimilarity: 0.7,
            maxRepeatArtist: 2,
            targetDuration: 3600000, // 1 heure en ms
            fadeInOut: true,
            avoidSkippedTracks: true,
            includeRecentDiscoveries: true,
            diversityFactor: 0.3
        };
    }

    /**
     * Générer une playlist basée sur des paramètres
     * @param {Object} params - Paramètres de génération
     * @param {string} params.userId - ID de l'utilisateur
     * @param {string} params.algorithm - Algorithme à utiliser
     * @param {Array} params.seedTracks - Tracks de base (optionnel)
     * @param {Array} params.seedArtists - Artistes de base (optionnel)
     * @param {Array} params.seedGenres - Genres de base (optionnel)
     * @param {Object} params.audioFeatures - Caractéristiques audio cibles
     * @param {Object} params.rules - Règles personnalisées
     * @param {number} params.targetSize - Nombre de tracks souhaité
     * @returns {Promise<Object>} Playlist générée
     */
    async generatePlaylist(params) {
        const {
            userId,
            algorithm = this.algorithms.HYBRID,
            seedTracks = [],
            seedArtists = [],
            seedGenres = [],
            audioFeatures = {},
            rules = {},
            targetSize = 30
        } = params;

        logger.info(`Génération de playlist pour l'utilisateur ${userId}`, {
            algorithm,
            seedTracks: seedTracks.length,
            seedArtists: seedArtists.length,
            seedGenres: seedGenres.length,
            targetSize
        });

        const combinedRules = { ...this.defaultRules, ...rules };
        const startTime = Date.now();

        try {
            // Récupérer le profil musical de l'utilisateur
            const userProfile = await this.getUserMusicProfile(userId);

            // Récupérer la bibliothèque de tracks disponibles
            const availableTracks = await this.getAvailableTracks(userId);

            if (availableTracks.length === 0) {
                throw new Error('Aucune track disponible pour générer une playlist');
            }

            let playlist;

            // Sélectionner l'algorithme approprié
            switch (algorithm) {
                case this.algorithms.SIMILARITY:
                    playlist = await this.generateSimilarityBasedPlaylist(
                        userProfile, availableTracks, seedTracks, combinedRules, targetSize
                    );
                    break;

                case this.algorithms.MOOD:
                    playlist = await this.generateMoodBasedPlaylist(
                        userProfile, availableTracks, audioFeatures, combinedRules, targetSize
                    );
                    break;

                case this.algorithms.GENRE:
                    playlist = await this.generateGenreBasedPlaylist(
                        userProfile, availableTracks, seedGenres, combinedRules, targetSize
                    );
                    break;

                case this.algorithms.TEMPO:
                    playlist = await this.generateTempoBasedPlaylist(
                        userProfile, availableTracks, audioFeatures, combinedRules, targetSize
                    );
                    break;

                case this.algorithms.DISCOVERY:
                    playlist = await this.generateDiscoveryPlaylist(
                        userProfile, availableTracks, combinedRules, targetSize
                    );
                    break;

                case this.algorithms.LISTENING_HISTORY:
                    playlist = await this.generateHistoryBasedPlaylist(
                        userProfile, availableTracks, combinedRules, targetSize
                    );
                    break;

                case this.algorithms.HYBRID:
                default:
                    playlist = await this.generateHybridPlaylist(
                        userProfile, availableTracks, {
                        seedTracks, seedArtists, seedGenres, audioFeatures
                    }, combinedRules, targetSize
                    );
                    break;
            }

            // Post-traitement de la playlist
            playlist = await this.postProcessPlaylist(playlist, combinedRules, userProfile);

            const duration = Date.now() - startTime;

            const result = {
                id: this.generatePlaylistId(),
                name: this.generatePlaylistName(algorithm, seedTracks, seedArtists, seedGenres),
                description: this.generatePlaylistDescription(algorithm, params),
                algorithm,
                tracks: playlist,
                metadata: {
                    generated: new Date().toISOString(),
                    userId,
                    algorithm,
                    rules: combinedRules,
                    seeds: { seedTracks, seedArtists, seedGenres },
                    audioFeatures,
                    generationTime: `${duration}ms`,
                    totalDuration: playlist.reduce((sum, track) => sum + (track.duration || 0), 0),
                    trackCount: playlist.length,
                    uniqueArtists: new Set(playlist.map(t => t.artist?.id).filter(Boolean)).size
                }
            };

            logger.info(`Playlist générée avec succès`, {
                playlistId: result.id,
                trackCount: result.tracks.length,
                duration: result.metadata.generationTime,
                algorithm
            });

            return result;

        } catch (error) {
            logger.error('Erreur lors de la génération de playlist:', error);
            throw error;
        }
    }

    /**
     * Générer une playlist basée sur la similarité
     * @param {Object} userProfile - Profil musical de l'utilisateur
     * @param {Array} availableTracks - Tracks disponibles
     * @param {Array} seedTracks - Tracks de base
     * @param {Object} rules - Règles de génération
     * @param {number} targetSize - Taille cible
     * @returns {Promise<Array>} Playlist générée
     */
    async generateSimilarityBasedPlaylist(userProfile, availableTracks, seedTracks, rules, targetSize) {
        if (seedTracks.length === 0) {
            // Utiliser les tracks favorites de l'utilisateur comme seeds
            seedTracks = userProfile.topTracks.slice(0, 5);
        }

        const playlist = [...seedTracks];
        const usedTrackIds = new Set(seedTracks.map(t => t.id));
        const artistCounts = new Map();

        // Compter les artistes dans les seeds
        seedTracks.forEach(track => {
            if (track.artist?.id) {
                artistCounts.set(track.artist.id, (artistCounts.get(track.artist.id) || 0) + 1);
            }
        });

        while (playlist.length < targetSize) {
            let bestTrack = null;
            let bestScore = 0;

            for (const track of availableTracks) {
                if (usedTrackIds.has(track.id)) continue;

                // Vérifier la règle de répétition d'artiste
                const artistCount = artistCounts.get(track.artist?.id) || 0;
                if (artistCount >= rules.maxRepeatArtist) continue;

                // Éviter les tracks souvent skip
                if (rules.avoidSkippedTracks && track.skipRatio > 0.5) continue;

                // Calculer le score de similarité
                const score = this.calculateSimilarityScore(seedTracks, track, userProfile);

                if (score > rules.minSimilarity && score > bestScore) {
                    bestScore = score;
                    bestTrack = track;
                }
            }

            if (!bestTrack) break;

            playlist.push(bestTrack);
            usedTrackIds.add(bestTrack.id);

            if (bestTrack.artist?.id) {
                artistCounts.set(bestTrack.artist.id, (artistCounts.get(bestTrack.artist.id) || 0) + 1);
            }
        }

        return playlist;
    }

    /**
     * Générer une playlist basée sur l'humeur
     * @param {Object} userProfile - Profil musical de l'utilisateur
     * @param {Array} availableTracks - Tracks disponibles
     * @param {Object} targetMood - Humeur cible
     * @param {Object} rules - Règles de génération
     * @param {number} targetSize - Taille cible
     * @returns {Promise<Array>} Playlist générée
     */
    async generateMoodBasedPlaylist(userProfile, availableTracks, targetMood, rules, targetSize) {
        const playlist = [];
        const usedTrackIds = new Set();
        const artistCounts = new Map();

        // Filtrer les tracks par humeur
        const moodTracks = availableTracks.filter(track => {
            return this.matchesMood(track.audioFeatures, targetMood);
        });

        // Trier par score d'humeur
        moodTracks.sort((a, b) => {
            const scoreA = this.calculateMoodScore(a.audioFeatures, targetMood);
            const scoreB = this.calculateMoodScore(b.audioFeatures, targetMood);
            return scoreB - scoreA;
        });

        for (const track of moodTracks) {
            if (playlist.length >= targetSize) break;
            if (usedTrackIds.has(track.id)) continue;

            const artistCount = artistCounts.get(track.artist?.id) || 0;
            if (artistCount >= rules.maxRepeatArtist) continue;

            if (rules.avoidSkippedTracks && track.skipRatio > 0.5) continue;

            playlist.push(track);
            usedTrackIds.add(track.id);

            if (track.artist?.id) {
                artistCounts.set(track.artist.id, artistCount + 1);
            }
        }

        return playlist;
    }

    /**
     * Générer une playlist hybride (combine plusieurs algorithmes)
     * @param {Object} userProfile - Profil musical de l'utilisateur
     * @param {Array} availableTracks - Tracks disponibles
     * @param {Object} seeds - Seeds de différents types
     * @param {Object} rules - Règles de génération
     * @param {number} targetSize - Taille cible
     * @returns {Promise<Array>} Playlist générée
     */
    async generateHybridPlaylist(userProfile, availableTracks, seeds, rules, targetSize) {
        const playlist = [];
        const usedTrackIds = new Set();
        const artistCounts = new Map();

        // Répartir la playlist selon différents algorithmes
        const distribution = {
            similarity: Math.floor(targetSize * 0.4), // 40% similarité
            mood: Math.floor(targetSize * 0.2),       // 20% humeur
            discovery: Math.floor(targetSize * 0.2),  // 20% découverte
            history: Math.floor(targetSize * 0.2)     // 20% historique
        };

        // Ajuster pour atteindre la taille cible exacte
        const total = Object.values(distribution).reduce((sum, val) => sum + val, 0);
        distribution.similarity += targetSize - total;

        // Générer les segments
        const segments = {};

        if (distribution.similarity > 0) {
            segments.similarity = await this.generateSimilarityBasedPlaylist(
                userProfile, availableTracks, seeds.seedTracks, rules, distribution.similarity
            );
        }

        if (distribution.mood > 0) {
            segments.mood = await this.generateMoodBasedPlaylist(
                userProfile, availableTracks, seeds.audioFeatures, rules, distribution.mood
            );
        }

        if (distribution.discovery > 0) {
            segments.discovery = await this.generateDiscoveryPlaylist(
                userProfile, availableTracks, rules, distribution.discovery
            );
        }

        if (distribution.history > 0) {
            segments.history = await this.generateHistoryBasedPlaylist(
                userProfile, availableTracks, rules, distribution.history
            );
        }

        // Entrelacer les segments pour créer une playlist cohérente
        return this.interleaveSegments(segments, rules);
    }

    /**
     * Générer une playlist de découverte
     * @param {Object} userProfile - Profil musical de l'utilisateur
     * @param {Array} availableTracks - Tracks disponibles
     * @param {Object} rules - Règles de génération
     * @param {number} targetSize - Taille cible
     * @returns {Promise<Array>} Playlist générée
     */
    async generateDiscoveryPlaylist(userProfile, availableTracks, rules, targetSize) {
        const playlist = [];
        const usedTrackIds = new Set();
        const artistCounts = new Map();

        // Filtrer les tracks non écoutées ou peu écoutées
        const discoveryTracks = availableTracks.filter(track => {
            return !userProfile.listenedTrackIds.has(track.id) || track.playCount < 3;
        });

        // Trier par potentiel de découverte (basé sur le profil utilisateur)
        discoveryTracks.sort((a, b) => {
            const scoreA = this.calculateDiscoveryScore(a, userProfile);
            const scoreB = this.calculateDiscoveryScore(b, userProfile);
            return scoreB - scoreA;
        });

        for (const track of discoveryTracks) {
            if (playlist.length >= targetSize) break;
            if (usedTrackIds.has(track.id)) continue;

            const artistCount = artistCounts.get(track.artist?.id) || 0;
            if (artistCount >= rules.maxRepeatArtist) continue;

            playlist.push(track);
            usedTrackIds.add(track.id);

            if (track.artist?.id) {
                artistCounts.set(track.artist.id, artistCount + 1);
            }
        }

        return playlist;
    }

    /**
     * Générer une playlist basée sur l'historique d'écoute
     * @param {Object} userProfile - Profil musical de l'utilisateur
     * @param {Array} availableTracks - Tracks disponibles
     * @param {Object} rules - Règles de génération
     * @param {number} targetSize - Taille cible
     * @returns {Promise<Array>} Playlist générée
     */
    async generateHistoryBasedPlaylist(userProfile, availableTracks, rules, targetSize) {
        const playlist = [];
        const usedTrackIds = new Set();
        const artistCounts = new Map();

        // Filtrer et trier par préférence historique
        const historyTracks = availableTracks.filter(track => {
            return userProfile.listenedTrackIds.has(track.id) && track.skipRatio < 0.3;
        });

        historyTracks.sort((a, b) => {
            // Score basé sur le nombre d'écoutes, la récence, et le taux de completion
            const scoreA = this.calculateHistoryScore(a, userProfile);
            const scoreB = this.calculateHistoryScore(b, userProfile);
            return scoreB - scoreA;
        });

        for (const track of historyTracks) {
            if (playlist.length >= targetSize) break;
            if (usedTrackIds.has(track.id)) continue;

            const artistCount = artistCounts.get(track.artist?.id) || 0;
            if (artistCount >= rules.maxRepeatArtist) continue;

            playlist.push(track);
            usedTrackIds.add(track.id);

            if (track.artist?.id) {
                artistCounts.set(track.artist.id, artistCount + 1);
            }
        }

        return playlist;
    }

    /**
     * Calculer le score de similarité entre des seeds et une track
     * @param {Array} seedTracks - Tracks de référence
     * @param {Object} track - Track à évaluer
     * @param {Object} userProfile - Profil utilisateur
     * @returns {number} Score de similarité (0-1)
     */
    calculateSimilarityScore(seedTracks, track, userProfile) {
        let totalScore = 0;
        let factors = 0;

        // Similarité des audio features
        if (track.audioFeatures) {
            const avgFeatures = this.calculateAverageAudioFeatures(seedTracks);
            if (avgFeatures) {
                totalScore += this.compareAudioFeatures(avgFeatures, track.audioFeatures);
                factors++;
            }
        }

        // Similarité des genres
        const seedGenres = new Set();
        seedTracks.forEach(seed => {
            if (seed.artist?.genres) {
                seed.artist.genres.forEach(genre => seedGenres.add(genre));
            }
        });

        if (track.artist?.genres && seedGenres.size > 0) {
            const commonGenres = track.artist.genres.filter(genre => seedGenres.has(genre));
            totalScore += commonGenres.length / Math.max(seedGenres.size, track.artist.genres.length);
            factors++;
        }

        // Bonus pour les artistes similaires dans l'historique utilisateur
        if (userProfile.preferredArtists.has(track.artist?.id)) {
            totalScore += 0.3;
            factors++;
        }

        return factors > 0 ? totalScore / factors : 0;
    }

    /**
     * Calculer le score d'humeur
     * @param {Object} audioFeatures - Caractéristiques audio de la track
     * @param {Object} targetMood - Humeur cible
     * @returns {number} Score d'humeur (0-1)
     */
    calculateMoodScore(audioFeatures, targetMood) {
        if (!audioFeatures) return 0;

        let score = 0;
        let factors = 0;

        const moodFeatures = ['valence', 'energy', 'danceability', 'acousticness'];

        moodFeatures.forEach(feature => {
            if (audioFeatures[feature] !== undefined && targetMood[feature] !== undefined) {
                const difference = Math.abs(audioFeatures[feature] - targetMood[feature]);
                score += 1 - difference;
                factors++;
            }
        });

        return factors > 0 ? score / factors : 0;
    }

    /**
     * Calculer le score de découverte
     * @param {Object} track - Track à évaluer
     * @param {Object} userProfile - Profil utilisateur
     * @returns {number} Score de découverte
     */
    calculateDiscoveryScore(track, userProfile) {
        let score = 0;

        // Bonus pour les artistes similaires aux préférences
        if (track.artist?.genres) {
            const commonGenres = track.artist.genres.filter(genre =>
                userProfile.preferredGenres.has(genre)
            );
            score += commonGenres.length * 0.2;
        }

        // Bonus pour la popularité (ni trop populaire, ni trop obscure)
        if (track.popularity !== undefined) {
            const idealPopularity = 0.4; // 40% de popularité idéale pour la découverte
            const popularityScore = 1 - Math.abs(track.popularity - idealPopularity);
            score += popularityScore * 0.3;
        }

        // Bonus pour la récence
        if (track.releaseDate) {
            const monthsAgo = (Date.now() - new Date(track.releaseDate).getTime()) / (1000 * 60 * 60 * 24 * 30);
            if (monthsAgo < 12) { // Sorti dans les 12 derniers mois
                score += (12 - monthsAgo) / 12 * 0.2;
            }
        }

        return score;
    }

    /**
     * Calculer le score basé sur l'historique
     * @param {Object} track - Track à évaluer
     * @param {Object} userProfile - Profil utilisateur
     * @returns {number} Score d'historique
     */
    calculateHistoryScore(track, userProfile) {
        let score = 0;

        // Score basé sur le nombre d'écoutes
        if (track.playCount) {
            score += Math.min(track.playCount / 10, 1) * 0.4;
        }

        // Score basé sur le taux de completion
        if (track.completionRate) {
            score += track.completionRate * 0.3;
        }

        // Score basé sur la récence d'écoute
        if (track.lastPlayed) {
            const daysAgo = (Date.now() - new Date(track.lastPlayed).getTime()) / (1000 * 60 * 60 * 24);
            score += Math.max(0, 1 - daysAgo / 30) * 0.3; // Plus récent = meilleur score
        }

        return score;
    }

    /**
     * Post-traiter la playlist (optimiser l'ordre, transitions, etc.)
     * @param {Array} playlist - Playlist à post-traiter
     * @param {Object} rules - Règles de génération
     * @param {Object} userProfile - Profil utilisateur
     * @returns {Promise<Array>} Playlist optimisée
     */
    async postProcessPlaylist(playlist, rules, userProfile) {
        // Optimiser l'ordre pour de meilleures transitions
        if (playlist.length > 2) {
            playlist = this.optimizeTrackOrder(playlist);
        }

        // Ajouter des métadonnées de transition
        playlist = playlist.map((track, index) => ({
            ...track,
            position: index + 1,
            transitionScore: index > 0 ? this.calculateTransitionScore(playlist[index - 1], track) : null
        }));

        return playlist;
    }

    /**
     * Optimiser l'ordre des tracks pour de meilleures transitions
     * @param {Array} tracks - Tracks à réorganiser
     * @returns {Array} Tracks réorganisées
     */
    optimizeTrackOrder(tracks) {
        if (tracks.length <= 2) return tracks;

        const optimized = [tracks[0]];
        const remaining = tracks.slice(1);

        while (remaining.length > 0) {
            const lastTrack = optimized[optimized.length - 1];
            let bestIndex = 0;
            let bestScore = -1;

            remaining.forEach((track, index) => {
                const score = this.calculateTransitionScore(lastTrack, track);
                if (score > bestScore) {
                    bestScore = score;
                    bestIndex = index;
                }
            });

            optimized.push(remaining[bestIndex]);
            remaining.splice(bestIndex, 1);
        }

        return optimized;
    }

    /**
     * Calculer le score de transition entre deux tracks
     * @param {Object} track1 - Première track
     * @param {Object} track2 - Deuxième track
     * @returns {number} Score de transition (0-1)
     */
    calculateTransitionScore(track1, track2) {
        let score = 0;
        let factors = 0;

        // Similarité des audio features pour une transition fluide
        if (track1.audioFeatures && track2.audioFeatures) {
            score += this.compareAudioFeatures(track1.audioFeatures, track2.audioFeatures);
            factors++;
        }

        // Bonus si même artiste ou artistes collaboratifs
        if (track1.artist?.id === track2.artist?.id) {
            score += 0.3;
            factors++;
        }

        // Similarité de tempo
        if (track1.audioFeatures?.tempo && track2.audioFeatures?.tempo) {
            const tempoDiff = Math.abs(track1.audioFeatures.tempo - track2.audioFeatures.tempo);
            score += Math.max(0, 1 - tempoDiff / 50); // 50 BPM de différence max
            factors++;
        }

        return factors > 0 ? score / factors : 0.5;
    }

    /**
     * Comparer les audio features de deux tracks
     * @param {Object} features1 - Audio features de la première track
     * @param {Object} features2 - Audio features de la deuxième track
     * @returns {number} Score de similarité (0-1)
     */
    compareAudioFeatures(features1, features2) {
        const featuresToCompare = ['energy', 'valence', 'danceability', 'acousticness', 'instrumentalness'];
        let totalSimilarity = 0;
        let validFeatures = 0;

        featuresToCompare.forEach(feature => {
            if (features1[feature] !== undefined && features2[feature] !== undefined) {
                const similarity = 1 - Math.abs(features1[feature] - features2[feature]);
                totalSimilarity += similarity;
                validFeatures++;
            }
        });

        return validFeatures > 0 ? totalSimilarity / validFeatures : 0;
    }

    /**
     * Calculer la moyenne des audio features pour un ensemble de tracks
     * @param {Array} tracks - Tracks avec audio features
     * @returns {Object|null} Audio features moyennes
     */
    calculateAverageAudioFeatures(tracks) {
        const tracksWithFeatures = tracks.filter(t => t.audioFeatures);
        if (tracksWithFeatures.length === 0) return null;

        const features = ['energy', 'valence', 'danceability', 'acousticness', 'instrumentalness', 'tempo'];
        const averages = {};

        features.forEach(feature => {
            const values = tracksWithFeatures
                .map(t => t.audioFeatures[feature])
                .filter(v => v !== undefined);

            if (values.length > 0) {
                averages[feature] = values.reduce((sum, val) => sum + val, 0) / values.length;
            }
        });

        return averages;
    }

    /**
     * Vérifier si une track correspond à une humeur donnée
     * @param {Object} audioFeatures - Audio features de la track
     * @param {Object} targetMood - Humeur cible
     * @returns {boolean} True si la track correspond
     */
    matchesMood(audioFeatures, targetMood) {
        if (!audioFeatures || !targetMood) return false;

        const tolerance = 0.3; // Tolérance pour la correspondance d'humeur

        return Object.keys(targetMood).every(feature => {
            if (audioFeatures[feature] === undefined) return true;
            return Math.abs(audioFeatures[feature] - targetMood[feature]) <= tolerance;
        });
    }

    /**
     * Entrelacer les segments de playlist
     * @param {Object} segments - Segments de playlist par algorithme
     * @param {Object} rules - Règles de génération
     * @returns {Array} Playlist entrelacée
     */
    interleaveSegments(segments, rules) {
        const result = [];
        const segmentKeys = Object.keys(segments);
        const maxLength = Math.max(...Object.values(segments).map(s => s.length));

        for (let i = 0; i < maxLength; i++) {
            segmentKeys.forEach(key => {
                if (segments[key][i]) {
                    result.push(segments[key][i]);
                }
            });
        }

        return result;
    }

    /**
     * Obtenir le profil musical de l'utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Profil musical
     */
    async getUserMusicProfile(userId) {
        try {
            // Récupérer les statistiques d'écoute de l'utilisateur
            const user = await db.findById('users', userId);
            if (!user) {
                throw new Error('Utilisateur introuvable');
            }

            // Récupérer les tracks les plus écoutées
            const topTracksQuery = `
                SELECT 
                    t.*,
                    COUNT(lh.id) as play_count,
                    AVG(lh.completion_rate) as avg_completion_rate,
                    a.name as artist_name,
                    al.title as album_title
                FROM listening_history lh
                JOIN tracks t ON lh.track_id = t.id
                LEFT JOIN artists a ON t.artist_id = a.id
                LEFT JOIN albums al ON t.album_id = al.id
                WHERE lh.user_id = $1 
                    AND lh.action_type = 'play'
                    AND lh.played_at > NOW() - INTERVAL '30 days'
                GROUP BY t.id, a.name, al.title
                ORDER BY play_count DESC, avg_completion_rate DESC
                LIMIT 50
            `;

            const topTracksResult = await db.query(topTracksQuery, [userId]);

            // Récupérer les artistes préférés
            const topArtistsQuery = `
                SELECT 
                    a.*,
                    COUNT(lh.id) as play_count,
                    AVG(lh.completion_rate) as avg_completion_rate
                FROM listening_history lh
                JOIN tracks t ON lh.track_id = t.id
                JOIN artists a ON t.artist_id = a.id
                WHERE lh.user_id = $1 
                    AND lh.action_type = 'play'
                    AND lh.played_at > NOW() - INTERVAL '30 days'
                GROUP BY a.id
                ORDER BY play_count DESC
                LIMIT 20
            `;

            const topArtistsResult = await db.query(topArtistsQuery, [userId]);

            // Récupérer les genres préférés
            const genresQuery = `
                SELECT 
                    genre,
                    COUNT(*) as play_count
                FROM listening_history lh
                JOIN tracks t ON lh.track_id = t.id
                JOIN artists a ON t.artist_id = a.id,
                jsonb_array_elements_text(a.genres) as genre
                WHERE lh.user_id = $1 
                    AND lh.action_type = 'play'
                    AND lh.played_at > NOW() - INTERVAL '30 days'
                GROUP BY genre
                ORDER BY play_count DESC
                LIMIT 10
            `;

            const genresResult = await db.query(genresQuery, [userId]);

            // Calculer les caractéristiques audio moyennes
            const audioFeaturesQuery = `
                SELECT 
                    AVG((t.audio_features->>'danceability')::float) as avg_danceability,
                    AVG((t.audio_features->>'energy')::float) as avg_energy,
                    AVG((t.audio_features->>'valence')::float) as avg_valence,
                    AVG((t.audio_features->>'tempo')::float) as avg_tempo
                FROM listening_history lh
                JOIN tracks t ON lh.track_id = t.id
                WHERE lh.user_id = $1 
                    AND lh.action_type = 'play'
                    AND lh.played_at > NOW() - INTERVAL '30 days'
                    AND t.audio_features IS NOT NULL
            `;

            const audioFeaturesResult = await db.query(audioFeaturesQuery, [userId]);

            // Récupérer les IDs des tracks déjà écoutées
            const listenedTracksQuery = `
                SELECT DISTINCT track_id
                FROM listening_history
                WHERE user_id = $1
            `;

            const listenedTracksResult = await db.query(listenedTracksQuery, [userId]);

            const profile = {
                topTracks: topTracksResult.rows.map(row => ({
                    id: row.id,
                    title: row.title,
                    artist: {
                        id: row.artist_id,
                        name: row.artist_name
                    },
                    album: {
                        id: row.album_id,
                        title: row.album_title
                    },
                    duration: row.duration,
                    audioFeatures: row.audio_features,
                    playCount: parseInt(row.play_count),
                    avgCompletionRate: parseFloat(row.avg_completion_rate)
                })),
                topArtists: topArtistsResult.rows.map(row => ({
                    id: row.id,
                    name: row.name,
                    genres: row.genres,
                    playCount: parseInt(row.play_count),
                    avgCompletionRate: parseFloat(row.avg_completion_rate)
                })),
                preferredGenres: new Set(genresResult.rows.map(row => row.genre)),
                preferredArtists: new Set(topArtistsResult.rows.map(row => row.id)),
                listenedTrackIds: new Set(listenedTracksResult.rows.map(row => row.track_id)),
                avgAudioFeatures: audioFeaturesResult.rows[0] || {},
                listeningHabits: user.listening_stats || {},
                userPreferences: user.preferences || {}
            };

            return profile;

        } catch (error) {
            logger.error('Erreur lors de la récupération du profil musical:', error);
            // Retourner un profil vide en cas d'erreur
            return {
                topTracks: [],
                topArtists: [],
                preferredGenres: new Set(),
                preferredArtists: new Set(),
                listenedTrackIds: new Set(),
                avgAudioFeatures: {},
                listeningHabits: {},
                userPreferences: {}
            };
        }
    }

    /**
     * Obtenir les tracks disponibles pour l'utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<Array>} Tracks disponibles
     */
    async getAvailableTracks(userId) {
        try {
            // Récupérer toutes les tracks avec leurs métadonnées
            const tracksQuery = `
                SELECT 
                    t.*,
                    a.name as artist_name,
                    a.genres as artist_genres,
                    al.title as album_title,
                    al.release_date as album_release_date,
                    
                    -- Statistiques d'écoute pour cette track
                    COALESCE(stats.play_count, 0) as play_count,
                    COALESCE(stats.skip_count, 0) as skip_count,
                    COALESCE(stats.avg_completion_rate, 0) as avg_completion_rate,
                    CASE 
                        WHEN COALESCE(stats.play_count, 0) > 0 
                        THEN COALESCE(stats.skip_count, 0)::float / stats.play_count 
                        ELSE 0 
                    END as skip_ratio,
                    
                    -- Vérifier si déjà écoutée par cet utilisateur
                    CASE WHEN user_plays.track_id IS NOT NULL THEN true ELSE false END as already_played
                    
                FROM tracks t
                LEFT JOIN artists a ON t.artist_id = a.id
                LEFT JOIN albums al ON t.album_id = al.id
                
                -- Statistiques globales de la track
                LEFT JOIN (
                    SELECT 
                        track_id,
                        COUNT(CASE WHEN action_type = 'play' THEN 1 END) as play_count,
                        COUNT(CASE WHEN action_type = 'skip' THEN 1 END) as skip_count,
                        AVG(completion_rate) as avg_completion_rate
                    FROM listening_history
                    GROUP BY track_id
                ) stats ON t.id = stats.track_id
                
                -- Vérifier si déjà écoutée par l'utilisateur
                LEFT JOIN (
                    SELECT DISTINCT track_id 
                    FROM listening_history 
                    WHERE user_id = $1
                ) user_plays ON t.id = user_plays.track_id
                
                WHERE t.is_active = true
                ORDER BY 
                    COALESCE(stats.play_count, 0) DESC,
                    t.popularity DESC,
                    t.created_at DESC
                LIMIT 5000
            `;

            const tracksResult = await db.query(tracksQuery, [userId]);

            const availableTracks = tracksResult.rows.map(row => ({
                id: row.id,
                title: row.title,
                artist: {
                    id: row.artist_id,
                    name: row.artist_name,
                    genres: row.artist_genres || []
                },
                album: {
                    id: row.album_id,
                    title: row.album_title,
                    releaseDate: row.album_release_date
                },
                duration: row.duration,
                popularity: row.popularity,
                audioFeatures: row.audio_features || {},

                // Statistiques d'écoute
                playCount: parseInt(row.play_count),
                skipCount: parseInt(row.skip_count),
                avgCompletionRate: parseFloat(row.avg_completion_rate),
                skipRatio: parseFloat(row.skip_ratio),
                alreadyPlayed: row.already_played,

                // Métadonnées supplémentaires
                explicit: row.explicit,
                releaseDate: row.release_date,
                createdAt: row.created_at
            }));

            logger.info(`${availableTracks.length} tracks disponibles pour l'utilisateur ${userId}`);
            return availableTracks;

        } catch (error) {
            logger.error('Erreur lors de la récupération des tracks disponibles:', error);
            return [];
        }
    }

    /**
     * Générer un ID unique pour la playlist
     * @returns {string} ID de playlist
     */
    generatePlaylistId() {
        return `playlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Générer un nom pour la playlist
     * @param {string} algorithm - Algorithme utilisé
     * @param {Array} seedTracks - Tracks de base
     * @param {Array} seedArtists - Artistes de base
     * @param {Array} seedGenres - Genres de base
     * @returns {string} Nom de playlist
     */
    generatePlaylistName(algorithm, seedTracks, seedArtists, seedGenres) {
        const now = new Date();
        const timeStr = now.toLocaleString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });

        if (seedArtists.length > 0) {
            return `Mix ${seedArtists[0].name} - ${timeStr}`;
        }

        if (seedGenres.length > 0) {
            return `Mix ${seedGenres[0]} - ${timeStr}`;
        }

        const algorithmNames = {
            [this.algorithms.SIMILARITY]: 'Similaire',
            [this.algorithms.MOOD]: 'Humeur',
            [this.algorithms.GENRE]: 'Genre',
            [this.algorithms.TEMPO]: 'Tempo',
            [this.algorithms.DISCOVERY]: 'Découverte',
            [this.algorithms.LISTENING_HISTORY]: 'Favoris',
            [this.algorithms.HYBRID]: 'Mix Intelligent'
        };

        return `${algorithmNames[algorithm] || 'Mix'} - ${timeStr}`;
    }

    /**
     * Générer une description pour la playlist
     * @param {string} algorithm - Algorithme utilisé
     * @param {Object} params - Paramètres de génération
     * @returns {string} Description de playlist
     */
    generatePlaylistDescription(algorithm, params) {
        const descriptions = {
            [this.algorithms.SIMILARITY]: 'Playlist générée basée sur la similarité musicale',
            [this.algorithms.MOOD]: 'Playlist créée pour correspondre à votre humeur',
            [this.algorithms.GENRE]: 'Mix centré sur vos genres préférés',
            [this.algorithms.TEMPO]: 'Playlist optimisée par tempo et énergie',
            [this.algorithms.DISCOVERY]: 'Nouvelles découvertes musicales personnalisées',
            [this.algorithms.LISTENING_HISTORY]: 'Basée sur votre historique d\'écoute',
            [this.algorithms.HYBRID]: 'Mix intelligent combinant plusieurs algorithmes'
        };

        return descriptions[algorithm] || 'Playlist générée automatiquement par Echo';
    }
}

module.exports = new PlaylistBuilder();
