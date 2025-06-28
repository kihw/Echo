'use client';

import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WelcomeHero } from '@/components/home/WelcomeHero';
import { QuickActions } from '@/components/home/QuickActions';
import { RecentPlaylists } from '@/components/home/RecentPlaylists';
import { ListeningStats } from '@/components/home/ListeningStats';
import { RecommendedTracks } from '@/components/home/RecommendedTracks';

export default function DashboardPage() {
  const { user, isLoading } = useAuth();

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <RecentPlaylists />
          <ListeningStats />
        </div>

        <RecommendedTracks />
      </div>
    </DashboardLayout>
  );
}
