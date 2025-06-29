const express = require('express');
const router = express.Router();
const unifiedSyncService = require('../../services/unifiedSync');
const auth = require('../../middleware/auth');
const logger = require('../../utils/logger');

/**
 * Routes pour le système de synchronisation unifié
 */

/**
 * POST /api/sync/full
 * Lance une synchronisation complète
 */
router.post('/full', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      services = ['spotify', 'deezer', 'ytmusic'],
      syncPlaylists = true,
      syncHistory = true,
      syncFavorites = true,
      syncLibrary = true,
      resolveConflicts = true,
      dryRun = false
    } = req.body;

    const options = {
      services,
      syncPlaylists,
      syncHistory,
      syncFavorites,
      syncLibrary,
      resolveConflicts,
      dryRun
    };

    // Lancer la synchronisation en arrière-plan
    const syncPromise = unifiedSyncService.performFullSync(userId, options);
    
    if (dryRun) {
      // En mode dry-run, attendre le résultat
      const result = await syncPromise;
      return res.json({
        success: true,
        data: result
      });
    } else {
      // En mode normal, retourner immédiatement l'ID de sync
      const syncId = syncPromise.syncId || `sync_${Date.now()}`;
      
      // Ne pas attendre la fin de la synchronisation
      syncPromise.catch(error => {
        logger.error(`Synchronisation ${syncId} échouée:`, error);
      });

      return res.json({
        success: true,
        data: {
          syncId,
          message: 'Synchronisation lancée en arrière-plan',
          options
        }
      });
    }

  } catch (error) {
    logger.error('Erreur lors du lancement de la synchronisation complète:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du lancement de la synchronisation'
    });
  }
});

/**
 * POST /api/sync/playlists
 * Synchronise uniquement les playlists
 */
router.post('/playlists', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      services = ['spotify', 'deezer', 'ytmusic'],
      playlistIds = null, // Synchroniser des playlists spécifiques
      bidirectional = true,
      resolveConflicts = true
    } = req.body;

    const options = {
      services,
      syncPlaylists: true,
      syncHistory: false,
      syncFavorites: false,
      syncLibrary: false,
      resolveConflicts,
      playlistIds
    };

    const result = await unifiedSyncService.performFullSync(userId, options);

    res.json({
      success: true,
      data: {
        syncId: result.syncId,
        playlists: result.results.playlists,
        conflicts: result.conflicts,
        statistics: result.statistics
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la synchronisation des playlists:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation des playlists'
    });
  }
});

/**
 * POST /api/sync/favorites
 * Synchronise uniquement les favoris
 */
router.post('/favorites', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      services = ['spotify', 'deezer', 'ytmusic'],
      strategy = 'union' // union, intersection, priority
    } = req.body;

    const options = {
      services,
      syncPlaylists: false,
      syncHistory: false,
      syncFavorites: true,
      syncLibrary: false,
      strategy
    };

    const result = await unifiedSyncService.performFullSync(userId, options);

    res.json({
      success: true,
      data: {
        syncId: result.syncId,
        favorites: result.results.favorites,
        statistics: result.statistics
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la synchronisation des favoris:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la synchronisation des favoris'
    });
  }
});

/**
 * GET /api/sync/status/:syncId
 * Obtenir le statut d'une synchronisation
 */
router.get('/status/:syncId', auth, async (req, res) => {
  try {
    const { syncId } = req.params;
    const userId = req.user.id;

    // Récupérer le statut depuis la base de données ou le cache
    const status = await unifiedSyncService.getSyncStatus(syncId, userId);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Synchronisation non trouvée'
      });
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération du statut de synchronisation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du statut'
    });
  }
});

/**
 * GET /api/sync/history
 * Obtenir l'historique des synchronisations
 */
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      limit = 20,
      offset = 0,
      service = null,
      status = null // success, error, in_progress
    } = req.query;

    const filters = {
      limit: parseInt(limit),
      offset: parseInt(offset),
      service,
      status
    };

    const history = await unifiedSyncService.getSyncHistory(userId, filters);

    res.json({
      success: true,
      data: history
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération de l\'historique de synchronisation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
});

/**
 * GET /api/sync/conflicts
 * Obtenir les conflits de synchronisation non résolus
 */
router.get('/conflicts', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { resolved = false } = req.query;

    const conflicts = await unifiedSyncService.getConflicts(userId, resolved === 'true');

    res.json({
      success: true,
      data: {
        conflicts,
        total: conflicts.length
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des conflits:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des conflits'
    });
  }
});

/**
 * POST /api/sync/conflicts/:conflictId/resolve
 * Résoudre manuellement un conflit
 */
router.post('/conflicts/:conflictId/resolve', auth, async (req, res) => {
  try {
    const { conflictId } = req.params;
    const userId = req.user.id;
    const { resolution, strategy } = req.body;

    if (!resolution) {
      return res.status(400).json({
        success: false,
        error: 'Résolution requise'
      });
    }

    const result = await unifiedSyncService.resolveConflict(
      conflictId, 
      userId, 
      resolution, 
      strategy
    );

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Erreur lors de la résolution du conflit:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la résolution du conflit'
    });
  }
});

/**
 * GET /api/sync/mappings
 * Obtenir les mappings entre services
 */
router.get('/mappings', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'all', service = null } = req.query;

    const validTypes = ['tracks', 'artists', 'albums', 'playlists', 'all'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'Type de mapping non valide',
        validTypes
      });
    }

    const mappings = await unifiedSyncService.getMappings(userId, type, service);

    res.json({
      success: true,
      data: mappings
    });

  } catch (error) {
    logger.error('Erreur lors de la récupération des mappings:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des mappings'
    });
  }
});

/**
 * POST /api/sync/schedule
 * Programmer une synchronisation automatique
 */
router.post('/schedule', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      frequency = 'daily', // daily, weekly, monthly
      time = '02:00', // Heure de synchronisation
      services = ['spotify', 'deezer', 'ytmusic'],
      options = {}
    } = req.body;

    const validFrequencies = ['daily', 'weekly', 'monthly'];
    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        error: 'Fréquence non valide',
        validFrequencies
      });
    }

    const schedule = await unifiedSyncService.scheduleSync(userId, {
      frequency,
      time,
      services,
      options
    });

    res.json({
      success: true,
      data: {
        message: 'Synchronisation programmée avec succès',
        schedule
      }
    });

  } catch (error) {
    logger.error('Erreur lors de la programmation de la synchronisation:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la programmation de la synchronisation'
    });
  }
});

/**
 * DELETE /api/sync/schedule
 * Annuler la synchronisation automatique
 */
router.delete('/schedule', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    await unifiedSyncService.cancelScheduledSync(userId);

    res.json({
      success: true,
      data: {
        message: 'Synchronisation automatique annulée'
      }
    });

  } catch (error) {
    logger.error('Erreur lors de l\'annulation de la synchronisation automatique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'annulation de la synchronisation automatique'
    });
  }
});

module.exports = router;
