// Constantes pour l'application Echo Music Player

// URLs et endpoints
export const API_ENDPOINTS = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    SPOTIFY: '/auth/spotify',
    DEEZER: '/auth/deezer',
    GOOGLE: '/auth/google'
  },
  USER: {
    PROFILE: '/user/profile',
    HISTORY: '/user/history',
    STATS: '/user/stats'
  },
  PLAYLISTS: {
    BASE: '/playlists',
    GENERATE: '/playlists/generate'
  },
  MUSIC: {
    SEARCH: '/music/search',
    TRACK: '/music/track',
    ALBUM: '/music/album',
    ARTIST: '/music/artist',
    RECOMMENDATIONS: '/music/recommendations'
  },
  SYNC: {
    FULL: '/sync/full',
    STATUS: '/sync/status',
    HISTORY: '/sync/history',
    SPOTIFY: '/sync/spotify',
    DEEZER: '/sync/deezer',
    YOUTUBE: '/sync/youtube',
    LIDARR: '/sync/lidarr'
  },
  PLAYER: {
    PLAY: '/player/play',
    PAUSE: '/player/pause',
    NEXT: '/player/next',
    PREVIOUS: '/player/previous',
    SEEK: '/player/seek',
    VOLUME: '/player/volume',
    STATE: '/player/state',
    QUEUE: '/player/queue'
  }
} as const;

// Limites et pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1
} as const;

export const LIMITS = {
  PLAYLIST_NAME_MAX_LENGTH: 100,
  PLAYLIST_DESCRIPTION_MAX_LENGTH: 500,
  SEARCH_QUERY_MAX_LENGTH: 200,
  MAX_TRACKS_PER_PLAYLIST: 1000,
  MAX_PLAYLIST_GENERATION_SIZE: 100,
  MIN_PLAYLIST_GENERATION_SIZE: 5
} as const;

// Timeouts et délais
export const TIMEOUTS = {
  API_REQUEST: 10000, // 10 secondes
  SEARCH_DEBOUNCE: 300, // 300ms
  PLAYER_UPDATE_INTERVAL: 1000, // 1 seconde
  SYNC_POLL_INTERVAL: 2000, // 2 secondes
  NOTIFICATION_DEFAULT_DURATION: 5000 // 5 secondes
} as const;

// Configuration du lecteur audio
export const PLAYER_CONFIG = {
  DEFAULT_VOLUME: 0.8,
  MIN_VOLUME: 0,
  MAX_VOLUME: 1,
  VOLUME_STEP: 0.1,
  SEEK_STEP: 10000, // 10 secondes en ms
  CROSSFADE_DURATION: 2000, // 2 secondes
  PRELOAD_NEXT_TRACK: true,
  AUDIO_FORMATS: ['mp3', 'ogg', 'webm', 'm4a']
} as const;

// Types de répétition
export const REPEAT_MODES = {
  OFF: 'off',
  ONE: 'one',
  ALL: 'all'
} as const;

// États de lecture
export const PLAYBACK_STATES = {
  STOPPED: 'stopped',
  PLAYING: 'playing',
  PAUSED: 'paused',
  LOADING: 'loading',
  ERROR: 'error'
} as const;

// Services de musique supportés
export const MUSIC_SERVICES = {
  SPOTIFY: {
    id: 'spotify',
    name: 'Spotify',
    color: '#1DB954',
    icon: '/icons/spotify.svg'
  },
  DEEZER: {
    id: 'deezer',
    name: 'Deezer',
    color: '#FF6600',
    icon: '/icons/deezer.svg'
  },
  YOUTUBE: {
    id: 'youtube',
    name: 'YouTube Music',
    color: '#FF0000',
    icon: '/icons/youtube.svg'
  },
  LIDARR: {
    id: 'lidarr',
    name: 'Lidarr',
    color: '#8B5CF6',
    icon: '/icons/lidarr.svg'
  }
} as const;

// Qualités audio
export const AUDIO_QUALITIES = {
  LOW: {
    id: 'low',
    label: 'Faible (96 kbps)',
    bitrate: 96
  },
  MEDIUM: {
    id: 'medium',
    label: 'Normale (128 kbps)',
    bitrate: 128
  },
  HIGH: {
    id: 'high',
    label: 'Haute (320 kbps)',
    bitrate: 320
  }
} as const;

// Thèmes disponibles
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
} as const;

// Langues supportées
export const LANGUAGES = {
  FR: {
    code: 'fr',
    name: 'Français',
    flag: '🇫🇷'
  },
  EN: {
    code: 'en',
    name: 'English',
    flag: '🇺🇸'
  }
} as const;

// Types de notifications
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const;

// Durées courantes (en millisecondes)
export const DURATIONS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000
} as const;

// Genres musicaux populaires
export const MUSIC_GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'Electronic', 'Jazz', 'Classical',
  'Country', 'R&B', 'Reggae', 'Blues', 'Folk', 'Metal',
  'Punk', 'Alternative', 'Indie', 'Dance', 'House', 'Techno',
  'Ambient', 'World Music', 'Latin', 'Funk', 'Soul', 'Gospel'
] as const;

// Algorithmes de génération de playlists
export const PLAYLIST_ALGORITHMS = {
  SIMILARITY: {
    id: 'similarity',
    name: 'Similarité',
    description: 'Basé sur la similarité des tracks'
  },
  MOOD: {
    id: 'mood',
    name: 'Humeur',
    description: 'Basé sur l\'humeur et l\'émotion'
  },
  GENRE: {
    id: 'genre',
    name: 'Genre',
    description: 'Basé sur les genres musicaux'
  },
  TEMPO: {
    id: 'tempo',
    name: 'Tempo',
    description: 'Basé sur le tempo et l\'énergie'
  },
  DISCOVERY: {
    id: 'discovery',
    name: 'Découverte',
    description: 'Pour découvrir de nouveaux artistes'
  },
  HISTORY: {
    id: 'history',
    name: 'Historique',
    description: 'Basé sur votre historique d\'écoute'
  },
  HYBRID: {
    id: 'hybrid',
    name: 'Hybride',
    description: 'Combinaison de plusieurs algorithmes'
  }
} as const;

// États de synchronisation
export const SYNC_STATUSES = {
  IDLE: 'idle',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  COMPLETED_WITH_ERRORS: 'completed_with_errors'
} as const;

// Types de playlists
export const PLAYLIST_TYPES = {
  MANUAL: 'manual',
  SMART: 'smart'
} as const;

// Sources de playlists
export const PLAYLIST_SOURCES = {
  LOCAL: 'local',
  SPOTIFY: 'spotify',
  DEEZER: 'deezer',
  YOUTUBE: 'youtube'
} as const;

// Clés de stockage local
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_PREFERENCES: 'user_preferences',
  PLAYER_STATE: 'player_state',
  LAST_PLAYED: 'last_played',
  VOLUME: 'volume',
  THEME: 'theme',
  LANGUAGE: 'language'
} as const;

// Événements personnalisés
export const CUSTOM_EVENTS = {
  PLAYER_STATE_CHANGE: 'player:state-change',
  TRACK_CHANGE: 'player:track-change',
  PLAYLIST_CHANGE: 'player:playlist-change',
  VOLUME_CHANGE: 'player:volume-change',
  SYNC_START: 'sync:start',
  SYNC_PROGRESS: 'sync:progress',
  SYNC_COMPLETE: 'sync:complete',
  NOTIFICATION_SHOW: 'notification:show',
  NOTIFICATION_HIDE: 'notification:hide'
} as const;

// Codes d'erreur personnalisés
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PLAYER_ERROR: 'PLAYER_ERROR',
  SYNC_ERROR: 'SYNC_ERROR',
  RATE_LIMITED: 'RATE_LIMITED'
} as const;

// Configuration des routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  CALLBACK: '/auth/callback',
  DASHBOARD: '/dashboard',
  PLAYLISTS: '/playlists',
  PLAYLIST_DETAIL: '/playlists/[id]',
  PLAYLIST_CREATE: '/playlists/create',
  PLAYLIST_GENERATE: '/playlists/generate',
  SEARCH: '/search',
  DISCOVER: '/discover',
  STATS: '/stats',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  SYNC: '/sync',
  PRIVACY: '/privacy',
  TERMS: '/terms'
} as const;

// Configuration responsive
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px'
} as const;

// Configuration des modales
export const MODAL_SIZES = {
  SMALL: 'sm',
  MEDIUM: 'md',
  LARGE: 'lg',
  EXTRA_LARGE: 'xl'
} as const;

// Configuration des animations
export const ANIMATION_DURATIONS = {
  FAST: '150ms',
  NORMAL: '300ms',
  SLOW: '500ms'
} as const;

const ECHO_CONSTANTS = {
  API_ENDPOINTS,
  PAGINATION,
  LIMITS,
  TIMEOUTS,
  PLAYER_CONFIG,
  REPEAT_MODES,
  PLAYBACK_STATES,
  MUSIC_SERVICES,
  AUDIO_QUALITIES,
  THEMES,
  LANGUAGES,
  NOTIFICATION_TYPES,
  DURATIONS,
  MUSIC_GENRES,
  PLAYLIST_ALGORITHMS,
  SYNC_STATUSES,
  PLAYLIST_TYPES,
  PLAYLIST_SOURCES,
  STORAGE_KEYS,
  CUSTOM_EVENTS,
  ERROR_CODES,
  ROUTES,
  BREAKPOINTS,
  MODAL_SIZES,
  ANIMATION_DURATIONS
};

export default ECHO_CONSTANTS;
