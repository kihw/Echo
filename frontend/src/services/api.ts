import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (email: string, password: string, displayName: string) =>
    api.post('/auth/register', { email, password, displayName }),

  logout: () => api.post('/auth/logout'),

  getSpotifyAuthUrl: () => api.get('/auth/spotify/url'),

  getDeezerAuthUrl: () => api.get('/auth/deezer/url'),

  handleOAuthCallback: (provider: string, code: string) =>
    api.post(`/auth/${provider}/callback`, { code }),
};

// User API endpoints
export const userApi = {
  getProfile: () => api.get('/user/profile'),

  updateProfile: (updates: any) => api.patch('/user/profile', updates),

  getHistory: (limit?: number, offset?: number) =>
    api.get('/user/history', { params: { limit, offset } }),

  getStats: () => api.get('/user/stats'),

  deleteAccount: () => api.delete('/user/profile'),
};

// Playlist API endpoints
export const playlistApi = {
  getPlaylists: (limit?: number, offset?: number) =>
    api.get('/playlist', { params: { limit, offset } }),

  getPlaylist: (id: string) => api.get(`/playlist/${id}`),

  createPlaylist: (data: any) => api.post('/playlist', data),

  updatePlaylist: (id: string, data: any) => api.patch(`/playlist/${id}`, data),

  deletePlaylist: (id: string) => api.delete(`/playlist/${id}`),

  addTrack: (id: string, trackId: string) =>
    api.post(`/playlist/${id}/tracks`, { trackId }),

  removeTrack: (id: string, trackId: string) =>
    api.delete(`/playlist/${id}/tracks/${trackId}`),

  reorderTracks: (id: string, trackIds: string[]) =>
    api.patch(`/playlist/${id}/reorder`, { trackIds }),

  generatePlaylist: (params: any) => api.post('/playlist/generate', params),

  exportPlaylist: (id: string, platform: string) =>
    api.post(`/playlist/${id}/export`, { platform }),

  duplicatePlaylist: (id: string) => api.post(`/playlist/${id}/duplicate`),
};

// Music API endpoints
export const musicApi = {
  search: (query: string, type?: string, limit?: number) =>
    api.get('/music/search', { params: { query, type, limit } }),

  getTrack: (id: string) => api.get(`/music/track/${id}`),

  getAlbum: (id: string) => api.get(`/music/album/${id}`),

  getArtist: (id: string) => api.get(`/music/artist/${id}`),

  getRecommendations: (seed?: any) =>
    api.get('/music/recommendations', { params: seed }),

  getGenres: () => api.get('/music/genres'),

  getPopular: (type?: string, limit?: number) =>
    api.get('/music/popular', { params: { type, limit } }),
};

// Sync API endpoints
export const syncApi = {
  syncSpotify: () => api.post('/sync/spotify'),

  syncDeezer: () => api.post('/sync/deezer'),

  syncYouTube: () => api.post('/sync/youtube'),

  getSyncStatus: () => api.get('/sync/status'),

  getSyncHistory: (limit?: number) =>
    api.get('/sync/history', { params: { limit } }),

  importFromService: (service: string, data: any) =>
    api.post(`/sync/import/${service}`, data),
};

// Player API endpoints
export const playerApi = {
  play: (trackId: string, playlistId?: string) =>
    api.post('/player/play', { trackId, playlistId }),

  pause: () => api.post('/player/pause'),

  next: () => api.post('/player/next'),

  previous: () => api.post('/player/previous'),

  seek: (position: number) => api.post('/player/seek', { position }),

  setVolume: (volume: number) => api.post('/player/volume', { volume }),

  getState: () => api.get('/player/state'),

  setRepeat: (mode: string) => api.post('/player/repeat', { mode }),

  setShuffle: (enabled: boolean) => api.post('/player/shuffle', { enabled }),

  addToQueue: (trackId: string) => api.post('/player/queue', { trackId }),

  getQueue: () => api.get('/player/queue'),

  clearQueue: () => api.delete('/player/queue'),
};

export default api;
