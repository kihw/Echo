'use client';

import { motion } from 'framer-motion';
import { Play, MoreHorizontal, Crown, Clock, Music, User } from 'lucide-react';
import { TopArtist } from '@/services/dashboard';

interface TopArtistsProps {
  artists?: TopArtist[];
  loading?: boolean;
  title?: string;
}

export function TopArtists({ artists = [], loading = false, title = 'Top Artistes du mois' }: TopArtistsProps) {
  const formatDuration = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}min` : `${minutes}min`;
  };

  const formatPlayCount = (count: number) => {
    if (count < 1000) return count.toString();
    return `${(count / 1000).toFixed(1)}k`;
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <div className="w-4 h-4 rounded-full bg-gray-300"></div>;
    if (index === 2) return <div className="w-4 h-4 rounded-full bg-amber-600"></div>;
    return null;
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
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
                <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="w-16 h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (artists.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Aucune donnée d'artiste disponible</p>
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
          <Crown className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Voir tout
        </button>
      </div>

      <div className="space-y-2">
        {artists.slice(0, 5).map((artist, index) => (
          <motion.div
            key={artist.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {/* Numéro de classement avec icône spéciale pour le podium */}
            <div className="w-6 flex items-center justify-center">
              {getRankIcon(index) || (
                <span className="text-lg font-bold text-gray-400">
                  {index + 1}
                </span>
              )}
            </div>

            {/* Avatar de l'artiste */}
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
              {artist.imageUrl ? (
                <img
                  src={artist.imageUrl}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <User className="w-6 h-6 text-purple-600" />
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

            {/* Informations de l'artiste */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 truncate">{artist.name}</h4>
              {artist.genres && artist.genres.length > 0 && (
                <p className="text-sm text-gray-600 truncate">
                  {artist.genres.slice(0, 2).join(', ')}
                  {artist.genres.length > 2 && '...'}
                </p>
              )}
              <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1">
                <span className="flex items-center">
                  <Music className="w-3 h-3 mr-1" />
                  {formatPlayCount(artist.playCount)} plays
                </span>
                <span className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(artist.totalDuration)}
                </span>
              </div>
            </div>

            {/* Badge pour le podium */}
            {index < 3 && (
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-100 text-gray-700' :
                    'bg-amber-100 text-amber-700'
                }`}>
                #{index + 1}
              </div>
            )}

            {/* Menu actions */}
            <button className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-1 hover:bg-gray-200 rounded">
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Résumé global */}
      {artists.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {artists.length} artiste{artists.length > 1 ? 's' : ''} écouté{artists.length > 1 ? 's' : ''}
            </span>
            <span>
              {formatDuration(artists.reduce((total, artist) => total + artist.totalDuration, 0))} au total
            </span>
          </div>
        </div>
      )}

      {artists.length > 5 && (
        <div className="mt-4">
          <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium py-2">
            Voir les {artists.length - 5} autres artistes
          </button>
        </div>
      )}
    </motion.div>
  );
}
