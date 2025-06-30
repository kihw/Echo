/**
 * Cache Manager optimisé multi-niveaux
 * Memory → Storage → IndexedDB → Network
 */

import { IntelligentCache } from '../utils/cache';
import { StorageManager } from './storageManager';

interface CacheConfig {
  defaultTTL: number;
  maxMemorySize: number;
  compressionThreshold: number;
  enableServiceWorker: boolean;
}

export class OptimizedCacheManager {
  private memoryCache: IntelligentCache;
  private storageManager: StorageManager;
  private config: CacheConfig;
  private dbName = 'echo-music-cache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 15 * 60 * 1000, // 15 minutes
      maxMemorySize: 50 * 1024 * 1024, // 50MB
      compressionThreshold: 1024, // 1KB
      enableServiceWorker: 'serviceWorker' in navigator,
      ...config
    };

    this.memoryCache = new IntelligentCache(100);

    this.storageManager = new StorageManager();
    this.initIndexedDB();
  }

  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store pour les données de cache
        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' });
          store.createIndex('expiry', 'expiry', { unique: false });
        }
        
        // Store pour les métadonnées
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  async get<T>(key: string): Promise<T | null> {
    // 1. Memory cache (le plus rapide)
    const memoryResult = this.memoryCache.get<T>(key);
    if (memoryResult !== null) {
      return memoryResult;
    }

    // 2. LocalStorage cache (rapide)
    const storageResult = this.storageManager.getItem<T>(key);
    if (storageResult !== null) {
      // Remettre en memory cache
      this.memoryCache.set(key, storageResult);
      return storageResult;
    }

    // 3. IndexedDB cache (moyen)
    const indexedDBResult = await this.getFromIndexedDB<T>(key);
    if (indexedDBResult !== null) {
      // Remettre dans les caches supérieurs
      this.memoryCache.set(key, indexedDBResult);
      this.storageManager.setItem(key, indexedDBResult);
      return indexedDBResult;
    }

    return null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const expiry = Date.now() + (ttl || this.config.defaultTTL);
    
    // 1. Memory cache
    this.memoryCache.set(key, value, { ttl });
    
    // 2. LocalStorage pour les petites données
    const serialized = JSON.stringify(value);
    if (serialized.length < this.config.compressionThreshold) {
      this.storageManager.setItem(key, value);
    }
    
    // 3. IndexedDB pour les grosses données
    await this.setInIndexedDB(key, value, expiry);
  }

  private async getFromIndexedDB<T>(key: string): Promise<T | null> {
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiry > Date.now()) {
          resolve(result.data);
        } else {
          // Expired, clean up
          if (result) {
            this.deleteFromIndexedDB(key);
          }
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  }

  private async setInIndexedDB<T>(key: string, data: T, expiry: number): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put({ key, data, expiry, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => resolve(); // Fail silently
    });
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    
    // Clear storage
    this.storageManager.clear();
    
    // Clear IndexedDB
    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });
    }
  }

  async cleanup(): Promise<void> {
    // Cleanup expired entries from IndexedDB
    if (!this.db) return;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('expiry');
      const request = index.openCursor(IDBKeyRange.upperBound(Date.now()));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => resolve();
    });
  }

  // Cache avec fetch automatique
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }

  // Statistiques du cache
  getStats() {
    const memoryStats = this.memoryCache.getStats();
    return {
      memorySize: memoryStats.total,
      memoryValid: memoryStats.valid,
      memoryExpired: memoryStats.expired,
      memoryUsage: memoryStats.usage,
      storageUsage: 'Available' // Placeholder
    };
  }
}

// Instance singleton
export const cacheManager = new OptimizedCacheManager();

// Utilities pour le cache spécialisé
export const musicCache = {
  tracks: {
    get: (id: string) => cacheManager.get(`track:${id}`),
    set: (id: string, track: any) => cacheManager.set(`track:${id}`, track, 30 * 60 * 1000) // 30 min
  },
  
  playlists: {
    get: (id: string) => cacheManager.get(`playlist:${id}`),
    set: (id: string, playlist: any) => cacheManager.set(`playlist:${id}`, playlist, 15 * 60 * 1000) // 15 min
  },
  
  recommendations: {
    get: (key: string) => cacheManager.get(`rec:${key}`),
    set: (key: string, recs: any) => cacheManager.set(`rec:${key}`, recs, 60 * 60 * 1000) // 1 hour
  },
  
  search: {
    get: (query: string) => cacheManager.get(`search:${query}`),
    set: (query: string, results: any) => cacheManager.set(`search:${query}`, results, 10 * 60 * 1000) // 10 min
  }
};
