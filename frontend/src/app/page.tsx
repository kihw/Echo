'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Music, Shuffle, Heart, TrendingUp, Clock, Zap } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ResponsiveDashboardLayout } from '@/components/layout/ResponsiveDashboardLayout';
import { WelcomeHero } from '@/components/home/WelcomeHero';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentPlaylists } from '@/components/home/RecentPlaylists';
import { ListeningStats } from '@/components/home/ListeningStats';
import { RecommendedTracks } from '@/components/home/RecommendedTracks';
import { TopTracks } from '@/components/home/TopTracks';
import { TopArtists } from '@/components/home/TopArtists';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import { useDashboard } from '@/hooks/useDashboard';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const { currentTrack, isPlaying } = usePlayer();
  const { data: dashboardData, stats, loading: dashboardLoading, error } = useDashboard();
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      setCurrentTime(timeString);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <WelcomeHero />
      </div>
    );
  }

  return (
    <ResponsiveDashboardLayout>
      <motion.div
        className="max-w-7xl mx-auto space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header avec salutation */}
        <motion.div variants={itemVariants} className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">
                Bonjour, {user?.displayName || 'Mélomane'} 👋
              </h1>
              <p className="text-secondary-600 mt-1">
                Il est {currentTime} • Prêt à découvrir de nouvelles musiques ?
              </p>
            </div>

            {/* Indicateur de lecture en cours */}
            {isPlaying && currentTrack && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center space-x-3 bg-primary-100 text-primary-700 px-4 py-2 rounded-full"
              >
                <div className="flex space-x-1">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 h-4 bg-primary-600 rounded-full animate-equalizer"
                      style={{ animationDelay: `${i * 0.1}s` }}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium">En lecture</span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Actions rapides */}
        <motion.div variants={itemVariants}>
          <QuickActions />
        </motion.div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Playlists récentes */}
            <motion.div variants={itemVariants}>
              <RecentPlaylists playlists={dashboardData?.recentPlaylists} loading={dashboardLoading} />
            </motion.div>

            {/* Top Tracks et Top Artists */}
            <motion.div variants={itemVariants}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopTracks tracks={dashboardData?.topTracks} loading={dashboardLoading} />
                <TopArtists artists={dashboardData?.topArtists} loading={dashboardLoading} />
              </div>
            </motion.div>

            {/* Tracks recommandées */}
            <motion.div variants={itemVariants}>
              <RecommendedTracks />
            </motion.div>
          </div>

          {/* Sidebar droite */}
          <div className="space-y-8">
            {/* Statistiques d'écoute */}
            <motion.div variants={itemVariants}>
              <ListeningStats stats={stats} loading={dashboardLoading} />
            </motion.div>

            {/* Carte découverte */}
            <motion.div variants={itemVariants}>
              <div className="card bg-gradient-to-br from-accent-500 to-accent-600 text-white">
                <div className="card-body">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        Découverte du jour
                      </h3>
                      <p className="text-accent-100 text-sm mb-4">
                        Explorez de nouveaux genres et artistes basés sur vos goûts musicaux
                      </p>
                      <button className="bg-white text-accent-600 px-4 py-2 rounded-lg font-medium hover:bg-accent-50 transition-colors">
                        Découvrir
                      </button>
                    </div>
                    <Zap className="w-8 h-8 text-accent-200" />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Activité récente */}
            <motion.div variants={itemVariants}>
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-secondary-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-secondary-500" />
                    Activité récente
                  </h3>
                </div>
                <div className="card-body space-y-4">
                  {dashboardData?.listeningHistory?.slice(0, 3).map((activity, index) => (
                    <div key={activity.id} className="flex items-center space-x-3">
                      <div className="p-2 bg-secondary-100 rounded-lg">
                        <Music className="w-4 h-4 text-secondary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary-900 truncate">
                          {activity.trackName}
                        </p>
                        <p className="text-xs text-secondary-500">
                          {activity.artistName} • {new Date(activity.playedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  )) || [
                    {
                      action: 'Playlist créée',
                      title: 'Chill Vibes',
                      time: 'Il y a 2h',
                      icon: Music
                    },
                    {
                      action: 'Track aimée',
                      title: 'Bohemian Rhapsody',
                      time: 'Il y a 4h',
                      icon: Heart
                    },
                    {
                      action: 'Découverte',
                      title: 'Arctic Monkeys',
                      time: 'Hier',
                      icon: TrendingUp
                    }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="p-2 bg-secondary-100 rounded-lg">
                        <activity.icon className="w-4 h-4 text-secondary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-xs text-secondary-500">
                          {activity.action} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!dashboardData?.listeningHistory || dashboardData.listeningHistory.length === 0) && !dashboardLoading && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Aucune activité récente</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Section suggestions */}
        <motion.div variants={itemVariants}>
          <div className="card">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-secondary-900">
                Suggestions pour vous
              </h3>
              <p className="text-secondary-600 mt-1">
                Basées sur votre historique d&apos;écoute et vos préférences
              </p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Générer une playlist détente',
                    description: 'Créez automatiquement une playlist pour vous relaxer',
                    icon: Shuffle,
                    color: 'primary',
                    action: 'Générer'
                  },
                  {
                    title: 'Synchroniser Spotify',
                    description: 'Importez vos playlists et tracks favorites',
                    icon: Play,
                    color: 'spotify',
                    action: 'Synchroniser'
                  },
                  {
                    title: 'Découvrir par genre',
                    description: 'Explorez de nouveaux styles musicaux',
                    icon: TrendingUp,
                    color: 'accent',
                    action: 'Explorer'
                  }
                ].map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-4 border border-secondary-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${suggestion.color === 'primary' ? 'bg-primary-100 text-primary-600' :
                        suggestion.color === 'spotify' ? 'bg-green-100 text-green-600' :
                          'bg-accent-100 text-accent-600'
                        }`}>
                        <suggestion.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-secondary-900 mb-1">
                          {suggestion.title}
                        </h4>
                        <p className="text-sm text-secondary-600 mb-3">
                          {suggestion.description}
                        </p>
                        <button className={`text-sm font-medium ${suggestion.color === 'primary' ? 'text-primary-600 hover:text-primary-700' :
                          suggestion.color === 'spotify' ? 'text-green-600 hover:text-green-700' :
                            'text-accent-600 hover:text-accent-700'
                          } transition-colors`}>
                          {suggestion.action} →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </ResponsiveDashboardLayout>
  );
}
