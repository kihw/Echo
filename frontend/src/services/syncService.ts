/**
 * Service client pour la synchronisation
 */
import { log } from './logger';

interface SyncOptions {
  services?: string[];
  syncPlaylists?: boolean;
  syncHistory?: boolean;
  syncFavorites?: boolean;
  syncLibrary?: boolean;
  resolveConflicts?: boolean;
  dryRun?: boolean;
}

interface SyncStatus {
  syncId: string;
  status: 'in_progress' | 'success' | 'error' | 'partial';
  services: string[];
  statistics: {
    playlistsSynced: number;
    tracksSynced: number;
    favoritesSynced: number;
    conflictsResolved: number;
    duration: number;
  };
  conflicts: Array<{
    id: string;
    type: string;
    resolved: boolean;
    description: string;
  }>;
  startTime: string;
  endTime?: string;
}

interface SyncHistory {
  syncId: string;
  status: string;
  services: string[];
  statistics: any;
  conflicts: any[];
  startTime: string;
  endTime?: string;
}

interface Conflict {
  id: string;
  type: string;
  description: string;
  resolved: boolean;
  resolution?: any;
}

class SyncService {
  private baseUrl = '/api/sync';

  async startFullSync(options: SyncOptions = {}): Promise<{ syncId: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/full`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        services: ['spotify', 'deezer', 'ytmusic'],
        syncPlaylists: true,
        syncHistory: true,
        syncFavorites: true,
        syncLibrary: true,
        resolveConflicts: true,
        dryRun: false,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors du lancement de la synchronisation');
    }

    const data = await response.json();
    return data.data;
  }

  async syncPlaylists(options: {
    services?: string[];
    playlistIds?: string[];
    bidirectional?: boolean;
    resolveConflicts?: boolean;
  } = {}): Promise<SyncStatus> {
    const response = await fetch(`${this.baseUrl}/playlists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        services: ['spotify', 'deezer', 'ytmusic'],
        bidirectional: true,
        resolveConflicts: true,
        ...options
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la synchronisation des playlists');
    }

    const data = await response.json();
    return data.data;
  }

  async syncFavorites(options: {
    services?: string[];
    strategy?: 'union' | 'intersection' | 'priority';
  } = {}): Promise<SyncStatus> {
    const response = await fetch(`${this.baseUrl}/favorites`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        services: ['spotify', 'deezer', 'ytmusic'],
        strategy: 'union',
        ...options
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la synchronisation des favoris');
    }

    const data = await response.json();
    return data.data;
  }

  async getSyncStatus(syncId: string): Promise<SyncStatus | null> {
    const response = await fetch(`${this.baseUrl}/status/${syncId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération du statut');
    }

    const data = await response.json();
    return data.data;
  }

  async getSyncHistory(filters: {
    limit?: number;
    offset?: number;
    service?: string;
    status?: string;
  } = {}): Promise<SyncHistory[]> {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    if (filters.service) params.append('service', filters.service);
    if (filters.status) params.append('status', filters.status);

    const response = await fetch(`${this.baseUrl}/history?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'historique');
    }

    const data = await response.json();
    return data.data || [];
  }

  async getConflicts(resolved: boolean = false): Promise<Conflict[]> {
    const response = await fetch(`${this.baseUrl}/conflicts?resolved=${resolved}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des conflits');
    }

    const data = await response.json();
    return data.data.conflicts || [];
  }

  async resolveConflict(conflictId: string, resolution: any, strategy?: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/conflicts/${conflictId}/resolve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ resolution, strategy })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la résolution du conflit');
    }

    const data = await response.json();
    return data.data;
  }

  async getMappings(type: 'tracks' | 'artists' | 'albums' | 'playlists' | 'all' = 'all', service?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('type', type);
    if (service) params.append('service', service);

    const response = await fetch(`${this.baseUrl}/mappings?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des mappings');
    }

    const data = await response.json();
    return data.data;
  }

  async scheduleSync(schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    services?: string[];
    options?: SyncOptions;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/schedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        services: ['spotify', 'deezer', 'ytmusic'],
        options: {},
        ...schedule
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la programmation de la synchronisation');
    }

    const data = await response.json();
    return data.data;
  }

  async cancelScheduledSync(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/schedule`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'annulation de la synchronisation automatique');
    }
  }

  // Utilitaires côté client
  getStatusColor(status: string): string {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      case 'partial':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  }

  getServiceIcon(service: string): string {
    const icons = {
      spotify: '🎧',
      deezer: '🎵',
      ytmusic: '📺',
      lidarr: '📀'
    };
    return icons[service as keyof typeof icons] || '🎵';
  }

  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  }

  // Polling pour suivre le statut en temps réel
  async pollSyncStatus(syncId: string, onUpdate: (status: SyncStatus) => void, onComplete: (status: SyncStatus) => void): Promise<void> {
    const poll = async () => {
      try {
        const status = await this.getSyncStatus(syncId);
        if (status) {
          onUpdate(status);

          if (status.status === 'success' || status.status === 'error' || status.status === 'partial') {
            onComplete(status);
            return;
          }

          // Continuer le polling si en cours
          setTimeout(poll, 2000);
        }
      } catch (error) {
        log.error('Erreur lors du polling de synchronisation:', error);
      }
    };

    poll();
  }
}

export const syncService = new SyncService();
export type { SyncOptions, SyncStatus, SyncHistory, Conflict };
