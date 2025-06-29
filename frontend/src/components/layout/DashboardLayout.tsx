'use client';

import { useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, Music, Heart, Settings, LogOut, Menu, X,
  Search, Library, TrendingUp, Clock, User, Play,
  Pause, SkipBack, SkipForward, Volume2, Repeat,
  Shuffle, MoreHorizontal
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePlayer } from '@/hooks/usePlayer';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { user, logout } = useAuth();
  const {
    currentTrack,
    isPlaying,
    volume,
    position,
    duration,
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    isRepeat,
    isShuffle,
    setRepeat,
    setShuffle
  } = usePlayer();
  const pathname = usePathname();

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigationItems = [
    { name: 'Accueil', href: '/', icon: Home },
    { name: 'Rechercher', href: '/search', icon: Search },
    { name: 'Ma bibliothèque', href: '/library', icon: Library },
    { name: 'Playlists', href: '/playlists', icon: Music },
    { name: 'Favoris', href: '/favorites', icon: Heart },
    { name: 'Découverte', href: '/discover', icon: TrendingUp },
    { name: 'Historique', href: '/history', icon: Clock },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newPosition = percentage * duration;
    seek(newPosition);
  };

  const toggleRepeat = () => {
    const modes: ('off' | 'one' | 'all')[] = ['off', 'all', 'one'];
    const currentIndex = modes.indexOf(isRepeat);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setRepeat(nextMode);
  };

  return (
    <div className="h-screen bg-secondary-50 flex flex-col">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-secondary-200 px-4 lg:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-secondary-100 lg:hidden"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
              <Music className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-secondary-900 hidden sm:block">
              Echo
            </span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-2 bg-secondary-100 rounded-lg px-3 py-2 min-w-[300px]">
            <Search size={16} className="text-secondary-500" />
            <input
              type="text"
              placeholder="Rechercher des morceaux, artistes, albums..."
              className="bg-transparent flex-1 outline-none text-sm text-secondary-700 placeholder-secondary-500"
            />
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-secondary-900">
                {user?.displayName}
              </p>
              <p className="text-xs text-secondary-500">
                {user?.subscription.type === 'premium' ? 'Premium' : 'Gratuit'}
              </p>
            </div>

            <div className="relative group">
              <button className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User size={20} className="text-primary-600" />
                )}
              </button>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-secondary-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50">
                    <User size={16} className="mr-3" />
                    Profil
                  </Link>
                  <Link href="/settings" className="flex items-center px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50">
                    <Settings size={16} className="mr-3" />
                    Paramètres
                  </Link>
                  <hr className="my-2 border-secondary-200" />
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} className="mr-3" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {(isSidebarOpen || isDesktop) && (
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              className="w-70 bg-white border-r border-secondary-200 flex flex-col absolute lg:relative z-40 h-full"
            >
              <div className="flex-1 px-4 py-6">
                <nav className="space-y-2">
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${isActive
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                          }`}
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        <item.icon size={20} />
                        <span className="font-medium">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>

                {/* Quick Playlists */}
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-secondary-500 uppercase tracking-wide mb-4">
                    Playlists récentes
                  </h3>
                  <div className="space-y-2">
                    {[
                      'Mes favoris',
                      'Découvertes récentes',
                      'Chill Vibes',
                      'Workout Mix',
                    ].map((playlist) => (
                      <Link
                        key={playlist}
                        href={`/playlist/${playlist.toLowerCase().replace(/\s+/g, '-')}`}
                        className="block px-3 py-2 text-sm text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
                        onClick={() => setIsSidebarOpen(false)}
                      >
                        {playlist}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Player Bar */}
      {currentTrack && (
        <div className="bg-white border-t border-secondary-200 px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Track Info */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-secondary-200 rounded-lg flex-shrink-0 overflow-hidden">
                {currentTrack.artwork ? (
                  <img
                    src={currentTrack.artwork}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={20} className="text-secondary-500" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-secondary-900 truncate">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-secondary-500 truncate">
                  {currentTrack.artist}
                </p>
              </div>
            </div>

            {/* Player Controls */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShuffle(!isShuffle)}
                className={`p-2 rounded-lg transition-colors ${isShuffle ? 'text-primary-600 bg-primary-100' : 'text-secondary-500 hover:text-secondary-700'
                  }`}
              >
                <Shuffle size={16} />
              </button>

              <button
                onClick={previous}
                className="p-2 rounded-lg text-secondary-600 hover:text-secondary-900 transition-colors"
              >
                <SkipBack size={20} />
              </button>

              <button
                onClick={isPlaying ? pause : () => play()}
                className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>

              <button
                onClick={next}
                className="p-2 rounded-lg text-secondary-600 hover:text-secondary-900 transition-colors"
              >
                <SkipForward size={20} />
              </button>

              <button
                onClick={toggleRepeat}
                className={`p-2 rounded-lg transition-colors ${isRepeat !== 'off' ? 'text-primary-600 bg-primary-100' : 'text-secondary-500 hover:text-secondary-700'
                  }`}
              >
                <Repeat size={16} />
                {isRepeat === 'one' && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                    1
                  </span>
                )}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="hidden md:flex items-center space-x-3 flex-1 max-w-md">
              <span className="text-xs text-secondary-500 min-w-[40px]">
                {formatTime(position)}
              </span>

              <div
                className="flex-1 h-1 bg-secondary-200 rounded-full cursor-pointer group"
                onClick={handleSeek}
              >
                <div
                  className="h-full bg-primary-600 rounded-full relative group-hover:bg-primary-700 transition-colors"
                  style={{ width: `${duration ? (position / duration) * 100 : 0}%` }}
                >
                  <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              <span className="text-xs text-secondary-500 min-w-[40px]">
                {formatTime(duration)}
              </span>
            </div>

            {/* Volume Control */}
            <div className="hidden lg:flex items-center space-x-3">
              <Volume2 size={16} className="text-secondary-500" />
              <div className="w-20 h-1 bg-secondary-200 rounded-full">
                <div
                  className="h-full bg-primary-600 rounded-full"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>

            {/* More Options */}
            <button className="p-2 rounded-lg text-secondary-500 hover:text-secondary-700 transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default DashboardLayout;
