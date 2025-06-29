import axios from 'axios';
import { api, authApi, userApi, playlistApi, musicApi, syncApi, playerApi } from '@/services/api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock axios.create
    mockedAxios.create.mockReturnValue({
      ...mockedAxios,
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() },
      },
    } as any);

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  describe('API Configuration', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:8000/api',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('Auth API', () => {
    it('should login with email and password', async () => {
      const mockResponse = { data: { token: 'test-token', user: {} } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await authApi.login('test@echo.com', 'password123');

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@echo.com',
        password: 'password123',
      });
      expect(result).toBe(mockResponse);
    });

    it('should register new user', async () => {
      const mockResponse = { data: { token: 'test-token', user: {} } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await authApi.register('test@echo.com', 'password123', 'Test User');

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', {
        email: 'test@echo.com',
        password: 'password123',
        displayName: 'Test User',
      });
      expect(result).toBe(mockResponse);
    });

    it('should logout user', async () => {
      const mockResponse = { data: { success: true } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await authApi.logout();

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/logout');
      expect(result).toBe(mockResponse);
    });

    it('should request password reset', async () => {
      const mockResponse = { data: { message: 'Reset email sent' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await authApi.forgotPassword('test@echo.com');

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'test@echo.com',
      });
      expect(result).toBe(mockResponse);
    });

    it('should reset password with token', async () => {
      const mockResponse = { data: { message: 'Password reset successful' } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await authApi.resetPassword('reset-token', 'newpassword123');

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset-token',
        password: 'newpassword123',
      });
      expect(result).toBe(mockResponse);
    });

    it('should get Spotify auth URL', async () => {
      const mockResponse = { data: { authUrl: 'https://spotify.com/oauth' } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await authApi.getSpotifyAuthUrl();

      expect(mockedAxios.get).toHaveBeenCalledWith('/auth/spotify/url');
      expect(result).toBe(mockResponse);
    });

    it('should get Deezer auth URL', async () => {
      const mockResponse = { data: { authUrl: 'https://deezer.com/oauth' } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await authApi.getDeezerAuthUrl();

      expect(mockedAxios.get).toHaveBeenCalledWith('/auth/deezer/url');
      expect(result).toBe(mockResponse);
    });

    it('should handle OAuth callback', async () => {
      const mockResponse = { data: { token: 'oauth-token', user: {} } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await authApi.handleOAuthCallback('spotify', 'auth-code');

      expect(mockedAxios.post).toHaveBeenCalledWith('/auth/spotify/callback', {
        code: 'auth-code',
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('User API', () => {
    it('should get user profile', async () => {
      const mockResponse = { data: { user: { id: '1', email: 'test@echo.com' } } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await userApi.getProfile();

      expect(mockedAxios.get).toHaveBeenCalledWith('/user/profile');
      expect(result).toBe(mockResponse);
    });

    it('should update user profile', async () => {
      const mockResponse = { data: { user: { id: '1', displayName: 'Updated Name' } } };
      const updates = { displayName: 'Updated Name' };
      mockedAxios.patch.mockResolvedValue(mockResponse);

      const result = await userApi.updateProfile(updates);

      expect(mockedAxios.patch).toHaveBeenCalledWith('/user/profile', updates);
      expect(result).toBe(mockResponse);
    });

    it('should get user history', async () => {
      const mockResponse = { data: { history: [] } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await userApi.getHistory(10, 0);

      expect(mockedAxios.get).toHaveBeenCalledWith('/user/history', {
        params: { limit: 10, offset: 0 },
      });
      expect(result).toBe(mockResponse);
    });

    it('should get user stats', async () => {
      const mockResponse = { data: { stats: {} } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await userApi.getStats();

      expect(mockedAxios.get).toHaveBeenCalledWith('/user/stats');
      expect(result).toBe(mockResponse);
    });

    it('should delete user account', async () => {
      const mockResponse = { data: { success: true } };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const result = await userApi.deleteAccount();

      expect(mockedAxios.delete).toHaveBeenCalledWith('/user/profile');
      expect(result).toBe(mockResponse);
    });
  });

  describe('Playlist API', () => {
    it('should get playlists', async () => {
      const mockResponse = { data: { playlists: [] } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await playlistApi.getPlaylists(10, 0);

      expect(mockedAxios.get).toHaveBeenCalledWith('/playlist', {
        params: { limit: 10, offset: 0 },
      });
      expect(result).toBe(mockResponse);
    });

    it('should get single playlist', async () => {
      const mockResponse = { data: { playlist: {} } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await playlistApi.getPlaylist('playlist-1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/playlist/playlist-1');
      expect(result).toBe(mockResponse);
    });

    it('should create playlist', async () => {
      const mockResponse = { data: { playlist: {} } };
      const playlistData = { name: 'New Playlist', description: 'Test playlist' };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await playlistApi.createPlaylist(playlistData);

      expect(mockedAxios.post).toHaveBeenCalledWith('/playlist', playlistData);
      expect(result).toBe(mockResponse);
    });

    it('should update playlist', async () => {
      const mockResponse = { data: { playlist: {} } };
      const updates = { name: 'Updated Playlist' };
      mockedAxios.patch.mockResolvedValue(mockResponse);

      const result = await playlistApi.updatePlaylist('playlist-1', updates);

      expect(mockedAxios.patch).toHaveBeenCalledWith('/playlist/playlist-1', updates);
      expect(result).toBe(mockResponse);
    });

    it('should delete playlist', async () => {
      const mockResponse = { data: { success: true } };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const result = await playlistApi.deletePlaylist('playlist-1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/playlist/playlist-1');
      expect(result).toBe(mockResponse);
    });

    it('should add track to playlist', async () => {
      const mockResponse = { data: { success: true } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await playlistApi.addTrack('playlist-1', 'track-1');

      expect(mockedAxios.post).toHaveBeenCalledWith('/playlist/playlist-1/tracks', {
        trackId: 'track-1',
      });
      expect(result).toBe(mockResponse);
    });

    it('should remove track from playlist', async () => {
      const mockResponse = { data: { success: true } };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const result = await playlistApi.removeTrack('playlist-1', 'track-1');

      expect(mockedAxios.delete).toHaveBeenCalledWith('/playlist/playlist-1/tracks/track-1');
      expect(result).toBe(mockResponse);
    });

    it('should generate playlist', async () => {
      const mockResponse = { data: { playlist: {} } };
      const params = { mood: 'happy', genre: 'pop' };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await playlistApi.generatePlaylist(params);

      expect(mockedAxios.post).toHaveBeenCalledWith('/playlist/generate', params);
      expect(result).toBe(mockResponse);
    });
  });

  describe('Music API', () => {
    it('should search music', async () => {
      const mockResponse = { data: { results: [] } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await musicApi.search('test query', 'track', 10);

      expect(mockedAxios.get).toHaveBeenCalledWith('/music/search', {
        params: { query: 'test query', type: 'track', limit: 10 },
      });
      expect(result).toBe(mockResponse);
    });

    it('should get track details', async () => {
      const mockResponse = { data: { track: {} } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await musicApi.getTrack('track-1');

      expect(mockedAxios.get).toHaveBeenCalledWith('/music/track/track-1');
      expect(result).toBe(mockResponse);
    });

    it('should get recommendations', async () => {
      const mockResponse = { data: { recommendations: [] } };
      const seed = { artist: 'test-artist' };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await musicApi.getRecommendations(seed);

      expect(mockedAxios.get).toHaveBeenCalledWith('/music/recommendations', {
        params: seed,
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('Player API', () => {
    it('should play track', async () => {
      const mockResponse = { data: { success: true } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await playerApi.play('track-1', 'playlist-1');

      expect(mockedAxios.post).toHaveBeenCalledWith('/player/play', {
        trackId: 'track-1',
        playlistId: 'playlist-1',
      });
      expect(result).toBe(mockResponse);
    });

    it('should pause playback', async () => {
      const mockResponse = { data: { success: true } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await playerApi.pause();

      expect(mockedAxios.post).toHaveBeenCalledWith('/player/pause');
      expect(result).toBe(mockResponse);
    });

    it('should set volume', async () => {
      const mockResponse = { data: { success: true } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await playerApi.setVolume(0.5);

      expect(mockedAxios.post).toHaveBeenCalledWith('/player/volume', { volume: 0.5 });
      expect(result).toBe(mockResponse);
    });

    it('should get player state', async () => {
      const mockResponse = { data: { state: {} } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await playerApi.getState();

      expect(mockedAxios.get).toHaveBeenCalledWith('/player/state');
      expect(result).toBe(mockResponse);
    });
  });

  describe('Sync API', () => {
    it('should sync Spotify', async () => {
      const mockResponse = { data: { success: true } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await syncApi.syncSpotify();

      expect(mockedAxios.post).toHaveBeenCalledWith('/sync/spotify');
      expect(result).toBe(mockResponse);
    });

    it('should get sync status', async () => {
      const mockResponse = { data: { status: {} } };
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await syncApi.getSyncStatus();

      expect(mockedAxios.get).toHaveBeenCalledWith('/sync/status');
      expect(result).toBe(mockResponse);
    });

    it('should import from service', async () => {
      const mockResponse = { data: { success: true } };
      const data = { playlists: [] };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await syncApi.importFromService('spotify', data);

      expect(mockedAxios.post).toHaveBeenCalledWith('/sync/import/spotify', data);
      expect(result).toBe(mockResponse);
    });
  });
});
