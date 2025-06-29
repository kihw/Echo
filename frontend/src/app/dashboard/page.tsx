'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WelcomeHero } from '@/components/home/WelcomeHero';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentPlaylists } from '@/components/home/RecentPlaylists';
import { ListeningStats } from '@/components/home/ListeningStats';
import { RecommendedTracks } from '@/components/home/RecommendedTracks';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const { isPlaying, currentTrack } = usePlayer();

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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <WelcomeHero />
        <QuickActions />

        {/* Currently Playing */}
        {isPlaying && currentTrack && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              En cours de lecture
            </h2>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🎵</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{currentTrack.title}</h3>
                <p className="text-gray-600">{currentTrack.artist}</p>
                <p className="text-sm text-gray-500">{currentTrack.album}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentPlaylists />
          <ListeningStats />
        </div>

        <RecommendedTracks />
      </div>
    </DashboardLayout>
  );
}
