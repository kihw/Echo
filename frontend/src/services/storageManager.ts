// Type definitions for better TypeScript support
interface Track {
    id: string;
    title: string;
    artist: string;
    album?: string;
    genre?: string[];
    duration?: number;
    url?: string;
    thumbnail?: string;
    playedAt?: string;
    downloadedAt?: string;
    favoritedAt?: string;
}

interface UserPreferences {
    theme: string;
    language: string;
    volume: number;
    autoplay: boolean;
    crossfade: boolean;
    crossfadeDuration: number;
    repeat: string;
    shuffle: boolean;
    showLyrics: boolean;
    showVisualizer: boolean;
    notificationsEnabled: boolean;
    updateNotifications: boolean;
    qualityPreference: string;
}

interface PlayerState {
    currentTrack: Track | null;
    position: number;
    volume: number;
    repeat: string;
    shuffle: boolean;
    lastUpdated?: string;
}

interface ListeningStats {
    totalPlayTime: number;
    tracksPlayed: number;
    sessionsCount: number;
    favoriteGenres: { [key: string]: number };
    favoriteArtists: { [key: string]: number };
    dailyStats: { [key: string]: { playTime: number; tracks: number } };
}

interface Session {
    id: string;
    startTime: string;
    endTime?: string;
    tracks: Array<Track & { playTime: number; playedAt: string }>;
    totalPlayTime: number;
}

// Storage Manager for handling local data persistence
export class StorageManager {
    private static instance: StorageManager;
    private prefix = 'echo_';

    constructor() {
        if (StorageManager.instance) {
            return StorageManager.instance;
        }
        StorageManager.instance = this;
    }

    // Get storage keys with prefix
    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    // Check if localStorage is available
    private isLocalStorageAvailable(): boolean {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, 'test');
            localStorage.removeItem(test);
            return true;
        } catch {
            return false;
        }
    }

    // Basic storage operations
    setItem<T>(key: string, value: T): boolean {
        if (!this.isLocalStorageAvailable()) return false;

        try {
            const serializedValue = JSON.stringify(value);
            localStorage.setItem(this.getKey(key), serializedValue);
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }

    getItem<T>(key: string, defaultValue?: T): T | null {
        if (!this.isLocalStorageAvailable()) return defaultValue || null;

        try {
            const serializedValue = localStorage.getItem(this.getKey(key));
            if (serializedValue === null) return defaultValue || null;
            return JSON.parse(serializedValue) as T;
        } catch (error) {
            console.error('Failed to read from localStorage:', error);
            return defaultValue || null;
        }
    }

    removeItem(key: string): boolean {
        if (!this.isLocalStorageAvailable()) return false;

        try {
            localStorage.removeItem(this.getKey(key));
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    }

    clear(): boolean {
        if (!this.isLocalStorageAvailable()) return false;

        try {
            // Only remove items with our prefix
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
            return false;
        }
    }

    // User preferences
    getUserPreferences(): UserPreferences {
        return this.getItem<UserPreferences>('user_preferences', {
            theme: 'system',
            language: 'fr',
            volume: 0.8,
            autoplay: true,
            crossfade: false,
            crossfadeDuration: 3000,
            repeat: 'off',
            shuffle: false,
            showLyrics: true,
            showVisualizer: false,
            notificationsEnabled: true,
            updateNotifications: true,
            qualityPreference: 'high',
        }) as UserPreferences;
    }

    setUserPreferences(preferences: Partial<UserPreferences>): boolean {
        const current = this.getUserPreferences();
        return this.setItem('user_preferences', { ...current, ...preferences });
    }

    // Playlist cache
    getCachedPlaylists(): any[] {
        return this.getItem<any[]>('cached_playlists', []) as any[];
    }

    setCachedPlaylists(playlists: any[]): boolean {
        return this.setItem('cached_playlists', playlists);
    }

    // Recently played tracks
    getRecentlyPlayed(): Track[] {
        return this.getItem<Track[]>('recently_played', []) as Track[];
    }

    addToRecentlyPlayed(track: Track): boolean {
        const recent = this.getRecentlyPlayed();

        // Remove if already exists
        const filtered = recent.filter((t: Track) => t.id !== track.id);

        // Add to beginning
        filtered.unshift({
            ...track,
            playedAt: new Date().toISOString(),
        });

        // Keep only last 50 tracks
        const limited = filtered.slice(0, 50);

        return this.setItem('recently_played', limited);
    }

    // Search history
    getSearchHistory(): string[] {
        return this.getItem<string[]>('search_history', []) as string[];
    }

    addToSearchHistory(query: string): boolean {
        if (!query.trim()) return false;

        const history = this.getSearchHistory();

        // Remove if already exists
        const filtered = history.filter((q: string) => q !== query);

        // Add to beginning
        filtered.unshift(query);

        // Keep only last 20 searches
        const limited = filtered.slice(0, 20);

        return this.setItem('search_history', limited);
    }

    clearSearchHistory(): boolean {
        return this.removeItem('search_history');
    }

    // Queue management
    getQueue(): Track[] {
        return this.getItem<Track[]>('player_queue', []) as Track[];
    }

    setQueue(queue: Track[]): boolean {
        return this.setItem('player_queue', queue);
    }

    // Player state
    getPlayerState(): PlayerState {
        return this.getItem<PlayerState>('player_state', {
            currentTrack: null,
            position: 0,
            volume: 0.8,
            repeat: 'off',
            shuffle: false,
        }) as PlayerState;
    }

    setPlayerState(state: Partial<PlayerState>): boolean {
        const current = this.getPlayerState();
        return this.setItem('player_state', {
            ...current,
            ...state,
            lastUpdated: new Date().toISOString(),
        });
    }

    // Offline tracks
    getOfflineTracks(): Track[] {
        return this.getItem<Track[]>('offline_tracks', []) as Track[];
    }

    addOfflineTrack(track: Track): boolean {
        const offline = this.getOfflineTracks();

        // Check if already exists
        if (offline.some((t: Track) => t.id === track.id)) {
            return true;
        }

        offline.push({
            ...track,
            downloadedAt: new Date().toISOString(),
        });

        return this.setItem('offline_tracks', offline);
    }

    removeOfflineTrack(trackId: string): boolean {
        const offline = this.getOfflineTracks();
        const filtered = offline.filter((t: Track) => t.id !== trackId);
        return this.setItem('offline_tracks', filtered);
    }

    // Favorites
    getFavorites(): Track[] {
        return this.getItem<Track[]>('favorites', []) as Track[];
    }

    addToFavorites(track: Track): boolean {
        const favorites = this.getFavorites();

        // Check if already exists
        if (favorites.some((t: Track) => t.id === track.id)) {
            return true;
        }

        favorites.push({
            ...track,
            favoritedAt: new Date().toISOString(),
        });

        return this.setItem('favorites', favorites);
    }

    removeFromFavorites(trackId: string): boolean {
        const favorites = this.getFavorites();
        const filtered = favorites.filter((t: Track) => t.id !== trackId);
        return this.setItem('favorites', filtered);
    }

    isFavorite(trackId: string): boolean {
        const favorites = this.getFavorites();
        return favorites.some((t: Track) => t.id === trackId);
    }

    // Analytics/Stats
    getListeningStats(): ListeningStats {
        return this.getItem<ListeningStats>('listening_stats', {
            totalPlayTime: 0,
            tracksPlayed: 0,
            sessionsCount: 0,
            favoriteGenres: {},
            favoriteArtists: {},
            dailyStats: {},
        }) as ListeningStats;
    }

    updateListeningStats(track: Track, playTime: number): boolean {
        const stats = this.getListeningStats();
        const today = new Date().toISOString().split('T')[0];

        // Update totals
        stats.totalPlayTime += playTime;
        stats.tracksPlayed += 1;

        // Update daily stats
        if (!stats.dailyStats[today]) {
            stats.dailyStats[today] = { playTime: 0, tracks: 0 };
        }
        stats.dailyStats[today].playTime += playTime;
        stats.dailyStats[today].tracks += 1;

        // Update genre stats
        if (track.genre && Array.isArray(track.genre)) {
            track.genre.forEach((genre: string) => {
                stats.favoriteGenres[genre] = (stats.favoriteGenres[genre] || 0) + 1;
            });
        }

        // Update artist stats
        if (track.artist) {
            stats.favoriteArtists[track.artist] = (stats.favoriteArtists[track.artist] || 0) + 1;
        }

        return this.setItem('listening_stats', stats);
    }

    // Session management
    startSession(): boolean {
        const sessionId = Date.now().toString();
        const session: Session = {
            id: sessionId,
            startTime: new Date().toISOString(),
            tracks: [],
            totalPlayTime: 0,
        };

        return this.setItem('current_session', session);
    }

    updateSession(track: Track, playTime: number): boolean {
        const session = this.getItem<Session>('current_session');
        if (!session) return false;

        session.tracks.push({
            ...track,
            playTime,
            playedAt: new Date().toISOString(),
        });
        session.totalPlayTime += playTime;

        return this.setItem('current_session', session);
    }

    endSession(): boolean {
        const session = this.getItem<Session>('current_session');
        if (!session) return false;

        session.endTime = new Date().toISOString();

        // Save to session history
        const history = this.getItem<Session[]>('session_history', []) as Session[];
        history.unshift(session);

        // Keep only last 50 sessions
        const limited = history.slice(0, 50);
        this.setItem('session_history', limited);

        // Update listening stats
        const stats = this.getListeningStats();
        stats.sessionsCount += 1;
        this.setItem('listening_stats', stats);

        // Clear current session
        return this.removeItem('current_session');
    }

    // Data export/import
    exportData() {
        const data = {
            preferences: this.getUserPreferences(),
            playlists: this.getCachedPlaylists(),
            recentlyPlayed: this.getRecentlyPlayed(),
            searchHistory: this.getSearchHistory(),
            favorites: this.getFavorites(),
            stats: this.getListeningStats(),
            sessionHistory: this.getItem<Session[]>('session_history', []) as Session[],
            exportedAt: new Date().toISOString(),
        };

        return data;
    }

    importData(data: any): boolean {
        try {
            if (data.preferences) this.setUserPreferences(data.preferences);
            if (data.playlists) this.setCachedPlaylists(data.playlists);
            if (data.recentlyPlayed) this.setItem('recently_played', data.recentlyPlayed);
            if (data.searchHistory) this.setItem('search_history', data.searchHistory);
            if (data.favorites) this.setItem('favorites', data.favorites);
            if (data.stats) this.setItem('listening_stats', data.stats);
            if (data.sessionHistory) this.setItem('session_history', data.sessionHistory);

            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }

    // Storage usage
    getStorageUsage() {
        if (!this.isLocalStorageAvailable()) return null;

        let totalSize = 0;
        const items: { [key: string]: number } = {};

        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                const size = localStorage.getItem(key)?.length || 0;
                items[key.replace(this.prefix, '')] = size;
                totalSize += size;
            }
        });

        return {
            totalSize,
            items,
            totalSizeFormatted: this.formatBytes(totalSize),
        };
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Singleton instance
export const storageManager = new StorageManager();
