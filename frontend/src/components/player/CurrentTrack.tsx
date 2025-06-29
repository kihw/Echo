'use client';

import React from 'react';
import Link from 'next/link';
import { usePlayer } from '@/contexts/PlayerContext';

export const CurrentTrack: React.FC = () => {
  const { currentTrack, toggleFavorite, isFavorite } = usePlayer();

  if (!currentTrack) {
    return null;
  }

  const isTrackFavorite = isFavorite(currentTrack.id);

  return (
    <div className="flex items-center gap-3 min-w-0">
      {/* Track artwork */}
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
        {currentTrack.artwork ? (
          <img
            src={currentTrack.artwork}
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
        )}
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {currentTrack.title}
          </h4>

          {/* Favorite button */}
          <button
            onClick={() => toggleFavorite(currentTrack)}
            className={`p-1 rounded transition-colors ${isTrackFavorite
              ? 'text-red-500 hover:text-red-600'
              : 'text-gray-400 hover:text-red-500'
            }`}
            title={isTrackFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Link
            href={`/artist/${currentTrack.artist.toLowerCase().replace(/\s+/g, '-')}`}
            className="hover:text-gray-700 dark:hover:text-gray-300 truncate"
          >
            {currentTrack.artist}
          </Link>

          {currentTrack.album && (
            <>
              <span>•</span>
              <Link
                href={`/album/${currentTrack.album.toLowerCase().replace(/\s+/g, '-')}`}
                className="hover:text-gray-700 dark:hover:text-gray-300 truncate"
              >
                {currentTrack.album}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Additional actions - Desktop only */}
      <div className="hidden md:flex items-center gap-1">
        {/* Download button */}
        <button
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Télécharger"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>

        {/* Queue button */}
        <button
          className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          title="Voir la file d'attente"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};
