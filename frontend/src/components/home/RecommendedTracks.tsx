'use client';

import { motion } from 'framer-motion';
import { Play, Heart, MoreHorizontal, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  artwork?: string;
  popularity: number;
  isLiked: boolean;
  recommendationReason: string;
}

export function RecommendedTracks() {
  const [tracks] = useState<Track[]>([
    {
      id: '1',
      title: 'Fluorescent Adolescent',
      artist: 'Arctic Monkeys',
      album: 'Favourite Worst Nightmare',
      duration: 178,
      popularity: 85,
      isLiked: false,
      recommendationReason: 'Basé sur vos écoutes récentes'
    },
    {
      id: '2',
      title: 'Time to Dance',
      artist: 'The Sounds',
      album: 'Living in America',
      duration: 195,
      popularity: 72,
      isLiked: true,
      recommendationReason: 'Fans d\'Arctic Monkeys aiment aussi'
    },
    {
      id: '3',
      title: 'Electric Feel',
      artist: 'MGMT',
      album: 'Oracular Spectacular',
      duration: 228,
      popularity: 91,
      isLiked: false,
      recommendationReason: 'Tendance cette semaine'
    },
    {
      id: '4',
      title: 'Somebody Told Me',
      artist: 'The Killers',
      album: 'Hot Fuss',
      duration: 197,
      popularity: 88,
      isLiked: false,
      recommendationReason: 'Découverte personnalisée'
    },
    {
      id: '5',
      title: 'Take Me Out',
      artist: 'Franz Ferdinand',
      album: 'Franz Ferdinand',
      duration: 237,
      popularity: 83,
      isLiked: false,
      recommendationReason: 'Votre genre préféré'
    }
  ]);

  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayTrack = (trackId: string) => {
    setCurrentlyPlaying(currentlyPlaying === trackId ? null : trackId);
    // Implement play logic
    console.log('Playing track:', trackId);
  };

  const handleLikeTrack = (trackId: string) => {
    // Implement like logic
    console.log('Liking track:', trackId);
  };

  const getRecommendationIcon = (reason: string) => {
    if (reason.includes('tendance')) return TrendingUp;
    if (reason.includes('personnalisée')) return Sparkles;
    return Heart;
  };

  const getRecommendationColor = (reason: string) => {
    if (reason.includes('tendance')) return 'text-green-600 bg-green-100';
    if (reason.includes('personnalisée')) return 'text-purple-600 bg-purple-100';
    return 'text-primary-600 bg-primary-100';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
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
        <h2 className="text-xl font-semibold text-secondary-900 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-accent-500" />
          Recommandations pour vous
        </h2>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          Actualiser
        </button>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {tracks.map((track, index) => {
          const RecommendationIcon = getRecommendationIcon(track.recommendationReason);
          const isPlaying = currentlyPlaying === track.id;

          return (
            <motion.div
              key={track.id}
              variants={itemVariants}
              className={`group p-4 rounded-lg border transition-all duration-300 hover:shadow-md ${isPlaying
                ? 'border-primary-300 bg-primary-50'
                : 'border-secondary-200 hover:border-primary-300 bg-white'
              }`}
            >
              <div className="flex items-center space-x-4">
                {/* Track Number / Play Button */}
                <div className="relative w-10 h-10 flex-shrink-0">
                  <div className={`w-full h-full rounded-lg flex items-center justify-center transition-all duration-300 ${isPlaying ? 'bg-primary-100' : 'bg-secondary-100 group-hover:bg-primary-100'
                  }`}>
                    <span className={`text-sm font-medium transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'
                    }`}>
                      {(index + 1).toString().padStart(2, '0')}
                    </span>

                    <button
                      onClick={() => handlePlayTrack(track.id)}
                      className={`absolute inset-0 rounded-lg flex items-center justify-center transition-all duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Play className={`w-5 h-5 ${isPlaying ? 'text-primary-600' : 'text-secondary-700'}`} />
                    </button>
                  </div>
                </div>

                {/* Album Art */}
                <div className="w-12 h-12 flex-shrink-0">
                  <div className="w-full h-full bg-gradient-to-br from-secondary-200 to-secondary-300 rounded-lg overflow-hidden">
                    {track.artwork ? (
                      <img
                        src={track.artwork}
                        alt={`${track.album} cover`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-secondary-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-medium truncate transition-colors ${isPlaying ? 'text-primary-700' : 'text-secondary-900'
                      }`}>
                        {track.title}
                      </h3>
                      <p className="text-sm text-secondary-600 truncate">
                        {track.artist} • {track.album}
                      </p>

                      {/* Recommendation Badge */}
                      <div className="flex items-center space-x-2 mt-2">
                        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getRecommendationColor(track.recommendationReason)}`}>
                          <RecommendationIcon className="w-3 h-3" />
                          <span>{track.recommendationReason}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-secondary-500">
                          <TrendingUp className="w-3 h-3" />
                          <span>{track.popularity}% populaire</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {/* Duration */}
                      <span className="text-sm text-secondary-500 hidden sm:block">
                        {formatDuration(track.duration)}
                      </span>

                      {/* Like Button */}
                      <button
                        onClick={() => handleLikeTrack(track.id)}
                        className={`p-2 rounded-lg transition-all duration-300 ${track.isLiked
                          ? 'text-red-500 bg-red-50'
                          : 'text-secondary-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${track.isLiked ? 'fill-current' : ''}`} />
                      </button>

                      {/* More Options */}
                      <button className="p-2 rounded-lg text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Playing Indicator */}
              {isPlaying && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  className="mt-3 h-1 bg-primary-500 rounded-full origin-left"
                />
              )}
            </motion.div>
          );
        })}
      </motion.div>

      {/* View More Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-full p-4 border-2 border-dashed border-secondary-300 rounded-lg hover:border-primary-400 hover:bg-primary-50 transition-all duration-300 group"
      >
        <div className="flex items-center justify-center space-x-3 text-secondary-600 group-hover:text-primary-600">
          <div className="w-10 h-10 bg-secondary-100 group-hover:bg-primary-100 rounded-lg flex items-center justify-center transition-colors">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="font-medium">Découvrir plus de recommandations</div>
            <div className="text-sm opacity-70">Basées sur vos goûts musicaux</div>
          </div>
        </div>
      </motion.button>
    </div>
  );
}
