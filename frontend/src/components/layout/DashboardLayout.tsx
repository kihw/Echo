'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AudioPlayer } from '@/components/player/AudioPlayer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pages qui n'ont pas besoin de la sidebar/topbar
  const publicRoutes = ['/auth', '/privacy', '/terms'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" message="Chargement..." />
      </div>
    );
  }

  // Pour les routes publiques, afficher seulement le contenu
  if (isPublicRoute || !user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* TopBar */}
        <TopBar onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Page content */}
        <main className="flex-1 p-6 pb-24">
          {children}
        </main>
      </div>

      {/* Audio Player */}
      <AudioPlayer />
    </div>
  );
};
