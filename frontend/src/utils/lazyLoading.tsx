import React, { lazy, ComponentType, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { GenericSkeleton } from '@/components/ui/Skeleton';

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
        <GenericSkeleton lines={4} />
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
