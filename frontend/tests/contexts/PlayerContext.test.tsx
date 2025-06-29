import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { PlayerProvider, usePlayer, Track, Playlist } from '@/contexts/PlayerContext';
import { playerApi } from '@/services/api';

// Mock the playerApi
jest.mock('@/services/api', () => ({
  playerApi: {
    play: jest.fn(),
    pause: jest.fn(),
    next: jest.fn(),
    previous: jest.fn(),
    seek: jest.fn(),
    setVolume: jest.fn(),
    setRepeat: jest.fn(),
    setShuffle: jest.fn(),
    addToQueue: jest.fn(),
    getQueue: jest.fn(),
    clearQueue: jest.fn(),
  },
}));

const mockTrack: Track = {
  id: '1',
  title: 'Test Track',
  artist: 'Test Artist',
  album: 'Test Album',
  duration: 180,
  artwork: 'https://example.com/artwork.jpg',
};

const mockPlaylist: Playlist = {
  id: 'playlist-1',
  name: 'Test Playlist',
  description: 'A test playlist',
  tracks: [mockTrack],
  isPublic: true,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  creator: {
    id: 'user-1',
    displayName: 'Test User',
  },
};

// Test wrapper
const wrapper = ({ children }: any) => (
  <PlayerProvider>{children}</PlayerProvider>
);

describe('PlayerContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('usePlayer hook', () => {
    it('should throw error when used outside PlayerProvider', () => {
      expect(() => {
        renderHook(() => usePlayer());
      }).toThrow('usePlayer must be used within a PlayerProvider');
    });

    it('should provide initial player state', () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      expect(result.current).toMatchObject({
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
        hasPrevious: false,
        play: expect.any(Function),
        pause: expect.any(Function),
        resume: expect.any(Function),
        stop: expect.any(Function),
        next: expect.any(Function),
        previous: expect.any(Function),
        seek: expect.any(Function),
        setVolume: expect.any(Function),
        addToQueue: expect.any(Function),
        removeFromQueue: expect.any(Function),
        clearQueue: expect.any(Function),
        playFromQueue: expect.any(Function),
        setRepeat: expect.any(Function),
        setShuffle: expect.any(Function),
        playPlaylist: expect.any(Function),
        toggleFavorite: expect.any(Function),
        isFavorite: expect.any(Function),
      });
    });
  });

  describe('Play functions', () => {
    it('should play a track', async () => {
      (playerApi.play as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => usePlayer(), { wrapper });

      await act(async () => {
        await result.current.play(mockTrack);
      });

      expect(playerApi.play).toHaveBeenCalledWith(mockTrack.id, undefined);
      expect(result.current.currentTrack).toEqual(mockTrack);
      expect(result.current.isPlaying).toBe(true);
      expect(result.current.isPaused).toBe(false);
    });

    it('should play a track from playlist', async () => {
      (playerApi.play as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => usePlayer(), { wrapper });

      await act(async () => {
        await result.current.play(mockTrack, mockPlaylist);
      });

      expect(playerApi.play).toHaveBeenCalledWith(mockTrack.id, mockPlaylist.id);
      expect(result.current.currentTrack).toEqual(mockTrack);
      expect(result.current.currentPlaylist).toEqual(mockPlaylist);
      expect(result.current.isPlaying).toBe(true);
    });

    it('should handle play error', async () => {
      (playerApi.play as jest.Mock).mockRejectedValue(new Error('Play failed'));
      console.error = jest.fn();

      const { result } = renderHook(() => usePlayer(), { wrapper });

      await act(async () => {
        await result.current.play(mockTrack);
      });

      expect(console.error).toHaveBeenCalledWith('Failed to play track:', expect.any(Error));
      expect(result.current.isLoading).toBe(false);
    });

    it('should pause playback', async () => {
      (playerApi.pause as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => usePlayer(), { wrapper });

      // First play a track
      await act(async () => {
        await result.current.play(mockTrack);
      });

      // Then pause
      await act(async () => {
        await result.current.pause();
      });

      expect(playerApi.pause).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isPaused).toBe(true);
    });

    it('should resume playback', async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      // First play and pause
      await act(async () => {
        await result.current.play(mockTrack);
        await result.current.pause();
      });

      // Then resume
      await act(async () => {
        await result.current.resume();
      });

      expect(result.current.isPlaying).toBe(true);
      expect(result.current.isPaused).toBe(false);
    });

    it('should stop playback', async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      // First play a track
      await act(async () => {
        await result.current.play(mockTrack);
      });

      // Then stop
      await act(async () => {
        await result.current.stop();
      });

      expect(result.current.isPlaying).toBe(false);
      expect(result.current.isPaused).toBe(false);
      expect(result.current.position).toBe(0);
    });
  });

  describe('Navigation functions', () => {
    it('should play next track', async () => {
      (playerApi.next as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => usePlayer(), { wrapper });

      await act(async () => {
        await result.current.next();
      });

      expect(playerApi.next).toHaveBeenCalled();
    });

    it('should play previous track', async () => {
      (playerApi.previous as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => usePlayer(), { wrapper });

      await act(async () => {
        await result.current.previous();
      });

      expect(playerApi.previous).toHaveBeenCalled();
    });

    it('should seek to position', async () => {
      (playerApi.seek as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => usePlayer(), { wrapper });

      await act(async () => {
        await result.current.seek(60);
      });

      expect(playerApi.seek).toHaveBeenCalledWith(60);
      expect(result.current.position).toBe(60);
    });
  });

  describe('Volume control', () => {
    it('should set volume', async () => {
      (playerApi.setVolume as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => usePlayer(), { wrapper });

      await act(async () => {
        await result.current.setVolume(0.5);
      });

      expect(playerApi.setVolume).toHaveBeenCalledWith(0.5);
      expect(result.current.volume).toBe(0.5);
    });
  });

  describe('Repeat modes', () => {
    it('should set repeat mode', async () => {
      (playerApi.setRepeat as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => usePlayer(), { wrapper });

      await act(async () => {
        await result.current.setRepeat('one');
      });

      expect(playerApi.setRepeat).toHaveBeenCalledWith('one');
      expect(result.current.isRepeat).toBe('one');
    });
  });

  describe('Shuffle mode', () => {
    it('should set shuffle mode', async () => {
      (playerApi.setShuffle as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => usePlayer(), { wrapper });

      await act(async () => {
        await result.current.setShuffle(true);
      });

      expect(playerApi.setShuffle).toHaveBeenCalledWith(true);
      expect(result.current.isShuffle).toBe(true);
    });
  });

  describe('Queue management', () => {
    it('should add track to queue', async () => {
      (playerApi.addToQueue as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => usePlayer(), { wrapper });

      await act(async () => {
        await result.current.addToQueue(mockTrack);
      });

      expect(playerApi.addToQueue).toHaveBeenCalledWith(mockTrack.id);
      expect(result.current.queue).toContain(mockTrack);
    });

    it('should remove track from queue', async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      // First add to queue
      await act(async () => {
        await result.current.addToQueue(mockTrack);
      });

      // Then remove (by index)
      await act(async () => {
        await result.current.removeFromQueue(0);
      });

      expect(result.current.queue).not.toContain(mockTrack);
    });

    it('should clear queue', async () => {
      (playerApi.clearQueue as jest.Mock).mockResolvedValue({});

      const { result } = renderHook(() => usePlayer(), { wrapper });

      // First add to queue
      await act(async () => {
        await result.current.addToQueue(mockTrack);
      });

      // Then clear
      await act(async () => {
        await result.current.clearQueue();
      });

      expect(playerApi.clearQueue).toHaveBeenCalled();
      expect(result.current.queue).toHaveLength(0);
    });

    it('should play from queue', async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      // First add to queue
      await act(async () => {
        await result.current.addToQueue(mockTrack);
      });

      // Then play from queue
      await act(async () => {
        await result.current.playFromQueue(0);
      });

      expect(result.current.currentTrack).toEqual(mockTrack);
      expect(result.current.queue).not.toContain(mockTrack);
    });
  });

  describe('Playlist functions', () => {
    it('should play playlist', async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      await act(async () => {
        await result.current.playPlaylist(mockPlaylist);
      });

      expect(result.current.currentPlaylist).toEqual(mockPlaylist);
      expect(result.current.currentTrack).toEqual(mockPlaylist.tracks[0]);
      expect(result.current.isPlaying).toBe(true);
    });

    it('should play playlist from specific index', async () => {
      const multiTrackPlaylist = {
        ...mockPlaylist,
        tracks: [
          mockTrack,
          { ...mockTrack, id: '2', title: 'Second Track' },
        ],
      };

      const { result } = renderHook(() => usePlayer(), { wrapper });

      await act(async () => {
        await result.current.playPlaylist(multiTrackPlaylist, 1);
      });

      expect(result.current.currentTrack?.id).toBe('2');
    });
  });

  describe('Favorites', () => {
    it('should toggle favorite status', async () => {
      const { result } = renderHook(() => usePlayer(), { wrapper });

      // Initially not favorite
      expect(result.current.isFavorite(mockTrack.id)).toBe(false);

      // Toggle to favorite
      await act(async () => {
        await result.current.toggleFavorite(mockTrack);
      });

      expect(result.current.isFavorite(mockTrack.id)).toBe(true);

      // Toggle back to not favorite
      await act(async () => {
        await result.current.toggleFavorite(mockTrack);
      });

      expect(result.current.isFavorite(mockTrack.id)).toBe(false);
    });
  });
});
