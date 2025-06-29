'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/utils/debounce';
import { searchCache, CACHE_KEYS, CACHE_TTL } from '@/utils/cache';
import { api } from '@/services/api';
import { toast } from 'react-hot-toast';

export interface SearchResult {
    id: string;
    type: 'track' | 'artist' | 'album' | 'playlist';
    title: string;
    subtitle: string;
    image?: string;
    metadata?: Record<string, any>;
}

export interface SearchFilters {
    type?: 'all' | 'track' | 'artist' | 'album' | 'playlist';
    service?: 'all' | 'spotify' | 'deezer' | 'youtube';
    duration?: {
        min?: number;
        max?: number;
    };
    year?: {
        min?: number;
        max?: number;
    };
}

interface UseSearchOptions {
    debounceMs?: number;
    minQueryLength?: number;
    autoSearch?: boolean;
}

interface UseSearchReturn {
    query: string;
    results: SearchResult[];
    loading: boolean;
    error: string | null;
    filters: SearchFilters;
    hasMore: boolean;
    totalResults: number;
    setQuery: (query: string) => void;
    setFilters: (filters: SearchFilters) => void;
    search: (force?: boolean) => Promise<void>;
    loadMore: () => Promise<void>;
    clearResults: () => void;
    clearCache: () => void;
}

export function useSearch(options: UseSearchOptions = {}): UseSearchReturn {
    const {
        debounceMs = 300,
        minQueryLength = 2,
        autoSearch = true
    } = options;

    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({ type: 'all', service: 'all' });
    const [hasMore, setHasMore] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);

    const debouncedQuery = useDebounce(query, debounceMs);

    const buildCacheKey = useCallback((searchQuery: string, searchFilters: SearchFilters, page: number = 1) => {
        const filterString = Object.entries(searchFilters)
            .filter(([_, value]) => value && value !== 'all')
            .map(([key, value]) => `${key}:${JSON.stringify(value)}`)
            .join('|');
        return `${CACHE_KEYS.SEARCH_RESULTS(searchQuery, filterString)}_page_${page}`;
    }, []);

    const performSearch = useCallback(async (
        searchQuery: string,
        searchFilters: SearchFilters,
        page: number = 1,
        force: boolean = false
    ): Promise<{ results: SearchResult[]; total: number; hasMore: boolean }> => {
        const cacheKey = buildCacheKey(searchQuery, searchFilters, page);

        if (!force) {
            const cached = searchCache.get<{ results: SearchResult[]; total: number; hasMore: boolean }>(cacheKey);
            if (cached) {
                return cached;
            }
        }

        try {
            const params = new URLSearchParams({
                q: searchQuery,
                page: page.toString(),
                limit: '20'
            });

            // Add filters to params
            if (searchFilters.type && searchFilters.type !== 'all') {
                params.append('type', searchFilters.type);
            }
            if (searchFilters.service && searchFilters.service !== 'all') {
                params.append('service', searchFilters.service);
            }
            if (searchFilters.duration?.min) {
                params.append('duration_min', searchFilters.duration.min.toString());
            }
            if (searchFilters.duration?.max) {
                params.append('duration_max', searchFilters.duration.max.toString());
            }
            if (searchFilters.year?.min) {
                params.append('year_min', searchFilters.year.min.toString());
            }
            if (searchFilters.year?.max) {
                params.append('year_max', searchFilters.year.max.toString());
            }

            const response = await api.get(`/search?${params.toString()}`);
            const data = response.data;

            const searchResult = {
                results: data.results || [],
                total: data.total || 0,
                hasMore: data.hasMore || false
            };

            // Cache the result
            searchCache.set(cacheKey, searchResult, { ttl: CACHE_TTL.SEARCH });

            return searchResult;
        } catch (error) {
            console.error('Search error:', error);
            throw error;
        }
    }, [buildCacheKey]);

    const search = useCallback(async (force: boolean = false) => {
        if (!debouncedQuery.trim() || debouncedQuery.length < minQueryLength) {
            setResults([]);
            setTotalResults(0);
            setHasMore(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const searchResult = await performSearch(debouncedQuery, filters, 1, force);
            setResults(searchResult.results);
            setTotalResults(searchResult.total);
            setHasMore(searchResult.hasMore);
            setCurrentPage(1);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la recherche';
            setError(errorMessage);
            toast.error('Erreur lors de la recherche');
            setResults([]);
            setTotalResults(0);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    }, [debouncedQuery, filters, minQueryLength, performSearch]);

    const loadMore = useCallback(async () => {
        if (!hasMore || loading || !debouncedQuery.trim()) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const nextPage = currentPage + 1;
            const searchResult = await performSearch(debouncedQuery, filters, nextPage);

            setResults(prev => [...prev, ...searchResult.results]);
            setHasMore(searchResult.hasMore);
            setCurrentPage(nextPage);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement';
            setError(errorMessage);
            toast.error('Erreur lors du chargement de plus de résultats');
        } finally {
            setLoading(false);
        }
    }, [hasMore, loading, debouncedQuery, currentPage, filters, performSearch]);

    const clearResults = useCallback(() => {
        setQuery('');
        setResults([]);
        setTotalResults(0);
        setHasMore(false);
        setCurrentPage(1);
        setError(null);
    }, []);

    const clearCache = useCallback(() => {
        searchCache.clear();
    }, []);

    // Auto search when debounced query or filters change
    useEffect(() => {
        if (autoSearch) {
            search();
        }
    }, [debouncedQuery, filters, autoSearch, search]);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
        if (autoSearch && debouncedQuery.trim() && debouncedQuery.length >= minQueryLength) {
            search();
        }
    }, [filters, autoSearch, debouncedQuery, minQueryLength, search]);

    return {
        query,
        results,
        loading,
        error,
        filters,
        hasMore,
        totalResults,
        setQuery,
        setFilters,
        search,
        loadMore,
        clearResults,
        clearCache
    };
}
