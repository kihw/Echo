const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Service d'analyse des caractéristiques audio et de génération de recommandations
 * Utilise l'API Spotify pour l'analyse audio et implémente des algorithmes de recommandation
 */
class RecommendationService {
  constructor() {
    this.spotifyService = null; // Sera injecté
    this.userPreferences = new Map(); // Cache des préférences utilisateur
    this.audioFeaturesCache = new Map(); // Cache des caractéristiques audio
  }

  /**
   * Initialise le service avec les dépendances
   */
  initialize(spotifyService) {
    this.spotifyService = spotifyService;
  }

  /**
   * Analyse les caractéristiques audio d'une track
   * @param {string} trackId - ID de la track
   * @param {string} service - Service source (spotify, deezer, ytmusic)
   * @returns {Promise<Object>} Caractéristiques audio
   */
  async analyzeAudioFeatures(trackId, service = 'spotify') {
    try {
      const cacheKey = `${service}:${trackId}`;
      
      // Vérifier le cache
      if (this.audioFeaturesCache.has(cacheKey)) {
        return this.audioFeaturesCache.get(cacheKey);
      }

      let features = null;

      switch (service) {
        case 'spotify':
          features = await this.analyzeSpotifyAudioFeatures(trackId);
          break;
        case 'deezer':
          features = await this.analyzeDeezerAudioFeatures(trackId);
          break;
        case 'ytmusic':
          features = await this.analyzeYTMusicAudioFeatures(trackId);
          break;
        default:
          throw new Error(`Service non supporté: ${service}`);
      }

      // Mettre en cache
      this.audioFeaturesCache.set(cacheKey, features);
      
      return features;
    } catch (error) {
      logger.error('Erreur lors de l\'analyse des caractéristiques audio:', error);
      throw error;
    }
  }

  /**
   * Analyse via l'API Spotify
   */
  async analyzeSpotifyAudioFeatures(trackId) {
    if (!this.spotifyService) {
      throw new Error('Service Spotify non initialisé');
    }

    const audioFeatures = await this.spotifyService.getAudioFeatures(trackId);
    const trackInfo = await this.spotifyService.getTrack(trackId);

    return {
      // Caractéristiques audio principales
      tempo: audioFeatures.tempo,
      energy: audioFeatures.energy,
      valence: audioFeatures.valence,
      danceability: audioFeatures.danceability,
      acousticness: audioFeatures.acousticness,
      instrumentalness: audioFeatures.instrumentalness,
      liveness: audioFeatures.liveness,
      speechiness: audioFeatures.speechiness,
      loudness: audioFeatures.loudness,
      key: audioFeatures.key,
      mode: audioFeatures.mode,
      duration_ms: audioFeatures.duration_ms,
      
      // Métadonnées enrichies
      popularity: trackInfo.popularity,
      explicit: trackInfo.explicit,
      
      // Genre et style (si disponible)
      genres: this.extractGenresFromArtists(trackInfo.artists),
      
      // Score d'énergie calculé
      energyScore: this.calculateEnergyScore(audioFeatures),
      
      // Mood calculé
      mood: this.calculateMood(audioFeatures),
      
      // Contexte d'écoute suggéré
      contexts: this.suggestListeningContexts(audioFeatures),
      
      // Timestamp d'analyse
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Analyse pour Deezer (basée sur des heuristiques)
   */
  async analyzeDeezerAudioFeatures(trackId) {
    // Implémentation simplifiée - dans un cas réel, utiliser l'API Deezer
    // ou des services d'analyse audio tiers
    return {
      tempo: null,
      energy: 0.5,
      valence: 0.5,
      danceability: 0.5,
      acousticness: 0.5,
      instrumentalness: 0.1,
      liveness: 0.1,
      speechiness: 0.1,
      loudness: -10,
      key: 5,
      mode: 1,
      duration_ms: 200000,
      energyScore: 0.5,
      mood: 'neutral',
      contexts: ['general'],
      analyzedAt: new Date().toISOString(),
      source: 'deezer_estimated'
    };
  }

  /**
   * Analyse pour YouTube Music (basée sur des heuristiques)
   */
  async analyzeYTMusicAudioFeatures(trackId) {
    // Implémentation similaire à Deezer
    return {
      tempo: null,
      energy: 0.5,
      valence: 0.5,
      danceability: 0.5,
      acousticness: 0.5,
      instrumentalness: 0.1,
      liveness: 0.1,
      speechiness: 0.1,
      loudness: -10,
      key: 5,
      mode: 1,
      duration_ms: 200000,
      energyScore: 0.5,
      mood: 'neutral',
      contexts: ['general'],
      analyzedAt: new Date().toISOString(),
      source: 'ytmusic_estimated'
    };
  }

  /**
   * Calcule un score d'énergie global
   */
  calculateEnergyScore(features) {
    const weights = {
      energy: 0.3,
      danceability: 0.25,
      valence: 0.2,
      loudness: 0.15,
      tempo: 0.1
    };

    // Normaliser le loudness (-60 à 0 dB)
    const normalizedLoudness = Math.max(0, (features.loudness + 60) / 60);
    
    // Normaliser le tempo (60-200 BPM typique)
    const normalizedTempo = Math.min(1, Math.max(0, (features.tempo - 60) / 140));

    return (
      features.energy * weights.energy +
      features.danceability * weights.danceability +
      features.valence * weights.valence +
      normalizedLoudness * weights.loudness +
      normalizedTempo * weights.tempo
    );
  }

  /**
   * Détermine l'humeur d'une track
   */
  calculateMood(features) {
    const { energy, valence, danceability, acousticness } = features;

    if (valence > 0.6 && energy > 0.6) return 'happy';
    if (valence > 0.6 && energy < 0.4) return 'peaceful';
    if (valence < 0.4 && energy > 0.6) return 'aggressive';
    if (valence < 0.4 && energy < 0.4) return 'sad';
    if (danceability > 0.7) return 'danceable';
    if (acousticness > 0.7) return 'acoustic';
    
    return 'neutral';
  }

  /**
   * Suggère des contextes d'écoute
   */
  suggestListeningContexts(features) {
    const contexts = [];
    
    if (features.energy > 0.7 && features.danceability > 0.6) {
      contexts.push('party', 'workout');
    }
    
    if (features.valence > 0.6 && features.energy > 0.5) {
      contexts.push('mood_booster');
    }
    
    if (features.acousticness > 0.6 && features.energy < 0.5) {
      contexts.push('chill', 'study');
    }
    
    if (features.instrumentalness > 0.5) {
      contexts.push('focus', 'background');
    }
    
    if (features.liveness > 0.3) {
      contexts.push('live_music');
    }
    
    if (contexts.length === 0) {
      contexts.push('general');
    }
    
    return contexts;
  }

  /**
   * Extrait les genres des artistes
   */
  extractGenresFromArtists(artists) {
    const genres = new Set();
    
    artists.forEach(artist => {
      if (artist.genres && Array.isArray(artist.genres)) {
        artist.genres.forEach(genre => genres.add(genre));
      }
    });
    
    return Array.from(genres);
  }

  /**
   * Génère des recommandations basées sur l'historique de l'utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} options - Options de recommandation
   * @returns {Promise<Array>} Liste de recommandations
   */
  async generatePersonalizedRecommendations(userId, options = {}) {
    try {
      const {
        limit = 20,
        includeNewReleases = true,
        includeSimilarArtists = true,
        diversityFactor = 0.3,
        mood = null,
        context = null
      } = options;

      // Analyser l'historique d'écoute
      const userProfile = await this.buildUserProfile(userId);
      
      // Obtenir des recommandations de différentes sources
      const recommendations = [];
      
      // 1. Recommandations basées sur les caractéristiques audio
      const audioBasedRecs = await this.getAudioBasedRecommendations(userProfile, limit * 0.4);
      recommendations.push(...audioBasedRecs);
      
      // 2. Recommandations basées sur les artistes similaires
      if (includeSimilarArtists) {
        const artistBasedRecs = await this.getArtistBasedRecommendations(userProfile, limit * 0.3);
        recommendations.push(...artistBasedRecs);
      }
      
      // 3. Nouvelles sorties dans les genres aimés
      if (includeNewReleases) {
        const newReleaseRecs = await this.getNewReleaseRecommendations(userProfile, limit * 0.2);
        recommendations.push(...newReleaseRecs);
      }
      
      // 4. Recommandations de découverte
      const discoveryRecs = await this.getDiscoveryRecommendations(userProfile, limit * 0.1);
      recommendations.push(...discoveryRecs);
      
      // Diversifier et filtrer
      const finalRecommendations = this.diversifyRecommendations(
        recommendations, 
        limit, 
        diversityFactor
      );
      
      // Filtrer par mood et contexte si spécifiés
      return this.filterByMoodAndContext(finalRecommendations, mood, context);
      
    } catch (error) {
      logger.error('Erreur lors de la génération des recommandations:', error);
      throw error;
    }
  }

  /**
   * Construit le profil musical de l'utilisateur
   */
  async buildUserProfile(userId) {
    // Cette méthode devrait analyser l'historique d'écoute de l'utilisateur
    // Pour l'instant, on retourne un profil par défaut
    return {
      userId,
      topGenres: ['pop', 'rock', 'electronic'],
      averageFeatures: {
        energy: 0.6,
        valence: 0.7,
        danceability: 0.5,
        acousticness: 0.3
      },
      topArtists: [],
      topTracks: [],
      contexts: ['general', 'chill'],
      buildAt: new Date().toISOString()
    };
  }

  /**
   * Recommandations basées sur les caractéristiques audio
   */
  async getAudioBasedRecommendations(userProfile, limit) {
    // Implémentation simplifiée
    return [];
  }

  /**
   * Recommandations basées sur les artistes similaires
   */
  async getArtistBasedRecommendations(userProfile, limit) {
    // Implémentation simplifiée
    return [];
  }

  /**
   * Recommandations de nouvelles sorties
   */
  async getNewReleaseRecommendations(userProfile, limit) {
    // Implémentation simplifiée
    return [];
  }

  /**
   * Recommandations de découverte
   */
  async getDiscoveryRecommendations(userProfile, limit) {
    // Implémentation simplifiée
    return [];
  }

  /**
   * Diversifie les recommandations pour éviter la monotonie
   */
  diversifyRecommendations(recommendations, limit, diversityFactor) {
    // Algorithme de diversification simple
    const diverse = [];
    const used = new Set();
    
    recommendations.forEach(rec => {
      if (diverse.length >= limit) return;
      
      const key = `${rec.artist}-${rec.genre}`;
      if (!used.has(key) || Math.random() < diversityFactor) {
        diverse.push(rec);
        used.add(key);
      }
    });
    
    return diverse;
  }

  /**
   * Filtre par mood et contexte
   */
  filterByMoodAndContext(recommendations, mood, context) {
    if (!mood && !context) return recommendations;
    
    return recommendations.filter(rec => {
      if (mood && rec.mood !== mood) return false;
      if (context && !rec.contexts.includes(context)) return false;
      return true;
    });
  }
}

module.exports = new RecommendationService();
