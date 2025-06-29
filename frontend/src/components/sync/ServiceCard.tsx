'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Wifi, RotateCcw, ExternalLink, Loader2 } from 'lucide-react';

interface Service {
  name: string;
  connected: boolean;
  lastSync?: string;
  status: 'connected' | 'disconnected' | 'error';
}

interface ServiceCardProps {
  service: Service;
  onSync: () => void;
  onConnect: () => void;
  disabled?: boolean;
}

const serviceConfig = {
  spotify: {
    displayName: 'Spotify',
    icon: '🎵',
    color: 'green',
    description: 'Synchroniser vos playlists Spotify'
  },
  deezer: {
    displayName: 'Deezer',
    icon: '🎶',
    color: 'orange',
    description: 'Synchroniser vos playlists Deezer'
  },
  youtube: {
    displayName: 'YouTube Music',
    icon: '📺',
    color: 'red',
    description: 'Synchroniser YouTube Music'
  },
  lidarr: {
    displayName: 'Lidarr',
    icon: '📚',
    color: 'purple',
    description: 'Synchroniser votre collection locale'
  }
};

export default function ServiceCard({ service, onSync, onConnect, disabled = false }: ServiceCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const config = serviceConfig[service.name as keyof typeof serviceConfig];
  if (!config) return null;

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await onSync();
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = () => {
    onConnect();
  };

  const getStatusIcon = () => {
    switch (service.status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Wifi className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (service.status) {
      case 'connected':
        return 'Connecté';
      case 'error':
        return 'Erreur';
      default:
        return 'Non connecté';
    }
  };

  const getStatusColor = () => {
    switch (service.status) {
      case 'connected':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {config.displayName}
            </h3>
            <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
              {getStatusIcon()}
              {getStatusText()}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {config.description}
      </p>

      {/* Dernière sync */}
      {service.lastSync && service.connected && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Dernière sync: {new Date(service.lastSync).toLocaleDateString()}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {service.connected ? (
          <button
            onClick={handleSync}
            disabled={disabled || isLoading}
            className={`w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${config.color === 'green'
                ? 'bg-green-500 hover:bg-green-600 disabled:bg-gray-400'
                : config.color === 'orange'
                  ? 'bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400'
                  : config.color === 'red'
                    ? 'bg-red-500 hover:bg-red-600 disabled:bg-gray-400'
                    : 'bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400'
              } text-white`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            {isLoading ? 'Synchronisation...' : 'Synchroniser'}
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={disabled}
            className="w-full px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white"
          >
            <ExternalLink className="w-4 h-4" />
            Connecter
          </button>
        )}
      </div>

      {/* Indicateur de statut */}
      <div className="mt-3 flex justify-center">
        <div className={`w-2 h-2 rounded-full ${service.status === 'connected'
            ? 'bg-green-500'
            : service.status === 'error'
              ? 'bg-red-500'
              : 'bg-gray-400'
          }`} />
      </div>
    </div>
  );
}
