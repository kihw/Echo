const spotifyService = require('./spotify');
const deezerService = require('./deezer');
const ytmusicService = require('./ytmusic');
const lidarrService = require('./lidarr');
const { logger, logExternalServiceError, logExternalServiceSuccess } = require('../utils/logger');
const db = require('../../database/connection');
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
        try {
            await db.transaction(async (client) => {
                // Sauvegarder les artistes
                for (const artist of data.artists || []) {
                    await client.query(`
                        INSERT INTO artists (id, name, genres, spotify_id, popularity, image_url)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (spotify_id) DO UPDATE SET
                            name = EXCLUDED.name,
                            genres = EXCLUDED.genres,
                            popularity = EXCLUDED.popularity,
                            image_url = EXCLUDED.image_url,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        artist.id || uuidv4(),
                        artist.name,
                        JSON.stringify(artist.genres || []),
                        artist.id,
                        artist.popularity || 0,
                        artist.images?.[0]?.url
                    ]);
                }

                // Sauvegarder les albums
                for (const album of data.albums || []) {
                    await client.query(`
                        INSERT INTO albums (id, title, artist_id, spotify_id, release_date, image_url)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (spotify_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            release_date = EXCLUDED.release_date,
                            image_url = EXCLUDED.image_url,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        album.id || uuidv4(),
                        album.name,
                        album.artists?.[0]?.id,
                        album.id,
                        album.release_date,
                        album.images?.[0]?.url
                    ]);
                }

                // Sauvegarder les tracks
                for (const track of data.tracks || []) {
                    await client.query(`
                        INSERT INTO tracks (id, title, artist_id, album_id, spotify_id, duration, popularity, audio_features)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (spotify_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            duration = EXCLUDED.duration,
                            popularity = EXCLUDED.popularity,
                            audio_features = EXCLUDED.audio_features,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        track.id || uuidv4(),
                        track.name,
                        track.artists?.[0]?.id,
                        track.album?.id,
                        track.id,
                        track.duration_ms,
                        track.popularity || 0,
                        JSON.stringify(track.audio_features || {})
                    ]);
                }

                // Sauvegarder les playlists
                for (const playlist of data.playlists || []) {
                    const playlistId = uuidv4();
                    await client.query(`
                        INSERT INTO playlists (id, name, description, user_id, spotify_id, is_public, source)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT (spotify_id) DO UPDATE SET
                            name = EXCLUDED.name,
                            description = EXCLUDED.description,
                            is_public = EXCLUDED.is_public,
                            updated_at = CURRENT_TIMESTAMP
                        RETURNING id
                    `, [
                        playlistId,
                        playlist.name,
                        playlist.description,
                        userId,
                        playlist.id,
                        playlist.public,
                        'spotify'
                    ]);

                    // Sauvegarder les tracks de la playlist
                    if (playlist.tracks?.items) {
                        for (let i = 0; i < playlist.tracks.items.length; i++) {
                            const item = playlist.tracks.items[i];
                            await client.query(`
                                INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
                                VALUES ($1, $2, $3, $4)
                                ON CONFLICT (playlist_id, track_id, position) DO NOTHING
                            `, [
                                playlistId,
                                item.track.id,
                                i + 1,
                                item.added_at
                            ]);
                        }
                    }
                }
            });

            logger.info(`Données Spotify sauvegardées pour l'utilisateur ${userId}`, {
                playlists: data.playlists?.length || 0,
                tracks: data.tracks?.length || 0,
                artists: data.artists?.length || 0,
                albums: data.albums?.length || 0
            });

        } catch (error) {
            logger.error('Erreur lors de la sauvegarde des données Spotify:', error);
            throw error;
        }
    }

    /**
     * Sauvegarder les données Deezer en base
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} data - Données Deezer
     */
    async saveDeezerData(userId, data) {
        try {
            await db.transaction(async (client) => {
                // Sauvegarder les artistes
                for (const artist of data.artists || []) {
                    await client.query(`
                        INSERT INTO artists (id, name, deezer_id, image_url)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (deezer_id) DO UPDATE SET
                            name = EXCLUDED.name,
                            image_url = EXCLUDED.image_url,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        artist.id || uuidv4(),
                        artist.name,
                        artist.id,
                        artist.picture_medium
                    ]);
                }

                // Sauvegarder les albums
                for (const album of data.albums || []) {
                    await client.query(`
                        INSERT INTO albums (id, title, artist_id, deezer_id, release_date, image_url)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (deezer_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            release_date = EXCLUDED.release_date,
                            image_url = EXCLUDED.image_url,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        album.id || uuidv4(),
                        album.title,
                        album.artist?.id,
                        album.id,
                        album.release_date,
                        album.cover_medium
                    ]);
                }

                // Sauvegarder les tracks
                for (const track of data.tracks || []) {
                    await client.query(`
                        INSERT INTO tracks (id, title, artist_id, album_id, deezer_id, duration, popularity)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT (deezer_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            duration = EXCLUDED.duration,
                            popularity = EXCLUDED.popularity,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        track.id || uuidv4(),
                        track.title,
                        track.artist?.id,
                        track.album?.id,
                        track.id,
                        track.duration * 1000, // Deezer donne en secondes, on convertit en ms
                        track.rank || 0
                    ]);
                }

                // Sauvegarder les playlists
                for (const playlist of data.playlists || []) {
                    const playlistId = uuidv4();
                    await client.query(`
                        INSERT INTO playlists (id, name, description, user_id, deezer_id, is_public, source)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT (deezer_id) DO UPDATE SET
                            name = EXCLUDED.name,
                            description = EXCLUDED.description,
                            is_public = EXCLUDED.is_public,
                            updated_at = CURRENT_TIMESTAMP
                        RETURNING id
                    `, [
                        playlistId,
                        playlist.title,
                        playlist.description,
                        userId,
                        playlist.id,
                        playlist.public,
                        'deezer'
                    ]);
                }
            });

            logger.info(`Données Deezer sauvegardées pour l'utilisateur ${userId}`, {
                playlists: data.playlists?.length || 0,
                tracks: data.tracks?.length || 0,
                artists: data.artists?.length || 0,
                albums: data.albums?.length || 0
            });

        } catch (error) {
            logger.error('Erreur lors de la sauvegarde des données Deezer:', error);
            throw error;
        }
    }

    /**
     * Sauvegarder les données YouTube Music en base
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} data - Données YouTube Music
     */
    async saveYTMusicData(userId, data) {
        try {
            await db.transaction(async (client) => {
                // Sauvegarder les tracks
                for (const track of data.tracks || []) {
                    await client.query(`
                        INSERT INTO tracks (id, title, youtube_id, duration)
                        VALUES ($1, $2, $3, $4)
                        ON CONFLICT (youtube_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            duration = EXCLUDED.duration,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        track.id || uuidv4(),
                        track.title,
                        track.videoId,
                        track.duration?.totalSeconds * 1000 || 0
                    ]);
                }

                // Sauvegarder les playlists
                for (const playlist of data.playlists || []) {
                    const playlistId = uuidv4();
                    await client.query(`
                        INSERT INTO playlists (id, name, description, user_id, youtube_id, source)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (youtube_id) DO UPDATE SET
                            name = EXCLUDED.name,
                            description = EXCLUDED.description,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        playlistId,
                        playlist.title,
                        playlist.description,
                        userId,
                        playlist.playlistId,
                        'youtube'
                    ]);
                }
            });

            logger.info(`Données YouTube Music sauvegardées pour l'utilisateur ${userId}`, {
                playlists: data.playlists?.length || 0,
                tracks: data.tracks?.length || 0
            });

        } catch (error) {
            logger.error('Erreur lors de la sauvegarde des données YouTube Music:', error);
            throw error;
        }
    }

    /**
     * Sauvegarder les données Lidarr en base
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} data - Données Lidarr
     */
    async saveLidarrData(userId, data) {
        try {
            await db.transaction(async (client) => {
                // Sauvegarder les artistes
                for (const artist of data.artists || []) {
                    await client.query(`
                        INSERT INTO artists (id, name, lidarr_id, musicbrainz_id, genres)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (lidarr_id) DO UPDATE SET
                            name = EXCLUDED.name,
                            musicbrainz_id = EXCLUDED.musicbrainz_id,
                            genres = EXCLUDED.genres,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        artist.id || uuidv4(),
                        artist.artistName,
                        artist.id,
                        artist.foreignArtistId,
                        JSON.stringify(artist.genres || [])
                    ]);
                }

                // Sauvegarder les albums
                for (const album of data.albums || []) {
                    await client.query(`
                        INSERT INTO albums (id, title, artist_id, lidarr_id, musicbrainz_id, release_date)
                        VALUES ($1, $2, $3, $4, $5, $6)
                        ON CONFLICT (lidarr_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            release_date = EXCLUDED.release_date,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        album.id || uuidv4(),
                        album.title,
                        album.artistId,
                        album.id,
                        album.foreignAlbumId,
                        album.releaseDate
                    ]);
                }

                // Sauvegarder les tracks
                for (const track of data.tracks || []) {
                    await client.query(`
                        INSERT INTO tracks (id, title, artist_id, album_id, lidarr_id, musicbrainz_id, duration, track_number)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        ON CONFLICT (lidarr_id) DO UPDATE SET
                            title = EXCLUDED.title,
                            duration = EXCLUDED.duration,
                            track_number = EXCLUDED.track_number,
                            updated_at = CURRENT_TIMESTAMP
                    `, [
                        track.id || uuidv4(),
                        track.title,
                        track.artistId,
                        track.albumId,
                        track.id,
                        track.foreignRecordingId,
                        track.duration * 1000, // Convertir en ms
                        track.trackNumber
                    ]);
                }
            });

            logger.info(`Données Lidarr sauvegardées pour l'utilisateur ${userId}`, {
                artists: data.artists?.length || 0,
                albums: data.albums?.length || 0,
                tracks: data.tracks?.length || 0
            });

        } catch (error) {
            logger.error('Erreur lors de la sauvegarde des données Lidarr:', error);
            throw error;
        }
    }

    /**
     * Sauvegarder les résultats de synchronisation
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} results - Résultats de synchronisation
     */
    async saveSyncResults(userId, results) {
        try {
            await db.transaction(async (client) => {
                // Sauvegarder l'historique de synchronisation
                await client.query(`
                    INSERT INTO sync_history (
                        id, user_id, sync_type, status, 
                        items_processed, items_added, items_updated, items_failed,
                        started_at, completed_at, duration_ms, details
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `, [
                    results.syncId || uuidv4(),
                    userId,
                    'full_sync',
                    results.summary.errors > 0 ? 'completed_with_errors' : 'completed',
                    results.summary.totalTracks + results.summary.totalPlaylists + results.summary.totalArtists,
                    results.summary.totalTracks + results.summary.totalPlaylists + results.summary.totalArtists,
                    0, // items_updated - à implémenter plus tard
                    results.summary.errors,
                    results.startTime,
                    results.endTime,
                    parseInt(results.duration.replace('ms', '')),
                    JSON.stringify(results.services)
                ]);

                // Sauvegarder/mettre à jour les données des services
                for (const [serviceName, serviceData] of Object.entries(results.services)) {
                    if (serviceData.error) continue;

                    // Sauvegarder les artistes
                    if (serviceData.artists) {
                        for (const artist of serviceData.artists) {
                            await this.saveArtist(client, artist, serviceName);
                        }
                    }

                    // Sauvegarder les albums
                    if (serviceData.albums) {
                        for (const album of serviceData.albums) {
                            await this.saveAlbum(client, album, serviceName);
                        }
                    }

                    // Sauvegarder les tracks
                    if (serviceData.tracks) {
                        for (const track of serviceData.tracks) {
                            await this.saveTrack(client, track, serviceName);
                        }
                    }

                    // Sauvegarder les playlists
                    if (serviceData.playlists) {
                        for (const playlist of serviceData.playlists) {
                            await this.savePlaylist(client, playlist, userId, serviceName);
                        }
                    }
                }

                // Mettre à jour les statistiques utilisateur
                await client.query(`
                    UPDATE users 
                    SET 
                        connected_services = jsonb_set(
                            COALESCE(connected_services, '{}'),
                            '{lastSyncAt}',
                            '"${new Date().toISOString()}"'
                        ),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $1
                `, [userId]);
            });

            logger.info(`Résultats de synchronisation sauvegardés pour l'utilisateur ${userId}`);
        } catch (error) {
            logger.error('Erreur lors de la sauvegarde des résultats de sync:', error);
            throw error;
        }
    }

    /**
     * Sauvegarder un artiste en base de données
     * @param {Object} client - Client de transaction
     * @param {Object} artist - Données de l'artiste
     * @param {string} service - Service source
     */
    async saveArtist(client, artist, service) {
        try {
            await client.query(`
                INSERT INTO artists (
                    id, name, genres, popularity, external_ids, 
                    images, followers, service_data, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    genres = EXCLUDED.genres,
                    popularity = EXCLUDED.popularity,
                    external_ids = EXCLUDED.external_ids,
                    images = EXCLUDED.images,
                    followers = EXCLUDED.followers,
                    service_data = EXCLUDED.service_data,
                    updated_at = CURRENT_TIMESTAMP
            `, [
                artist.id || uuidv4(),
                artist.name,
                JSON.stringify(artist.genres || []),
                artist.popularity || 0,
                JSON.stringify({ [service]: artist.external_id || artist.id }),
                JSON.stringify(artist.images || []),
                artist.followers || 0,
                JSON.stringify({ [service]: artist })
            ]);
        } catch (error) {
            logger.error(`Erreur lors de la sauvegarde de l'artiste ${artist.name}:`, error);
        }
    }

    /**
     * Sauvegarder une track en base de données
     * @param {Object} client - Client de transaction
     * @param {Object} track - Données de la track
     * @param {string} service - Service source
     */
    async saveTrack(client, track, service) {
        try {
            await client.query(`
                INSERT INTO tracks (
                    id, title, artist_id, album_id, duration, popularity,
                    explicit, preview_url, external_ids, audio_features,
                    service_data, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (id) DO UPDATE SET
                    title = EXCLUDED.title,
                    artist_id = EXCLUDED.artist_id,
                    album_id = EXCLUDED.album_id,
                    duration = EXCLUDED.duration,
                    popularity = EXCLUDED.popularity,
                    explicit = EXCLUDED.explicit,
                    preview_url = EXCLUDED.preview_url,
                    external_ids = EXCLUDED.external_ids,
                    audio_features = EXCLUDED.audio_features,
                    service_data = EXCLUDED.service_data,
                    updated_at = CURRENT_TIMESTAMP
            `, [
                track.id || uuidv4(),
                track.name || track.title,
                track.artists?.[0]?.id || track.artist?.id,
                track.album?.id,
                track.duration_ms || track.duration,
                track.popularity || 0,
                track.explicit || false,
                track.preview_url,
                JSON.stringify({ [service]: track.external_id || track.id }),
                JSON.stringify(track.audio_features || {}),
                JSON.stringify({ [service]: track })
            ]);
        } catch (error) {
            logger.error(`Erreur lors de la sauvegarde de la track ${track.name || track.title}:`, error);
        }
    }

    /**
     * Sauvegarder une playlist en base de données
     * @param {Object} client - Client de transaction
     * @param {Object} playlist - Données de la playlist
     * @param {string} userId - ID de l'utilisateur
     * @param {string} service - Service source
     */
    async savePlaylist(client, playlist, userId, service) {
        try {
            const playlistId = playlist.id || uuidv4();

            await client.query(`
                INSERT INTO playlists (
                    id, name, description, user_id, is_public, is_collaborative,
                    type, source, external_id, stats, created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT (external_id, source) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    is_public = EXCLUDED.is_public,
                    is_collaborative = EXCLUDED.is_collaborative,
                    stats = EXCLUDED.stats,
                    updated_at = CURRENT_TIMESTAMP
            `, [
                playlistId,
                playlist.name,
                playlist.description,
                userId,
                playlist.public || false,
                playlist.collaborative || false,
                'manual',
                service,
                playlist.external_id || playlist.id,
                JSON.stringify({
                    totalTracks: playlist.tracks?.length || 0,
                    totalDuration: playlist.tracks?.reduce((sum, t) => sum + (t.track?.duration_ms || 0), 0) || 0,
                    creationMethod: 'imported'
                })
            ]);

            // Sauvegarder les tracks de la playlist
            if (playlist.tracks && playlist.tracks.length > 0) {
                for (let i = 0; i < playlist.tracks.length; i++) {
                    const trackItem = playlist.tracks[i];
                    const track = trackItem.track || trackItem;

                    if (track && track.id) {
                        await client.query(`
                            INSERT INTO playlist_tracks (
                                id, playlist_id, track_id, position, added_at, metadata
                            ) VALUES ($1, $2, $3, $4, $5, $6)
                            ON CONFLICT (playlist_id, track_id, position) DO NOTHING
                        `, [
                            uuidv4(),
                            playlistId,
                            track.id,
                            i + 1,
                            trackItem.added_at || new Date(),
                            JSON.stringify({
                                reason: 'imported',
                                service: service
                            })
                        ]);
                    }
                }
            }
        } catch (error) {
            logger.error(`Erreur lors de la sauvegarde de la playlist ${playlist.name}:`, error);
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

        const startTime = Date.now();
        const results = {
            syncId: uuidv4(),
            userId,
            type: 'incremental',
            since: since.toISOString(),
            startTime: new Date(startTime).toISOString(),
            services: {},
            summary: {
                totalPlaylists: 0,
                totalTracks: 0,
                totalArtists: 0,
                newItems: 0,
                updatedItems: 0,
                errors: 0
            }
        };

        try {
            // Récupérer la dernière synchronisation pour chaque service
            const lastSyncQuery = `
                SELECT 
                    service_name,
                    MAX(completed_at) as last_sync
                FROM sync_history 
                WHERE user_id = $1 
                    AND status IN ('completed', 'completed_with_errors')
                    AND completed_at > $2
                GROUP BY service_name
            `;

            const lastSyncResult = await db.query(lastSyncQuery, [userId, since]);
            const lastSyncByService = {};
            lastSyncResult.rows.forEach(row => {
                lastSyncByService[row.service_name] = new Date(row.last_sync);
            });

            // Synchronisation incrémentielle Spotify
            if (tokens.spotify) {
                try {
                    const lastSync = lastSyncByService.spotify || since;
                    results.services.spotify = await this.incrementalSyncSpotify(userId, tokens.spotify, lastSync);
                } catch (error) {
                    logger.error('Erreur sync incrémentielle Spotify:', error);
                    results.services.spotify = { error: error.message };
                    results.summary.errors++;
                }
            }

            // Synchronisation incrémentielle Deezer
            if (tokens.deezer) {
                try {
                    const lastSync = lastSyncByService.deezer || since;
                    results.services.deezer = await this.incrementalSyncDeezer(userId, tokens.deezer, lastSync);
                } catch (error) {
                    logger.error('Erreur sync incrémentielle Deezer:', error);
                    results.services.deezer = { error: error.message };
                    results.summary.errors++;
                }
            }

            // Calcul des totaux
            Object.values(results.services).forEach(service => {
                if (service.error) return;
                if (service.newPlaylists) results.summary.totalPlaylists += service.newPlaylists.length;
                if (service.newTracks) results.summary.totalTracks += service.newTracks.length;
                if (service.newArtists) results.summary.totalArtists += service.newArtists.length;
                results.summary.newItems += service.newItems || 0;
                results.summary.updatedItems += service.updatedItems || 0;
            });

            const duration = Date.now() - startTime;
            results.endTime = new Date().toISOString();
            results.duration = `${duration}ms`;

            // Sauvegarder les résultats
            await this.saveIncrementalSyncResults(userId, results);

            logger.info(`Synchronisation incrémentielle terminée pour l'utilisateur ${userId}`, {
                duration: results.duration,
                summary: results.summary
            });

            return results;

        } catch (error) {
            logger.error('Erreur lors de la synchronisation incrémentielle:', error);
            throw error;
        }
    }

    /**
     * Synchronisation incrémentielle Spotify
     * @param {string} userId - ID utilisateur
     * @param {string} accessToken - Token Spotify
     * @param {Date} since - Date depuis laquelle synchroniser
     * @returns {Promise<Object>} Résultats
     */
    async incrementalSyncSpotify(userId, accessToken, since) {
        const results = {
            newPlaylists: [],
            updatedPlaylists: [],
            newTracks: [],
            newItems: 0,
            updatedItems: 0
        };

        // Récupérer les playlists modifiées depuis la dernière sync
        const playlists = await spotifyService.getUserPlaylists(accessToken, 50, 0);

        for (const playlist of playlists.playlists) {
            // Vérifier si la playlist existe déjà
            const existingPlaylist = await db.query(
                'SELECT id, updated_at FROM playlists WHERE external_id = $1 AND source = $2',
                [playlist.id, 'spotify']
            );

            if (existingPlaylist.rows.length === 0) {
                // Nouvelle playlist
                results.newPlaylists.push(playlist);
                results.newItems++;
            } else {
                // Vérifier si elle a été modifiée
                const lastUpdate = new Date(existingPlaylist.rows[0].updated_at);
                const playlistModified = new Date(playlist.tracks?.href ? Date.now() : since);

                if (playlistModified > lastUpdate) {
                    results.updatedPlaylists.push(playlist);
                    results.updatedItems++;
                }
            }
        }

        return results;
    }

    /**
     * Synchronisation incrémentielle Deezer
     * @param {string} userId - ID utilisateur
     * @param {string} accessToken - Token Deezer
     * @param {Date} since - Date depuis laquelle synchroniser
     * @returns {Promise<Object>} Résultats
     */
    async incrementalSyncDeezer(userId, accessToken, since) {
        // Implémentation similaire à Spotify mais pour Deezer
        return {
            newPlaylists: [],
            updatedPlaylists: [],
            newTracks: [],
            newItems: 0,
            updatedItems: 0
        };
    }

    /**
     * Sauvegarder les résultats de synchronisation incrémentielle
     * @param {string} userId - ID utilisateur
     * @param {Object} results - Résultats
     */
    async saveIncrementalSyncResults(userId, results) {
        try {
            await db.transaction(async (client) => {
                // Enregistrer l'historique de sync
                await client.query(`
                    INSERT INTO sync_history (
                        id, user_id, sync_type, status,
                        items_processed, items_added, items_updated, items_failed,
                        started_at, completed_at, duration_ms, details
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                `, [
                    results.syncId,
                    userId,
                    'incremental',
                    results.summary.errors > 0 ? 'completed_with_errors' : 'completed',
                    results.summary.newItems + results.summary.updatedItems,
                    results.summary.newItems,
                    results.summary.updatedItems,
                    results.summary.errors,
                    results.startTime,
                    results.endTime,
                    parseInt(results.duration.replace('ms', '')),
                    JSON.stringify(results.services)
                ]);

                // Traiter les nouveaux items
                for (const [serviceName, serviceData] of Object.entries(results.services)) {
                    if (serviceData.error) continue;

                    // Sauvegarder les nouvelles playlists
                    if (serviceData.newPlaylists) {
                        for (const playlist of serviceData.newPlaylists) {
                            await this.savePlaylist(client, playlist, userId, serviceName);
                        }
                    }

                    // Mettre à jour les playlists modifiées
                    if (serviceData.updatedPlaylists) {
                        for (const playlist of serviceData.updatedPlaylists) {
                            await this.savePlaylist(client, playlist, userId, serviceName);
                        }
                    }
                }
            });

            logger.info(`Résultats de synchronisation incrémentielle sauvegardés pour l'utilisateur ${userId}`);
        } catch (error) {
            logger.error('Erreur lors de la sauvegarde des résultats de sync incrémentielle:', error);
            throw error;
        }
    }
}

module.exports = new DataSyncService();
