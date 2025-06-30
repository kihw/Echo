/**
 * Hooks d'optimisation des performances pour React
 * Debounce, throttle, memoization, virtual scrolling
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { debounce, throttle } from '../utils/debounce';
import { log } from '@/services/logger';

// Hook pour les requêtes API optimisées avec debounce
export function useOptimizedSearch(
  searchFn: (query: string) => Promise<any>,
  delay: number = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const searchResults = await searchFn(searchQuery);
        setResults(searchResults);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de recherche');
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, delay),
    [searchFn, delay]
  );

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearResults: () => setResults([])
  };
}

// Hook pour la memoization intelligente avec invalidation
export function useSmartMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual?: (a: T, b: T) => boolean
): T {
  const ref = useRef<{ deps: React.DependencyList; value: T }>();

  const depsChanged = !ref.current || 
    deps.length !== ref.current.deps.length ||
    deps.some((dep, i) => dep !== ref.current!.deps[i]);

  if (depsChanged) {
    const newValue = factory();
    
    // Custom equality check if provided
    if (ref.current && isEqual && !isEqual(ref.current.value, newValue)) {
      ref.current = { deps, value: newValue };
    } else if (!ref.current) {
      ref.current = { deps, value: newValue };
    }
  }

  return ref.current!.value;
}

// Hook pour le scroll virtuel (grandes listes)
export function useVirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

  const visibleItems = useMemo(() => 
    items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    })),
    [items, startIndex, endIndex]
  );

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  return {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll: (event: React.UIEvent<HTMLDivElement>) => {
      setScrollTop(event.currentTarget.scrollTop);
    }
  };
}

// Hook pour les images lazy loading avec Intersection Observer
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let observer: IntersectionObserver;
    
    if (imgRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.onload = () => {
              setImageSrc(src);
              setLoading(false);
            };
            img.onerror = () => {
              setError(true);
              setLoading(false);
            };
            img.src = src;
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );
      
      observer.observe(imgRef.current);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [src]);

  return {
    ref: imgRef,
    src: imageSrc,
    loading,
    error
  };
}

// Hook pour gérer les états de loading avec timeout
export function useLoadingState(defaultLoading = false, timeout = 10000) {
  const [loading, setLoading] = useState(defaultLoading);
  const [timeoutError, setTimeoutError] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const startLoading = useCallback(() => {
    setLoading(true);
    setTimeoutError(false);
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Set timeout
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      setTimeoutError(true);
    }, timeout);
  }, [timeout]);

  const stopLoading = useCallback(() => {
    setLoading(false);
    setTimeoutError(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    loading,
    timeoutError,
    startLoading,
    stopLoading
  };
}

// Hook pour le prefetching de données
export function usePrefetch<T>(
  prefetchFn: () => Promise<T>,
  deps: React.DependencyList,
  delay = 1000
) {
  const [prefetchedData, setPrefetchedData] = useState<T | null>(null);
  const [prefetching, setPrefetching] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        setPrefetching(true);
        const data = await prefetchFn();
        setPrefetchedData(data);
      } catch (error) {
        // Silently fail prefetch
        log.debug('Prefetch failed:', error);
      } finally {
        setPrefetching(false);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [prefetchFn, delay, ...deps]);

  return {
    prefetchedData,
    prefetching
  };
}

// Hook pour monitorer les performances
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    
    const renderTime = performance.now() - startTime.current;
    
    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      log.debug(`[Performance] ${componentName}:`, {
        renderCount: renderCount.current,
        renderTime: `${renderTime.toFixed(2)}ms`
      });
    }

    startTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current
  };
}

// Hook pour throttler les événements de scroll/resize
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttledCallback = useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  );

  return throttledCallback as T;
}
