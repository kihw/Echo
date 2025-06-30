'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { log } from '@/services/logger';
import notifications from '@/services/notifications';
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ClockIcon,
  PlayIcon,
  Cog6ToothIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface SyncStatus {
  syncId: string;
  status: 'in_progress' | 'success' | 'error' | 'partial';
  services: string[];
  statistics: {
    playlistsSynced: number;
    tracksSynced: number;
    favoritesSynced: number;
    conflictsResolved: number;
    duration: number;
  };
  conflicts: Array<{
    id: string;
    type: string;
    resolved: boolean;
    description: string;
  }>;
  startTime: string;
  endTime?: string;
}

interface SyncPanelProps {
  userId: string;
  onSyncComplete?: (result: SyncStatus) => void;
}

export function SyncPanel({ userId, onSyncComplete }: SyncPanelProps) {
  const { resolvedTheme } = useTheme();
  const [currentSync, setCurrentSync] = useState<SyncStatus | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Configuration de synchronisation
  const [syncConfig, setSyncConfig] = useState({
    services: ['spotify', 'deezer', 'ytmusic'],
    syncPlaylists: true,
    syncHistory: true,
    syncFavorites: true,
    syncLibrary: true,
    resolveConflicts: true
  });

  // Classes de thème
  const themeClasses = {
    container: `${resolvedTheme === 'dark' ? 'bg-slate-900' : 'bg-white'}`,
    card: `${resolvedTheme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`,
    text: {
      primary: resolvedTheme === 'dark' ? 'text-slate-100' : 'text-slate-900',
      secondary: resolvedTheme === 'dark' ? 'text-slate-300' : 'text-slate-600',
      muted: resolvedTheme === 'dark' ? 'text-slate-400' : 'text-slate-500'
    },
    button: {
      primary: `${resolvedTheme === 'dark'
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white'}`,
      secondary: `${resolvedTheme === 'dark'
        ? 'bg-slate-700 hover:bg-slate-600 text-slate-100 border-slate-600'
        : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-300'}`
    }
  };

  // Charger l'historique de synchronisation au montage
  useEffect(() => {
    loadSyncHistory();
  }, [userId]);

  const loadSyncHistory = async () => {
    try {
      const response = await fetch('/api/sync/history?limit=10', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSyncHistory(data.data || []);
      }
    } catch (error) {
      log.error('Erreur lors du chargement de l\'historique:', error);
      notifications.error('Impossible de charger l\'historique de synchronisation');
    }
  };

  const startSync = async (dryRun: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/sync/full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...syncConfig,
          dryRun
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors du lancement de la synchronisation');
      }

      const data = await response.json();

      if (dryRun || data.data.syncId) {
        // En mode dry-run ou si on a un ID de sync, traiter le résultat
        if (dryRun) {
          setCurrentSync(data.data);
        } else {
          // Polling pour suivre le statut
          pollSyncStatus(data.data.syncId);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const pollSyncStatus = async (syncId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/sync/status/${syncId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          const status = data.data;
          setCurrentSync(status);

          if (status.status === 'success' || status.status === 'error' || status.status === 'partial') {
            onSyncComplete?.(status);
            loadSyncHistory(); // Recharger l'historique
            return;
          }

          // Continuer le polling si en cours
          setTimeout(poll, 2000);
        }
      } catch (error) {
        log.error('Erreur lors du polling de synchronisation:', error);
        // Don't show notification for polling errors as they're frequent
      }
    };

    poll();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'partial':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-800';
      case 'partial':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-800';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900/20 dark:border-gray-800';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  return (
    <div className={`${themeClasses.container} rounded-lg space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ArrowPathIcon className="h-6 w-6 text-blue-500" />
          <h2 className={`text-xl font-semibold ${themeClasses.text.primary}`}>
            Synchronisation
          </h2>
        </div>

        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`p-2 rounded-lg ${themeClasses.button.secondary} border transition-colors`}
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Configuration avancée */}
      {showAdvanced && (
        <div className={`p-4 rounded-lg border ${themeClasses.card}`}>
          <h3 className={`font-medium ${themeClasses.text.primary} mb-4`}>
            Configuration
          </h3>

          <div className="space-y-4">
            {/* Services */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}>
                Services à synchroniser
              </label>
              <div className="flex flex-wrap gap-2">
                {['spotify', 'deezer', 'ytmusic', 'lidarr'].map((service) => (
                  <label key={service} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={syncConfig.services.includes(service)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSyncConfig(prev => ({
                            ...prev,
                            services: [...prev.services, service]
                          }));
                        } else {
                          setSyncConfig(prev => ({
                            ...prev,
                            services: prev.services.filter(s => s !== service)
                          }));
                        }
                      }}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                    <span className={`text-sm ${themeClasses.text.secondary} capitalize`}>
                      {service}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Options de synchronisation */}
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}>
                Éléments à synchroniser
              </label>
              <div className="space-y-2">
                {[
                  { key: 'syncPlaylists', label: 'Playlists' },
                  { key: 'syncHistory', label: 'Historique d\'écoute' },
                  { key: 'syncFavorites', label: 'Favoris' },
                  { key: 'syncLibrary', label: 'Bibliothèque' },
                  { key: 'resolveConflicts', label: 'Résoudre automatiquement les conflits' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={syncConfig[key as keyof typeof syncConfig] as boolean}
                      onChange={(e) => {
                        setSyncConfig(prev => ({
                          ...prev,
                          [key]: e.target.checked
                        }));
                      }}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                    <span className={`text-sm ${themeClasses.text.secondary}`}>
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Boutons de synchronisation */}
      <div className="flex space-x-3">
        <button
          onClick={() => startSync(false)}
          disabled={isLoading || currentSync?.status === 'in_progress'}
          className={`
            flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium
            ${themeClasses.button.primary} transition-colors
            ${(isLoading || currentSync?.status === 'in_progress') ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isLoading ? (
            <ArrowPathIcon className="h-5 w-5 animate-spin" />
          ) : (
            <PlayIcon className="h-5 w-5" />
          )}
          <span>Synchroniser</span>
        </button>

        <button
          onClick={() => startSync(true)}
          disabled={isLoading}
          className={`
            px-4 py-3 rounded-lg font-medium border transition-colors
            ${themeClasses.button.secondary}
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          Test
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div className="p-4 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <XCircleIcon className="h-5 w-5" />
            <span className="font-medium">Erreur de synchronisation</span>
          </div>
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Synchronisation actuelle */}
      {currentSync && (
        <div className={`p-4 rounded-lg border ${getStatusColor(currentSync.status)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getStatusIcon(currentSync.status)}
              <span className="font-medium">
                Synchronisation {currentSync.status === 'in_progress' ? 'en cours' : 'terminée'}
              </span>
            </div>
            <span className="text-sm">
              {formatDate(currentSync.startTime)}
            </span>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{currentSync.statistics.playlistsSynced}</div>
              <div className="text-sm opacity-75">Playlists</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{currentSync.statistics.favoritesSynced}</div>
              <div className="text-sm opacity-75">Favoris</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">{currentSync.statistics.conflictsResolved}</div>
              <div className="text-sm opacity-75">Conflits</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold">
                {currentSync.statistics.duration ? formatDuration(currentSync.statistics.duration) : '--'}
              </div>
              <div className="text-sm opacity-75">Durée</div>
            </div>
          </div>

          {/* Services */}
          <div className="flex flex-wrap gap-2">
            {currentSync.services.map((service) => (
              <span
                key={service}
                className="px-2 py-1 text-xs rounded-full bg-white/20 backdrop-blur-sm capitalize"
              >
                {service}
              </span>
            ))}
          </div>

          {/* Conflits */}
          {currentSync.conflicts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-current/20">
              <div className="flex items-center space-x-2 mb-2">
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Conflits détectés ({currentSync.conflicts.length})
                </span>
              </div>
              <div className="space-y-1">
                {currentSync.conflicts.slice(0, 3).map((conflict) => (
                  <div key={conflict.id} className="flex items-center justify-between text-sm">
                    <span className="opacity-75">{conflict.description}</span>
                    {conflict.resolved ? (
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                ))}
                {currentSync.conflicts.length > 3 && (
                  <div className="text-sm opacity-75">
                    ... et {currentSync.conflicts.length - 3} autres
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historique */}
      {syncHistory.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <ChartBarIcon className="h-5 w-5 text-slate-500" />
            <h3 className={`font-medium ${themeClasses.text.primary}`}>
              Historique récent
            </h3>
          </div>

          <div className="space-y-2">
            {syncHistory.slice(0, 5).map((sync) => (
              <div
                key={sync.syncId}
                className={`flex items-center justify-between p-3 rounded-lg border ${themeClasses.card}`}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(sync.status)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm font-medium ${themeClasses.text.primary}`}>
                        {formatDate(sync.startTime)}
                      </span>
                      {sync.statistics.duration && (
                        <span className={`text-xs ${themeClasses.text.muted}`}>
                          ({formatDuration(sync.statistics.duration)})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <span>{sync.statistics.playlistsSynced} playlists</span>
                      <span>•</span>
                      <span>{sync.statistics.favoritesSynced} favoris</span>
                      {sync.conflicts.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{sync.conflicts.length} conflits</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-1">
                  {sync.services.map((service) => (
                    <span
                      key={service}
                      className={`px-1.5 py-0.5 text-xs rounded ${themeClasses.text.muted} bg-slate-100 dark:bg-slate-700 capitalize`}
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
