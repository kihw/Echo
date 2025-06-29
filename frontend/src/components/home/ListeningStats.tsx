'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Clock, Music, Headphones, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DashboardStats } from '@/services/dashboard';

interface ListeningStatsProps {
  stats?: DashboardStats | null;
  loading?: boolean;
}

export function ListeningStats({ stats, loading = false }: ListeningStatsProps) {
  const [timeOfDay, setTimeOfDay] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('matin');
    else if (hour < 18) setTimeOfDay('après-midi');
    else setTimeOfDay('soir');
  }, []);

  const formatTime = (milliseconds: number) => {
    if (!milliseconds) return '0min';
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}min` : `${minutes}min`;
  };

  const formatLastSync = (lastSyncTime?: string) => {
    if (!lastSyncTime) return 'Jamais synchronisé';
    const syncDate = new Date(lastSyncTime);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / (1000 * 60));

    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffMinutes / 1440)} jour(s)`;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Statistiques d'écoute</h3>
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded mb-2"></div>
              <div className="w-16 h-4 bg-gray-200 rounded mb-1"></div>
              <div className="w-12 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
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
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Statistiques d'écoute</h3>
          <p className="text-sm text-gray-500">Bonne écoute ce {timeOfDay} ! 🎵</p>
        </div>
        <div className="p-2 bg-blue-50 rounded-lg">
          <TrendingUp className="w-6 h-6 text-blue-600" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">TEMPS</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {formatTime(stats?.totalListeningTime || 0)}
          </div>
          <div className="text-xs text-blue-700">Total d'écoute</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Music className="w-5 h-5 text-green-600" />
            <span className="text-xs text-green-600 font-medium">MORCEAUX</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            {stats?.totalTracks || 0}
          </div>
          <div className="text-xs text-green-700">Pistes écoutées</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Headphones className="w-5 h-5 text-purple-600" />
            <span className="text-xs text-purple-600 font-medium">ARTISTES</span>
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {stats?.totalArtists || 0}
          </div>
          <div className="text-xs text-purple-700">Artistes uniques</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <Award className="w-5 h-5 text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">SERVICES</span>
          </div>
          <div className="text-2xl font-bold text-orange-900">
            {stats?.syncedServices || 0}
          </div>
          <div className="text-xs text-orange-700">Connectés</div>
        </div>
      </div>

      {stats?.lastSyncTime && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Dernière synchronisation</span>
            <span className="text-gray-700 font-medium">
              {formatLastSync(stats.lastSyncTime)}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
