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
     * Créer un enregistrement de synchronisation
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<string>} ID de la synchronisation
     */
    async createSyncRecord(userId) {
        try {
            const syncId = uuidv4();
            const query = `
                INSERT INTO sync_logs (id, user_id, status, started_at)
                VALUES ($1, $2, 'running', NOW())
                RETURNING id
            `;

            const result = await pool.query(query, [syncId, userId]);
            return result.rows[0].id;
        } catch (error) {
            logger.error('Erreur lors de la création du log de synchronisation:', error);
            throw error;
        }
    }

    /**
     * Mettre à jour un enregistrement de synchronisation
     * @param {string} syncId - ID de la synchronisation
     * @param {string} status - Statut ('completed', 'failed')
     * @param {Object} results - Résultats de la synchronisation
     */
    async updateSyncRecord(syncId, status, results = {}) {
        try {
            const query = `
                UPDATE sync_logs 
                SET status = $2, completed_at = NOW(), results = $3
                WHERE id = $1
            `;

            await pool.query(query, [syncId, status, JSON.stringify(results)]);
        } catch (error) {
            logger.error('Erreur lors de la mise à jour du log de synchronisation:', error);
        }
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
        let syncId = null;

        try {
            logger.info(`Début de la synchronisation complète pour l'utilisateur ${userId}`);

            // Enregistrer le début de la synchronisation
            syncId = await this.createSyncRecord(userId);

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
                    logger.info('Synchronisation Spotify en cours...');
                    const spotifyResults = await spotifyService.syncUserPlaylists(userId, tokens.spotify.accessToken);

                    results.services.spotify = {
                        status: 'success',
                        playlists: spotifyResults.syncedCount,
                        totalPlaylists: spotifyResults.totalCount,
                        tracks: 0,
                        artists: 0
                    };

                    results.summary.totalPlaylists += spotifyResults.syncedCount;
                    logExternalServiceSuccess('Spotify', 'Synchronisation des playlists');

                } catch (error) {
                    logger.error('Erreur synchronisation Spotify:', error);
                    results.services.spotify = {
                        status: 'error',
                        error: error.message,
                        playlists: 0,
                        tracks: 0,
                        artists: 0
                    };
                    results.summary.errors++;
                    logExternalServiceError('Spotify', error.message);
                }
            }

            // Synchroniser Deezer
            if (tokens.deezer) {
                try {
                    logger.info('Synchronisation Deezer en cours...');
                    const deezerResults = await this.syncDeezerData(userId, tokens.deezer.accessToken);

                    results.services.deezer = deezerResults;
                    results.summary.totalPlaylists += deezerResults.playlists;
                    results.summary.totalTracks += deezerResults.tracks;

                    logExternalServiceSuccess('Deezer', 'Synchronisation des données');

                } catch (error) {
                    logger.error('Erreur synchronisation Deezer:', error);
                    results.services.deezer = {
                        status: 'error',
                        error: error.message,
                        playlists: 0,
                        tracks: 0,
                        artists: 0
                    };
                    results.summary.errors++;
                    logExternalServiceError('Deezer', error.message);
                }
            }

            // Synchroniser YouTube Music
            if (tokens.ytmusic) {
                try {
                    logger.info('Synchronisation YouTube Music en cours...');
                    const ytmusicResults = await this.syncYTMusicData(userId, tokens.ytmusic.accessToken);

                    results.services.ytmusic = ytmusicResults;
                    results.summary.totalPlaylists += ytmusicResults.playlists;
                    results.summary.totalTracks += ytmusicResults.tracks;

                    logExternalServiceSuccess('YouTube Music', 'Synchronisation des données');

                } catch (error) {
                    logger.error('Erreur synchronisation YouTube Music:', error);
                    results.services.ytmusic = {
                        status: 'error',
                        error: error.message,
                        playlists: 0,
                        tracks: 0,
                        artists: 0
                    };
                    results.summary.errors++;
                    logExternalServiceError('YouTube Music', error.message);
                }
            }

            // Synchroniser Lidarr
            try {
                logger.info('Synchronisation Lidarr en cours...');
                const lidarrResults = await this.syncLidarrData(userId);

                results.services.lidarr = lidarrResults;
                results.summary.totalArtists += lidarrResults.artists;

                logExternalServiceSuccess('Lidarr', 'Synchronisation des artistes');

            } catch (error) {
                logger.error('Erreur synchronisation Lidarr:', error);
                results.services.lidarr = {
                    status: 'error',
                    error: error.message,
                    playlists: 0,
                    tracks: 0,
                    artists: 0
                };
                results.summary.errors++;
                logExternalServiceError('Lidarr', error.message);
            }

            // Finaliser les résultats
            results.endTime = new Date().toISOString();
            results.duration = Date.now() - startTime;
            results.success = results.summary.errors === 0;

            // Mettre à jour l'enregistrement de synchronisation
            await this.updateSyncRecord(syncId, results.success ? 'completed' : 'partial', results);

            this.lastSyncTime = new Date();
            this.syncResults = results;

            logger.info(`Synchronisation terminée en ${results.duration}ms - ${results.summary.totalPlaylists} playlists, ${results.summary.totalTracks} tracks, ${results.summary.totalArtists} artistes`);

            return results;

        } catch (error) {
            logger.error('Erreur lors de la synchronisation:', error);

            if (syncId) {
                await this.updateSyncRecord(syncId, 'failed', { error: error.message });
            }

            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * Synchroniser les données Deezer
     * @param {string} userId - ID de l'utilisateur
     * @param {string} accessToken - Token d'accès Deezer
     * @returns {Promise<Object>} Résultats de la synchronisation
     */
    async syncDeezerData(userId, accessToken) {
        const results = { status: 'success', playlists: 0, tracks: 0, artists: 0 };

        try {
            // Récupérer et sauvegarder les playlists
            const playlists = await deezerService.getUserPlaylists(accessToken);

            for (const playlist of playlists.playlists || []) {
                try {
                    // Vérifier si la playlist existe déjà
                    const existingQuery = `
                        SELECT id FROM playlists 
                        WHERE user_id = $1 AND deezer_id = $2
                    `;
                    const existing = await pool.query(existingQuery, [userId, playlist.id]);

                    if (existing.rows.length === 0) {
                        // Récupérer les tracks de la playlist
                        const tracks = await deezerService.getPlaylistTracks(accessToken, playlist.id);

                        // Sauvegarder la playlist
                        await this.saveDeezerPlaylist(userId, playlist, tracks.tracks || []);
                        results.playlists++;
                        results.tracks += tracks.tracks?.length || 0;
                    }
                } catch (error) {
                    logger.error(`Erreur lors de la synchronisation de la playlist Deezer ${playlist.title}:`, error);
                }
            }

            return results;

        } catch (error) {
            logger.error('Erreur lors de la synchronisation Deezer:', error);
            throw error;
        }
    }

    /**
     * Synchroniser les données YouTube Music
     * @param {string} userId - ID de l'utilisateur
     * @param {string} accessToken - Token d'accès YouTube Music
     * @returns {Promise<Object>} Résultats de la synchronisation
     */
    async syncYTMusicData(userId, accessToken) {
        const results = { status: 'success', playlists: 0, tracks: 0, artists: 0 };

        try {
            // Récupérer et sauvegarder les playlists
            const playlists = await ytmusicService.getUserPlaylists(accessToken);

            for (const playlist of playlists.playlists || []) {
                try {
                    // Vérifier si la playlist existe déjà
                    const existingQuery = `
                        SELECT id FROM playlists 
                        WHERE user_id = $1 AND ytmusic_id = $2
                    `;
                    const existing = await pool.query(existingQuery, [userId, playlist.id]);

                    if (existing.rows.length === 0) {
                        // Récupérer les tracks de la playlist
                        const tracks = await ytmusicService.getPlaylistTracks(accessToken, playlist.id);

                        // Sauvegarder la playlist
                        await this.saveYTMusicPlaylist(userId, playlist, tracks.tracks || []);
                        results.playlists++;
                        results.tracks += tracks.tracks?.length || 0;
                    }
                } catch (error) {
                    logger.error(`Erreur lors de la synchronisation de la playlist YouTube Music ${playlist.title}:`, error);
                }
            }

            return results;

        } catch (error) {
            logger.error('Erreur lors de la synchronisation YouTube Music:', error);
            throw error;
        }
    }

    /**
     * Synchroniser les données Lidarr
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Résultats de la synchronisation
     */
    async syncLidarrData(userId) {
        const results = { status: 'success', playlists: 0, tracks: 0, artists: 0 };

        try {
            // Récupérer et sauvegarder les artistes
            const artists = await lidarrService.getAllArtists();

            for (const artist of artists.artists || []) {
                try {
                    // Vérifier si l'artiste existe déjà
                    const existingQuery = `
                        SELECT id FROM artists 
                        WHERE lidarr_id = $1
                    `;
                    const existing = await pool.query(existingQuery, [artist.id]);

                    if (existing.rows.length === 0) {
                        await this.saveLidarrArtist(artist);
                        results.artists++;
                    }
                } catch (error) {
                    logger.error(`Erreur lors de la synchronisation de l'artiste Lidarr ${artist.artistName}:`, error);
                }
            }

            return results;

        } catch (error) {
            logger.error('Erreur lors de la synchronisation Lidarr:', error);
            throw error;
        }
    }

    /**
     * Sauvegarder une playlist Deezer
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} playlist - Données de la playlist
     * @param {Array} tracks - Tracks de la playlist
     */
    async saveDeezerPlaylist(userId, playlist, tracks = []) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const playlistId = uuidv4();
            const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);

            // Insérer la playlist
            const insertPlaylistQuery = `
                INSERT INTO playlists (
                    id, user_id, name, description, deezer_id, is_public,
                    track_count, total_duration, cover_image_url, algorithm_used,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            `;

            await client.query(insertPlaylistQuery, [
                playlistId,
                userId,
                playlist.title,
                playlist.description || '',
                playlist.id,
                playlist.public || false,
                playlist.trackCount || tracks.length,
                totalDuration,
                playlist.picture_medium,
                'deezer_import'
            ]);

            // Sauvegarder les tracks
            if (tracks.length > 0) {
                for (let i = 0; i < tracks.length; i++) {
                    const track = tracks[i];
                    const trackId = await this.saveDeezerTrack(client, track);

                    // Lier la track à la playlist
                    await client.query(`
                        INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
                        VALUES ($1, $2, $3, NOW())
                    `, [playlistId, trackId, i]);
                }
            }

            await client.query('COMMIT');
            logger.info(`Playlist Deezer "${playlist.title}" sauvegardée avec ${tracks.length} tracks`);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Sauvegarder une track Deezer
     * @param {Object} client - Client de base de données
     * @param {Object} track - Données de la track
     * @returns {string} ID de la track
     */
    async saveDeezerTrack(client, track) {
        const trackId = uuidv4();

        const query = `
            INSERT INTO tracks (
                id, title, artist, album, duration, deezer_id, preview_url,
                cover_image_url, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT (deezer_id) DO UPDATE SET
                title = EXCLUDED.title,
                artist = EXCLUDED.artist,
                album = EXCLUDED.album,
                duration = EXCLUDED.duration,
                preview_url = EXCLUDED.preview_url,
                cover_image_url = EXCLUDED.cover_image_url
            RETURNING id
        `;

        const result = await client.query(query, [
            trackId,
            track.title || 'Titre inconnu',
            track.artist?.name || 'Artiste inconnu',
            track.album?.title || 'Album inconnu',
            track.duration || 0,
            track.id,
            track.preview,
            track.album?.cover_medium
        ]);

        return result.rows[0].id;
    }

    /**
     * Sauvegarder une playlist YouTube Music
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} playlist - Données de la playlist
     * @param {Array} tracks - Tracks de la playlist
     */
    async saveYTMusicPlaylist(userId, playlist, tracks = []) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const playlistId = uuidv4();
            const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);

            // Insérer la playlist
            const insertPlaylistQuery = `
                INSERT INTO playlists (
                    id, user_id, name, description, ytmusic_id, is_public,
                    track_count, total_duration, cover_image_url, algorithm_used,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            `;

            await client.query(insertPlaylistQuery, [
                playlistId,
                userId,
                playlist.title,
                playlist.description || '',
                playlist.playlistId,
                false, // YouTube Music playlists are private by default
                tracks.length,
                totalDuration,
                playlist.thumbnail,
                'ytmusic_import'
            ]);

            // Sauvegarder les tracks
            if (tracks.length > 0) {
                for (let i = 0; i < tracks.length; i++) {
                    const track = tracks[i];
                    const trackId = await this.saveYTMusicTrack(client, track);

                    // Lier la track à la playlist
                    await client.query(`
                        INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
                        VALUES ($1, $2, $3, NOW())
                    `, [playlistId, trackId, i]);
                }
            }

            await client.query('COMMIT');
            logger.info(`Playlist YouTube Music "${playlist.title}" sauvegardée avec ${tracks.length} tracks`);

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Sauvegarder une track YouTube Music
     * @param {Object} client - Client de base de données
     * @param {Object} track - Données de la track
     * @returns {string} ID de la track
     */
    async saveYTMusicTrack(client, track) {
        const trackId = uuidv4();

        const query = `
            INSERT INTO tracks (
                id, title, artist, album, duration, ytmusic_id,
                cover_image_url, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            ON CONFLICT (ytmusic_id) DO UPDATE SET
                title = EXCLUDED.title,
                artist = EXCLUDED.artist,
                album = EXCLUDED.album,
                duration = EXCLUDED.duration,
                cover_image_url = EXCLUDED.cover_image_url
            RETURNING id
        `;

        const artists = track.artists?.map(a => a.name).join(', ') || 'Artiste inconnu';

        const result = await client.query(query, [
            trackId,
            track.title || 'Titre inconnu',
            artists,
            track.album || 'Album inconnu',
            track.duration || 0,
            track.videoId,
            track.thumbnail
        ]);

        return result.rows[0].id;
    }

    /**
     * Sauvegarder un artiste Lidarr
     * @param {Object} artist - Données de l'artiste
     */
    async saveLidarrArtist(artist) {
        try {
            const artistId = uuidv4();

            const query = `
                INSERT INTO artists (
                    id, name, lidarr_id, status, monitored, quality_profile_id,
                    metadata_profile_id, path, genres, statistics, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
                ON CONFLICT (lidarr_id) DO UPDATE SET
                    name = EXCLUDED.name,
                    status = EXCLUDED.status,
                    monitored = EXCLUDED.monitored,
                    quality_profile_id = EXCLUDED.quality_profile_id,
                    metadata_profile_id = EXCLUDED.metadata_profile_id,
                    path = EXCLUDED.path,
                    genres = EXCLUDED.genres,
                    statistics = EXCLUDED.statistics
            `;

            await pool.query(query, [
                artistId,
                artist.artistName,
                artist.id,
                artist.status,
                artist.monitored,
                artist.qualityProfileId,
                artist.metadataProfileId,
                artist.path,
                JSON.stringify(artist.genres || []),
                JSON.stringify(artist.statistics || {})
            ]);

            logger.info(`Artiste Lidarr "${artist.artistName}" sauvegardé`);

        } catch (error) {
            logger.error('Erreur lors de la sauvegarde de l\'artiste Lidarr:', error);
            throw error;
        }
    }

    /**
     * Obtenir le statut de la dernière synchronisation
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Statut de la synchronisation
     */
    async getLastSyncStatus(userId) {
        try {
            const query = `
                SELECT * FROM sync_logs 
                WHERE user_id = $1 
                ORDER BY started_at DESC 
                LIMIT 1
            `;

            const result = await pool.query(query, [userId]);

            if (result.rows.length === 0) {
                return null;
            }

            const sync = result.rows[0];
            return {
                id: sync.id,
                status: sync.status,
                startedAt: sync.started_at,
                completedAt: sync.completed_at,
                results: sync.results,
                inProgress: this.syncInProgress
            };

        } catch (error) {
            logger.error('Erreur lors de la récupération du statut de synchronisation:', error);
            throw error;
        }
    }

    /**
     * Obtenir l'historique des synchronisations
     * @param {string} userId - ID de l'utilisateur
     * @param {number} limit - Nombre de synchronisations à récupérer
     * @returns {Promise<Array>} Historique des synchronisations
     */
    async getSyncHistory(userId, limit = 10) {
        try {
            const query = `
                SELECT id, status, started_at, completed_at, results
                FROM sync_logs 
                WHERE user_id = $1 
                ORDER BY started_at DESC 
                LIMIT $2
            `;

            const result = await pool.query(query, [userId, limit]);

            return result.rows.map(sync => ({
                id: sync.id,
                status: sync.status,
                startedAt: sync.started_at,
                completedAt: sync.completed_at,
                results: sync.results
            }));

        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'historique de synchronisation:', error);
            throw error;
        }
    }

    /**
     * Obtenir le statut actuel de la synchronisation
     * @returns {Object} Statut de la synchronisation
     */
    getSyncStatus() {
        return {
            isRunning: this.syncInProgress,
            lastSyncTime: this.lastSyncTime ? this.lastSyncTime.toISOString() : null,
            lastResults: this.syncResults || null,
            nextSyncAllowed: !this.syncInProgress
        };
    }
}

module.exports = new DataSyncService();
