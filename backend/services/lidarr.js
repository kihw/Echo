const axios = require('axios');
const { logger } = require('../utils/logger');

/**
 * Service d'intégration avec Lidarr
 * Gère la synchronisation avec le serveur Lidarr pour la gestion de la bibliothèque musicale
 */
class LidarrService {
    constructor() {
        this.baseURL = process.env.LIDARR_BASE_URL || 'http://localhost:8686';
        this.apiKey = process.env.LIDARR_API_KEY;
        this.apiVersion = 'v1';
    }

    /**
     * Créer un client HTTP configuré pour Lidarr
     * @returns {Object} Instance Axios configurée
     */
    createClient() {
        if (!this.apiKey) {
            throw new Error('Clé API Lidarr non configurée');
        }

        return axios.create({
            baseURL: `${this.baseURL}/api/${this.apiVersion}`,
            headers: {
                'X-Api-Key': this.apiKey,
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
    }

    /**
     * Tester la connexion à Lidarr
     * @returns {Promise<boolean>} Statut de la connexion
     */
    async testConnection() {
        try {
            const client = this.createClient();
            const response = await client.get('/system/status');
            logger.info('Connexion Lidarr réussie:', response.data.version);
            return true;
        } catch (error) {
            logger.error('Erreur de connexion Lidarr:', error.message);
            return false;
        }
    }

    /**
     * Obtenir le statut du système Lidarr
     * @returns {Promise<Object>} Statut du système
     */
    async getSystemStatus() {
        try {
            const client = this.createClient();
            const response = await client.get('/system/status');

            return {
                version: response.data.version,
                buildTime: response.data.buildTime,
                isDebug: response.data.isDebug,
                isProduction: response.data.isProduction,
                isAdmin: response.data.isAdmin,
                isUserInteractive: response.data.isUserInteractive,
                startupPath: response.data.startupPath,
                appData: response.data.appData,
                osName: response.data.osName,
                osVersion: response.data.osVersion,
                isMonoRuntime: response.data.isMonoRuntime,
                isMono: response.data.isMono,
                isLinux: response.data.isLinux,
                isOsx: response.data.isOsx,
                isWindows: response.data.isWindows,
                branch: response.data.branch,
                authentication: response.data.authentication,
                sqliteVersion: response.data.sqliteVersion,
                urlBase: response.data.urlBase
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération du statut Lidarr:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer le statut Lidarr');
        }
    }

    /**
     * Obtenir la liste des artistes
     * @param {boolean} includeStatistics - Inclure les statistiques
     * @returns {Promise<Array>} Liste des artistes
     */
    async getArtists(includeStatistics = false) {
        try {
            const client = this.createClient();
            const response = await client.get('/artist', {
                params: { includeStatistics }
            });

            return response.data.map(artist => this.formatArtist(artist));
        } catch (error) {
            logger.error('Erreur lors de la récupération des artistes Lidarr:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les artistes');
        }
    }

    /**
     * Obtenir un artiste par ID
     * @param {number} artistId - ID de l'artiste
     * @param {boolean} includeStatistics - Inclure les statistiques
     * @returns {Promise<Object>} Artiste
     */
    async getArtist(artistId, includeStatistics = false) {
        try {
            const client = this.createClient();
            const response = await client.get(`/artist/${artistId}`, {
                params: { includeStatistics }
            });

            return this.formatArtist(response.data);
        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'artiste Lidarr:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer l\'artiste');
        }
    }

    /**
     * Rechercher des artistes
     * @param {string} term - Terme de recherche
     * @returns {Promise<Array>} Résultats de recherche
     */
    async searchArtists(term) {
        try {
            const client = this.createClient();
            const response = await client.get('/artist/lookup', {
                params: { term }
            });

            return response.data.map(artist => this.formatArtist(artist));
        } catch (error) {
            logger.error('Erreur lors de la recherche d\'artistes Lidarr:', error.response?.data || error.message);
            throw new Error('Erreur lors de la recherche d\'artistes');
        }
    }

    /**
     * Obtenir les albums d'un artiste
     * @param {number} artistId - ID de l'artiste
     * @param {boolean} includeStatistics - Inclure les statistiques
     * @returns {Promise<Array>} Albums de l'artiste
     */
    async getArtistAlbums(artistId, includeStatistics = false) {
        try {
            const client = this.createClient();
            const response = await client.get('/album', {
                params: { artistId, includeStatistics }
            });

            return response.data.map(album => this.formatAlbum(album));
        } catch (error) {
            logger.error('Erreur lors de la récupération des albums Lidarr:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les albums');
        }
    }

    /**
     * Obtenir un album par ID
     * @param {number} albumId - ID de l'album
     * @param {boolean} includeStatistics - Inclure les statistiques
     * @returns {Promise<Object>} Album
     */
    async getAlbum(albumId, includeStatistics = false) {
        try {
            const client = this.createClient();
            const response = await client.get(`/album/${albumId}`, {
                params: { includeStatistics }
            });

            return this.formatAlbum(response.data);
        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'album Lidarr:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer l\'album');
        }
    }

    /**
     * Obtenir les tracks d'un album
     * @param {number} albumId - ID de l'album
     * @returns {Promise<Array>} Tracks de l'album
     */
    async getAlbumTracks(albumId) {
        try {
            const client = this.createClient();
            const response = await client.get('/track', {
                params: { albumId }
            });

            return response.data.map(track => this.formatTrack(track));
        } catch (error) {
            logger.error('Erreur lors de la récupération des tracks Lidarr:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les tracks');
        }
    }

    /**
     * Obtenir les profils de qualité
     * @returns {Promise<Array>} Profils de qualité
     */
    async getQualityProfiles() {
        try {
            const client = this.createClient();
            const response = await client.get('/qualityProfile');

            return response.data.map(profile => ({
                id: profile.id,
                name: profile.name,
                upgradeAllowed: profile.upgradeAllowed,
                cutoff: profile.cutoff,
                items: profile.items.map(item => ({
                    quality: item.quality,
                    allowed: item.allowed
                }))
            }));
        } catch (error) {
            logger.error('Erreur lors de la récupération des profils qualité Lidarr:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les profils de qualité');
        }
    }

    /**
     * Obtenir les profils de métadonnées
     * @returns {Promise<Array>} Profils de métadonnées
     */
    async getMetadataProfiles() {
        try {
            const client = this.createClient();
            const response = await client.get('/metadataProfile');

            return response.data.map(profile => ({
                id: profile.id,
                name: profile.name,
                primaryAlbumTypes: profile.primaryAlbumTypes,
                secondaryAlbumTypes: profile.secondaryAlbumTypes,
                releaseStatuses: profile.releaseStatuses
            }));
        } catch (error) {
            logger.error('Erreur lors de la récupération des profils métadonnées Lidarr:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les profils de métadonnées');
        }
    }

    /**
     * Obtenir les chemins racine
     * @returns {Promise<Array>} Chemins racine
     */
    async getRootFolders() {
        try {
            const client = this.createClient();
            const response = await client.get('/rootFolder');

            return response.data.map(folder => ({
                id: folder.id,
                path: folder.path,
                accessible: folder.accessible,
                freeSpace: folder.freeSpace,
                totalSpace: folder.totalSpace
            }));
        } catch (error) {
            logger.error('Erreur lors de la récupération des dossiers racine Lidarr:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer les dossiers racine');
        }
    }

    /**
     * Ajouter un artiste à Lidarr
     * @param {Object} artistData - Données de l'artiste
     * @returns {Promise<Object>} Artiste ajouté
     */
    async addArtist(artistData) {
        try {
            const client = this.createClient();
            const response = await client.post('/artist', artistData);

            return this.formatArtist(response.data);
        } catch (error) {
            logger.error('Erreur lors de l\'ajout de l\'artiste Lidarr:', error.response?.data || error.message);
            throw new Error('Impossible d\'ajouter l\'artiste');
        }
    }

    /**
     * Déclencher une recherche manuelle d'albums manquants
     * @param {number} artistId - ID de l'artiste (optionnel)
     * @returns {Promise<Object>} Commande déclenchée
     */
    async searchMissingAlbums(artistId = null) {
        try {
            const client = this.createClient();
            const command = {
                name: 'AlbumSearch'
            };

            if (artistId) {
                command.artistId = artistId;
            }

            const response = await client.post('/command', command);
            return response.data;
        } catch (error) {
            logger.error('Erreur lors du déclenchement de la recherche Lidarr:', error.response?.data || error.message);
            throw new Error('Impossible de déclencher la recherche');
        }
    }

    /**
     * Obtenir l'historique des téléchargements
     * @param {number} page - Numéro de page
     * @param {number} pageSize - Taille de page
     * @param {string} sortKey - Clé de tri
     * @param {string} sortDirection - Direction du tri (asc/desc)
     * @returns {Promise<Object>} Historique
     */
    async getHistory(page = 1, pageSize = 20, sortKey = 'date', sortDirection = 'desc') {
        try {
            const client = this.createClient();
            const response = await client.get('/history', {
                params: {
                    page,
                    pageSize,
                    sortKey,
                    sortDirection
                }
            });

            return {
                page: response.data.page,
                pageSize: response.data.pageSize,
                sortKey: response.data.sortKey,
                sortDirection: response.data.sortDirection,
                totalRecords: response.data.totalRecords,
                records: response.data.records.map(record => ({
                    id: record.id,
                    episodeId: record.episodeId,
                    seriesId: record.seriesId,
                    sourceTitle: record.sourceTitle,
                    quality: record.quality,
                    qualityCutoffNotMet: record.qualityCutoffNotMet,
                    date: record.date,
                    downloadId: record.downloadId,
                    eventType: record.eventType,
                    data: record.data
                }))
            };
        } catch (error) {
            logger.error('Erreur lors de la récupération de l\'historique Lidarr:', error.response?.data || error.message);
            throw new Error('Impossible de récupérer l\'historique');
        }
    }

    /**
     * Formater les données d'un artiste
     * @param {Object} artist - Artiste Lidarr
     * @returns {Object} Artiste formaté
     */
    formatArtist(artist) {
        if (!artist) return null;

        return {
            id: artist.id,
            artistName: artist.artistName,
            foreignArtistId: artist.foreignArtistId,
            mbId: artist.mbId,
            tadbId: artist.tadbId,
            discogsId: artist.discogsId,
            allMusicId: artist.allMusicId,
            overview: artist.overview,
            artistType: artist.artistType,
            disambiguation: artist.disambiguation,
            links: artist.links || [],
            images: artist.images || [],
            path: artist.path,
            qualityProfileId: artist.qualityProfileId,
            metadataProfileId: artist.metadataProfileId,
            monitored: artist.monitored,
            monitorNewItems: artist.monitorNewItems,
            rootFolderPath: artist.rootFolderPath,
            folder: artist.folder,
            genres: artist.genres || [],
            cleanName: artist.cleanName,
            sortName: artist.sortName,
            tags: artist.tags || [],
            added: artist.added,
            ratings: artist.ratings,
            statistics: artist.statistics
        };
    }

    /**
     * Formater les données d'un album
     * @param {Object} album - Album Lidarr
     * @returns {Object} Album formaté
     */
    formatAlbum(album) {
        if (!album) return null;

        return {
            id: album.id,
            title: album.title,
            disambiguation: album.disambiguation,
            overview: album.overview,
            artistId: album.artistId,
            foreignAlbumId: album.foreignAlbumId,
            monitored: album.monitored,
            anyReleaseOk: album.anyReleaseOk,
            profileId: album.profileId,
            duration: album.duration,
            albumType: album.albumType,
            secondaryTypes: album.secondaryTypes || [],
            mediumCount: album.mediumCount,
            ratings: album.ratings,
            releaseDate: album.releaseDate,
            releases: album.releases || [],
            genres: album.genres || [],
            media: album.media || [],
            artist: album.artist ? this.formatArtist(album.artist) : null,
            images: album.images || [],
            links: album.links || [],
            statistics: album.statistics,
            grabbed: album.grabbed
        };
    }

    /**
     * Formater les données d'une track
     * @param {Object} track - Track Lidarr
     * @returns {Object} Track formatée
     */
    formatTrack(track) {
        if (!track) return null;

        return {
            id: track.id,
            title: track.title,
            trackNumber: track.trackNumber,
            duration: track.duration,
            explicit: track.explicit,
            absoluteTrackNumber: track.absoluteTrackNumber,
            albumId: track.albumId,
            foreignTrackId: track.foreignTrackId,
            foreignRecordingId: track.foreignRecordingId,
            trackFileId: track.trackFileId,
            hasFile: track.hasFile,
            monitored: track.monitored,
            ratings: track.ratings,
            mediumNumber: track.mediumNumber,
            artist: track.artist ? this.formatArtist(track.artist) : null,
            album: track.album ? this.formatAlbum(track.album) : null
        };
    }

    /**
     * Synchroniser les données avec la base de données locale
     * @returns {Promise<Object>} Résultat de la synchronisation
     */
    async syncToDatabase() {
        try {
            logger.info('Début de la synchronisation Lidarr...');

            const artists = await this.getArtists(true);
            const syncResults = {
                artists: artists.length,
                albums: 0,
                tracks: 0,
                errors: []
            };

            // Pour chaque artiste, récupérer ses albums et tracks
            for (const artist of artists) {
                try {
                    const albums = await this.getArtistAlbums(artist.id, true);
                    syncResults.albums += albums.length;

                    for (const album of albums) {
                        try {
                            const tracks = await this.getAlbumTracks(album.id);
                            syncResults.tracks += tracks.length;
                        } catch (error) {
                            syncResults.errors.push(`Erreur tracks album ${album.title}: ${error.message}`);
                        }
                    }
                } catch (error) {
                    syncResults.errors.push(`Erreur albums artiste ${artist.artistName}: ${error.message}`);
                }
            }

            logger.info('Synchronisation Lidarr terminée:', syncResults);
            return syncResults;

        } catch (error) {
            logger.error('Erreur lors de la synchronisation Lidarr:', error.message);
            throw new Error('Impossible de synchroniser avec Lidarr');
        }
    }
}

module.exports = new LidarrService();
