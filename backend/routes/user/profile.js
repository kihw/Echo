const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const db = require('../../../database/connection');
const TokenManager = require('../../services/tokenManager');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// Route: Récupérer le profil utilisateur
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur introuvable'
      });
    }

    // Masquer les informations sensibles
    const userProfile = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.display_name,
      profilePicture: user.profile_picture,
      preferences: user.preferences,
      connectedServices: user.connected_services,
      listeningStats: user.listening_stats,
      isActive: user.is_active,
      emailVerified: user.email_verified,
      lastLoginAt: user.last_login_at,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    res.json({
      success: true,
      user: userProfile
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer le profil utilisateur'
    });
  }
});

// Route: Mettre à jour le profil utilisateur
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = req.body;

    // Validation des champs autorisés à la mise à jour
    const allowedFields = [
      'username',
      'display_name',
      'profile_picture'
    ];

    const updateFields = {};
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        error: 'Aucune donnée à mettre à jour',
        allowedFields
      });
    }

    // Vérification de l'unicité du username si modifié
    if (updateFields.username) {
      const existingUser = await db.query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [updateFields.username, userId]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          error: 'Username déjà utilisé',
          message: 'Ce nom d\'utilisateur est déjà pris'
        });
      }
    }

    // Mise à jour du profil
    const updatedUser = await db.update('users', userId, updateFields);

    if (!updatedUser) {
      return res.status(404).json({
        error: 'Utilisateur introuvable'
      });
    }

    res.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        displayName: updatedUser.display_name,
        profilePicture: updatedUser.profile_picture,
        updatedAt: updatedUser.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de mettre à jour le profil'
    });
  }
});

// Route: Mettre à jour les préférences utilisateur
router.put('/preferences', async (req, res) => {
  try {
    const userId = req.user.id;
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        error: 'Préférences invalides',
        message: 'Les préférences doivent être un objet JSON valide'
      });
    }

    // Récupération des préférences actuelles
    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur introuvable'
      });
    }

    // Fusion des préférences (merge)
    const currentPreferences = user.preferences || {};
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences
    };

    // Validation des préférences
    const validPreferences = {
      autoPlay: typeof updatedPreferences.autoPlay === 'boolean' ? updatedPreferences.autoPlay : true,
      shuffle: typeof updatedPreferences.shuffle === 'boolean' ? updatedPreferences.shuffle : false,
      repeat: ['none', 'one', 'all'].includes(updatedPreferences.repeat) ? updatedPreferences.repeat : 'none',
      volume: typeof updatedPreferences.volume === 'number' && updatedPreferences.volume >= 0 && updatedPreferences.volume <= 1 ? updatedPreferences.volume : 0.8,
      audioQuality: ['low', 'medium', 'high'].includes(updatedPreferences.audioQuality) ? updatedPreferences.audioQuality : 'high',
      theme: ['light', 'dark', 'auto'].includes(updatedPreferences.theme) ? updatedPreferences.theme : 'dark',
      language: typeof updatedPreferences.language === 'string' ? updatedPreferences.language : 'fr',
      notifications: {
        ...currentPreferences.notifications,
        ...updatedPreferences.notifications
      }
    };

    // Mise à jour en base
    await db.update('users', userId, {
      preferences: JSON.stringify(validPreferences)
    });

    res.json({
      success: true,
      message: 'Préférences mises à jour avec succès',
      preferences: validPreferences
    });

  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour des préférences:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de mettre à jour les préférences'
    });
  }
});

// Route: Récupérer les statistiques d'écoute
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;

    // Calcul de la période
    let dateFrom;
    switch (period) {
      case '7d':
        dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3m':
        dateFrom = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Statistiques de base depuis l'historique d'écoute
    const basicStats = await db.query(`
      SELECT 
        COUNT(*) as total_plays,
        COUNT(DISTINCT track_id) as unique_tracks,
        SUM(play_duration) as total_listening_time,
        AVG(completion_rate) as avg_completion_rate,
        COUNT(CASE WHEN action_type = 'skip' THEN 1 END) as total_skips
      FROM listening_history 
      WHERE user_id = $1 AND played_at >= $2
    `, [userId, dateFrom]);

    // Top artistes
    const topArtists = await db.query(`
      SELECT 
        t.artist,
        COUNT(*) as play_count,
        SUM(lh.play_duration) as total_duration
      FROM listening_history lh
      JOIN tracks t ON lh.track_id = t.id
      WHERE lh.user_id = $1 AND lh.played_at >= $2
      GROUP BY t.artist
      ORDER BY play_count DESC
      LIMIT 10
    `, [userId, dateFrom]);

    // Top pistes
    const topTracks = await db.query(`
      SELECT 
        t.title,
        t.artist,
        t.album,
        COUNT(*) as play_count,
        SUM(lh.play_duration) as total_duration
      FROM listening_history lh
      JOIN tracks t ON lh.track_id = t.id
      WHERE lh.user_id = $1 AND lh.played_at >= $2
      GROUP BY t.id, t.title, t.artist, t.album
      ORDER BY play_count DESC
      LIMIT 10
    `, [userId, dateFrom]);

    // Écoutes par jour (pour les graphiques)
    const dailyStats = await db.query(`
      SELECT 
        DATE(played_at) as date,
        COUNT(*) as plays,
        SUM(play_duration) as duration
      FROM listening_history
      WHERE user_id = $1 AND played_at >= $2
      GROUP BY DATE(played_at)
      ORDER BY date
    `, [userId, dateFrom]);

    // Genres les plus écoutés
    const topGenres = await db.query(`
      SELECT 
        t.genre,
        COUNT(*) as play_count,
        SUM(lh.play_duration) as total_duration
      FROM listening_history lh
      JOIN tracks t ON lh.track_id = t.id
      WHERE lh.user_id = $1 AND lh.played_at >= $2 AND t.genre IS NOT NULL
      GROUP BY t.genre
      ORDER BY play_count DESC
      LIMIT 10
    `, [userId, dateFrom]);

    const stats = basicStats.rows[0];

    res.json({
      success: true,
      period,
      stats: {
        totalPlays: parseInt(stats.total_plays) || 0,
        uniqueTracks: parseInt(stats.unique_tracks) || 0,
        totalListeningTime: parseInt(stats.total_listening_time) || 0,
        averageCompletionRate: parseFloat(stats.avg_completion_rate) || 0,
        totalSkips: parseInt(stats.total_skips) || 0,
        skipRate: stats.total_plays > 0 ? (stats.total_skips / stats.total_plays) : 0
      },
      topArtists: topArtists.rows,
      topTracks: topTracks.rows,
      topGenres: topGenres.rows,
      dailyActivity: dailyStats.rows
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les statistiques'
    });
  }
});

// Route: Récupérer l'historique d'écoute
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0, trackId } = req.query;

    let query = `
      SELECT 
        lh.*,
        t.title,
        t.artist,
        t.album,
        t.duration as track_duration_total,
        t.artwork
      FROM listening_history lh
      JOIN tracks t ON lh.track_id = t.id
      WHERE lh.user_id = $1
    `;

    const params = [userId];

    // Filtre par piste spécifique si demandé
    if (trackId) {
      query += ` AND lh.track_id = $${params.length + 1}`;
      params.push(trackId);
    }

    query += ` ORDER BY lh.played_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const history = await db.query(query, params);

    // Compte total pour la pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM listening_history lh
      WHERE lh.user_id = $1 ${trackId ? 'AND lh.track_id = $2' : ''}
    `;

    const countParams = trackId ? [userId, trackId] : [userId];
    const totalResult = await db.query(countQuery, countParams);
    const total = parseInt(totalResult.rows[0].total);

    res.json({
      success: true,
      history: history.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer l\'historique d\'écoute'
    });
  }
});

// Route: Récupérer les services connectés
router.get('/connected-services', async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur introuvable'
      });
    }

    const connectedServices = user.connected_services || {};

    // Vérification du statut des tokens pour chaque service
    const servicesStatus = {};

    for (const [service, config] of Object.entries(connectedServices)) {
      if (config.connected) {
        const tokens = await TokenManager.getTokens(userId, service);
        servicesStatus[service] = {
          ...config,
          tokenValid: tokens ? TokenManager.isTokenValid(tokens) : false,
          lastTokenCheck: new Date().toISOString()
        };
      } else {
        servicesStatus[service] = config;
      }
    }

    res.json({
      success: true,
      connectedServices: servicesStatus
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des services:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les services connectés'
    });
  }
});

// Route: Supprimer le compte utilisateur
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmation } = req.body;

    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return res.status(400).json({
        error: 'Confirmation requise',
        message: 'Vous devez confirmer la suppression avec "DELETE_MY_ACCOUNT"'
      });
    }

    // Révocation de tous les tokens
    await TokenManager.revokeTokens(userId);

    // Suppression des données utilisateur (CASCADE supprimera l'historique)
    const deletedUser = await db.delete('users', userId);

    if (!deletedUser) {
      return res.status(404).json({
        error: 'Utilisateur introuvable'
      });
    }

    console.log(`🗑️ Compte utilisateur supprimé: ${deletedUser.email}`);

    res.json({
      success: true,
      message: 'Compte supprimé avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression du compte:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de supprimer le compte'
    });
  }
});

module.exports = router;
