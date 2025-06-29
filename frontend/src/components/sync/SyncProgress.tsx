'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, CheckCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface SyncStatus {
  inProgress: boolean;
  lastSyncTime?: string;
  lastResults?: {
    syncId: string;
    status: string;
    summary: {
      totalPlaylists: number;
      totalTracks: number;
      totalArtists: number;
      errors: number;
    };
    services: Record<string, any>;
    duration?: number;
  };
}

interface SyncProgressProps {
  syncStatus: SyncStatus;
  onRefresh: () => void;
}

export default function SyncProgress({ syncStatus, onRefresh }: SyncProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Initialisation...');

  useEffect(() => {
    if (syncStatus.inProgress) {
      // Simuler le progrès de synchronisation
      const steps = [
        'Initialisation...',
        'Connexion aux services...',
        'Synchronisation Spotify...',
        'Synchronisation Deezer...',
        'Synchronisation YouTube Music...',
        'Synchronisation Lidarr...',
        'Finalisation...'
      ];

      let currentStepIndex = 0;
      setProgress(0);
      setCurrentStep(steps[0]);

      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 5;

          // Changer l'étape en cours
          const stepProgress = Math.floor((newProgress / 100) * steps.length);
          if (stepProgress < steps.length && stepProgress !== currentStepIndex) {
            currentStepIndex = stepProgress;
            setCurrentStep(steps[stepProgress]);
          }

          return Math.min(newProgress, 95); // Ne jamais atteindre 100% pendant la sync
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setProgress(100);
      setCurrentStep('Synchronisation terminée');
    }
  }, [syncStatus.inProgress]);

  const getStatusIcon = () => {
    if (syncStatus.inProgress) {
      return <RotateCcw className="w-6 h-6 animate-spin text-blue-500" />;
    }

    if (syncStatus.lastResults) {
      return syncStatus.lastResults.summary.errors > 0
        ? <AlertCircle className="w-6 h-6 text-orange-500" />
        : <CheckCircle className="w-6 h-6 text-green-500" />;
    }

    return <Clock className="w-6 h-6 text-gray-400" />;
  };

  const getStatusText = () => {
    if (syncStatus.inProgress) {
      return 'Synchronisation en cours';
    }

    if (syncStatus.lastResults) {
      return syncStatus.lastResults.summary.errors > 0
        ? 'Terminée avec des erreurs'
        : 'Terminée avec succès';
    }

    return 'En attente';
  };

  const getStatusColor = () => {
    if (syncStatus.inProgress) {
      return 'text-blue-600 dark:text-blue-400';
    }

    if (syncStatus.lastResults) {
      return syncStatus.lastResults.summary.errors > 0
        ? 'text-orange-600 dark:text-orange-400'
        : 'text-green-600 dark:text-green-400';
    }

    return 'text-gray-600 dark:text-gray-400';
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {getStatusText()}
            </h3>
            <p className={`text-sm ${getStatusColor()}`}>
              {currentStep}
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Actualiser"
        >
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progression</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${syncStatus.inProgress
                ? 'bg-blue-500'
                : (syncStatus.lastResults?.summary.errors || 0) > 0
                  ? 'bg-orange-500'
                  : 'bg-green-500'
              }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Statistiques de synchronisation */}
      {syncStatus.lastResults && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-blue-500">
              {syncStatus.lastResults.summary.totalPlaylists}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Playlists</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-green-500">
              {syncStatus.lastResults.summary.totalTracks}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Tracks</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-purple-500">
              {syncStatus.lastResults.summary.totalArtists}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Artistes</div>
          </div>
          <div>
            <div className={`text-lg font-semibold ${syncStatus.lastResults.summary.errors > 0 ? 'text-red-500' : 'text-green-500'
              }`}>
              {syncStatus.lastResults.summary.errors}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Erreurs</div>
          </div>
        </div>
      )}

      {/* Durée */}
      {syncStatus.lastResults?.duration && (
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Durée: {formatDuration(syncStatus.lastResults.duration)}
        </div>
      )}

      {/* Services détaillés */}
      {syncStatus.lastResults?.services && Object.keys(syncStatus.lastResults.services).length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Détails par service
          </h4>
          <div className="space-y-2">
            {Object.entries(syncStatus.lastResults.services).map(([serviceName, serviceData]: [string, any]) => (
              <div key={serviceName} className="flex justify-between items-center text-sm">
                <span className="capitalize text-gray-700 dark:text-gray-300">
                  {serviceName}
                </span>
                <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                  {serviceData.playlists && (
                    <span>{serviceData.playlists} playlists</span>
                  )}
                  {serviceData.tracks && (
                    <span>{serviceData.tracks} tracks</span>
                  )}
                  {serviceData.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  {serviceData.status === 'success' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
