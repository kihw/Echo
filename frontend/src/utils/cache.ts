/**
 * Intelligent cache utility for Echo Music Player
 * Provides memory-based caching with TTL (Time To Live) support
 */

interface CacheItem<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

interface CacheOptions {
    ttl?: number; // Time to live in milliseconds
    maxSize?: number; // Maximum number of items in cache
}

class IntelligentCache {
    private cache = new Map<string, CacheItem<any>>();
    private accessTimes = new Map<string, number>();
    private maxSize: number;

    constructor(maxSize: number = 100) {
        this.maxSize = maxSize;
    }

    /**
     * Set a value in the cache with optional TTL
     */
    set<T>(key: string, value: T, options: CacheOptions = {}): void {
        const ttl = options.ttl || 5 * 60 * 1000; // Default 5 minutes
        const timestamp = Date.now();

        // Remove oldest items if cache is full
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            data: value,
            timestamp,
            ttl
        });

        this.accessTimes.set(key, timestamp);
    }

    /**
     * Get a value from the cache
     */
    get<T>(key: string): T | null {
        const item = this.cache.get(key);

        if (!item) {
            return null;
        }

        // Check if item has expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.delete(key);
            return null;
        }

        // Update access time for LRU
        this.accessTimes.set(key, Date.now());

        return item.data as T;
    }

    /**
     * Check if a key exists and is not expired
     */
    has(key: string): boolean {
        const item = this.cache.get(key);

        if (!item) {
            return false;
        }

        // Check if expired
        if (Date.now() - item.timestamp > item.ttl) {
            this.delete(key);
            return false;
        }

        return true;
    }

    /**
     * Delete a key from the cache
     */
    delete(key: string): boolean {
        this.accessTimes.delete(key);
        return this.cache.delete(key);
    }

    /**
     * Clear all cached data
     */
    clear(): void {
        this.cache.clear();
        this.accessTimes.clear();
    }

    /**
     * Get cache statistics
     */
    getStats() {
        const now = Date.now();
        let expired = 0;
        let valid = 0;

        this.cache.forEach((item) => {
            if (now - item.timestamp > item.ttl) {
                expired++;
            } else {
                valid++;
            }
        });

        return {
            total: this.cache.size,
            valid,
            expired,
            maxSize: this.maxSize,
            usage: Math.round((this.cache.size / this.maxSize) * 100)
        };
    }

    /**
     * Remove expired items from cache
     */
    cleanup(): number {
        const now = Date.now();
        let removed = 0;
        const keysToRemove: string[] = [];

        this.cache.forEach((item, key) => {
            if (now - item.timestamp > item.ttl) {
                keysToRemove.push(key);
            }
        });

        keysToRemove.forEach(key => {
            this.delete(key);
            removed++;
        });

        return removed;
    }

    /**
     * Evict the oldest accessed item (LRU)
     */
    private evictOldest(): void {
        let oldestKey: string | null = null;
        let oldestTime = Date.now();

        this.accessTimes.forEach((accessTime, key) => {
            if (accessTime < oldestTime) {
                oldestTime = accessTime;
                oldestKey = key;
            }
        });

        if (oldestKey) {
            this.delete(oldestKey);
        }
    }

    /**
     * Get or set cached data with a provider function
     */
    async getOrSet<T>(
        key: string,
        provider: () => Promise<T>,
        options: CacheOptions = {}
    ): Promise<T> {
        const cached = this.get<T>(key);

        if (cached !== null) {
            return cached;
        }

        try {
            const data = await provider();
            this.set(key, data, options);
            return data;
        } catch (error) {
            // Don't cache errors
            throw error;
        }
    }
}

// Create cache instances for different data types
export const dashboardCache = new IntelligentCache(50);
export const playlistCache = new IntelligentCache(100);
export const searchCache = new IntelligentCache(200);
export const userCache = new IntelligentCache(20);

// Cache keys constants
export const CACHE_KEYS = {
    DASHBOARD_DATA: 'dashboard_data',
    DASHBOARD_STATS: 'dashboard_stats',
    USER_PLAYLISTS: (userId: string) => `user_playlists_${userId}`,
    PLAYLIST_DETAIL: (playlistId: string) => `playlist_${playlistId}`,
    SEARCH_RESULTS: (query: string, filters?: string) => `search_${query}_${filters || 'all'}`,
    TOP_TRACKS: (period: string) => `top_tracks_${period}`,
    TOP_ARTISTS: (period: string) => `top_artists_${period}`,
    USER_PROFILE: (userId: string) => `user_profile_${userId}`,
    LISTENING_HISTORY: (userId: string, limit: number) => `listening_history_${userId}_${limit}`
} as const;

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
    DASHBOARD: 2 * 60 * 1000,      // 2 minutes
    PLAYLISTS: 5 * 60 * 1000,      // 5 minutes
    SEARCH: 10 * 60 * 1000,        // 10 minutes
    USER_DATA: 15 * 60 * 1000,     // 15 minutes
    STATISTICS: 1 * 60 * 1000,     // 1 minute
    LONG_TERM: 60 * 60 * 1000      // 1 hour
} as const;

// Auto cleanup every 5 minutes
setInterval(() => {
    dashboardCache.cleanup();
    playlistCache.cleanup();
    searchCache.cleanup();
    userCache.cleanup();
}, 5 * 60 * 1000);

export { IntelligentCache };
