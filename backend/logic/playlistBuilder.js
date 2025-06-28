const { logger } = require('../utils/logger');

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
        // TODO: Récupérer depuis la base de données
        return {
            topTracks: [],
            topArtists: [],
            preferredGenres: new Set(),
            preferredArtists: new Set(),
            listenedTrackIds: new Set(),
            avgAudioFeatures: {},
            listeningHabits: {}
        };
    }

    /**
     * Obtenir les tracks disponibles pour l'utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<Array>} Tracks disponibles
     */
    async getAvailableTracks(userId) {
        // TODO: Récupérer depuis la base de données et les services
        return [];
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
