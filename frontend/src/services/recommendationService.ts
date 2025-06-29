/**
 * Service client pour les recommandations
 */

interface RecommendationOptions {
  limit?: number;
  mood?: string;
  context?: string;
  includeNewReleases?: boolean;
  includeSimilarArtists?: boolean;
  diversityFactor?: number;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  imageUrl: string;
  service: string;
  audioFeatures: {
    energy: number;
    valence: number;
    danceability: number;
    mood: string;
  };
  recommendationReason: string;
}

class RecommendationService {
  private baseUrl = '/api/recommendations';

  async getPersonalizedRecommendations(options: RecommendationOptions = {}): Promise<Track[]> {
    const params = new URLSearchParams();
    
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.mood) params.append('mood', options.mood);
    if (options.context) params.append('context', options.context);
    if (options.includeNewReleases !== undefined) {
      params.append('includeNewReleases', options.includeNewReleases.toString());
    }
    if (options.includeSimilarArtists !== undefined) {
      params.append('includeSimilarArtists', options.includeSimilarArtists.toString());
    }
    if (options.diversityFactor) {
      params.append('diversityFactor', options.diversityFactor.toString());
    }

    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des recommandations');
    }

    const data = await response.json();
    return data.data.recommendations || [];
  }

  async getDailyMix(): Promise<{ title: string; description: string; recommendations: Track[] }> {
    const response = await fetch(`${this.baseUrl}/daily`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement du mix quotidien');
    }

    const data = await response.json();
    return data.data;
  }

  async getRecommendationsByMood(mood: string, limit: number = 25): Promise<Track[]> {
    const response = await fetch(`${this.baseUrl}/mood/${mood}?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des recommandations par humeur');
    }

    const data = await response.json();
    return data.data.recommendations || [];
  }

  async getRecommendationsByContext(context: string, limit: number = 25): Promise<Track[]> {
    const response = await fetch(`${this.baseUrl}/context/${context}?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des recommandations par contexte');
    }

    const data = await response.json();
    return data.data.recommendations || [];
  }

  async getSimilarTracks(trackId: string, service: string = 'spotify', limit: number = 20): Promise<Track[]> {
    const response = await fetch(`${this.baseUrl}/similar/${trackId}?service=${service}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement des tracks similaires');
    }

    const data = await response.json();
    return data.data.similarTracks || [];
  }

  async analyzeTrack(trackId: string, service: string = 'spotify'): Promise<any> {
    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trackId, service }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'analyse de la track');
    }

    const data = await response.json();
    return data.data.features;
  }

  async sendFeedback(trackId: string, action: 'like' | 'dislike' | 'skip' | 'play' | 'add_to_playlist', rating?: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/feedback`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ trackId, action, rating }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de l\'envoi du feedback');
    }
  }

  // Utilitaires côté client
  getMoodColor(mood: string): string {
    const colors = {
      happy: 'text-yellow-500',
      sad: 'text-blue-500',
      peaceful: 'text-green-500',
      aggressive: 'text-red-500',
      danceable: 'text-purple-500',
      acoustic: 'text-orange-500',
      neutral: 'text-gray-500',
    };
    return colors[mood as keyof typeof colors] || 'text-gray-500';
  }

  getContextIcon(context: string): string {
    const icons = {
      workout: '💪',
      study: '📚',
      party: '🎉',
      chill: '😌',
      focus: '🎯',
      sleep: '😴',
      commute: '🚗',
      general: '🎵',
    };
    return icons[context as keyof typeof icons] || '🎵';
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  calculateSimilarityScore(track1: Track, track2: Track): number {
    if (!track1.audioFeatures || !track2.audioFeatures) return 0;

    const features1 = track1.audioFeatures;
    const features2 = track2.audioFeatures;

    // Calculer la distance euclidienne entre les caractéristiques
    const energyDiff = Math.abs(features1.energy - features2.energy);
    const valenceDiff = Math.abs(features1.valence - features2.valence);
    const danceabilityDiff = Math.abs(features1.danceability - features2.danceability);

    const distance = Math.sqrt(energyDiff ** 2 + valenceDiff ** 2 + danceabilityDiff ** 2);
    
    // Convertir en score de similarité (0-1)
    return Math.max(0, 1 - distance / Math.sqrt(3));
  }
}

export const recommendationService = new RecommendationService();
export type { Track, RecommendationOptions };
