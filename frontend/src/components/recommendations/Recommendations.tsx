'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import {
  SparklesIcon,
  HeartIcon,
  MusicalNoteIcon,
  ClockIcon,
  PlayIcon,
  PlusIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { log } from '@/services/logger';
import notifications from '@/services/notifications';

interface Recommendation {
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

interface RecommendationsProps {
  userId: string;
  limit?: number;
  mood?: string | null;
  context?: string | null;
  onTrackPlay?: (track: Recommendation) => void;
  onTrackLike?: (track: Recommendation) => void;
  onTrackAdd?: (track: Recommendation) => void;
}

export function Recommendations({
  userId,
  limit = 20,
  mood = null,
  context = null,
  onTrackPlay,
  onTrackLike,
  onTrackAdd
}: RecommendationsProps) {
  const { resolvedTheme } = useTheme();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Classes de thème
  const themeClasses = {
    container: `${resolvedTheme === 'dark' ? 'bg-slate-900' : 'bg-white'}`,
    card: `${resolvedTheme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`,
    text: {
      primary: resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-900',
      secondary: resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-600',
      muted: resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
    },
    button: {
      primary: `${resolvedTheme === 'dark'
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white'}`,
      secondary: `${resolvedTheme === 'dark'
        ? 'bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600'
        : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300'}`
    },
    hover: resolvedTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-50'
  };

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('limit', limit.toString());
      if (mood) params.append('mood', mood);
      if (context) params.append('context', context);

      const response = await fetch(`/api/recommendations?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des recommandations');
      }

      const data = await response.json();
      setRecommendations(data.data.recommendations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }, [mood, context, limit]); // Remove unused userId dependency

  // Charger les recommandations au montage et lors des changements de paramètres
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const refreshRecommendations = async () => {
    setRefreshing(true);
    await loadRecommendations();
    setRefreshing(false);
  };

  const handleLike = async (track: Recommendation) => {
    try {
      const isLiked = likedTracks.has(track.id);

      // Optimistic update
      const newLikedTracks = new Set(likedTracks);
      if (isLiked) {
        newLikedTracks.delete(track.id);
      } else {
        newLikedTracks.add(track.id);
      }
      setLikedTracks(newLikedTracks);

      // Envoyer le feedback
      await fetch('/api/recommendations/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          trackId: track.id,
          action: isLiked ? 'dislike' : 'like'
        })
      });

      onTrackLike?.(track);
    } catch (error) {
      log.error('Erreur lors du like:', error);
      notifications.error('Erreur lors du like');
      // Revert optimistic update
      setLikedTracks(prev => {
        const reverted = new Set(prev);
        if (likedTracks.has(track.id)) {
          reverted.add(track.id);
        } else {
          reverted.delete(track.id);
        }
        return reverted;
      });
    }
  };

  const handlePlay = (track: Recommendation) => {
    onTrackPlay?.(track);

    // Envoyer le feedback
    fetch('/api/recommendations/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        trackId: track.id,
        action: 'play'
      })
    }).catch(error => {
      log.error('Analytics tracking error:', error);
    });
  };

  const getMoodColor = (mood: string) => {
    const colors = {
      happy: 'text-yellow-500',
      sad: 'text-blue-500',
      peaceful: 'text-green-500',
      aggressive: 'text-red-500',
      danceable: 'text-purple-500',
      acoustic: 'text-orange-500',
      neutral: 'text-gray-500'
    };
    return colors[mood as keyof typeof colors] || 'text-gray-500';
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className={`${themeClasses.container} p-6 rounded-lg`}>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-slate-300 dark:bg-slate-600 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-3/4"></div>
                <div className="h-3 bg-slate-300 dark:bg-slate-600 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${themeClasses.container} p-6 rounded-lg border border-red-300 dark:border-red-700`}>
        <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 mb-4">
          <XMarkIcon className="h-5 w-5" />
          <span className="font-medium">Erreur</span>
        </div>
        <p className={themeClasses.text.secondary}>{error}</p>
        <button
          onClick={loadRecommendations}
          className={`mt-4 px-4 py-2 rounded-lg ${themeClasses.button.primary} font-medium transition-colors`}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className={`${themeClasses.container} rounded-lg`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <SparklesIcon className="h-6 w-6 text-blue-500" />
          <div>
            <h2 className={`text-xl font-semibold ${themeClasses.text.primary}`}>
              Recommandations
            </h2>
            {(mood || context) && (
              <p className={`text-sm ${themeClasses.text.muted}`}>
                {mood && `Humeur: ${mood}`}
                {mood && context && ' • '}
                {context && `Contexte: ${context}`}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={refreshRecommendations}
          disabled={refreshing}
          className={`p-2 rounded-lg ${themeClasses.button.secondary} border transition-colors ${refreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          <SparklesIcon className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Recommendations List */}
      <div className="p-6 space-y-4">
        {recommendations.length === 0 ? (
          <div className="text-center py-8">
            <MusicalNoteIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <p className={`${themeClasses.text.secondary} mb-2`}>
              Aucune recommandation disponible
            </p>
            <p className={`text-sm ${themeClasses.text.muted}`}>
              Écoutez plus de musique pour obtenir des recommandations personnalisées
            </p>
          </div>
        ) : (
          recommendations.map((track) => (
            <div
              key={track.id}
              className={`
                flex items-center space-x-4 p-4 rounded-lg border 
                ${themeClasses.card} ${themeClasses.hover} 
                transition-all duration-200 cursor-pointer group
              `}
            >
              {/* Album Art */}
              <div className="relative">
                <img
                  src={track.imageUrl || '/images/default-album.png'}
                  alt={`${track.album} cover`}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <button
                  onClick={() => handlePlay(track)}
                  className="
                    absolute inset-0 flex items-center justify-center
                    bg-black bg-opacity-50 rounded-lg opacity-0 group-hover:opacity-100
                    transition-opacity duration-200
                  "
                >
                  <PlayIcon className="h-6 w-6 text-white" />
                </button>
              </div>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`font-medium ${themeClasses.text.primary} truncate`}>
                  {track.title}
                </h3>
                <p className={`text-sm ${themeClasses.text.secondary} truncate`}>
                  {track.artist}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 ${themeClasses.text.muted}`}>
                    {track.service}
                  </span>
                  <span className={`text-xs ${getMoodColor(track.audioFeatures.mood)}`}>
                    {track.audioFeatures.mood}
                  </span>
                  <span className={`text-xs ${themeClasses.text.muted} flex items-center`}>
                    <ClockIcon className="h-3 w-3 mr-1" />
                    {formatDuration(track.duration)}
                  </span>
                </div>
                {track.recommendationReason && (
                  <p className={`text-xs ${themeClasses.text.muted} mt-1 italic`}>
                    {track.recommendationReason}
                  </p>
                )}
              </div>

              {/* Audio Features */}
              <div className="hidden md:flex flex-col space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <span className={themeClasses.text.muted}>Énergie:</span>
                  <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${track.audioFeatures.energy * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={themeClasses.text.muted}>Humeur:</span>
                  <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${track.audioFeatures.valence * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleLike(track)}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${likedTracks.has(track.id)
                      ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                      : `${themeClasses.text.muted} hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`
                    }
                  `}
                >
                  {likedTracks.has(track.id) ? (
                    <HeartSolidIcon className="h-5 w-5" />
                  ) : (
                    <HeartIcon className="h-5 w-5" />
                  )}
                </button>

                <button
                  onClick={() => onTrackAdd?.(track)}
                  className={`
                    p-2 rounded-lg transition-colors
                    ${themeClasses.text.muted} hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20
                  `}
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
