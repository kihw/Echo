'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { useTheme } from '@/contexts/ThemeContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { Recommendations } from '@/components/recommendations/Recommendations';
import { SyncPanel } from '@/components/sync/SyncPanel';
import { WelcomeHero } from '@/components/home/WelcomeHero';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentPlaylists } from '@/components/home/RecentPlaylists';
import { ListeningStats } from '@/components/home/ListeningStats';
import { log } from '@/services/logger';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { isPlaying, currentTrack } = usePlayer();
  const { resolvedTheme } = useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // AuthContext will redirect to login
  }

  const handleTrackPlay = (track: any) => {
    log.info('Lecture de la track démarrée', { track }, 'Dashboard');
  };

  const handleTrackLike = (track: any) => {
    log.info('Track likée', { track }, 'Dashboard');
  };

  const handleTrackAdd = (track: any) => {
    log.info('Track ajoutée à playlist', { track }, 'Dashboard');
  };

  const handleSyncComplete = (result: any) => {
    log.info('Synchronisation terminée', { result }, 'Dashboard');
  };

  const themeClasses = {
    background: resolvedTheme === 'dark' ? 'bg-slate-900' : 'bg-slate-50',
    card: `${resolvedTheme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`,
    text: {
      primary: resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-900',
      secondary: resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-600'
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header avec toggle de thème */}
        <div className="flex items-center justify-between">
          <WelcomeHero />
          <ThemeToggle variant="button" />
        </div>

        <QuickActions />

        {/* Currently Playing */}
        {isPlaying && currentTrack && (
          <div className={`${themeClasses.card} rounded-lg shadow-sm p-6 border`}>
            <h2 className={`text-xl font-semibold ${themeClasses.text.primary} mb-4`}>
              En cours de lecture
            </h2>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
              <div>
                <h3 className={`font-medium ${themeClasses.text.primary}`}>{currentTrack.title}</h3>
                <p className={themeClasses.text.secondary}>{currentTrack.artist}</p>
                <p className={`text-sm ${themeClasses.text.secondary}`}>{currentTrack.album}</p>
              </div>
            </div>
          </div>
        )}

        {/* Grille principale */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Section principale - Recommandations */}
          <div className="xl:col-span-2 space-y-8">
            <div className={`${themeClasses.card} border rounded-lg`}>
              <Recommendations
                userId={user?.id || 'demo'}
                limit={15}
                onTrackPlay={handleTrackPlay}
                onTrackLike={handleTrackLike}
                onTrackAdd={handleTrackAdd}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RecentPlaylists />
              <ListeningStats />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className={`${themeClasses.card} border rounded-lg`}>
              <SyncPanel
                userId={user?.id || 'demo'}
                onSyncComplete={handleSyncComplete}
              />
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
