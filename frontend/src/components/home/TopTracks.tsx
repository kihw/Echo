'use client';

import { motion } from 'framer-motion';
import { Play, MoreHorizontal, TrendingUp, Clock, Music } from 'lucide-react';
import { TopTrack } from '@/services/dashboard';

interface TopTracksProps {
  tracks?: TopTrack[];
  loading?: boolean;
  title?: string;
}

export function TopTracks({ tracks = [], loading = false, title = "Top Tracks du mois" }: TopTracksProps) {
  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatPlayCount = (count: number) => {
    if (count < 1000) return count.toString();
    return `${(count / 1000).toFixed(1)}k`;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (tracks.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune donnée d'écoute disponible</p>
          <p className="text-sm text-gray-400">Écoutez de la musique pour voir vos statistiques</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Voir tout
        </button>
      </div>

      <div className="space-y-2">
        {tracks.slice(0, 5).map((track, index) => (
          <motion.div
            key={track.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {/* Numéro de classement */}
            <div className="w-6 text-center">
              <span className="text-lg font-bold text-gray-400">
                {index + 1}
              </span>
            </div>

            {/* Artwork */}
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary-100 to-purple-100">
              {track.coverUrl ? (
                <img
                  src={track.coverUrl}
                  alt={track.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Music className="w-5 h-5 text-primary-600" />
                </div>
              )}

              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
                <motion.button
                  initial={{ scale: 0, opacity: 0 }}
                  whileHover={{ scale: 1, opacity: 1 }}
                  className="p-1.5 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <Play className="w-3 h-3 text-gray-900 fill-current" />
                </motion.button>
              </div>
            </div>

            {/* Informations du track */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{track.name}</h4>
              <p className="text-sm text-gray-600 truncate">{track.artist}</p>
              {track.album && (
                <p className="text-xs text-gray-500 truncate">{track.album}</p>
              )}
            </div>

            {/* Statistiques */}
            <div className="flex flex-col items-end text-sm">
              <span className="text-gray-900 font-medium">
                {formatPlayCount(track.playCount)} écoutes
              </span>
              <span className="text-gray-500 text-xs flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {formatDuration(track.totalDuration)}
              </span>
            </div>

            {/* Menu actions */}
            <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-1 hover:bg-gray-200 rounded">
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </button>
          </motion.div>
        ))}
      </div>

      {tracks.length > 5 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2">
            Voir les {tracks.length - 5} autres tracks
          </button>
        </div>
      )}
    </motion.div>
  );
}
