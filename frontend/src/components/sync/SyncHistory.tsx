'use client';

import { useState } from 'react';
import { CheckCircle, AlertCircle, Clock, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

interface SyncHistoryItem {
  id: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  results?: {
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

interface SyncHistoryProps {
  history: SyncHistoryItem[];
  onRefresh: () => void;
}

export default function SyncHistory({ history, onRefresh }: SyncHistoryProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusIcon = (status: string, errors?: number) => {
    switch (status) {
      case 'completed':
        return errors && errors > 0
          ? <AlertCircle className="w-5 h-5 text-orange-500" />
          : <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string, errors?: number) => {
    switch (status) {
      case 'completed':
        return errors && errors > 0 ? 'Terminée avec erreurs' : 'Terminée';
      case 'failed':
        return 'Échouée';
      case 'running':
        return 'En cours';
      default:
        return 'Inconnue';
    }
  };

  const getStatusColor = (status: string, errors?: number) => {
    switch (status) {
      case 'completed':
        return errors && errors > 0
          ? 'text-orange-600 dark:text-orange-400'
          : 'text-green-600 dark:text-green-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'running':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const formatDuration = (startedAt: string, completedAt?: string) => {
    const start = new Date(startedAt);
    const end = completedAt ? new Date(completedAt) : new Date();
    const duration = end.getTime() - start.getTime();

    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  if (history.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center border dark:border-gray-700">
        <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Aucun historique
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Aucune synchronisation n'a encore été effectuée
        </p>
        <button
          onClick={onRefresh}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 mx-auto transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Historique ({history.length})
        </h3>
        <button
          onClick={onRefresh}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title="Actualiser"
        >
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Liste */}
      <div className="divide-y dark:divide-gray-700">
        {history.map((item) => {
          const isExpanded = expandedItems.has(item.id);
          const errors = item.results?.summary?.errors || 0;

          return (
            <div key={item.id} className="p-6">
              {/* Ligne principale */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpanded(item.id)}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(item.status, errors)}
                  <div>
                    <div className={`font-medium ${getStatusColor(item.status, errors)}`}>
                      {getStatusText(item.status, errors)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(item.startedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Résumé rapide */}
                  {item.results && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 text-right">
                      <div>{item.results.summary.totalTracks} tracks</div>
                      <div>{formatDuration(item.startedAt, item.completedAt)}</div>
                    </div>
                  )}

                  {/* Chevron */}
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Détails expandés */}
              {isExpanded && item.results && (
                <div className="mt-4 pt-4 border-t dark:border-gray-700">
                  {/* Statistiques */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-blue-500">
                        {item.results.summary.totalPlaylists}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Playlists</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-500">
                        {item.results.summary.totalTracks}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Tracks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-purple-500">
                        {item.results.summary.totalArtists}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Artistes</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${errors > 0 ? 'text-red-500' : 'text-green-500'
                        }`}>
                        {errors}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Erreurs</div>
                    </div>
                  </div>

                  {/* Services */}
                  {item.results.services && Object.keys(item.results.services).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Services synchronisés
                      </h4>
                      <div className="space-y-2">
                        {Object.entries(item.results.services).map(([serviceName, serviceData]: [string, any]) => (
                          <div key={serviceName} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <span className="capitalize font-medium text-gray-700 dark:text-gray-300">
                              {serviceName}
                            </span>
                            <div className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                              {serviceData.playlists !== undefined && (
                                <span>{serviceData.playlists} playlists</span>
                              )}
                              {serviceData.tracks !== undefined && (
                                <span>{serviceData.tracks} tracks</span>
                              )}
                              {serviceData.artists !== undefined && (
                                <span>{serviceData.artists} artistes</span>
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
