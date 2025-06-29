'use client';

import { useState, useEffect, useCallback } from 'react';
import { recommendationService, Track, RecommendationOptions } from '../services/recommendationService';

interface UseRecommendationsOptions extends RecommendationOptions {
  autoLoad?: boolean;
  refreshInterval?: number;
}

interface UseRecommendationsReturn {
  recommendations: Track[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  loadRecommendations: () => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  likeTrack: (trackId: string) => Promise<void>;
  addToPlaylist: (trackId: string) => Promise<void>;
  playTrack: (trackId: string) => Promise<void>;
  skipTrack: (trackId: string) => Promise<void>;
  likedTracks: Set<string>;
}

export function useRecommendations(options: UseRecommendationsOptions = {}): UseRecommendationsReturn {
  const {
    autoLoad = true,
    refreshInterval = 0,
    ...recommendationOptions
  } = options;

  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const tracks = await recommendationService.getPersonalizedRecommendations(recommendationOptions);
      setRecommendations(tracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [recommendationOptions]);

  const refreshRecommendations = useCallback(async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  }, [loadRecommendations]);

  const likeTrack = useCallback(async (trackId: string) => {
    try {
      const isLiked = likedTracks.has(trackId);
      
      // Optimistic update
      const newLikedTracks = new Set(likedTracks);
      if (isLiked) {
        newLikedTracks.delete(trackId);
      } else {
        newLikedTracks.add(trackId);
      }
      setLikedTracks(newLikedTracks);

      // Envoyer le feedback
      await recommendationService.sendFeedback(trackId, isLiked ? 'dislike' : 'like');
    } catch (error) {
      console.error('Erreur lors du like:', error);
      // Revert optimistic update
      setLikedTracks(prev => {
        const reverted = new Set(prev);
        if (likedTracks.has(trackId)) {
          reverted.add(trackId);
        } else {
          reverted.delete(trackId);
        }
        return reverted;
      });
    }
  }, [likedTracks]);

  const addToPlaylist = useCallback(async (trackId: string) => {
    try {
      await recommendationService.sendFeedback(trackId, 'add_to_playlist');
      // Ici, on pourrait ouvrir une modal de sélection de playlist
      console.log('Ajouter à playlist:', trackId);
    } catch (error) {
      console.error('Erreur lors de l\'ajout à playlist:', error);
    }
  }, []);

  const playTrack = useCallback(async (trackId: string) => {
    try {
      await recommendationService.sendFeedback(trackId, 'play');
      // Ici, on pourrait déclencher la lecture via le player
      console.log('Jouer track:', trackId);
    } catch (error) {
      console.error('Erreur lors de la lecture:', error);
    }
  }, []);

  const skipTrack = useCallback(async (trackId: string) => {
    try {
      await recommendationService.sendFeedback(trackId, 'skip');
    } catch (error) {
      console.error('Erreur lors du skip:', error);
    }
  }, []);

  // Charger automatiquement au montage
  useEffect(() => {
    if (autoLoad) {
      loadRecommendations();
    }
  }, [autoLoad, loadRecommendations]);

  // Refresh automatique
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(refreshRecommendations, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, refreshRecommendations]);

  return {
    recommendations,
    loading,
    error,
    refreshing,
    loadRecommendations,
    refreshRecommendations,
    likeTrack,
    addToPlaylist,
    playTrack,
    skipTrack,
    likedTracks,
  };
}

// Hook spécialisé pour le mix quotidien
export function useDailyMix() {
  const [dailyMix, setDailyMix] = useState<{ title: string; description: string; recommendations: Track[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDailyMix = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const mix = await recommendationService.getDailyMix();
      setDailyMix(mix);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDailyMix();
  }, [loadDailyMix]);

  return {
    dailyMix,
    loading,
    error,
    loadDailyMix,
  };
}

// Hook pour les recommandations par humeur
export function useMoodRecommendations(mood: string, limit: number = 25) {
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMoodRecommendations = useCallback(async () => {
    if (!mood) return;

    try {
      setLoading(true);
      setError(null);
      const tracks = await recommendationService.getRecommendationsByMood(mood, limit);
      setRecommendations(tracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [mood, limit]);

  useEffect(() => {
    loadMoodRecommendations();
  }, [loadMoodRecommendations]);

  return {
    recommendations,
    loading,
    error,
    loadMoodRecommendations,
  };
}

// Hook pour les recommandations par contexte
export function useContextRecommendations(context: string, limit: number = 25) {
  const [recommendations, setRecommendations] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContextRecommendations = useCallback(async () => {
    if (!context) return;

    try {
      setLoading(true);
      setError(null);
      const tracks = await recommendationService.getRecommendationsByContext(context, limit);
      setRecommendations(tracks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [context, limit]);

  useEffect(() => {
    loadContextRecommendations();
  }, [loadContextRecommendations]);

  return {
    recommendations,
    loading,
    error,
    loadContextRecommendations,
  };
}
