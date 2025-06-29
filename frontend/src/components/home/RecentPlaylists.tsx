'use client';

import { motion } from 'framer-motion';
import { Play, MoreHorizontal, Music, Clock, Heart } from 'lucide-react';
import { RecentPlaylist } from '@/services/dashboard';

interface RecentPlaylistsProps {
  playlists?: RecentPlaylist[];
  loading?: boolean;
}

export function RecentPlaylists({ playlists = [], loading = false }: RecentPlaylistsProps) {
  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}min` : `${minutes}min`;
  };

  const formatLastUpdate = (updatedAt: string) => {
    const date = new Date(updatedAt);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 24) return `Il y a ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} jour(s)`;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Playlists récentes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
              <div className="w-full h-32 bg-gray-200 rounded-lg mb-3"></div>
              <div className="w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
              <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (playlists.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Playlists récentes</h3>
        <div className="text-center py-8">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune playlist trouvée</p>
          <p className="text-sm text-gray-400">Créez votre première playlist pour commencer</p>
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
        <h3 className="text-lg font-semibold text-gray-900">Playlists récentes</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          Voir tout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {playlists.slice(0, 6).map((playlist, index) => (
          <motion.div
            key={playlist.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="group cursor-pointer"
          >
            <div className="relative p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg transition-all duration-300 hover:shadow-md">
              {/* Cover Image Placeholder */}
              <div className="relative w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-3 overflow-hidden">
                {playlist.coverImageUrl ? (
                  <img
                    src={playlist.coverImageUrl}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Music className="w-8 h-8 text-blue-600" />
                  </div>
                )}

                {/* Play Button Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                  <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1, opacity: 1 }}
                    className="p-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <Play className="w-6 h-6 text-gray-900 fill-current" />
                  </motion.button>
                </div>
              </div>

              {/* Playlist Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 truncate">{playlist.name}</h4>
                {playlist.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{playlist.description}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Music className="w-3 h-3 mr-1" />
                      {playlist.trackCount}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDuration(playlist.totalDuration)}
                    </span>
                  </div>

                  {playlist.isPublic && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      Public
                    </span>
                  )}
                </div>

                <div className="text-xs text-gray-400">
                  Mis à jour {formatLastUpdate(playlist.updatedAt)}
                </div>
              </div>

              {/* More Options */}
              <button className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white hover:bg-opacity-80 rounded">
                <MoreHorizontal className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
