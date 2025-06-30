'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RotateCcw, AlertCircle, RefreshCw } from 'lucide-react';
import ServiceCard from '@/components/sync/ServiceCard';
import SyncProgress from '@/components/sync/SyncProgress';
import SyncHistory from '@/components/sync/SyncHistory';
import { useSync } from '@/hooks/useSync';
import { log } from '@/services/logger';
import notifications from '@/services/notifications';

interface ConnectedService {
  name: string;
  connected: boolean;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'error';
}

export default function SyncPage() {
  const { user } = useAuth();
  const {
    syncStatus,
    syncHistory,
    loading,
    error,
    startFullSync,
    startServiceSync,
    refreshStatus,
    refreshHistory,
    isSyncInProgress
  } = useSync();

  const [connectedServices, setConnectedServices] = useState<ConnectedService[]>([
    { name: 'spotify', connected: false, status: 'disconnected' },
    { name: 'deezer', connected: false, status: 'disconnected' },
    { name: 'youtube', connected: false, status: 'disconnected' },
    { name: 'lidarr', connected: false, status: 'disconnected' }
  ]);

  useEffect(() => {
    loadConnectedServices();
  }, [user, loadConnectedServices]);

  const loadConnectedServices = useCallback(async () => {
    try {
      // Simuler les services connectés depuis le profil utilisateur
      if (user?.spotifyId) {
        setConnectedServices(prev => prev.map(s =>
          s.name === 'spotify' ? { ...s, connected: true, status: 'connected' } : s
        ));
      }
      if (user?.deezerId) {
        setConnectedServices(prev => prev.map(s =>
          s.name === 'deezer' ? { ...s, connected: true, status: 'connected' } : s
        ));
      }
      if (user?.youtubeId) {
        setConnectedServices(prev => prev.map(s =>
          s.name === 'youtube' ? { ...s, connected: true, status: 'connected' } : s
        ));
      }
    } catch (error) {
      log.error('Erreur lors du chargement des services:', error);
      notifications.error('Erreur lors du chargement des services');
    }
  }, [user]); // Add user as dependency

  const connectService = (serviceName: string) => {
    // Rediriger vers la page d'auth OAuth du service
    window.location.href = `/api/auth/${serviceName}/connect`;
  };

  const handleRefreshAll = () => {
    refreshStatus();
    refreshHistory();
    loadConnectedServices();
  };

  // Dev login function for testing
  const devLogin = async () => {
    try {
      const response = await fetch('http://localhost:3003/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: 'test@echo.com',
          password: 'password123'
        })
      });

      const data = await response.json();
      if (data.success && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        window.location.reload();
      }
    } catch (error) {
      log.error('Dev login failed:', error);
      notifications.error('Erreur de connexion en mode développement');
    }
  };

  // Check if we have token
  const hasToken = typeof window !== 'undefined' && localStorage.getItem('auth_token');

  if (!hasToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto pt-20">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Synchronisation</h1>
            <p className="text-gray-600 mb-6">Vous devez être connecté pour accéder à la synchronisation.</p>
            <button
              onClick={devLogin}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Connexion de test
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <RotateCcw className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Synchronisation des Services
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Synchronisez votre musique depuis vos plateformes préférées
        </p>
      </div>

      {/* Erreur globale */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Synchronisation en cours */}
      {isSyncInProgress && (
        <div className="mb-8">
          <SyncProgress
            syncStatus={syncStatus}
            onRefresh={refreshStatus}
          />
        </div>
      )}

      {/* Actions rapides */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Actions rapides
        </h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={startFullSync}
            disabled={isSyncInProgress}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            {isSyncInProgress ? 'Synchronisation en cours...' : 'Synchronisation complète'}
          </button>

          <button
            onClick={handleRefreshAll}
            className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Actualiser
          </button>
        </div>
      </div>

      {/* Services connectés */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Services connectés
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {connectedServices.map((service) => (
            <ServiceCard
              key={service.name}
              service={service}
              onSync={() => startServiceSync(service.name)}
              onConnect={() => connectService(service.name)}
              disabled={isSyncInProgress}
            />
          ))}
        </div>
      </div>

      {/* Dernière synchronisation */}
      {syncStatus.lastResults && (
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Dernière synchronisation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {syncStatus.lastResults.summary.totalPlaylists}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Playlists</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {syncStatus.lastResults.summary.totalTracks}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tracks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-500">
                {syncStatus.lastResults.summary.totalArtists}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Artistes</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${syncStatus.lastResults.summary.errors > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {syncStatus.lastResults.summary.errors}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Erreurs</div>
            </div>
          </div>

          {syncStatus.lastSyncTime && (
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Dernière synchronisation: {new Date(syncStatus.lastSyncTime).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Historique des synchronisations */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Historique des synchronisations
        </h2>
        <SyncHistory
          history={syncHistory}
          onRefresh={refreshHistory}
        />
      </div>
    </div>
  );
}
