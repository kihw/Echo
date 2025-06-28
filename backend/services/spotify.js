const axios = require('axios');
const pool = require('../../database/connection');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Service d'intégration avec l'API Spotify
 * Gère les requêtes vers l'API Spotify Web API
 */
class SpotifyService {
    constructor() {
        this.baseURL = 'https://api.spotify.com/v1';
        this.clientId = process.env.SPOTIFY_CLIENT_ID;
        this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
        this.redirectUri = process.env.SPOTIFY_REDIRECT_URI;
    }

    /**
     * Créer un client HTTP avec l'authentification
     * @param {string} accessToken - Token d'accès utilisateur
     * @returns {Object} Instance Axios configurée
     */
    createAuthenticatedClient(accessToken) {
        return axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
    }

    /**
     * Obtenir les informations du profil utilisateur
     * @param {string} accessToken - Token d'accès
     * @returns {Promise<Object>} Profil utilisateur
     */
    async getUserProfile(accessToken) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const response = await client.get('/me');

            return {
                id: response.data.id,
                displayName: response.data.display_name,
                email: response.data.email,
                country: response.data.country,
                followers: response.data.followers?.total || 0,
                images: response.data.images || [],
                product: response.data.product, // free, premium
                explicitContent: response.data.explicit_content
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération du profil Spotify:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer le profil Spotify');
        }
    }

    /**
     * Obtenir les playlists de l'utilisateur
     * @param {string} accessToken - Token d'accès
     * @param {number} limit - Nombre de playlists à récupérer (max 50)
     * @param {number} offset - Décalage pour la pagination
     * @returns {Promise<Object>} Liste des playlists
     */
    async getUserPlaylists(accessToken, limit = 20, offset = 0) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const response = await client.get('/me/playlists', {
                params: { limit, offset }
            });

            return {
                total: response.data.total,
                playlists: response.data.items.map(playlist => ({
                    id: playlist.id,
                    name: playlist.name,
                    description: playlist.description,
                    public: playlist.public,
                    collaborative: playlist.collaborative,
                    trackCount: playlist.tracks.total,
                    images: playlist.images || [],
                    owner: {
                        id: playlist.owner.id,
                        displayName: playlist.owner.display_name
                    },
                    externalUrls: playlist.external_urls
                }))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des playlists Spotify:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les playlists Spotify');
        }
    }

    /**
     * Obtenir les tracks d'une playlist
     * @param {string} accessToken - Token d'accès
     * @param {string} playlistId - ID de la playlist
     * @param {number} limit - Nombre de tracks à récupérer (max 100)
     * @param {number} offset - Décalage pour la pagination
     * @returns {Promise<Object>} Tracks de la playlist
     */
    async getPlaylistTracks(accessToken, playlistId, limit = 50, offset = 0) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const response = await client.get(`/playlists/${playlistId}/tracks`, {
                params: { limit, offset }
            });

            return {
                total: response.data.total,
                tracks: response.data.items.map(item => ({
                    addedAt: item.added_at,
                    track: this.formatTrack(item.track)
                }))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des tracks de playlist Spotify:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les tracks de la playlist');
        }
    }

    /**
     * Obtenir les top tracks de l'utilisateur
     * @param {string} accessToken - Token d'accès
     * @param {string} timeRange - Période (short_term, medium_term, long_term)
     * @param {number} limit - Nombre de tracks (max 50)
     * @returns {Promise<Object>} Top tracks
     */
    async getUserTopTracks(accessToken, timeRange = 'medium_term', limit = 20) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const response = await client.get('/me/top/tracks', {
                params: { time_range: timeRange, limit }
            });

            return {
                tracks: response.data.items.map(track => this.formatTrack(track))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des top tracks Spotify:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les top tracks');
        }
    }

    /**
     * Obtenir les top artists de l'utilisateur
     * @param {string} accessToken - Token d'accès
     * @param {string} timeRange - Période (short_term, medium_term, long_term)
     * @param {number} limit - Nombre d'artistes (max 50)
     * @returns {Promise<Object>} Top artists
     */
    async getUserTopArtists(accessToken, timeRange = 'medium_term', limit = 20) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const response = await client.get('/me/top/artists', {
                params: { time_range: timeRange, limit }
            });

            return {
                artists: response.data.items.map(artist => this.formatArtist(artist))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des top artists Spotify:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les top artists');
        }
    }

    /**
     * Rechercher des tracks
     * @param {string} accessToken - Token d'accès
     * @param {string} query - Requête de recherche
     * @param {number} limit - Nombre de résultats (max 50)
     * @returns {Promise<Object>} Résultats de recherche
     */
    async searchTracks(accessToken, query, limit = 20) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const response = await client.get('/search', {
                params: {
                    q: query,
                    type: 'track',
                    limit
                }
            });

            return {
                tracks: response.data.tracks.items.map(track => this.formatTrack(track))
            };
        } catch (error) {
            logger.error('Erreur lors de la recherche Spotify:', error.response?.data || error.message);
            throw new Error('Erreur lors de la recherche');
        }
    }

    /**
     * Obtenir les audio features d'une track
     * @param {string} accessToken - Token d'accès
     * @param {string} trackId - ID de la track
     * @returns {Promise<Object>} Audio features
     */
    async getTrackAudioFeatures(accessToken, trackId) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const response = await client.get(`/audio-features/${trackId}`);

            return {
                danceability: response.data.danceability,
                energy: response.data.energy,
                key: response.data.key,
                loudness: response.data.loudness,
                mode: response.data.mode,
                speechiness: response.data.speechiness,
                acousticness: response.data.acousticness,
                instrumentalness: response.data.instrumentalness,
                liveness: response.data.liveness,
                valence: response.data.valence,
                tempo: response.data.tempo,
                duration: response.data.duration_ms,
                timeSignature: response.data.time_signature
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des audio features:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les audio features');
        }
    }

    /**
     * Obtenir les recommandations basées sur des seeds
     * @param {string} accessToken - Token d'accès
     * @param {Object} seeds - Seeds pour les recommandations (artists, tracks, genres)
     * @param {Object} audioFeatures - Paramètres audio (optionnel)
     * @param {number} limit - Nombre de recommandations (max 100)
     * @returns {Promise<Object>} Recommandations
     */
    async getRecommendations(accessToken, seeds, audioFeatures = {}, limit = 20) {
        try {
            const client = this.createAuthenticatedClient(accessToken);

            const params = {
                limit,
                seed_artists: seeds.artists?.join(','),
                seed_tracks: seeds.tracks?.join(','),
                seed_genres: seeds.genres?.join(','),
                ...audioFeatures
            };

            // Nettoyer les paramètres undefined
            Object.keys(params).forEach(key => {
                if (params[key] === undefined || params[key] === '') {
                    delete params[key];
                }
            });

            const response = await client.get('/recommendations', { params });

            return {
                tracks: response.data.tracks.map(track => this.formatTrack(track)),
                seeds: response.data.seeds
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des recommandations:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les recommandations');
        }
    }

    /**
     * Formater les données d'une track
     * @param {Object} track - Track Spotify
     * @returns {Object} Track formatée
     */
    formatTrack(track) {
        if (!track) return null;

        return {
            id: track.id,
            name: track.name,
            artists: track.artists?.map(artist => this.formatArtist(artist)) || [],
            album: track.album ? {
                id: track.album.id,
                name: track.album.name,
                images: track.album.images || [],
                releaseDate: track.album.release_date,
                type: track.album.album_type
            } : null,
            duration: track.duration_ms,
            explicit: track.explicit,
            popularity: track.popularity,
            previewUrl: track.preview_url,
            trackNumber: track.track_number,
            isrc: track.external_ids?.isrc,
            externalUrls: track.external_urls,
            available: track.is_playable !== false
        };
    }

    /**
     * Formater les données d'un artiste
     * @param {Object} artist - Artiste Spotify
     * @returns {Object} Artiste formaté
     */
    formatArtist(artist) {
        if (!artist) return null;

        return {
            id: artist.id,
            name: artist.name,
            genres: artist.genres || [],
            images: artist.images || [],
            popularity: artist.popularity,
            followers: artist.followers?.total || 0,
            externalUrls: artist.external_urls
        };
    }

    /**
     * Sauvegarder le profil utilisateur en base de données
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} profile - Profil Spotify
     * @param {string} accessToken - Token d'accès
     * @param {string} refreshToken - Token de rafraîchissement
     */
    async saveUserProfile(userId, profile, accessToken, refreshToken) {
        try {
            const query = `
                INSERT INTO user_profiles (user_id, spotify_id, display_name, email, country, 
                                         product, images, access_token, refresh_token, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    spotify_id = EXCLUDED.spotify_id,
                    display_name = EXCLUDED.display_name,
                    email = EXCLUDED.email,
                    country = EXCLUDED.country,
                    product = EXCLUDED.product,
                    images = EXCLUDED.images,
                    access_token = EXCLUDED.access_token,
                    refresh_token = EXCLUDED.refresh_token,
                    updated_at = NOW()
            `;

            await pool.query(query, [
                userId,
                profile.id,
                profile.displayName,
                profile.email,
                profile.country,
                profile.product,
                JSON.stringify(profile.images),
                accessToken,
                refreshToken
            ]);

            logger.info(`Profil Spotify sauvegardé pour l'utilisateur ${userId}`);
        } catch (error) {
            logger.error('Erreur lors de la sauvegarde du profil Spotify:', error);
            throw error;
        }
    }

    /**
     * Sauvegarder une playlist en base de données
     * @param {string} userId - ID de l'utilisateur
     * @param {Object} playlist - Données de la playlist
     * @param {Array} tracks - Tracks de la playlist
     */
    async savePlaylist(userId, playlist, tracks = []) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const playlistId = uuidv4();
            const totalDuration = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);

            // Insérer la playlist
            const insertPlaylistQuery = `
                INSERT INTO playlists (
                    id, user_id, name, description, spotify_id, is_public,
                    track_count, total_duration, cover_image_url, algorithm_used,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
                RETURNING id
            `;

            const coverImage = playlist.images && playlist.images.length > 0 ? playlist.images[0].url : null;

            await client.query(insertPlaylistQuery, [
                playlistId,
                userId,
                playlist.name,
                playlist.description || '',
                playlist.id,
                playlist.public || false,
                playlist.trackCount || tracks.length,
                totalDuration,
                coverImage,
                'spotify_import'
            ]);

            // Sauvegarder les tracks
            if (tracks.length > 0) {
                for (let i = 0; i < tracks.length; i++) {
                    const track = tracks[i];
                    const trackId = await this.saveTrack(client, track);

                    // Lier la track à la playlist
                    await client.query(`
                        INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
                        VALUES ($1, $2, $3, NOW())
                    `, [playlistId, trackId, i]);
                }
            }

            await client.query('COMMIT');
            logger.info(`Playlist Spotify "${playlist.name}" sauvegardée avec ${tracks.length} tracks`);

            return playlistId;

        } catch (error) {
            await client.query('ROLLBACK');
            logger.error('Erreur lors de la sauvegarde de la playlist Spotify:', error);
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Sauvegarder une track en base de données
     * @param {Object} client - Client de base de données
     * @param {Object} track - Données de la track
     * @returns {string} ID de la track
     */
    async saveTrack(client, track) {
        const trackId = uuidv4();

        const query = `
            INSERT INTO tracks (
                id, title, artist, album, duration, spotify_id, preview_url,
                cover_image_url, audio_features, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
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

        const coverImage = track.album?.images && track.album.images.length > 0
            ? track.album.images[0].url : null;

        const artists = track.artists?.map(a => a.name).join(', ') || 'Artiste inconnu';

        const result = await client.query(query, [
            trackId,
            track.name || 'Titre inconnu',
            artists,
            track.album?.name || 'Album inconnu',
            track.duration_ms || 0,
            track.id,
            track.preview_url,
            coverImage,
            track.audio_features ? JSON.stringify(track.audio_features) : null
        ]);

        return result.rows[0].id;
    }

    /**
     * Récupérer les tokens d'accès de l'utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<Object>} Tokens d'accès
     */
    async getUserTokens(userId) {
        try {
            const query = `
                SELECT access_token, refresh_token 
                FROM user_profiles 
                WHERE user_id = $1 AND access_token IS NOT NULL
            `;

            const result = await pool.query(query, [userId]);

            if (result.rows.length === 0) {
                throw new Error('Tokens Spotify non trouvés pour cet utilisateur');
            }

            return {
                accessToken: result.rows[0].access_token,
                refreshToken: result.rows[0].refresh_token
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des tokens Spotify:', error);
            throw error;
        }
    }

    /**
     * Synchroniser les playlists de l'utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} accessToken - Token d'accès
     */
    async syncUserPlaylists(userId, accessToken) {
        try {
            logger.info(`Début de la synchronisation des playlists Spotify pour l'utilisateur ${userId}`);

            const playlists = await this.getUserPlaylists(accessToken, 50, 0);
            let syncedCount = 0;

            for (const playlist of playlists.playlists) {
                try {
                    // Vérifier si la playlist existe déjà
                    const existingQuery = `
                        SELECT id FROM playlists 
                        WHERE user_id = $1 AND spotify_id = $2
                    `;
                    const existing = await pool.query(existingQuery, [userId, playlist.id]);

                    if (existing.rows.length === 0) {
                        // Récupérer les tracks de la playlist
                        const tracks = await this.getPlaylistTracks(accessToken, playlist.id);

                        // Sauvegarder la playlist
                        await this.savePlaylist(userId, playlist, tracks.tracks);
                        syncedCount++;
                    }
                } catch (error) {
                    logger.error(`Erreur lors de la synchronisation de la playlist ${playlist.name}:`, error);
                }
            }

            logger.info(`Synchronisation terminée: ${syncedCount} nouvelles playlists synchronisées`);
            return { syncedCount, totalCount: playlists.playlists.length };

        } catch (error) {
            logger.error('Erreur lors de la synchronisation des playlists Spotify:', error);
            throw error;
        }
    }
}

module.exports = new SpotifyService();
