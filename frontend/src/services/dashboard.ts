import { api } from './api';
import { dashboardCache, CACHE_KEYS, CACHE_TTL } from '@/utils/cache';

export interface DashboardStats {
  totalPlaylists: number;
  totalTracks: number;
  totalListeningTime: number;
  totalArtists: number;
  syncedServices: number;
  lastSyncTime?: string;
}

export interface RecentPlaylist {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  totalDuration: number;
  coverImageUrl?: string;
  updatedAt: string;
  isPublic: boolean;
}

export interface ListeningHistory {
  id: string;
  trackId: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration: number;
  playedAt: string;
  completionPercentage: number;
}

export interface TopTrack {
  id: string;
  name: string;
  artist: string;
  album?: string;
  playCount: number;
  totalDuration: number;
  coverUrl?: string;
}

export interface TopArtist {
  id: string;
  name: string;
  playCount: number;
  totalDuration: number;
  imageUrl?: string;
  genres?: string[];
}

export interface DashboardData {
  stats: DashboardStats;
  recentPlaylists: RecentPlaylist[];
  listeningHistory: ListeningHistory[];
  topTracks: TopTrack[];
  topArtists: TopArtist[];
  recommendations?: TopTrack[];
}

class DashboardService {
  async getDashboardData(): Promise<DashboardData> {
    return dashboardCache.getOrSet(
      CACHE_KEYS.DASHBOARD_DATA,
      async () => {
        const response = await api.get('/dashboard');
        return response.data;
      },
      { ttl: CACHE_TTL.DASHBOARD }
    ).catch(error => {
      console.error('Erreur lors de la récupération des données dashboard:', error);
      return this.getDefaultDashboardData();
    });
  }

  async getStats(): Promise<DashboardStats> {
    return dashboardCache.getOrSet(
      CACHE_KEYS.DASHBOARD_STATS,
      async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
      },
      { ttl: CACHE_TTL.STATISTICS }
    ).catch(error => {
      console.error('Erreur lors de la récupération des stats:', error);
      return {
        totalPlaylists: 0,
        totalTracks: 0,
        totalListeningTime: 0,
        totalArtists: 0,
        syncedServices: 0
      };
    });
  }

  async getRecentPlaylists(limit: number = 6): Promise<RecentPlaylist[]> {
    try {
      const response = await api.get(`/playlists/recent?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des playlists récentes:', error);
      return [];
    }
  }

  async getListeningHistory(limit: number = 10): Promise<ListeningHistory[]> {
    try {
      const response = await api.get(`/user/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }

  async getTopTracks(period: 'week' | 'month' | 'year' = 'month', limit: number = 10): Promise<TopTrack[]> {
    try {
      const response = await api.get(`/user/top-tracks?period=${period}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des top tracks:', error);
      return [];
    }
  }

  async getTopArtists(period: 'week' | 'month' | 'year' = 'month', limit: number = 10): Promise<TopArtist[]> {
    try {
      const response = await api.get(`/user/top-artists?period=${period}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des top artists:', error);
      return [];
    }
  }

  async getRecommendations(limit: number = 10): Promise<TopTrack[]> {
    try {
      const response = await api.get(`/recommendations?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des recommandations:', error);
      return [];
    }
  }

  private getDefaultDashboardData(): DashboardData {
    return {
      stats: {
        totalPlaylists: 0,
        totalTracks: 0,
        totalListeningTime: 0,
        totalArtists: 0,
        syncedServices: 0
      },
      recentPlaylists: [],
      listeningHistory: [],
      topTracks: [],
      topArtists: [],
      recommendations: []
    };
  }

  /**
   * Invalidate dashboard cache to force fresh data on next request
   */
  invalidateCache(): void {
    dashboardCache.delete(CACHE_KEYS.DASHBOARD_DATA);
    dashboardCache.delete(CACHE_KEYS.DASHBOARD_STATS);
  }

  /**
   * Refresh cache with fresh data
   */
  async refreshCache(): Promise<void> {
    this.invalidateCache();
    await Promise.all([
      this.getDashboardData(),
      this.getStats()
    ]);
  }
}

export const dashboardService = new DashboardService();
