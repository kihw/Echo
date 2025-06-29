// Types pour l'application Echo Music Player

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  spotifyId?: string;
  deezerId?: string;
  youtubeId?: string;
  preferences: UserPreferences;
  subscription: Subscription;
  createdAt: string;
  lastLoginAt: string;
  connectedServices?: ConnectedServices;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoplay: boolean;
  crossfade: boolean;
  volume: number;
  quality: 'low' | 'medium' | 'high';
  notifications: boolean;
}

export interface Subscription {
  type: 'free' | 'premium';
  expiresAt?: string;
  features: string[];
}

export interface ConnectedServices {
  spotify?: ServiceConnection;
  deezer?: ServiceConnection;
  youtube?: ServiceConnection;
  lastSyncAt?: string;
}

export interface ServiceConnection {
  id: string;
  name: string;
  connected: boolean;
  lastSync?: string;
  status: 'active' | 'expired' | 'error';
}

export interface Track {
  id: string;
  title: string;
  artist: Artist;
  album?: Album;
  duration: number; // en millisecondes
  popularity?: number;
  explicit: boolean;
  previewUrl?: string;
  externalIds: ExternalIds;
  audioFeatures?: AudioFeatures;
  isrc?: string;
  trackNumber?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Artist {
  id: string;
  name: string;
  genres: string[];
  popularity?: number;
  imageUrl?: string;
  followers?: number;
  externalIds: ExternalIds;
  createdAt: string;
  updatedAt: string;
}

export interface Album {
  id: string;
  title: string;
  artist: Artist;
  releaseDate?: string;
  imageUrl?: string;
  totalTracks?: number;
  externalIds: ExternalIds;
  createdAt: string;
  updatedAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  userId: string;
  isPublic: boolean;
  isCollaborative: boolean;
  type: 'manual' | 'smart';
  source: 'local' | 'spotify' | 'deezer' | 'youtube';
  mood?: string;
  category?: string;
  trackCount: number;
  totalDuration: number;
  artwork?: string;
  tracks?: PlaylistTrack[];
  generationRules?: GenerationRules;
  stats?: PlaylistStats;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistTrack {
  id: string;
  playlistId: string;
  trackId: string;
  track: Track;
  position: number;
  addedAt: string;
  metadata?: {
    reason?: string;
    confidence?: number;
    ruleMatched?: string;
  };
}

export interface GenerationRules {
  algorithm: 'similarity' | 'mood' | 'genre' | 'tempo' | 'discovery' | 'history' | 'hybrid';
  seedTracks: string[];
  seedArtists: string[];
  seedGenres: string[];
  audioFeatures: Partial<AudioFeatures>;
  rules: {
    minSimilarity?: number;
    maxRepeatArtist?: number;
    targetDuration?: number;
    diversityFactor?: number;
  };
  targetSize: number;
}

export interface AudioFeatures {
  acousticness: number;
  danceability: number;
  energy: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
  valence: number;
  tempo: number;
  loudness: number;
  mode: number;
  key: number;
  timeSignature: number;
}

export interface PlaylistStats {
  totalTracks: number;
  totalDuration: number;
  creationMethod: 'manual' | 'ai_generated' | 'imported';
  mostPlayedTrack?: string;
  averagePopularity?: number;
  genres: { [key: string]: number };
}

export interface ExternalIds {
  spotify?: string;
  deezer?: string;
  youtube?: string;
  lidarr?: string;
  musicbrainz?: string;
}

export interface PlayerState {
  isPlaying: boolean;
  currentTrack?: Track;
  playlist?: Playlist;
  position: number; // en millisecondes
  volume: number; // 0-1
  isMuted: boolean;
  repeatMode: 'off' | 'one' | 'all';
  shuffleEnabled: boolean;
  queue: Track[];
  history: Track[];
}

export interface SyncStatus {
  inProgress: boolean;
  lastSyncTime?: string;
  currentService?: string;
  progress?: number;
  totalItems?: number;
  processedItems?: number;
  errors?: string[];
}

export interface SyncHistory {
  id: string;
  userId: string;
  serviceName: string;
  syncType: 'full' | 'incremental';
  status: 'running' | 'completed' | 'failed' | 'completed_with_errors';
  itemsProcessed: number;
  itemsAdded: number;
  itemsUpdated: number;
  itemsFailed: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
}

export interface ListeningHistory {
  id: string;
  userId: string;
  trackId: string;
  track: Track;
  playlistId?: string;
  actionType: 'play' | 'skip' | 'like' | 'dislike';
  completionRate: number; // 0-1
  playedAt: string;
  metadata?: {
    source?: string;
    device?: string;
    quality?: string;
  };
}

export interface UserStats {
  totalListeningTime: number;
  topTracks: Track[];
  topArtists: Artist[];
  topGenres: { genre: string; count: number }[];
  recentlyPlayed: Track[];
  monthlyStats: {
    month: string;
    listeningTime: number;
    tracksPlayed: number;
  }[];
  discoveryStats: {
    newArtists: number;
    newTracks: number;
    period: string;
  };
}

export interface SearchResult {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  total: number;
  query: string;
}

export interface Recommendation {
  track: Track;
  reason: string;
  confidence: number;
  basedOn: 'listening_history' | 'similar_users' | 'track_features' | 'genre_preferences';
}

export interface ApiError {
  error: string;
  message: string;
  code?: string;
  details?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// Types pour les événements du lecteur
export type PlayerEvent =
  | 'play'
  | 'pause'
  | 'stop'
  | 'next'
  | 'previous'
  | 'seek'
  | 'volume_change'
  | 'track_change'
  | 'playlist_change'
  | 'queue_change'
  | 'repeat_change'
  | 'shuffle_change'
  | 'error';

export interface PlayerEventData {
  type: PlayerEvent;
  payload?: any;
  timestamp: number;
}

// Types pour la génération de playlists
export interface PlaylistGenerationParams {
  algorithm: GenerationRules['algorithm'];
  seedTracks?: string[];
  seedArtists?: string[];
  seedGenres?: string[];
  audioFeatures?: Partial<AudioFeatures>;
  rules?: GenerationRules['rules'];
  targetSize: number;
  name?: string;
  description?: string;
}

// Types pour les filtres de recherche
export interface SearchFilters {
  type?: 'track' | 'artist' | 'album' | 'playlist';
  genre?: string[];
  year?: [number, number];
  duration?: [number, number];
  popularity?: [number, number];
  explicit?: boolean;
  hasPreview?: boolean;
}

// Types pour les notifications
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
  createdAt: string;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'destructive';
}

// Types pour les thèmes
export interface Theme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    warning: string;
    success: string;
    info: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}
