'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { log } from '@/services/logger';
import notifications from '@/services/notifications';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  artwork?: string;
  spotifyId?: string;
  deezerId?: string;
  youtubeId?: string;
  url?: string;
  isrc?: string;
  genre?: string[];
  releaseDate?: string;
  popularity?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  tracks: Track[];
  artwork?: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    displayName: string;
  };
}

export interface PlayerState {
  currentTrack: Track | null;
  currentPlaylist: Playlist | null;
  queue: Track[];
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  volume: number;
  position: number;
  duration: number;
  isRepeat: 'off' | 'one' | 'all';
  isShuffle: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface PlayerContextType extends PlayerState {
  // Playback controls
  play: (_track?: Track, _playlist?: Playlist) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => void;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (_position: number) => Promise<void>;
  setVolume: (_volume: number) => Promise<void>;

  // Queue management
  addToQueue: (_track: Track) => Promise<void>;
  removeFromQueue: (_index: number) => void;
  clearQueue: () => Promise<void>;
  playFromQueue: (_index: number) => Promise<void>;

  // Player settings
  setRepeat: (_mode: 'off' | 'one' | 'all') => Promise<void>;
  setShuffle: (_enabled: boolean) => Promise<void>;

  // Playlist management
  playPlaylist: (_playlist: Playlist, _startIndex?: number) => Promise<void>;

  // Favorites
  toggleFavorite: (_track: Track) => Promise<void>;
  isFavorite: (_trackId: string) => boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export { PlayerContext };

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    currentPlaylist: null,
    queue: [],
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    volume: 0.8,
    position: 0,
    duration: 0,
    isRepeat: 'off',
    isShuffle: false,
    hasNext: false,
    hasPrevious: false
  });

  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';

    const handleLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, position: audio.currentTime }));
    };

    const handleEnded = () => {
      next();
    };

    const handleLoadStart = () => {
      setState(prev => ({ ...prev, isLoading: true }));
    };

    const handleCanPlay = () => {
      setState(prev => ({ ...prev, isLoading: false }));
    };

    const handleError = (e: any) => {
      log.error('Audio playback error:', e);
      notifications.error('Erreur de lecture audio');
      setState(prev => ({
        ...prev,
        isLoading: false,
        isPlaying: false,
        isPaused: false
      }));
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);

    setAudioElement(audio);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  // Audio initialization needs to be moved after next function is defined
  // We'll handle the next reference in the callback differently

  // Update audio volume when state changes
  useEffect(() => {
    if (audioElement) {
      audioElement.volume = state.volume;
    }
  }, [audioElement, state.volume]);

  const play = useCallback(async (track?: Track, playlist?: Playlist) => {
    if (!audioElement) return;

    if (track) {
      // Play specific track
      setState(prev => ({
        ...prev,
        currentTrack: track,
        currentPlaylist: playlist || null,
        isLoading: true
      }));

      if (track.url) {
        audioElement.src = track.url;
        try {
          await audioElement.play();
          setState(prev => ({
            ...prev,
            isPlaying: true,
            isPaused: false,
            isLoading: false
          }));
        } catch (error) {
          log.error('Audio play error:', error);
          notifications.error('Impossible de lire cette piste');
          setState(prev => ({ ...prev, isLoading: false }));
        }
      }
    } else if (state.currentTrack && state.isPaused) {
      // Resume current track
      try {
        await audioElement.play();
        setState(prev => ({
          ...prev,
          isPlaying: true,
          isPaused: false
        }));
      } catch (error) {
        log.error('Audio resume error:', error);
        notifications.error('Erreur lors de la reprise de lecture');
      }
    }
  }, [audioElement, state.currentTrack, state.isPaused]);

  const pause = useCallback(async () => {
    if (audioElement && state.isPlaying) {
      audioElement.pause();
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: true
      }));
    }
  }, [audioElement, state.isPlaying]);

  const resume = useCallback(async () => {
    await play();
  }, [play]);

  const stop = useCallback(() => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        position: 0
      }));
    }
  }, [audioElement]);

  const next = useCallback(async () => {
    const { currentPlaylist, queue, currentTrack, isShuffle } = state;

    if (queue.length > 0) {
      // Play next from queue
      const nextTrack = queue[0];
      setState(prev => ({
        ...prev,
        queue: prev.queue.slice(1)
      }));
      await play(nextTrack);
    } else if (currentPlaylist && currentTrack) {
      // Play next from playlist
      const currentIndex = currentPlaylist.tracks.findIndex(t => t.id === currentTrack.id);
      let nextIndex;

      if (isShuffle) {
        const remainingIndices = currentPlaylist.tracks
          .map((_, i) => i)
          .filter(i => i !== currentIndex);
        nextIndex = remainingIndices[Math.floor(Math.random() * remainingIndices.length)];
      } else {
        nextIndex = currentIndex + 1;
      }

      if (nextIndex < currentPlaylist.tracks.length) {
        await play(currentPlaylist.tracks[nextIndex], currentPlaylist);
      } else if (state.isRepeat === 'all') {
        await play(currentPlaylist.tracks[0], currentPlaylist);
      }
    }
  }, [state, play]);

  const previous = useCallback(async () => {
    const { currentPlaylist, currentTrack } = state;

    if (currentPlaylist && currentTrack) {
      const currentIndex = currentPlaylist.tracks.findIndex(t => t.id === currentTrack.id);
      const previousIndex = currentIndex - 1;

      if (previousIndex >= 0) {
        await play(currentPlaylist.tracks[previousIndex], currentPlaylist);
      } else if (state.isRepeat === 'all') {
        await play(currentPlaylist.tracks[currentPlaylist.tracks.length - 1], currentPlaylist);
      }
    }
  }, [state, play]);

  const seek = useCallback(async (position: number) => {
    if (audioElement) {
      audioElement.currentTime = position;
      setState(prev => ({ ...prev, position }));
    }
  }, [audioElement]);

  const setVolume = useCallback(async (volume: number) => {
    setState(prev => ({ ...prev, volume }));
  }, []);

  const addToQueue = useCallback(async (track: Track) => {
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, track]
    }));
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      queue: prev.queue.filter((_, i) => i !== index)
    }));
  }, []);

  const clearQueue = useCallback(async () => {
    setState(prev => ({ ...prev, queue: [] }));
  }, []);

  const playFromQueue = useCallback(async (index: number) => {
    const track = state.queue[index];
    if (track) {
      setState(prev => ({
        ...prev,
        queue: prev.queue.filter((_, i) => i !== index)
      }));
      await play(track);
    }
  }, [state.queue, play]);

  const setRepeat = useCallback(async (mode: 'off' | 'one' | 'all') => {
    setState(prev => ({ ...prev, isRepeat: mode }));
  }, []);

  const setShuffle = useCallback(async (enabled: boolean) => {
    setState(prev => ({ ...prev, isShuffle: enabled }));
  }, []);

  const playPlaylist = useCallback(async (playlist: Playlist, startIndex = 0) => {
    if (playlist.tracks.length > 0) {
      await play(playlist.tracks[startIndex], playlist);
    }
  }, [play]);

  const toggleFavorite = useCallback(async (track: Track) => {
    const newFavorites = new Set(favorites);
    if (favorites.has(track.id)) {
      newFavorites.delete(track.id);
    } else {
      newFavorites.add(track.id);
    }
    setFavorites(newFavorites);

    // Sync with backend
    try {
      if (favorites.has(track.id)) {
        // Remove from favorites
        // await api.delete(`/user/favorites/${track.id}`);
      } else {
        // Add to favorites
        // await api.post('/user/favorites', { trackId: track.id });
      }
    } catch (error) {
      log.error('Failed to sync favorite:', error);
      notifications.error('Erreur lors de la synchronisation des favoris');
      // Revert on error
      setFavorites(favorites);
    }
  }, [favorites]);

  const isFavorite = useCallback((trackId: string) => {
    return favorites.has(trackId);
  }, [favorites]);

  // Update hasNext and hasPrevious
  useEffect(() => {
    const { currentPlaylist, currentTrack, queue, isRepeat } = state;
    let hasNext = queue.length > 0;
    let hasPrevious = false;

    if (currentPlaylist && currentTrack) {
      const currentIndex = currentPlaylist.tracks.findIndex(t => t.id === currentTrack.id);
      hasNext = hasNext || currentIndex < currentPlaylist.tracks.length - 1 || isRepeat === 'all';
      hasPrevious = currentIndex > 0 || isRepeat === 'all';
    }

    setState(prev => ({ ...prev, hasNext, hasPrevious }));
  }, [state.currentPlaylist, state.currentTrack, state.queue, state.isRepeat]);

  const value: PlayerContextType = {
    ...state,
    play,
    pause,
    resume,
    stop,
    next,
    previous,
    seek,
    setVolume,
    addToQueue,
    removeFromQueue,
    clearQueue,
    playFromQueue,
    setRepeat,
    setShuffle,
    playPlaylist,
    toggleFavorite,
    isFavorite
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
