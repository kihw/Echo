const axios = require('axios');
const { logger } = require('../utils/logger');

/**
 * Service d'intégration avec YouTube Music via YouTube Data API
 * Gère les requêtes vers l'API YouTube pour accéder à YouTube Music
 */
class YouTubeMusicService {
    constructor() {
        this.baseURL = 'https://www.googleapis.com/youtube/v3';
        this.apiKey = process.env.YOUTUBE_API_KEY;
        this.clientId = process.env.GOOGLE_CLIENT_ID;
        this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        this.redirectUri = process.env.GOOGLE_REDIRECT_URI;
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
            params: {
                key: this.apiKey
            },
            timeout: 10000
        });
    }

    /**
     * Créer un client HTTP pour les requêtes publiques
     * @returns {Object} Instance Axios configurée
     */
    createPublicClient() {
        return axios.create({
            baseURL: this.baseURL,
            params: {
                key: this.apiKey
            },
            timeout: 10000
        });
    }

    /**
     * Obtenir les playlists de l'utilisateur
     * @param {string} accessToken - Token d'accès
     * @param {number} maxResults - Nombre de playlists à récupérer
     * @param {string} pageToken - Token de pagination
     * @returns {Promise<Object>} Liste des playlists
     */
    async getUserPlaylists(accessToken, maxResults = 25, pageToken = null) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const params = {
                part: 'snippet,status,contentDetails',
                mine: true,
                maxResults
            };

            if (pageToken) params.pageToken = pageToken;

            const response = await client.get('/playlists', { params });

            return {
                total: response.data.pageInfo.totalResults,
                nextPageToken: response.data.nextPageToken,
                playlists: response.data.items.map(playlist => ({
                    id: playlist.id,
                    title: playlist.snippet.title,
                    description: playlist.snippet.description,
                    thumbnails: playlist.snippet.thumbnails,
                    channelId: playlist.snippet.channelId,
                    channelTitle: playlist.snippet.channelTitle,
                    defaultLanguage: playlist.snippet.defaultLanguage,
                    itemCount: playlist.contentDetails.itemCount,
                    publishedAt: playlist.snippet.publishedAt,
                    privacy: playlist.status.privacyStatus,
                    tags: playlist.snippet.tags || []
                }))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des playlists YouTube:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les playlists YouTube');
        }
    }

    /**
     * Obtenir les vidéos d'une playlist
     * @param {string} accessToken - Token d'accès
     * @param {string} playlistId - ID de la playlist
     * @param {number} maxResults - Nombre de vidéos à récupérer
     * @param {string} pageToken - Token de pagination
     * @returns {Promise<Object>} Vidéos de la playlist
     */
    async getPlaylistItems(accessToken, playlistId, maxResults = 50, pageToken = null) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const params = {
                part: 'snippet,contentDetails,status',
                playlistId,
                maxResults
            };

            if (pageToken) params.pageToken = pageToken;

            const response = await client.get('/playlistItems', { params });

            return {
                total: response.data.pageInfo.totalResults,
                nextPageToken: response.data.nextPageToken,
                items: response.data.items.map(item => ({
                    id: item.id,
                    videoId: item.contentDetails.videoId,
                    title: item.snippet.title,
                    description: item.snippet.description,
                    thumbnails: item.snippet.thumbnails,
                    channelId: item.snippet.videoOwnerChannelId,
                    channelTitle: item.snippet.videoOwnerChannelTitle,
                    publishedAt: item.snippet.publishedAt,
                    position: item.snippet.position,
                    videoPublishedAt: item.contentDetails.videoPublishedAt,
                    note: item.contentDetails.note,
                    privacy: item.status.privacyStatus
                }))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des items de playlist YouTube:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les items de la playlist');
        }
    }

    /**
     * Obtenir les détails de vidéos
     * @param {string} accessToken - Token d'accès
     * @param {Array<string>} videoIds - IDs des vidéos
     * @returns {Promise<Object>} Détails des vidéos
     */
    async getVideosDetails(accessToken, videoIds) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const response = await client.get('/videos', {
                params: {
                    part: 'snippet,contentDetails,statistics,status',
                    id: videoIds.join(',')
                }
            });

            return {
                videos: response.data.items.map(video => this.formatVideo(video))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des détails vidéos YouTube:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les détails des vidéos');
        }
    }

    /**
     * Rechercher des vidéos musicales
     * @param {string} query - Requête de recherche
     * @param {number} maxResults - Nombre de résultats
     * @param {string} pageToken - Token de pagination
     * @returns {Promise<Object>} Résultats de recherche
     */
    async searchMusic(query, maxResults = 25, pageToken = null) {
        try {
            const client = this.createPublicClient();
            const params = {
                part: 'snippet',
                q: query,
                type: 'video',
                videoCategoryId: '10', // Catégorie Musique
                maxResults,
                order: 'relevance',
                safeSearch: 'none'
            };

            if (pageToken) params.pageToken = pageToken;

            const response = await client.get('/search', { params });

            // Récupérer les détails des vidéos trouvées
            const videoIds = response.data.items.map(item => item.id.videoId);
            const videosDetails = await this.getVideosDetailsPublic(videoIds);

            return {
                total: response.data.pageInfo.totalResults,
                nextPageToken: response.data.nextPageToken,
                videos: videosDetails.videos
            };
        } catch (error) {
            logger.error('Erreur lors de la recherche YouTube Music:', error.response?.data || error.message);
            throw new Error('Erreur lors de la recherche');
        }
    }

    /**
     * Obtenir les détails de vidéos (requête publique)
     * @param {Array<string>} videoIds - IDs des vidéos
     * @returns {Promise<Object>} Détails des vidéos
     */
    async getVideosDetailsPublic(videoIds) {
        try {
            const client = this.createPublicClient();
            const response = await client.get('/videos', {
                params: {
                    part: 'snippet,contentDetails,statistics,status',
                    id: videoIds.join(',')
                }
            });

            return {
                videos: response.data.items.map(video => this.formatVideo(video))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des détails vidéos YouTube (public):', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les détails des vidéos');
        }
    }

    /**
     * Obtenir les informations d'un canal
     * @param {string} accessToken - Token d'accès
     * @param {string} channelId - ID du canal (optionnel, utilise 'mine' si non fourni)
     * @returns {Promise<Object>} Informations du canal
     */
    async getChannelInfo(accessToken, channelId = null) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const params = {
                part: 'snippet,statistics,contentDetails,brandingSettings'
            };

            if (channelId) {
                params.id = channelId;
            } else {
                params.mine = true;
            }

            const response = await client.get('/channels', { params });

            if (response.data.items.length === 0) {
                throw new Error('Canal non trouvé');
            }

            const channel = response.data.items[0];
            return {
                id: channel.id,
                title: channel.snippet.title,
                description: channel.snippet.description,
                customUrl: channel.snippet.customUrl,
                publishedAt: channel.snippet.publishedAt,
                thumbnails: channel.snippet.thumbnails,
                defaultLanguage: channel.snippet.defaultLanguage,
                country: channel.snippet.country,
                viewCount: parseInt(channel.statistics.viewCount),
                subscriberCount: parseInt(channel.statistics.subscriberCount),
                videoCount: parseInt(channel.statistics.videoCount),
                uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads,
                likesPlaylistId: channel.contentDetails.relatedPlaylists.likes,
                keywords: channel.brandingSettings?.channel?.keywords?.split(' ') || []
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des infos canal YouTube:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les informations du canal');
        }
    }

    /**
     * Obtenir les vidéos likées de l'utilisateur
     * @param {string} accessToken - Token d'accès
     * @param {number} maxResults - Nombre de vidéos
     * @param {string} pageToken - Token de pagination
     * @returns {Promise<Object>} Vidéos likées
     */
    async getLikedVideos(accessToken, maxResults = 50, pageToken = null) {
        try {
            // Récupérer les infos du canal pour obtenir l'ID de la playlist des likes
            const channelInfo = await this.getChannelInfo(accessToken);

            if (!channelInfo.likesPlaylistId) {
                return { videos: [], total: 0 };
            }

            // Récupérer les vidéos de la playlist des likes
            const likedVideos = await this.getPlaylistItems(
                accessToken,
                channelInfo.likesPlaylistId,
                maxResults,
                pageToken
            );

            // Récupérer les détails complets des vidéos
            const videoIds = likedVideos.items.map(item => item.videoId);
            if (videoIds.length === 0) {
                return { videos: [], total: 0 };
            }

            const videosDetails = await this.getVideosDetails(accessToken, videoIds);

            return {
                total: likedVideos.total,
                nextPageToken: likedVideos.nextPageToken,
                videos: videosDetails.videos
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des vidéos likées:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les vidéos likées');
        }
    }

    /**
     * Convertir la durée ISO 8601 en millisecondes
     * @param {string} duration - Durée au format ISO 8601 (ex: PT4M13S)
     * @returns {number} Durée en millisecondes
     */
    parseDuration(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        if (!match) return 0;

        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const seconds = parseInt(match[3]) || 0;

        return (hours * 3600 + minutes * 60 + seconds) * 1000;
    }

    /**
     * Formater les données d'une vidéo
     * @param {Object} video - Vidéo YouTube
     * @returns {Object} Vidéo formatée
     */
    formatVideo(video) {
        if (!video) return null;

        return {
            id: video.id,
            title: video.snippet.title,
            description: video.snippet.description,
            thumbnails: video.snippet.thumbnails,
            channelId: video.snippet.channelId,
            channelTitle: video.snippet.channelTitle,
            tags: video.snippet.tags || [],
            categoryId: video.snippet.categoryId,
            liveBroadcastContent: video.snippet.liveBroadcastContent,
            defaultLanguage: video.snippet.defaultLanguage,
            defaultAudioLanguage: video.snippet.defaultAudioLanguage,
            publishedAt: video.snippet.publishedAt,
            duration: this.parseDuration(video.contentDetails.duration),
            dimension: video.contentDetails.dimension,
            definition: video.contentDetails.definition,
            caption: video.contentDetails.caption,
            licensedContent: video.contentDetails.licensedContent,
            regionRestriction: video.contentDetails.regionRestriction,
            contentRating: video.contentDetails.contentRating,
            projection: video.contentDetails.projection,
            viewCount: parseInt(video.statistics?.viewCount) || 0,
            likeCount: parseInt(video.statistics?.likeCount) || 0,
            commentCount: parseInt(video.statistics?.commentCount) || 0,
            privacy: video.status.privacyStatus,
            uploadStatus: video.status.uploadStatus,
            failureReason: video.status.failureReason,
            rejectionReason: video.status.rejectionReason,
            publishAt: video.status.publishAt,
            license: video.status.license,
            embeddable: video.status.embeddable,
            publicStatsViewable: video.status.publicStatsViewable,
            madeForKids: video.status.madeForKids,
            selfDeclaredMadeForKids: video.status.selfDeclaredMadeForKids
        };
    }

    /**
     * Extraire les informations musicales du titre et de la description
     * @param {Object} video - Vidéo formatée
     * @returns {Object} Informations musicales extraites
     */
    extractMusicInfo(video) {
        const title = video.title.toLowerCase();
        const description = video.description.toLowerCase();

        // Patterns communs pour détecter artiste - titre
        const patterns = [
            /^(.+?)\s*-\s*(.+?)(?:\s*\(.*\))?$/,
            /^(.+?)\s*–\s*(.+?)(?:\s*\(.*\))?$/,
            /^(.+?)\s*:\s*(.+?)(?:\s*\(.*\))?$/
        ];

        let artist = null;
        let track = null;

        for (const pattern of patterns) {
            const match = video.title.match(pattern);
            if (match) {
                artist = match[1].trim();
                track = match[2].trim();
                break;
            }
        }

        // Si on n'a pas trouvé avec les patterns, utiliser le nom du canal comme artiste
        if (!artist && video.channelTitle) {
            artist = video.channelTitle;
            track = video.title;
        }

        // Nettoyer les informations extraites
        if (artist) {
            artist = artist.replace(/\s*(official|music|video|mv|hd|hq)\s*/gi, '').trim();
        }

        if (track) {
            track = track.replace(/\s*(official|music|video|mv|hd|hq|lyrics|audio)\s*/gi, '').trim();
        }

        return {
            ...video,
            extractedArtist: artist,
            extractedTrack: track,
            isMusic: video.categoryId === '10' ||
                title.includes('music') ||
                title.includes('song') ||
                description.includes('music') ||
                description.includes('song')
        };
    }
}

module.exports = new YouTubeMusicService();
