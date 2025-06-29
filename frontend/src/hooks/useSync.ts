'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncService, SyncOptions, SyncStatus as ServiceSyncStatus, SyncHistory, Conflict } from '../services/syncService';
import { toast } from 'react-hot-toast';

'use client';

import { useState, useEffect, useCallback } from 'react';
import { syncService, SyncOptions, SyncStatus, SyncHistory, Conflict } from '../services/syncService';
import { toast } from 'react-hot-toast';

interface UseSyncReturn {
  // Status
  syncStatus: SyncStatus | null;
  syncHistory: SyncHistory[];
  loading: boolean;
  error: string | null;

  // Actions
  startFullSync: (options?: SyncOptions) => Promise<void>;
  startServiceSync: (service: string, options?: SyncOptions) => Promise<void>;
  refreshStatus: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  clearError: () => void;

  // Utils
  isSyncInProgress: boolean;
}

export function useSync(): UseSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Polling pour le statut si sync en cours
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (syncStatus?.inProgress) {
      pollInterval = setInterval(refreshStatus, 2000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [syncStatus?.inProgress]);

  // Chargement initial
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        refreshStatus(),
        refreshHistory()
      ]);
    } catch (err) {
      console.error('Erreur lors du chargement initial:', err);
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = useCallback(async () => {
    try {
      const status = await syncService.getStatus();
      setSyncStatus(status);
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors du refresh du statut:', err);
      if (!syncStatus?.inProgress) {
        setError('Impossible de récupérer le statut de synchronisation');
      }
    }
  }, [syncStatus?.inProgress]);

  const refreshHistory = useCallback(async () => {
    try {
      const history = await syncService.getHistory({ limit: 10 });
      setSyncHistory(history);
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors du refresh de l\'historique:', err);
      setError('Impossible de récupérer l\'historique');
    }
  }, []);

  const startFullSync = useCallback(async (options?: SyncOptions) => {
    try {
      if (syncStatus?.inProgress) {
        toast.error('Une synchronisation est déjà en cours');
        return;
      }

      setSyncStatus(prev => prev ? { ...prev, inProgress: true } : null);
      setError(null);

      const syncId = await syncService.startFullSync(options);
      
      toast.success('Synchronisation complète démarrée');

      // Commencer le polling du statut
      setTimeout(refreshStatus, 1000);
      
    } catch (err: any) {
      console.error('Erreur lors du démarrage de la sync complète:', err);

      const errorMessage = err.message || 'Erreur lors de la synchronisation';
      setError(errorMessage);
      toast.error(errorMessage);

      setSyncStatus(prev => prev ? { ...prev, inProgress: false } : null);
    }
  }, [syncStatus?.inProgress, refreshStatus]);

  const startServiceSync = useCallback(async (service: string, options?: SyncOptions) => {
    try {
      if (syncStatus?.inProgress) {
        toast.error('Une synchronisation est déjà en cours');
        return;
      }

      setError(null);

      const syncId = await syncService.startServiceSync(service, options);
      
      toast.success(`Synchronisation ${service} démarrée`);

      // Refresh du statut pour voir le changement
      setTimeout(refreshStatus, 1000);
      setTimeout(refreshHistory, 2000);
      
    } catch (err: any) {
      console.error(`Erreur lors de la sync ${service}:`, err);

      const errorMessage = err.message || `Erreur lors de la synchronisation ${service}`;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [syncStatus?.inProgress, refreshStatus, refreshHistory]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Status
    syncStatus,
    syncHistory,
    loading,
    error,

    // Actions
    startFullSync,
    startServiceSync,
    refreshStatus,
    refreshHistory,
    clearError,

    // Utils
    isSyncInProgress: syncStatus?.inProgress || false
  };
}

export default useSync;
