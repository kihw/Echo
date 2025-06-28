const express = require('express');
const { authMiddleware } = require('../../middleware/auth');
const db = require('../../../database/connection');

const router = express.Router();

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// Route: Rechercher des pistes
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20, offset = 0, filter } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Requête trop courte',
        message: 'La recherche doit contenir au moins 2 caractères'
      });
    }

    let baseQuery = `
      SELECT 
        t.*,
        ts_rank_cd(to_tsvector('french', t.title || ' ' || t.artist || ' ' || COALESCE(t.album, '')), plainto_tsquery('french', $1)) as rank
      FROM tracks t
      WHERE t.is_active = true
        AND to_tsvector('french', t.title || ' ' || t.artist || ' ' || COALESCE(t.album, '')) @@ plainto_tsquery('french', $1)
    `;

    const params = [q];

    // Filtres additionnels
    if (filter) {
      switch (filter) {
        case 'artist':
          baseQuery += ` AND t.artist ILIKE $${params.length + 1}`;
          params.push(`%${q}%`);
          break;
        case 'album':
          baseQuery += ` AND t.album ILIKE $${params.length + 1}`;
          params.push(`%${q}%`);
          break;
        case 'title':
          baseQuery += ` AND t.title ILIKE $${params.length + 1}`;
          params.push(`%${q}%`);
          break;
      }
    }

    baseQuery += ` ORDER BY rank DESC, t.title LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));

    const results = await db.query(baseQuery, params);

    // Statistiques de recherche pour l'amélioration
    if (results.rows.length > 0) {
      // Log de la recherche réussie (pour analytics)
      console.log(`🔍 Recherche: "${q}" - ${results.rows.length} résultats`);
    }

    res.json({
      success: true,
      query: q,
      results: results.rows.map(track => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        year: track.year,
        genre: track.genre,
        artwork: track.artwork,
        streamingUrls: track.streaming_urls,
        audioFeatures: track.audio_features,
        playStats: track.play_stats,
        relevanceScore: parseFloat(track.rank)
      })),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: results.rows.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la recherche:', error);
    res.status(500).json({
      error: 'Erreur de recherche',
      message: 'Impossible de traiter la recherche'
    });
  }
});

// Route: Récupérer une piste par ID
router.get('/track/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const track = await db.findById('tracks', id);
    if (!track || !track.is_active) {
      return res.status(404).json({
        error: 'Piste introuvable',
        message: 'Cette piste n\'existe pas ou n\'est plus disponible'
      });
    }

    // Enrichissement avec les statistiques utilisateur si disponible
    const userStats = await db.query(`
      SELECT 
        COUNT(*) as user_play_count,
        MAX(played_at) as last_played,
        AVG(completion_rate) as avg_completion
      FROM listening_history 
      WHERE user_id = $1 AND track_id = $2
    `, [req.user.id, id]);

    res.json({
      success: true,
      track: {
        ...track,
        userStats: userStats.rows[0] || {
          user_play_count: 0,
          last_played: null,
          avg_completion: 0
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la piste:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer la piste'
    });
  }
});

// Route: Enregistrer une écoute
router.post('/play', async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      trackId,
      playDuration = 0,
      trackDuration,
      actionType = 'play',
      playContext = {},
      skipInfo = null,
      sessionId = null
    } = req.body;

    if (!trackId || !trackDuration) {
      return res.status(400).json({
        error: 'Données manquantes',
        message: 'trackId et trackDuration sont requis'
      });
    }

    // Vérification que la piste existe
    const track = await db.findById('tracks', trackId);
    if (!track) {
      return res.status(404).json({
        error: 'Piste introuvable'
      });
    }

    // Calcul du taux de complétion
    const completionRate = Math.min(playDuration / trackDuration, 1.0);

    // Calcul du score d'engagement basique
    let engagementScore = completionRate;
    if (actionType === 'skip' && completionRate < 0.3) {
      engagementScore = 0.1; // Skip précoce = faible engagement
    } else if (completionRate > 0.8) {
      engagementScore = 1.0; // Écoute complète = engagement maximal
    }

    // Récupération de la dernière position dans la session
    let sessionSequence = 1;
    if (sessionId) {
      const lastInSession = await db.query(
        'SELECT MAX(session_sequence) as max_seq FROM listening_history WHERE session_id = $1',
        [sessionId]
      );
      sessionSequence = (parseInt(lastInSession.rows[0]?.max_seq) || 0) + 1;
    }

    // Enregistrement de l'historique d'écoute
    const historyEntry = await db.create('listening_history', {
      user_id: userId,
      track_id: trackId,
      play_duration: playDuration,
      track_duration: trackDuration,
      completion_rate: completionRate,
      action_type: actionType,
      play_context: JSON.stringify({
        source: 'player',
        device: 'web',
        ...playContext
      }),
      skip_info: skipInfo ? JSON.stringify(skipInfo) : null,
      engagement_score: engagementScore,
      session_id: sessionId,
      session_sequence: sessionSequence,
      tech_info: JSON.stringify({
        userAgent: req.headers['user-agent'],
        ip: req.ip
      })
    });

    // Mise à jour des statistiques de la piste
    const currentStats = track.play_stats || {};
    const updatedStats = {
      totalPlays: (currentStats.totalPlays || 0) + 1,
      totalPlaytime: (currentStats.totalPlaytime || 0) + playDuration,
      uniqueListeners: currentStats.uniqueListeners || 0, // Sera calculé séparément
      skipRate: 0, // Sera recalculé
      averagePlayDuration: 0, // Sera recalculé
      lastPlayed: new Date().toISOString(),
      popularity: Math.min((currentStats.totalPlays || 0) / 100 * 10, 100) // Score simple
    };

    await db.update('tracks', trackId, {
      play_stats: JSON.stringify(updatedStats)
    });

    res.json({
      success: true,
      message: 'Écoute enregistrée avec succès',
      historyId: historyEntry.id,
      completionRate,
      engagementScore
    });

  } catch (error) {
    console.error('❌ Erreur lors de l\'enregistrement de l\'écoute:', error);
    res.status(500).json({
      error: 'Erreur d\'enregistrement',
      message: 'Impossible d\'enregistrer l\'écoute'
    });
  }
});

// Route: Récupérer les pistes récemment écoutées
router.get('/recent', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const recentTracks = await db.query(`
      SELECT DISTINCT ON (lh.track_id)
        lh.track_id,
        lh.played_at,
        lh.completion_rate,
        t.title,
        t.artist,
        t.album,
        t.duration,
        t.artwork,
        t.streaming_urls
      FROM listening_history lh
      JOIN tracks t ON lh.track_id = t.id
      WHERE lh.user_id = $1 AND lh.action_type IN ('play', 'complete')
      ORDER BY lh.track_id, lh.played_at DESC
      LIMIT $2
    `, [userId, parseInt(limit)]);

    res.json({
      success: true,
      recentTracks: recentTracks.rows
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des pistes récentes:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les pistes récentes'
    });
  }
});

// Route: Récupérer les pistes populaires
router.get('/popular', async (req, res) => {
  try {
    const { limit = 50, genre, period = '30d' } = req.query;

    // Calcul de la période
    let dateFrom;
    switch (period) {
      case '7d':
        dateFrom = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        dateFrom = new Date(0); // Depuis le début
        break;
      default:
        dateFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    let query = `
      SELECT 
        t.*,
        COUNT(lh.id) as recent_plays,
        COUNT(DISTINCT lh.user_id) as unique_listeners,
        AVG(lh.completion_rate) as avg_completion_rate
      FROM tracks t
      LEFT JOIN listening_history lh ON t.id = lh.track_id AND lh.played_at >= $1
      WHERE t.is_active = true
    `;

    const params = [dateFrom];

    if (genre) {
      query += ` AND t.genre = $${params.length + 1}`;
      params.push(genre);
    }

    query += `
      GROUP BY t.id
      ORDER BY recent_plays DESC, unique_listeners DESC, avg_completion_rate DESC
      LIMIT $${params.length + 1}
    `;
    params.push(parseInt(limit));

    const popularTracks = await db.query(query, params);

    res.json({
      success: true,
      period,
      genre: genre || 'all',
      popularTracks: popularTracks.rows.map(track => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        genre: track.genre,
        artwork: track.artwork,
        streamingUrls: track.streaming_urls,
        popularity: {
          recentPlays: parseInt(track.recent_plays),
          uniqueListeners: parseInt(track.unique_listeners),
          avgCompletionRate: parseFloat(track.avg_completion_rate) || 0
        }
      }))
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des pistes populaires:', error);
    res.status(500).json({
      error: 'Erreur serveur',
      message: 'Impossible de récupérer les pistes populaires'
    });
  }
});

// Route: Recommandations basiques
router.get('/recommendations', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, seed_tracks, seed_artists, seed_genres } = req.query;

    // Récupération des genres les plus écoutés par l'utilisateur
    const userTopGenres = await db.query(`
      SELECT t.genre, COUNT(*) as play_count
      FROM listening_history lh
      JOIN tracks t ON lh.track_id = t.id
      WHERE lh.user_id = $1 AND t.genre IS NOT NULL
        AND lh.played_at >= NOW() - INTERVAL '30 days'
      GROUP BY t.genre
      ORDER BY play_count DESC
      LIMIT 3
    `, [userId]);

    // Récupération des artistes les plus écoutés
    const userTopArtists = await db.query(`
      SELECT t.artist, COUNT(*) as play_count
      FROM listening_history lh
      JOIN tracks t ON lh.track_id = t.id
      WHERE lh.user_id = $1
        AND lh.played_at >= NOW() - INTERVAL '30 days'
      GROUP BY t.artist
      ORDER BY play_count DESC
      LIMIT 3
    `, [userId]);

    // Pistes déjà écoutées à exclure
    const excludeTracks = await db.query(`
      SELECT DISTINCT track_id
      FROM listening_history
      WHERE user_id = $1
    `, [userId]);

    const excludeIds = excludeTracks.rows.map(row => row.track_id);

    let query = `
      SELECT DISTINCT t.*,
        CASE 
          WHEN t.genre = ANY($2) THEN 3
          WHEN t.artist = ANY($3) THEN 2
          ELSE 1
        END as recommendation_score
      FROM tracks t
      WHERE t.is_active = true
    `;

    const params = [
      userId,
      userTopGenres.rows.map(g => g.genre),
      userTopArtists.rows.map(a => a.artist)
    ];

    if (excludeIds.length > 0) {
      query += ` AND t.id != ALL($${params.length + 1})`;
      params.push(excludeIds);
    }

    query += `
      ORDER BY recommendation_score DESC, 
               (t.play_stats->>'popularity')::numeric DESC NULLS LAST,
               RANDOM()
      LIMIT $${params.length + 1}
    `;
    params.push(parseInt(limit));

    const recommendations = await db.query(query, params);

    res.json({
      success: true,
      recommendations: recommendations.rows.map(track => ({
        id: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        duration: track.duration,
        genre: track.genre,
        artwork: track.artwork,
        streamingUrls: track.streaming_urls,
        recommendationScore: parseInt(track.recommendation_score),
        reason: track.recommendation_score === 3 ? 'Genre similaire' :
          track.recommendation_score === 2 ? 'Artiste similaire' : 'Découverte'
      })),
      basedOn: {
        topGenres: userTopGenres.rows,
        topArtists: userTopArtists.rows
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération des recommandations:', error);
    res.status(500).json({
      error: 'Erreur de recommandation',
      message: 'Impossible de générer des recommandations'
    });
  }
});

module.exports = router;
