import { useState, useEffect, useCallback } from 'react';
import { ApiError } from '@/types';

interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (_data: any) => void;
  onError?: (_error: ApiError) => void;
}

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  success: boolean;
}

export function useApi<T = any>(
  apiFunction: (..._args: any[]) => Promise<any>,
  options: UseApiOptions = {}
) {
  const { immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
    success: false
  });

  const execute = useCallback(async (...args: any[]) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false
    }));

    try {
      const response = await apiFunction(...args);
      const data = response.data || response;

      setState({
        data,
        loading: false,
        error: null,
        success: true
      });

      if (onSuccess) {
        onSuccess(data);
      }

      return data;
    } catch (error: any) {
      const apiError: ApiError = {
        error: error.response?.data?.error || 'Unknown error',
        message: error.response?.data?.message || error.message || 'An error occurred',
        code: error.response?.data?.code || error.code,
        details: error.response?.data?.details || error.response?.data
      };

      setState({
        data: null,
        loading: false,
        error: apiError,
        success: false
      });

      if (onError) {
        onError(apiError);
      }

      throw apiError;
    }
  }, [apiFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false
    });
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    execute,
    reset
  };
}

// Hook pour les requêtes avec pagination
interface UsePaginatedApiOptions extends UseApiOptions {
  limit?: number;
  initialPage?: number;
}

interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export function usePaginatedApi<T = any>(
  apiFunction: (_page: number, _limit: number, ..._args: any[]) => Promise<any>,
  options: UsePaginatedApiOptions = {}
) {
  const { limit = 20, initialPage = 1, immediate = false, onSuccess, onError } = options;

  const [state, setState] = useState<UseApiState<PaginatedData<T>>>({
    data: null,
    loading: false,
    error: null,
    success: false
  });

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentLimit, setCurrentLimit] = useState(limit);

  const execute = useCallback(async (page?: number, newLimit?: number, ...args: any[]) => {
    const pageToUse = page ?? currentPage;
    const limitToUse = newLimit ?? currentLimit;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false
    }));

    try {
      const response = await apiFunction(pageToUse, limitToUse, ...args);
      const data = response.data || response;

      setState({
        data,
        loading: false,
        error: null,
        success: true
      });

      setCurrentPage(pageToUse);
      setCurrentLimit(limitToUse);

      if (onSuccess) {
        onSuccess(data);
      }

      return data;
    } catch (error: any) {
      const apiError: ApiError = {
        error: error.response?.data?.error || 'Unknown error',
        message: error.response?.data?.message || error.message || 'An error occurred',
        code: error.response?.data?.code || error.code,
        details: error.response?.data?.details || error.response?.data
      };

      setState({
        data: null,
        loading: false,
        error: apiError,
        success: false
      });

      if (onError) {
        onError(apiError);
      }

      throw apiError;
    }
  }, [apiFunction, currentPage, currentLimit, onSuccess, onError]);

  const nextPage = useCallback(() => {
    if (state.data && currentPage < state.data.pagination.pages) {
      execute(currentPage + 1);
    }
  }, [execute, currentPage, state.data]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      execute(currentPage - 1);
    }
  }, [execute, currentPage]);

  const goToPage = useCallback((page: number) => {
    if (state.data && page >= 1 && page <= state.data.pagination.pages) {
      execute(page);
    }
  }, [execute, state.data]);

  const changeLimit = useCallback((newLimit: number) => {
    execute(1, newLimit);
  }, [execute]);

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      success: false
    });
    setCurrentPage(initialPage);
    setCurrentLimit(limit);
  }, [initialPage, limit]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute]);

  return {
    ...state,
    currentPage,
    currentLimit,
    execute,
    nextPage,
    previousPage,
    goToPage,
    changeLimit,
    reset,
    hasNextPage: state.data ? currentPage < state.data.pagination.pages : false,
    hasPreviousPage: currentPage > 1
  };
}

// Hook pour les requêtes avec cache simple
interface UseCachedApiOptions extends UseApiOptions {
  cacheKey: string;
  cacheDuration?: number; // en millisecondes
}

const cache = new Map<string, { data: any; timestamp: number }>();

export function useCachedApi<T = any>(
  apiFunction: (..._args: any[]) => Promise<any>,
  options: UseCachedApiOptions
) {
  const { cacheKey, cacheDuration = 5 * 60 * 1000, ...apiOptions } = options; // 5 minutes par défaut

  const getCachedData = useCallback(() => {
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cacheDuration) {
      return cached.data;
    }
    return null;
  }, [cacheKey, cacheDuration]);

  const setCachedData = useCallback((data: any) => {
    cache.set(cacheKey, { data, timestamp: Date.now() });
  }, [cacheKey]);

  const api = useApi<T>(apiFunction, {
    ...apiOptions,
    onSuccess: (data) => {
      setCachedData(data);
      if (apiOptions.onSuccess) {
        apiOptions.onSuccess(data);
      }
    }
  });

  const executeWithCache = useCallback(async (...args: any[]) => {
    const cachedData = getCachedData();
    if (cachedData) {
      // Retourner les données en cache
      api.reset();
      // Simuler l'état de succès avec les données en cache
      return cachedData;
    }
    // Exécuter la requête API
    return api.execute(...args);
  }, [api, getCachedData]);

  const clearCache = useCallback(() => {
    cache.delete(cacheKey);
  }, [cacheKey]);

  // Vérifier le cache au montage
  useEffect(() => {
    const cachedData = getCachedData();
    if (cachedData && apiOptions.immediate) {
      // Utiliser les données en cache
      api.reset();
    }
  }, [getCachedData, apiOptions.immediate, api]);

  return {
    ...api,
    execute: executeWithCache,
    clearCache,
    isCached: !!getCachedData()
  };
}

// Hook pour les requêtes avec retry automatique
interface UseRetryApiOptions extends UseApiOptions {
  maxRetries?: number;
  retryDelay?: number;
  shouldRetry?: (_error: ApiError) => boolean;
}

export function useRetryApi<T = any>(
  apiFunction: (..._args: any[]) => Promise<any>,
  options: UseRetryApiOptions = {}
) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    shouldRetry = (error) => error.code !== 'UNAUTHORIZED',
    ...apiOptions
  } = options;

  const [retryCount, setRetryCount] = useState(0);

  const api = useApi<T>(apiFunction, apiOptions);

  const executeWithRetry = useCallback(async (...args: any[]) => {
    let currentRetry = 0;

    while (currentRetry <= maxRetries) {
      try {
        setRetryCount(currentRetry);
        const result = await api.execute(...args);
        setRetryCount(0); // Reset on success
        return result;
      } catch (error: any) {
        currentRetry++;

        if (currentRetry > maxRetries || !shouldRetry(error)) {
          setRetryCount(0);
          throw error;
        }

        // Attendre avant de réessayer
        const delay = retryDelay * currentRetry;
        // eslint-disable-next-line no-await-in-loop
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, [api, maxRetries, retryDelay, shouldRetry]);

  return {
    ...api,
    execute: executeWithRetry,
    retryCount,
    isRetrying: retryCount > 0
  };
}

export default useApi;
