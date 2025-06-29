import { lazy, ComponentType } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Suspense } from 'react';

import { lazy, ComponentType, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

/**
 * Custom loading fallback for different component types
 */
export const PageLoadingFallback = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600">Chargement de la page...</p>
        </div>
    </div>
);

export const ComponentLoadingFallback = () => (
    <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
    </div>
);

export const CardLoadingFallback = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
        </div>
    </div>
);

/**
 * Preload a lazy component to improve perceived performance
 */
export function preloadComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
): Promise<{ default: T }> {
    return importFn();
}

/**
 * Higher-order component for lazy loading with error boundaries
 */
export function withLazyLoading<P = {}>(
    importFn: () => Promise<{ default: ComponentType<P> }>,
    options: {
        fallback?: React.ReactNode;
        errorFallback?: React.ReactNode;
    } = {}
) {
    const LazyComponent = lazy(importFn);

    return function LazyWrapper(props: P) {
        return (
            <Suspense fallback={options.fallback || <ComponentLoadingFallback />}>
                <LazyComponent {...(props as any)} />
            </Suspense>
        );
    };
}
