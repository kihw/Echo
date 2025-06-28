const spotifyService = require('./spotify');
const deezerService = require('./deezer');
const ytmusicService = require('./ytmusic');
const lidarrService = require('./lidarr');
const { logger, logExternalServiceError, logExternalServiceSuccess } = require('../utils/logger');
const pool = require('../../database/connection');
const { v4: uuidv4 } = require('uuid');

/**
 * Service de synchronisation des données
 * Coordonne la récupération et la synchronisation des données depuis tous les services externes
 */
class DataSyncService {
    constructor() {
        this.syncInProgress = false;
        this.lastSyncTime = null;
        this.syncResults = {};
    }

    /**
     * Synchroniser toutes les données utilisateur depuis tous les services
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} tokens - Tokens d'authentification pour les services
     * @returns {Promise<Object>} Résultats de la synchronisation
     */
    async syncAllUserData(userId, tokens) {
        if (this.syncInProgress) {
            throw new Error('Synchronisation déjà en cours');
        }

        this.syncInProgress = true;
        const startTime = Date.now();

        try {
            logger.info(`Début de la synchronisation complète pour l'utilisateur ${userId}`);

            // Enregistrer le début de la synchronisation
            const syncId = await this.createSyncRecord(userId);

            const results = {
                syncId,
                userId,
                startTime: new Date(startTime).toISOString(),
                services: {},
                summary: {
                    totalPlaylists: 0,
                    totalTracks: 0,
                    totalArtists: 0,
                    errors: 0
                }
            };

            // Synchroniser Spotify
            if (tokens.spotify) {
                try {
                    results.services.spotify = await this.syncSpotifyData(userId, tokens.spotify);
                    logExternalServiceSuccess('Spotify', 'full sync', { userId });
                } catch (error) {
                    logExternalServiceError('Spotify', 'full sync', error, { userId });
                    results.services.spotify = { error: error.message };
                    results.summary.errors++;
                }
            }

            // Synchroniser Deezer
            if (tokens.deezer) {
                try {
                    results.services.deezer = await this.syncDeezerData(userId, tokens.deezer);
                    logExternalServiceSuccess('Deezer', 'full sync', { userId });
                } catch (error) {
                    logExternalServiceError('Deezer', 'full sync', error, { userId });
                    results.services.deezer = { error: error.message };
                    results.summary.errors++;
                }
            }

            // Synchroniser YouTube Music
            if (tokens.google) {
                try {
                    results.services.ytmusic = await this.syncYTMusicData(userId, tokens.google);
                    logExternalServiceSuccess('YouTube Music', 'full sync', { userId });
                } catch (error) {
                    logExternalServiceError('YouTube Music', 'full sync', error, { userId });
                    results.services.ytmusic = { error: error.message };
                    results.summary.errors++;
                }
            }

            // Synchroniser Lidarr
            try {
                results.services.lidarr = await this.syncLidarrData(userId);
                logExternalServiceSuccess('Lidarr', 'full sync', { userId });
            } catch (error) {
                logExternalServiceError('Lidarr', 'full sync', error, { userId });
                results.services.lidarr = { error: error.message };
                results.summary.errors++;
            }

            // Calculer les totaux
            Object.values(results.services).forEach(service => {
                if (service.playlists) results.summary.totalPlaylists += service.playlists.length;
                if (service.tracks) results.summary.totalTracks += service.tracks.length;
                if (service.artists) results.summary.totalArtists += service.artists.length;
            });

            const duration = Date.now() - startTime;
            results.endTime = new Date().toISOString();
            results.duration = `${duration}ms`;

            // Sauvegarder les résultats de synchronisation
            await this.saveSyncResults(userId, results);

            this.lastSyncTime = new Date();
            this.syncResults = results;

            logger.info(`Synchronisation complète terminée pour l'utilisateur ${userId}`, {
                duration: results.duration,
                summary: results.summary
            });

            return results;

        } catch (error) {
            logger.error('Erreur lors de la synchronisation complète:', error);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Synchroniser les données Spotify
     * @param {string} userId - ID de l'utilisateur
     * @param {string} accessToken - Token d'accès Spotify
     * @returns {Promise<Object>} Données Spotify synchronisées
     */
    async syncSpotifyData(userId, accessToken) {
        logger.info('Synchronisation des données Spotify');

        const results = {
            profile: null,
            playlists: [],
            topTracks: [],
            topArtists: [],
            tracks: [],
            errors: []
        };

        try {
            // Profil utilisateur
            results.profile = await spotifyService.getUserProfile(accessToken);

            // Playlists utilisateur
            let allPlaylists = [];
            let offset = 0;
            const limit = 50;

            while (true) {
                const playlistsResponse = await spotifyService.getUserPlaylists(accessToken, limit, offset);
                allPlaylists = allPlaylists.concat(playlistsResponse.playlists);

                if (playlistsResponse.playlists.length < limit) break;
                offset += limit;
            }

            results.playlists = allPlaylists;

            // Pour chaque playlist, récupérer les tracks
            for (const playlist of allPlaylists) {
                try {
                    let playlistTracks = [];
                    let trackOffset = 0;
                    const trackLimit = 100;

                    while (true) {
                        const tracksResponse = await spotifyService.getPlaylistTracks(
                            accessToken,
                            playlist.id,
                            trackLimit,
                            trackOffset
                        );

                        playlistTracks = playlistTracks.concat(tracksResponse.tracks);

                        if (tracksResponse.tracks.length < trackLimit) break;
                        trackOffset += trackLimit;
                    }

                    playlist.tracks = playlistTracks;
                    results.tracks = results.tracks.concat(playlistTracks.map(t => t.track).filter(Boolean));

                } catch (error) {
                    results.errors.push(`Erreur playlist ${playlist.name}: ${error.message}`);
                }
            }

            // Top tracks et artists
            results.topTracks = await spotifyService.getUserTopTracks(accessToken, 'medium_term', 50);
            results.topArtists = await spotifyService.getUserTopArtists(accessToken, 'medium_term', 50);

        } catch (error) {
            logger.error('Erreur lors de la synchronisation Spotify:', error);
            throw error;
        }

        // Sauvegarder en base de données
        await this.saveSpotifyData(userId, results);

        return results;
    }

    /**
     * Synchroniser les données Deezer
     * @param {string} userId - ID de l'utilisateur
     * @param {string} accessToken - Token d'accès Deezer
     * @returns {Promise<Object>} Données Deezer synchronisées
     */
    async syncDeezerData(userId, accessToken) {
        logger.info('Synchronisation des données Deezer');

        const results = {
            profile: null,
            playlists: [],
            favoriteTracks: [],
            favoriteArtists: [],
            favoriteAlbums: [],
            tracks: [],
            errors: []
        };

        try {
            // Profil utilisateur
            results.profile = await deezerService.getUserProfile(accessToken);

            // Playlists utilisateur
            let allPlaylists = [];
            let index = 0;
            const limit = 25;

            while (true) {
                const playlistsResponse = await deezerService.getUserPlaylists(accessToken, limit, index);
                allPlaylists = allPlaylists.concat(playlistsResponse.playlists);

                if (playlistsResponse.playlists.length < limit) break;
                index += limit;
            }

            results.playlists = allPlaylists;

            // Pour chaque playlist, récupérer les tracks
            for (const playlist of allPlaylists) {
                try {
                    let playlistTracks = [];
                    let trackIndex = 0;
                    const trackLimit = 50;

                    while (true) {
                        const tracksResponse = await deezerService.getPlaylistTracks(
                            accessToken,
                            playlist.id,
                            trackLimit,
                            trackIndex
                        );

                        playlistTracks = playlistTracks.concat(tracksResponse.tracks);

                        if (tracksResponse.tracks.length < trackLimit) break;
                        trackIndex += trackLimit;
                    }

                    playlist.tracks = playlistTracks;
                    results.tracks = results.tracks.concat(playlistTracks);

                } catch (error) {
                    results.errors.push(`Erreur playlist ${playlist.title}: ${error.message}`);
                }
            }

            // Favoris
            results.favoriteTracks = await deezerService.getUserFavoriteTracks(accessToken, 200);
            results.favoriteArtists = await deezerService.getUserFavoriteArtists(accessToken, 100);
            results.favoriteAlbums = await deezerService.getUserFavoriteAlbums(accessToken, 100);

        } catch (error) {
            logger.error('Erreur lors de la synchronisation Deezer:', error);
            throw error;
        }

        // Sauvegarder en base de données
        await this.saveDeezerData(userId, results);

        return results;
    }

    /**
     * Synchroniser les données YouTube Music
     * @param {string} userId - ID de l'utilisateur
     * @param {string} accessToken - Token d'accès Google
     * @returns {Promise<Object>} Données YouTube Music synchronisées
     */
    async syncYTMusicData(userId, accessToken) {
        logger.info('Synchronisation des données YouTube Music');

        const results = {
            channel: null,
            playlists: [],
            likedVideos: [],
            tracks: [],
            errors: []
        };

        try {
            // Informations du canal
            results.channel = await ytmusicService.getChannelInfo(accessToken);

            // Playlists utilisateur
            let allPlaylists = [];
            let pageToken = null;

            do {
                const playlistsResponse = await ytmusicService.getUserPlaylists(accessToken, 50, pageToken);
                allPlaylists = allPlaylists.concat(playlistsResponse.playlists);
                pageToken = playlistsResponse.nextPageToken;
            } while (pageToken);

            results.playlists = allPlaylists;

            // Pour chaque playlist, récupérer les vidéos
            for (const playlist of allPlaylists) {
                try {
                    let playlistItems = [];
                    let itemPageToken = null;

                    do {
                        const itemsResponse = await ytmusicService.getPlaylistItems(
                            accessToken,
                            playlist.id,
                            50,
                            itemPageToken
                        );

                        playlistItems = playlistItems.concat(itemsResponse.items);
                        itemPageToken = itemsResponse.nextPageToken;
                    } while (itemPageToken);

                    playlist.items = playlistItems;

                    // Récupérer les détails des vidéos
                    const videoIds = playlistItems.map(item => item.videoId).filter(Boolean);
                    if (videoIds.length > 0) {
                        const videosDetails = await ytmusicService.getVideosDetails(accessToken, videoIds);
                        const musicVideos = videosDetails.videos.map(video =>
                            ytmusicService.extractMusicInfo(video)
                        ).filter(video => video.isMusic);

                        results.tracks = results.tracks.concat(musicVideos);
                    }

                } catch (error) {
                    results.errors.push(`Erreur playlist ${playlist.title}: ${error.message}`);
                }
            }

            // Vidéos likées
            results.likedVideos = await ytmusicService.getLikedVideos(accessToken, 200);

        } catch (error) {
            logger.error('Erreur lors de la synchronisation YouTube Music:', error);
            throw error;
        }

        // Sauvegarder en base de données
        await this.saveYTMusicData(userId, results);

        return results;
    }

    /**
     * Synchroniser les données Lidarr
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Données Lidarr synchronisées
     */
    async syncLidarrData(userId) {
        logger.info('Synchronisation des données Lidarr');

        const results = {
            artists: [],
            albums: [],
            tracks: [],
            systemStatus: null,
            errors: []
        };

        try {
            // Statut du système
            results.systemStatus = await lidarrService.getSystemStatus();

            // Artistes avec statistiques
            results.artists = await lidarrService.getArtists(true);

            // Pour chaque artiste, récupérer les albums et tracks
            for (const artist of results.artists) {
                try {
                    const albums = await lidarrService.getArtistAlbums(artist.id, true);
                    results.albums = results.albums.concat(albums);

                    for (const album of albums) {
                        try {
                            const tracks = await lidarrService.getAlbumTracks(album.id);
                            results.tracks = results.tracks.concat(tracks);
                        } catch (error) {
                            results.errors.push(`Erreur tracks album ${album.title}: ${error.message}`);
                        }
                    }

                } catch (error) {
                    results.errors.push(`Erreur albums artiste ${artist.artistName}: ${error.message}`);
                }
            }

        } catch (error) {
            logger.error('Erreur lors de la synchronisation Lidarr:', error);
            throw error;
        }

        // Sauvegarder en base de données
        await this.saveLidarrData(userId, results);

        return results;
    }

    /**
     * Sauvegarder les données Spotify en base
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} data - Données Spotify
     */
    async saveSpotifyData(userId, data) {
        // TODO: Implémenter la sauvegarde en base de données
        logger.info(`Sauvegarde des données Spotify pour l'utilisateur ${userId}`, {
            playlists: data.playlists.length,
            tracks: data.tracks.length
        });
    }

    /**
     * Sauvegarder les données Deezer en base
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} data - Données Deezer
     */
    async saveDeezerData(userId, data) {
        // TODO: Implémenter la sauvegarde en base de données
        logger.info(`Sauvegarde des données Deezer pour l'utilisateur ${userId}`, {
            playlists: data.playlists.length,
            tracks: data.tracks.length
        });
    }

    /**
     * Sauvegarder les données YouTube Music en base
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} data - Données YouTube Music
     */
    async saveYTMusicData(userId, data) {
        // TODO: Implémenter la sauvegarde en base de données
        logger.info(`Sauvegarde des données YouTube Music pour l'utilisateur ${userId}`, {
            playlists: data.playlists.length,
            tracks: data.tracks.length
        });
    }

    /**
     * Sauvegarder les données Lidarr en base
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} data - Données Lidarr
     */
    async saveLidarrData(userId, data) {
        // TODO: Implémenter la sauvegarde en base de données
        logger.info(`Sauvegarde des données Lidarr pour l'utilisateur ${userId}`, {
            artists: data.artists.length,
            albums: data.albums.length,
            tracks: data.tracks.length
        });
    }

    /**
     * Sauvegarder les résultats de synchronisation
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} results - Résultats de synchronisation
     */
    async saveSyncResults(userId, results) {
        try {
            // TODO: Sauvegarder en base de données
            logger.info(`Résultats de synchronisation sauvegardés pour l'utilisateur ${userId}`);
        } catch (error) {
            logger.error('Erreur lors de la sauvegarde des résultats de sync:', error);
        }
    }

    /**
     * Obtenir le statut de la synchronisation
     * @returns {Object} Statut actuel
     */
    getSyncStatus() {
        return {
            inProgress: this.syncInProgress,
            lastSyncTime: this.lastSyncTime,
            lastResults: this.syncResults
        };
    }

    /**
     * Synchronisation incrémentielle (uniquement les nouveautés)
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} tokens - Tokens d'authentification
     * @param {Date} since - Date depuis laquelle synchroniser
     * @returns {Promise<Object>} Résultats de la synchronisation incrémentielle
     */
    async incrementalSync(userId, tokens, since) {
        logger.info(`Début de la synchronisation incrémentielle pour l'utilisateur ${userId} depuis ${since}`);

        // TODO: Implémenter la synchronisation incrémentielle
        // - Comparer les dates de modification
        // - Ne synchroniser que les données modifiées
        // - Optimiser les requêtes API

        throw new Error('Synchronisation incrémentielle non encore implémentée');
    }
}

module.exports = new DataSyncService();
