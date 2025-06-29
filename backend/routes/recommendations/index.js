const express = require('express');
const router = express.Router();
const recommendationService = require('../../services/recommendation');
const auth = require('../../middleware/auth');
const logger = require('../../utils/logger');

/**
 * Routes pour le système de recommandations
 */

/**
 * GET /api/recommendations
 * Obtenir des recommandations personnalisées
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      limit = 20,
      mood = null,
      context = null,
      includeNewReleases = true,
      includeSimilarArtists = true,
      diversityFactor = 0.3
    } = req.query;

    const options = {
      limit: parseInt(limit),
      mood,
      context,
      includeNewReleases: includeNewReleases === 'true',
      includeSimilarArtists: includeSimilarArtists === 'true',
      diversityFactor: parseFloat(diversityFactor)
    };

    const recommendations = await recommendationService.generatePersonalizedRecommendations(
      userId,
      options
    );

    res.json({
      success: true,
      data: {
        recommendations,
        userId,
        generatedAt: new Date().toISOString(),
        options
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des recommandations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération des recommandations'
    });
  }
});

/**
 * GET /api/recommendations/daily
 * Mix quotidien personnalisé
 */
router.get('/daily', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Générer un mix équilibré pour la journée
    const recommendations = await recommendationService.generatePersonalizedRecommendations(
      userId,
      {
        limit: 30,
        includeNewReleases: true,
        includeSimilarArtists: true,
        diversityFactor: 0.5
      }
    );

    res.json({
      success: true,
      data: {
        title: 'Votre Mix Quotidien',
        description: 'Une sélection personnalisée pour bien commencer la journée',
        recommendations,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la génération du mix quotidien:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération du mix quotidien'
    });
  }
});

/**
 * GET /api/recommendations/mood/:mood
 * Recommandations par humeur
 */
router.get('/mood/:mood', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mood } = req.params;
    const { limit = 25 } = req.query;

    const validMoods = ['happy', 'sad', 'peaceful', 'aggressive', 'danceable', 'acoustic', 'neutral'];
    
    if (!validMoods.includes(mood)) {
      return res.status(400).json({
        success: false,
        error: 'Humeur non valide',
        validMoods
      });
    }

    const recommendations = await recommendationService.generatePersonalizedRecommendations(
      userId,
      {
        limit: parseInt(limit),
        mood,
        diversityFactor: 0.2 // Moins de diversité pour une humeur spécifique
      }
    );

    const moodDescriptions = {
      happy: 'Musiques joyeuses et énergiques',
      sad: 'Musiques mélancoliques et apaisantes',
      peaceful: 'Musiques relaxantes et tranquilles',
      aggressive: 'Musiques intenses et puissantes',
      danceable: 'Musiques parfaites pour danser',
      acoustic: 'Musiques acoustiques et intimistes',
      neutral: 'Musiques pour tous les moments'
    };

    res.json({
      success: true,
      data: {
        mood,
        title: `Humeur ${mood}`,
        description: moodDescriptions[mood],
        recommendations
      }
    });

  } catch (error) {
    logger.error('Erreur lors des recommandations par humeur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération des recommandations par humeur'
    });
  }
});

/**
 * GET /api/recommendations/context/:context
 * Recommandations par contexte d'écoute
 */
router.get('/context/:context', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { context } = req.params;
    const { limit = 25 } = req.query;

    const validContexts = ['workout', 'study', 'party', 'chill', 'focus', 'sleep', 'commute'];
    
    if (!validContexts.includes(context)) {
      return res.status(400).json({
        success: false,
        error: 'Contexte non valide',
        validContexts
      });
    }

    const recommendations = await recommendationService.generatePersonalizedRecommendations(
      userId,
      {
        limit: parseInt(limit),
        context,
        diversityFactor: 0.25
      }
    );

    const contextDescriptions = {
      workout: 'Musiques motivantes pour le sport',
      study: 'Musiques pour se concentrer',
      party: 'Musiques pour faire la fête',
      chill: 'Musiques pour se détendre',
      focus: 'Musiques pour se concentrer',
      sleep: 'Musiques pour dormir',
      commute: 'Musiques pour les trajets'
    };

    res.json({
      success: true,
      data: {
        context,
        title: `${context.charAt(0).toUpperCase() + context.slice(1)}`,
        description: contextDescriptions[context],
        recommendations
      }
    });

  } catch (error) {
    logger.error('Erreur lors des recommandations par contexte:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération des recommandations par contexte'
    });
  }
});

/**
 * POST /api/recommendations/analyze
 * Analyser les caractéristiques audio d'une track
 */
router.post('/analyze', auth, async (req, res) => {
  try {
    const { trackId, service = 'spotify' } = req.body;

    if (!trackId) {
      return res.status(400).json({
        success: false,
        error: 'ID de track requis'
      });
    }

    const features = await recommendationService.analyzeAudioFeatures(trackId, service);

    res.json({
      success: true,
      data: {
        trackId,
        service,
        features
      }
    });

  } catch (error) {
    logger.error('Erreur lors de l\'analyse audio:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse des caractéristiques audio'
    });
  }
});

/**
 * GET /api/recommendations/similar/:trackId
 * Recommandations basées sur une track spécifique
 */
router.get('/similar/:trackId', auth, async (req, res) => {
  try {
    const { trackId } = req.params;
    const { limit = 20, service = 'spotify' } = req.query;

    // Analyser la track de référence
    const referenceFeatures = await recommendationService.analyzeAudioFeatures(trackId, service);

    // Trouver des tracks similaires (implémentation simplifiée)
    const similarTracks = await recommendationService.findSimilarTracks(
      referenceFeatures,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        referenceTrack: {
          id: trackId,
          service,
          features: referenceFeatures
        },
        similarTracks
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la recherche de tracks similaires:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la recherche de tracks similaires'
    });
  }
});

/**
 * POST /api/recommendations/feedback
 * Enregistrer le feedback utilisateur sur une recommandation
 */
router.post('/feedback', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { trackId, rating, action } = req.body;

    // Valider les données
    if (!trackId || (rating === undefined && !action)) {
      return res.status(400).json({
        success: false,
        error: 'trackId et (rating ou action) requis'
      });
    }

    const validActions = ['like', 'dislike', 'skip', 'play', 'add_to_playlist'];
    if (action && !validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Action non valide',
        validActions
      });
    }

    // Enregistrer le feedback (implémentation à compléter)
    const feedback = {
      userId,
      trackId,
      rating: rating ? parseFloat(rating) : null,
      action,
      timestamp: new Date().toISOString()
    };

    // TODO: Sauvegarder en base de données
    logger.info('Feedback utilisateur enregistré:', feedback);

    res.json({
      success: true,
      data: {
        message: 'Feedback enregistré avec succès',
        feedback
      }
    });

  } catch (error) {
    logger.error('Erreur lors de l\'enregistrement du feedback:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'enregistrement du feedback'
    });
  }
});

module.exports = router;
