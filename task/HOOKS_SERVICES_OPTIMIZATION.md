# ⚙️ OPTIMISATION HOOKS & SERVICES - Amélioration Architecture

## 📋 Vue d'Ensemble

Optimiser l'architecture des hooks, services et gestion d'état dans Echo Music Player pour améliorer les performances, la maintenabilité et la robustesse du code. Focus sur la gestion d'état, le typage TypeScript et la gestion d'erreurs.

## 🎯 Objectifs d'Optimisation

- [ ] Hooks performants avec gestion d'état optimisée
- [ ] Services robustes avec gestion d'erreur avancée
- [ ] Typage TypeScript strict et complet
- [ ] Architecture modulaire et testable
- [ ] Gestion des side effects maîtrisée
- [ ] Memory leaks prevention

---

## 🔧 Optimisations Hooks

### 1. 🎵 usePlayer Hook Optimization

#### 1.1 State Management Optimization
**Priorité: HAUTE**

- [ ] **Reducer Pattern Implementation**
  ```typescript
  // hooks/usePlayer/playerReducer.ts
  interface PlayerState {
    currentTrack: Track | null;
    queue: Track[];
    currentIndex: number;
    isPlaying: boolean;
    volume: number;
    duration: number;
    currentTime: number;
    repeatMode: RepeatMode;
    shuffleEnabled: boolean;
    loading: boolean;
    error: string | null;
  }
  
  type PlayerAction =
    | { type: 'PLAY_TRACK'; payload: Track }
    | { type: 'PAUSE' }
    | { type: 'RESUME' }
    | { type: 'NEXT_TRACK' }
    | { type: 'PREVIOUS_TRACK' }
    | { type: 'SET_VOLUME'; payload: number }
    | { type: 'SET_PROGRESS'; payload: number }
    | { type: 'SET_QUEUE'; payload: Track[] }
    | { type: 'TOGGLE_SHUFFLE' }
    | { type: 'SET_REPEAT_MODE'; payload: RepeatMode }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null };
  
  const playerReducer = (state: PlayerState, action: PlayerAction): PlayerState => {
    switch (action.type) {
      case 'PLAY_TRACK':
        return {
          ...state,
          currentTrack: action.payload,
          isPlaying: true,
          loading: false,
          error: null
        };
      
      case 'SET_QUEUE':
        return {
          ...state,
          queue: action.payload,
          currentIndex: 0
        };
      
      // ... autres cases
      
      default:
        return state;
    }
  };
  ```

- [ ] **Optimized usePlayer Hook**
  ```typescript
  // hooks/usePlayer.ts
  export const usePlayer = () => {
    const [state, dispatch] = useReducer(playerReducer, initialPlayerState);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressIntervalRef = useRef<NodeJS.Timeout>();
    
    // Memoized actions
    const actions = useMemo(() => ({
      playTrack: (track: Track) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'PLAY_TRACK', payload: track });
      },
      
      pause: () => dispatch({ type: 'PAUSE' }),
      resume: () => dispatch({ type: 'RESUME' }),
      
      nextTrack: () => {
        const nextIndex = (state.currentIndex + 1) % state.queue.length;
        if (state.queue[nextIndex]) {
          dispatch({ type: 'PLAY_TRACK', payload: state.queue[nextIndex] });
        }
      },
      
      setVolume: useCallback((volume: number) => {
        dispatch({ type: 'SET_VOLUME', payload: volume });
        if (audioRef.current) {
          audioRef.current.volume = volume;
        }
      }, []),
      
      setQueue: useCallback((queue: Track[]) => {
        dispatch({ type: 'SET_QUEUE', payload: queue });
      }, [])
    }), [state.currentIndex, state.queue]);
    
    // Audio element management
    useEffect(() => {
      if (!audioRef.current) {
        audioRef.current = new Audio();
        
        const audio = audioRef.current;
        
        audio.addEventListener('loadstart', () => 
          dispatch({ type: 'SET_LOADING', payload: true })
        );
        
        audio.addEventListener('canplay', () => 
          dispatch({ type: 'SET_LOADING', payload: false })
        );
        
        audio.addEventListener('error', (e) => 
          dispatch({ type: 'SET_ERROR', payload: 'Failed to load audio' })
        );
        
        audio.addEventListener('ended', () => {
          actions.nextTrack();
        });
      }
      
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = '';
        }
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
      };
    }, []);
    
    return {
      ...state,
      ...actions
    };
  };
  ```

### 2. 🔄 useSync Hook Optimization

#### 2.1 Error Handling Enhancement
- [ ] **Robust Error Management**
  ```typescript
  // hooks/useSync/types.ts
  interface SyncError {
    code: string;
    message: string;
    service?: string;
    timestamp: Date;
    retryable: boolean;
  }
  
  interface SyncState {
    status: SyncStatus;
    progress: number;
    errors: SyncError[];
    history: SyncHistoryItem[];
    conflicts: SyncConflict[];
    isLoading: boolean;
    lastSync: Date | null;
  }
  ```

- [ ] **Enhanced useSync Hook**
  ```typescript
  export const useSync = (userId: string) => {
    const [state, setState] = useState<SyncState>(initialSyncState);
    const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
    
    const addError = useCallback((error: SyncError) => {
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, error]
      }));
      
      // Auto-retry for retryable errors
      if (error.retryable && error.service) {
        const timeoutId = setTimeout(() => {
          syncService(error.service!);
        }, getRetryDelay(error.code));
        
        retryTimeouts.current.set(error.service, timeoutId);
      }
    }, []);
    
    const clearErrors = useCallback(() => {
      setState(prev => ({ ...prev, errors: [] }));
      retryTimeouts.current.forEach(timeout => clearTimeout(timeout));
      retryTimeouts.current.clear();
    }, []);
    
    const syncService = useCallback(async (service: string) => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        
        const result = await syncServiceAPI.sync(userId, service);
        
        setState(prev => ({
          ...prev,
          status: result.status,
          progress: result.progress,
          lastSync: new Date(),
          isLoading: false
        }));
        
      } catch (error) {
        const syncError: SyncError = {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Sync failed',
          service,
          timestamp: new Date(),
          retryable: isRetryableError(error)
        };
        
        addError(syncError);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    }, [userId, addError]);
    
    return {
      ...state,
      syncService,
      clearErrors,
      retryFailedSync: (service: string) => syncService(service)
    };
  };
  ```

### 3. 🎯 useRecommendations Hook Optimization

#### 3.1 Caching and Performance
- [ ] **Intelligent Caching Strategy**
  ```typescript
  export const useRecommendations = (userId: string) => {
    const [recommendations, setRecommendations] = useState<Track[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const cacheKey = useMemo(() => 
      `recommendations_${userId}_${Date.now() - (Date.now() % 300000)}`, // 5min cache
      [userId]
    );
    
    const fetchRecommendations = useCallback(async (force = false) => {
      if (!force) {
        const cached = recommendationCache.get<Track[]>(cacheKey);
        if (cached) {
          setRecommendations(cached);
          return;
        }
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await recommendationService.getRecommendations(userId);
        setRecommendations(data);
        recommendationCache.set(cacheKey, data, { ttl: 300000 }); // 5min TTL
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
      } finally {
        setLoading(false);
      }
    }, [userId, cacheKey]);
    
    // Auto-refresh on user activity
    const lastActivity = useUserActivity();
    useEffect(() => {
      if (lastActivity && Date.now() - lastActivity > 600000) { // 10min
        fetchRecommendations(true);
      }
    }, [lastActivity, fetchRecommendations]);
    
    return {
      recommendations,
      loading,
      error,
      refreshRecommendations: () => fetchRecommendations(true)
    };
  };
  ```

---

## 🛠️ Services Optimization

### 1. 🎵 Audio Service Enhancement

#### 1.1 Advanced Audio Engine
- [ ] **Robust Audio Management**
  ```typescript
  // services/audioEngine.ts
  export class AudioEngine extends EventEmitter {
    private audioContext: AudioContext | null = null;
    private gainNode: GainNode | null = null;
    private crossfadeNode: GainNode | null = null;
    private analyserNode: AnalyserNode | null = null;
    
    constructor() {
      super();
      this.initializeAudioContext();
    }
    
    private async initializeAudioContext() {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.crossfadeNode = this.audioContext.createGain();
        this.analyserNode = this.audioContext.createAnalyser();
        
        // Connect nodes
        this.gainNode.connect(this.crossfadeNode);
        this.crossfadeNode.connect(this.analyserNode);
        this.analyserNode.connect(this.audioContext.destination);
        
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
        this.emit('error', error);
      }
    }
    
    async playTrack(track: Track): Promise<void> {
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }
      
      try {
        const audioBuffer = await this.loadAudioBuffer(track.url);
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.gainNode!);
        
        source.start();
        this.emit('play', track);
        
      } catch (error) {
        this.emit('error', error);
        throw error;
      }
    }
    
    private async loadAudioBuffer(url: string): Promise<AudioBuffer> {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      return this.audioContext!.decodeAudioData(arrayBuffer);
    }
    
    crossfade(fromTrack: Track, toTrack: Track, duration: number = 3000): Promise<void> {
      return new Promise((resolve) => {
        const startTime = this.audioContext!.currentTime;
        const endTime = startTime + (duration / 1000);
        
        // Fade out current track
        this.gainNode!.gain.setValueAtTime(1, startTime);
        this.gainNode!.gain.exponentialRampToValueAtTime(0.01, endTime);
        
        // Start new track with fade in
        setTimeout(() => {
          this.playTrack(toTrack);
          this.gainNode!.gain.setValueAtTime(0.01, this.audioContext!.currentTime);
          this.gainNode!.gain.exponentialRampToValueAtTime(1, this.audioContext!.currentTime + (duration / 1000));
          resolve();
        }, duration / 2);
      });
    }
  }
  ```

### 2. 🔄 Sync Service Enhancement

#### 2.1 Queue Management System
- [ ] **Advanced Sync Queue**
  ```typescript
  // services/syncQueue.ts
  interface SyncJob {
    id: string;
    type: 'playlist' | 'favorites' | 'library';
    service: string;
    userId: string;
    priority: number;
    retryCount: number;
    maxRetries: number;
    data: any;
    createdAt: Date;
    scheduledAt: Date;
  }
  
  export class SyncQueue {
    private queue: SyncJob[] = [];
    private processing: Set<string> = new Set();
    private maxConcurrent = 3;
    
    addJob(job: Omit<SyncJob, 'id' | 'createdAt' | 'retryCount'>): string {
      const syncJob: SyncJob = {
        ...job,
        id: generateId(),
        createdAt: new Date(),
        retryCount: 0
      };
      
      // Insert by priority
      const insertIndex = this.queue.findIndex(j => j.priority < syncJob.priority);
      if (insertIndex === -1) {
        this.queue.push(syncJob);
      } else {
        this.queue.splice(insertIndex, 0, syncJob);
      }
      
      this.processQueue();
      return syncJob.id;
    }
    
    private async processQueue() {
      if (this.processing.size >= this.maxConcurrent) return;
      
      const job = this.queue.find(j => 
        !this.processing.has(j.id) && 
        j.scheduledAt <= new Date()
      );
      
      if (!job) return;
      
      this.processing.add(job.id);
      
      try {
        await this.executeJob(job);
        this.removeJob(job.id);
      } catch (error) {
        await this.handleJobError(job, error);
      } finally {
        this.processing.delete(job.id);
        this.processQueue(); // Process next job
      }
    }
    
    private async handleJobError(job: SyncJob, error: any) {
      job.retryCount++;
      
      if (job.retryCount >= job.maxRetries) {
        this.removeJob(job.id);
        this.emit('jobFailed', { job, error });
        return;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, job.retryCount) * 1000;
      job.scheduledAt = new Date(Date.now() + delay);
      
      this.emit('jobRetry', { job, error, delay });
    }
  }
  ```

### 3. 💾 Storage Service Enhancement

#### 3.1 Advanced Storage Management
- [ ] **Quota Management**
  ```typescript
  // services/storageService.ts
  export class StorageService {
    private maxQuota = 50 * 1024 * 1024; // 50MB
    private warningThreshold = 0.8; // 80%
    
    async checkQuota(): Promise<StorageQuota> {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          available: estimate.quota || this.maxQuota,
          percentage: (estimate.usage || 0) / (estimate.quota || this.maxQuota)
        };
      }
      
      // Fallback for browsers without storage API
      return this.estimateLocalStorageUsage();
    }
    
    async setItem<T>(key: string, value: T): Promise<boolean> {
      try {
        const quota = await this.checkQuota();
        
        if (quota.percentage > this.warningThreshold) {
          await this.cleanup();
        }
        
        const serialized = JSON.stringify({
          data: value,
          timestamp: Date.now(),
          size: new Blob([JSON.stringify(value)]).size
        });
        
        localStorage.setItem(key, serialized);
        return true;
        
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          await this.cleanup();
          // Retry once after cleanup
          try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
          } catch {
            return false;
          }
        }
        return false;
      }
    }
    
    private async cleanup(): Promise<void> {
      const items = this.getAllItems();
      
      // Sort by last access time and size
      const sortedItems = items.sort((a, b) => {
        const aScore = (Date.now() - a.timestamp) / a.size;
        const bScore = (Date.now() - b.timestamp) / b.size;
        return bScore - aScore;
      });
      
      // Remove oldest/largest items until under threshold
      let removedSize = 0;
      const quota = await this.checkQuota();
      const targetSize = quota.used * 0.7; // Target 70% usage
      
      for (const item of sortedItems) {
        if (quota.used - removedSize <= targetSize) break;
        
        localStorage.removeItem(item.key);
        removedSize += item.size;
      }
    }
  }
  ```

---

## 🔍 TypeScript Optimization

### 1. 🎯 Strict Type Definitions

#### 1.1 Enhanced Type Safety
- [ ] **Comprehensive Type Definitions**
  ```typescript
  // types/api.ts
  export interface APIResponse<T = any> {
    data: T;
    success: boolean;
    message?: string;
    errors?: string[];
    metadata?: {
      total?: number;
      page?: number;
      limit?: number;
      hasMore?: boolean;
    };
  }
  
  export interface APIError {
    code: string;
    message: string;
    details?: Record<string, any>;
    field?: string;
  }
  
  // Generic API client types
  export type APIMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  
  export interface APIRequestConfig {
    method: APIMethod;
    url: string;
    data?: any;
    params?: Record<string, any>;
    headers?: Record<string, string>;
    timeout?: number;
    retries?: number;
  }
  ```

- [ ] **Hook Type Safety**
  ```typescript
  // types/hooks.ts
  export interface UseAsyncState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
  }
  
  export interface UseAsyncActions<T> {
    execute: (...args: any[]) => Promise<T>;
    reset: () => void;
    setData: (data: T) => void;
    setError: (error: string) => void;
  }
  
  export type UseAsyncReturn<T> = UseAsyncState<T> & UseAsyncActions<T>;
  
  // Generic async hook
  export function useAsync<T, Args extends any[]>(
    asyncFunction: (...args: Args) => Promise<T>
  ): UseAsyncReturn<T> {
    // Implementation with full type safety
  }
  ```

### 2. 🛡️ Runtime Type Validation

#### 2.1 Zod Integration
- [ ] **Schema Validation**
  ```typescript
  // schemas/track.ts
  import { z } from 'zod';
  
  export const TrackSchema = z.object({
    id: z.string(),
    title: z.string().min(1),
    artist: z.string().min(1),
    album: z.string().optional(),
    duration: z.number().positive(),
    url: z.string().url(),
    artwork: z.string().url().optional(),
    service: z.enum(['spotify', 'deezer', 'ytmusic']),
    externalId: z.string(),
    isLiked: z.boolean().default(false),
    addedAt: z.date().default(() => new Date())
  });
  
  export type Track = z.infer<typeof TrackSchema>;
  
  // Validation hook
  export const useValidatedData = <T>(
    data: unknown,
    schema: z.ZodSchema<T>
  ): { data: T | null; error: string | null } => {
    return useMemo(() => {
      try {
        const validated = schema.parse(data);
        return { data: validated, error: null };
      } catch (error) {
        return { 
          data: null, 
          error: error instanceof z.ZodError 
            ? error.errors.map(e => e.message).join(', ')
            : 'Validation failed'
        };
      }
    }, [data, schema]);
  };
  ```

---

## 🧪 Testing Optimization

### 1. 🔧 Hook Testing
```typescript
// tests/hooks/usePlayer.test.ts
describe('usePlayer Hook', () => {
  it('should manage player state correctly', () => {
    const { result } = renderHook(() => usePlayer());
    
    expect(result.current.currentTrack).toBeNull();
    expect(result.current.isPlaying).toBe(false);
    
    act(() => {
      result.current.playTrack(mockTrack);
    });
    
    expect(result.current.currentTrack).toEqual(mockTrack);
    expect(result.current.isPlaying).toBe(true);
  });
  
  it('should handle queue management', () => {
    const { result } = renderHook(() => usePlayer());
    
    act(() => {
      result.current.setQueue([mockTrack1, mockTrack2]);
    });
    
    expect(result.current.queue).toHaveLength(2);
    
    act(() => {
      result.current.nextTrack();
    });
    
    expect(result.current.currentIndex).toBe(1);
  });
});
```

### 2. 🎯 Service Testing
```typescript
// tests/services/syncService.test.ts
describe('SyncService', () => {
  let syncService: SyncService;
  
  beforeEach(() => {
    syncService = new SyncService();
  });
  
  it('should handle sync errors gracefully', async () => {
    const mockError = new Error('Network error');
    jest.spyOn(api, 'post').mockRejectedValue(mockError);
    
    const result = await syncService.syncPlaylists('user1');
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Network error');
  });
  
  it('should retry failed requests', async () => {
    const mockApi = jest.spyOn(api, 'post')
      .mockRejectedValueOnce(new Error('Temporary error'))
      .mockResolvedValueOnce({ data: { success: true } });
    
    await syncService.syncPlaylists('user1');
    
    expect(mockApi).toHaveBeenCalledTimes(2);
  });
});
```

---

## 📊 Performance Metrics

### Hook Performance
- [ ] **Render Count** - Minimized unnecessary re-renders
- [ ] **Memory Usage** - No memory leaks in hooks
- [ ] **Computation Time** - Expensive operations memoized
- [ ] **Effect Dependencies** - Optimized dependency arrays

### Service Performance
- [ ] **API Response Time** - < 200ms average
- [ ] **Error Rate** - < 2% for all services
- [ ] **Retry Success Rate** - > 90% for retryable errors
- [ ] **Memory Consumption** - Stable over time

---

## 🎯 Plan d'Implémentation

### Phase 1: Hook Optimization
1. Refactorisation usePlayer avec reducer
2. Amélioration gestion d'erreur useSync
3. Cache optimization useRecommendations

### Phase 2: Service Enhancement
1. Audio engine avec Web Audio API
2. Sync queue management
3. Storage quota management

### Phase 3: Type Safety
1. Strict TypeScript configuration
2. Zod schema validation
3. Runtime type checking

### Phase 4: Testing & Monitoring
1. Comprehensive hook testing
2. Service integration tests
3. Performance monitoring

---

## ✅ Critères de Succès

- ✅ Hooks performants (< 16ms render time)
- ✅ Services robustes (< 2% error rate)
- ✅ Type safety 100% (no any types)
- ✅ Memory leaks eliminated
- ✅ Test coverage > 90%
- ✅ Code maintainability score > 85

---

*Dernière mise à jour: ${new Date().toLocaleDateString('fr-FR')}*
