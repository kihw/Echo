'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';

interface SyncStatus {
  inProgress: boolean;
  lastSyncTime?: string;
  lastResults?: {
    syncId: string;
    status: string;
    summary: {
      totalPlaylists: number;
      totalTracks: number;
      totalArtists: number;
      errors: number;
    };
    services: Record<string, any>;
    duration?: number;
  };
}

interface SyncHistoryItem {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  results?: any;
}

interface UseSyncReturn {
  // Status
  syncStatus: SyncStatus;
  syncHistory: SyncHistoryItem[];
  loading: boolean;
  error: string | null;

  // Actions
  startFullSync: () => Promise<void>;
  startServiceSync: (service: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
  refreshHistory: () => Promise<void>;

  // Utils
  isSyncInProgress: boolean;
}

export function useSync(): UseSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ inProgress: false });
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Polling pour le statut si sync en cours
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (syncStatus.inProgress) {
      pollInterval = setInterval(refreshStatus, 2000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [syncStatus.inProgress]);

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
      const response = await api.get('/sync/status');
      setSyncStatus(response.data.status || { inProgress: false });
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors du refresh du statut:', err);
      if (!syncStatus.inProgress) {
        setError('Impossible de récupérer le statut de synchronisation');
      }
    }
  }, [syncStatus.inProgress]);

  const refreshHistory = useCallback(async () => {
    try {
      const response = await api.get('/sync/history?limit=10');
      setSyncHistory(response.data.history || []);
      setError(null);
    } catch (err: any) {
      console.error('Erreur lors du refresh de l\'historique:', err);
      setError('Impossible de récupérer l\'historique');
    }
  }, []);

  const startFullSync = useCallback(async () => {
    try {
      if (syncStatus.inProgress) {
        toast.error('Une synchronisation est déjà en cours');
        return;
      }

      setSyncStatus(prev => ({ ...prev, inProgress: true }));
      setError(null);

      const response = await api.post('/sync/all');

      if (response.data.success) {
        toast.success('Synchronisation complète démarrée');

        // Commencer le polling du statut
        setTimeout(refreshStatus, 1000);
      } else {
        throw new Error(response.data.message || 'Échec du démarrage de la synchronisation');
      }
    } catch (err: any) {
      console.error('Erreur lors du démarrage de la sync complète:', err);

      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la synchronisation';
      setError(errorMessage);
      toast.error(errorMessage);

      setSyncStatus(prev => ({ ...prev, inProgress: false }));
    }
  }, [syncStatus.inProgress, refreshStatus]);

  const startServiceSync = useCallback(async (service: string) => {
    try {
      if (syncStatus.inProgress) {
        toast.error('Une synchronisation est déjà en cours');
        return;
      }

      setError(null);

      const response = await api.post(`/sync/${service}`);

      if (response.data.success) {
        toast.success(`Synchronisation ${service} démarrée`);

        // Refresh du statut pour voir le changement
        setTimeout(refreshStatus, 1000);
        setTimeout(refreshHistory, 2000);
      } else {
        throw new Error(response.data.message || `Échec de la synchronisation ${service}`);
      }
    } catch (err: any) {
      console.error(`Erreur lors de la sync ${service}:`, err);

      const errorMessage = err.response?.data?.message || err.message || `Erreur lors de la synchronisation ${service}`;
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [syncStatus.inProgress, refreshStatus, refreshHistory]);

  // Gestion des erreurs de connexion
  const handleApiError = (err: any, context: string) => {
    console.error(`Erreur ${context}:`, err);

    if (err.response?.status === 401) {
      setError('Session expirée, veuillez vous reconnecter');
    } else if (err.response?.status === 403) {
      setError('Accès refusé');
    } else if (err.response?.status >= 500) {
      setError('Erreur du serveur, veuillez réessayer plus tard');
    } else if (err.code === 'NETWORK_ERROR') {
      setError('Erreur de connexion réseau');
    } else {
      setError(err.response?.data?.message || err.message || `Erreur ${context}`);
    }
  };

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

    // Utils
    isSyncInProgress: syncStatus.inProgress
  };
}

export default useSync;
