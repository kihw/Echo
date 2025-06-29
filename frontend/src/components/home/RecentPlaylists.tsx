'use client';

import { motion } from 'framer-motion';
import { Play, MoreHorizontal, Music, Clock, Heart } from 'lucide-react';
import { useState } from 'react';

interface Playlist {
  id: string;
  name: string;
  description: string;
  trackCount: number;
  duration: number;
  artwork?: string;
  lastPlayed?: string;
  isLiked?: boolean;
}

export function RecentPlaylists() {
  const [playlists] = useState<Playlist[]>([
    {
      id: '1',
      name: 'Mes Favoris',
      description: 'Vos titres préférés en un seul endroit',
      trackCount: 47,
      duration: 180, // minutes
      lastPlayed: '2024-06-28T10:30:00Z',
      isLiked: true
    },
    {
      id: '2',
      name: 'Découvertes de la semaine',
      description: 'Nouvelles trouvailles musicales',
      trackCount: 23,
      duration: 95,
      lastPlayed: '2024-06-28T08:15:00Z'
    },
    {
      id: '3',
      name: 'Chill Vibes',
      description: 'Pour se détendre après une longue journée',
      trackCount: 31,
      duration: 125,
      lastPlayed: '2024-06-27T22:45:00Z'
    },
    {
      id: '4',
      name: 'Workout Mix',
      description: 'Motivation musicale pour le sport',
      trackCount: 18,
      duration: 75,
      lastPlayed: '2024-06-27T07:00:00Z'
    }
  ]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;
  };

  const formatLastPlayed = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    return `Il y a ${diffDays} jours`;
  };

  const handlePlayPlaylist = (playlist: Playlist) => {
    console.log('Playing playlist:', playlist.name);
    // Implement playlist play logic
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-secondary-900">
          Playlists récentes
        </h2>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Voir tout
        </button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {playlists.map((playlist) => (
          <motion.div
            key={playlist.id}
            variants={itemVariants}
            className="group bg-white rounded-xl border border-secondary-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start space-x-4">
                {/* Playlist Artwork */}
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                    {playlist.artwork ? (
                      <img
                        src={playlist.artwork}
                        alt={playlist.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Music className="w-8 h-8 text-primary-600" />
                    )}
                  </div>

                  {/* Play Button Overlay */}
                  <button
                    onClick={() => handlePlayPlaylist(playlist)}
                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-4 h-4 text-secondary-900 ml-0.5" />
                    </div>
                  </button>
                </div>

                {/* Playlist Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-secondary-900 truncate flex items-center space-x-2">
                        <span>{playlist.name}</span>
                        {playlist.isLiked && (
                          <Heart className="w-4 h-4 text-red-500 fill-current" />
                        )}
                      </h3>
                      <p className="text-sm text-secondary-600 mt-1 line-clamp-2">
                        {playlist.description}
                      </p>
                    </div>

                    <button className="p-1 rounded-lg hover:bg-secondary-100 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4 text-secondary-500" />
                    </button>
                  </div>

                  {/* Playlist Stats */}
                  <div className="flex items-center space-x-4 mt-3 text-xs text-secondary-500">
                    <div className="flex items-center space-x-1">
                      <Music className="w-3 h-3" />
                      <span>{playlist.trackCount} titres</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(playlist.duration)}</span>
                    </div>
                    {playlist.lastPlayed && (
                      <div className="flex items-center space-x-1">
                        <div className="w-1 h-1 bg-secondary-400 rounded-full"></div>
                        <span>{formatLastPlayed(playlist.lastPlayed)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress Bar for Recently Played */}
              {playlist.lastPlayed && (
                <div className="mt-4">
                  <div className="w-full h-1 bg-secondary-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${Math.random() * 60 + 20}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-secondary-500 mt-1">
                    <span>Écouté récemment</span>
                    <span>{Math.floor(Math.random() * 80 + 10)}% terminé</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Create New Playlist Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="w-full p-6 border-2 border-dashed border-secondary-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all duration-300 group"
      >
        <div className="flex items-center justify-center space-x-3 text-secondary-600 group-hover:text-primary-600">
          <div className="w-12 h-12 bg-secondary-100 group-hover:bg-primary-100 rounded-lg flex items-center justify-center transition-colors">
            <Play className="w-6 h-6" />
          </div>
          <div className="text-left">
            <div className="font-medium">Créer une nouvelle playlist</div>
            <div className="text-sm opacity-70">Commencez avec vos titres préférés</div>
          </div>
        </div>
      </motion.button>
    </div>
  );
}
