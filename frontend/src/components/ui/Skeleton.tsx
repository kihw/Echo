/**
 * Composants Skeleton pour les états de chargement
 * Améliore l'UX pendant le lazy loading
 */

import React from 'react';

interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
  rounded?: boolean;
}

export function Skeleton({ className = '', height = 'h-4', width = 'w-full', rounded = false }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${height} ${width} ${
        rounded ? 'rounded-full' : 'rounded'
      } ${className}`}
    />
  );
}

// Skeletons spécialisés pour différents composants
export function RecommendationsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton height="h-8" width="w-48" />
        <Skeleton height="h-10" width="w-32" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
            <Skeleton height="h-48" />
            <Skeleton height="h-5" width="w-3/4" />
            <Skeleton height="h-4" width="w-1/2" />
            <div className="flex justify-between items-center">
              <Skeleton height="h-8" width="w-16" rounded />
              <div className="flex space-x-2">
                <Skeleton height="h-8" width="w-8" rounded />
                <Skeleton height="h-8" width="w-8" rounded />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton height="h-8" width="w-32" />
        <Skeleton height="h-10" width="w-48" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton height="h-8" width="w-8" rounded />
              <Skeleton height="h-4" width="w-16" />
            </div>
            <Skeleton height="h-8" width="w-20" />
            <Skeleton height="h-3" width="w-full" />
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <Skeleton height="h-6" width="w-48" />
          <Skeleton height="h-64" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <Skeleton height="h-6" width="w-48" />
          <Skeleton height="h-64" />
        </div>
      </div>
    </div>
  );
}

export function PlaylistsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton height="h-8" width="w-32" />
        <Skeleton height="h-10" width="w-32" />
      </div>
      
      {/* Playlists Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
            <Skeleton height="h-48" />
            <div className="p-4 space-y-3">
              <Skeleton height="h-5" width="w-3/4" />
              <Skeleton height="h-4" width="w-1/2" />
              <div className="flex items-center justify-between">
                <Skeleton height="h-4" width="w-20" />
                <Skeleton height="h-8" width="w-8" rounded />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SyncSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Skeleton height="h-8" width="w-48" />
      
      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <Skeleton height="h-12" width="w-12" rounded />
              <div className="flex-1 space-y-2">
                <Skeleton height="h-5" width="w-24" />
                <Skeleton height="h-4" width="w-16" />
              </div>
            </div>
            <Skeleton height="h-10" />
            <div className="space-y-2">
              <Skeleton height="h-3" width="w-full" />
              <Skeleton height="h-3" width="w-3/4" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Sync History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4">
        <Skeleton height="h-6" width="w-48" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-3 border border-gray-200 dark:border-gray-700 rounded">
              <Skeleton height="h-4" width="w-4" rounded />
              <div className="flex-1 space-y-1">
                <Skeleton height="h-4" width="w-48" />
                <Skeleton height="h-3" width="w-32" />
              </div>
              <Skeleton height="h-4" width="w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SearchSkeleton() {
  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Skeleton height="h-12" />
      
      {/* Filter Tabs */}
      <div className="flex space-x-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} height="h-10" width="w-20" />
        ))}
      </div>
      
      {/* Results */}
      <div className="space-y-4">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
            <Skeleton height="h-16" width="w-16" />
            <div className="flex-1 space-y-2">
              <Skeleton height="h-5" width="w-3/4" />
              <Skeleton height="h-4" width="w-1/2" />
              <Skeleton height="h-3" width="w-1/4" />
            </div>
            <div className="flex space-x-2">
              <Skeleton height="h-8" width="w-8" rounded />
              <Skeleton height="h-8" width="w-8" rounded />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton générique pour contenus inconnus
export function GenericSkeleton({ lines = 3, showAvatar = false }: { lines?: number; showAvatar?: boolean }) {
  return (
    <div className="animate-pulse space-y-4 p-4">
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <Skeleton height="h-12" width="w-12" rounded />
          <div className="space-y-2">
            <Skeleton height="h-4" width="w-24" />
            <Skeleton height="h-3" width="w-16" />
          </div>
        </div>
      )}
      <div className="space-y-3">
        {[...Array(lines)].map((_, i) => (
          <Skeleton
            key={i}
            height="h-4"
            width={i === lines - 1 ? 'w-3/4' : 'w-full'}
          />
        ))}
      </div>
    </div>
  );
}
