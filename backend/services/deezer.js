const axios = require('axios');
const { logger } = require('../utils/logger');

/**
 * Service d'intégration avec l'API Deezer
 * Gère les requêtes vers l'API Deezer
 */
class DeezerService {
    constructor() {
        this.baseURL = 'https://api.deezer.com';
        this.appId = process.env.DEEZER_APP_ID;
        this.appSecret = process.env.DEEZER_APP_SECRET;
        this.redirectUri = process.env.DEEZER_REDIRECT_URI;
    }

    /**
     * Créer un client HTTP avec l'authentification
     * @param {string} accessToken - Token d'accès utilisateur
     * @returns {Object} Instance Axios configurée
     */
    createAuthenticatedClient(accessToken) {
        return axios.create({
            baseURL: this.baseURL,
            params: {
                access_token: accessToken
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
            const response = await client.get('/user/me');

            return {
                id: response.data.id,
                name: response.data.name,
                firstname: response.data.firstname,
                lastname: response.data.lastname,
                email: response.data.email,
                country: response.data.country,
                lang: response.data.lang,
                picture: response.data.picture,
                pictureSmall: response.data.picture_small,
                pictureMedium: response.data.picture_medium,
                pictureBig: response.data.picture_big,
                pictureXl: response.data.picture_xl,
                inscriptionDate: response.data.inscription_date,
                link: response.data.link
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération du profil Deezer:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer le profil Deezer');
        }
    }

    /**
     * Obtenir les playlists de l'utilisateur
     * @param {string} accessToken - Token d'accès
     * @param {number} limit - Nombre de playlists à récupérer
     * @param {number} index - Index de départ pour la pagination
     * @returns {Promise<Object>} Liste des playlists
     */
    async getUserPlaylists(accessToken, limit = 25, index = 0) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const response = await client.get('/user/me/playlists', {
                params: { limit, index }
            });

            return {
                total: response.data.total,
                playlists: response.data.data.map(playlist => ({
                    id: playlist.id,
                    title: playlist.title,
                    description: playlist.description,
                    duration: playlist.duration,
                    public: playlist.public,
                    isLovedTrack: playlist.is_loved_track,
                    collaborative: playlist.collaborative,
                    trackCount: playlist.nb_tracks,
                    fans: playlist.fans,
                    link: playlist.link,
                    picture: playlist.picture,
                    pictureSmall: playlist.picture_small,
                    pictureMedium: playlist.picture_medium,
                    pictureBig: playlist.picture_big,
                    pictureXl: playlist.picture_xl,
                    checksum: playlist.checksum,
                    creationDate: playlist.creation_date,
                    creator: {
                        id: playlist.creator.id,
                        name: playlist.creator.name,
                        link: playlist.creator.link,
                        picture: playlist.creator.picture,
                        pictureSmall: playlist.creator.picture_small,
                        pictureMedium: playlist.creator.picture_medium,
                        pictureBig: playlist.creator.picture_big,
                        pictureXl: playlist.creator.picture_xl
                    }
                }))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des playlists Deezer:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les playlists Deezer');
        }
    }

    /**
     * Obtenir les tracks d'une playlist
     * @param {string} accessToken - Token d'accès
     * @param {string} playlistId - ID de la playlist
     * @param {number} limit - Nombre de tracks à récupérer
     * @param {number} index - Index de départ pour la pagination
     * @returns {Promise<Object>} Tracks de la playlist
     */
    async getPlaylistTracks(accessToken, playlistId, limit = 50, index = 0) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const response = await client.get(`/playlist/${playlistId}/tracks`, {
                params: { limit, index }
            });

            return {
                total: response.data.total,
                tracks: response.data.data.map(track => this.formatTrack(track))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des tracks de playlist Deezer:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les tracks de la playlist');
        }
    }

    /**
     * Obtenir les tracks favorites de l'utilisateur
     * @param {string} accessToken - Token d'accès
     * @param {number} limit - Nombre de tracks à récupérer
     * @param {number} index - Index de départ pour la pagination
     * @returns {Promise<Object>} Tracks favorites
     */
    async getUserFavoriteTracks(accessToken, limit = 50, index = 0) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const response = await client.get('/user/me/tracks', {
                params: { limit, index }
            });

            return {
                total: response.data.total,
                tracks: response.data.data.map(track => this.formatTrack(track))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des tracks favorites Deezer:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les tracks favorites');
        }
    }

    /**
     * Obtenir les artistes favoris de l'utilisateur
     * @param {string} accessToken - Token d'accès
     * @param {number} limit - Nombre d'artistes à récupérer
     * @param {number} index - Index de départ pour la pagination
     * @returns {Promise<Object>} Artistes favoris
     */
    async getUserFavoriteArtists(accessToken, limit = 50, index = 0) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const response = await client.get('/user/me/artists', {
                params: { limit, index }
            });

            return {
                total: response.data.total,
                artists: response.data.data.map(artist => this.formatArtist(artist))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des artistes favoris Deezer:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les artistes favoris');
        }
    }

    /**
     * Obtenir les albums favoris de l'utilisateur
     * @param {string} accessToken - Token d'accès
     * @param {number} limit - Nombre d'albums à récupérer
     * @param {number} index - Index de départ pour la pagination
     * @returns {Promise<Object>} Albums favoris
     */
    async getUserFavoriteAlbums(accessToken, limit = 50, index = 0) {
        try {
            const client = this.createAuthenticatedClient(accessToken);
            const response = await client.get('/user/me/albums', {
                params: { limit, index }
            });

            return {
                total: response.data.total,
                albums: response.data.data.map(album => this.formatAlbum(album))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des albums favoris Deezer:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les albums favoris');
        }
    }

    /**
     * Rechercher des tracks
     * @param {string} query - Requête de recherche
     * @param {number} limit - Nombre de résultats
     * @param {number} index - Index de départ
     * @returns {Promise<Object>} Résultats de recherche
     */
    async searchTracks(query, limit = 25, index = 0) {
        try {
            const client = axios.create({
                baseURL: this.baseURL,
                timeout: 10000
            });

            const response = await client.get('/search/track', {
                params: { q: query, limit, index }
            });

            return {
                total: response.data.total,
                tracks: response.data.data.map(track => this.formatTrack(track))
            };
        } catch (error) {
            logger.error('Erreur lors de la recherche Deezer:', error.response?.data || error.message);
            throw new Error('Erreur lors de la recherche');
        }
    }

    /**
     * Obtenir les informations d'une track
     * @param {string} trackId - ID de la track
     * @returns {Promise<Object>} Informations de la track
     */
    async getTrack(trackId) {
        try {
            const client = axios.create({
                baseURL: this.baseURL,
                timeout: 10000
            });

            const response = await client.get(`/track/${trackId}`);
            return this.formatTrack(response.data);
        } catch (error) {
            logger.error('Erreur lors de la récupération de la track Deezer:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer la track');
        }
    }

    /**
     * Obtenir les informations d'un artiste
     * @param {string} artistId - ID de l'artiste
     * @returns {Promise<Object>} Informations de l'artiste
     */
    async getArtist(artistId) {
        try {
            const client = axios.create({
                baseURL: this.baseURL,
                timeout: 10000
            });

            const response = await client.get(`/artist/${artistId}`);
            return this.formatArtist(response.data);
        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'artiste Deezer:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer l\'artiste');
        }
    }

    /**
     * Obtenir les top tracks d'un artiste
     * @param {string} artistId - ID de l'artiste
     * @param {number} limit - Nombre de tracks
     * @returns {Promise<Object>} Top tracks de l'artiste
     */
    async getArtistTopTracks(artistId, limit = 50) {
        try {
            const client = axios.create({
                baseURL: this.baseURL,
                timeout: 10000
            });

            const response = await client.get(`/artist/${artistId}/top`, {
                params: { limit }
            });

            return {
                tracks: response.data.data.map(track => this.formatTrack(track))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération des top tracks de l\'artiste:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les top tracks');
        }
    }

    /**
     * Formater les données d'une track
     * @param {Object} track - Track Deezer
     * @returns {Object} Track formatée
     */
    formatTrack(track) {
        if (!track) return null;

        return {
            id: track.id,
            readable: track.readable,
            title: track.title,
            titleShort: track.title_short,
            titleVersion: track.title_version,
            isrc: track.isrc,
            link: track.link,
            duration: track.duration * 1000, // Convertir en millisecondes
            trackPosition: track.track_position,
            diskNumber: track.disk_number,
            rank: track.rank,
            releaseDate: track.release_date,
            explicitLyrics: track.explicit_lyrics,
            explicitContentLyrics: track.explicit_content_lyrics,
            explicitContentCover: track.explicit_content_cover,
            preview: track.preview,
            bpm: track.bpm,
            gain: track.gain,
            availableCountries: track.available_countries,
            artist: track.artist ? this.formatArtist(track.artist) : null,
            album: track.album ? this.formatAlbum(track.album) : null,
            contributors: track.contributors?.map(contributor => this.formatArtist(contributor)) || []
        };
    }

    /**
     * Formater les données d'un artiste
     * @param {Object} artist - Artiste Deezer
     * @returns {Object} Artiste formaté
     */
    formatArtist(artist) {
        if (!artist) return null;

        return {
            id: artist.id,
            name: artist.name,
            link: artist.link,
            share: artist.share,
            picture: artist.picture,
            pictureSmall: artist.picture_small,
            pictureMedium: artist.picture_medium,
            pictureBig: artist.picture_big,
            pictureXl: artist.picture_xl,
            nbAlbum: artist.nb_album,
            nbFan: artist.nb_fan,
            radio: artist.radio,
            tracklist: artist.tracklist,
            role: artist.role // Pour les contributeurs
        };
    }

    /**
     * Formater les données d'un album
     * @param {Object} album - Album Deezer
     * @returns {Object} Album formaté
     */
    formatAlbum(album) {
        if (!album) return null;

        return {
            id: album.id,
            title: album.title,
            upc: album.upc,
            link: album.link,
            share: album.share,
            cover: album.cover,
            coverSmall: album.cover_small,
            coverMedium: album.cover_medium,
            coverBig: album.cover_big,
            coverXl: album.cover_xl,
            mdCode: album.md5_image,
            genreId: album.genre_id,
            genres: album.genres?.data || [],
            label: album.label,
            nbTracks: album.nb_tracks,
            duration: album.duration,
            fans: album.fans,
            rating: album.rating,
            releaseDate: album.release_date,
            recordType: album.record_type,
            available: album.available,
            tracklist: album.tracklist,
            explicitLyrics: album.explicit_lyrics,
            explicitContentLyrics: album.explicit_content_lyrics,
            explicitContentCover: album.explicit_content_cover,
            contributors: album.contributors?.map(contributor => this.formatArtist(contributor)) || [],
            artist: album.artist ? this.formatArtist(album.artist) : null
        };
    }
}

module.exports = new DeezerService();
