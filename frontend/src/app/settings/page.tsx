'use client';

import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useState } from 'react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(user?.preferences || {
    theme: 'system',
    language: 'fr',
    autoplay: true,
    crossfade: false,
    volume: 0.8,
  });

  const handleSave = async () => {
    try {
      // TODO: Implement preferences update API call
      console.log('Update preferences with:', preferences);
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres</h1>

            <div className="space-y-8">
              {/* Appearance */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Apparence</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thème
                    </label>
                    <select
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value as 'light' | 'dark' | 'system' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                      style={{ color: '#334155' }}
                    >
                      <option value="light">Clair</option>
                      <option value="dark">Sombre</option>
                      <option value="system">Système</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Langue
                    </label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
                      style={{ color: '#334155' }}
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                      <option value="es">Español</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Playback */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Lecture</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Lecture automatique
                      </label>
                      <p className="text-sm text-gray-500">
                        Lancer automatiquement la musique au démarrage
                      </p>
                    </div>
                    <button
                      onClick={() => setPreferences({ ...preferences, autoplay: !preferences.autoplay })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.autoplay ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.autoplay ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Crossfade
                      </label>
                      <p className="text-sm text-gray-500">
                        Transition en fondu entre les morceaux
                      </p>
                    </div>
                    <button
                      onClick={() => setPreferences({ ...preferences, crossfade: !preferences.crossfade })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${preferences.crossfade ? 'bg-primary-600' : 'bg-gray-200'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${preferences.crossfade ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Volume par défaut: {Math.round(preferences.volume * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={preferences.volume}
                      onChange={(e) => setPreferences({ ...preferences, volume: parseFloat(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              </div>

              {/* Privacy */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Confidentialité</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Historique d'écoute
                      </label>
                      <p className="text-sm text-gray-500">
                        Enregistrer votre historique d'écoute pour les recommandations
                      </p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Partage de données
                      </label>
                      <p className="text-sm text-gray-500">
                        Partager des données anonymes pour améliorer le service
                      </p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Nouvelles sorties
                      </label>
                      <p className="text-sm text-gray-500">
                        Être notifié des nouvelles sorties d'artistes suivis
                      </p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Playlists partagées
                      </label>
                      <p className="text-sm text-gray-500">
                        Être notifié quand quelqu'un partage une playlist avec vous
                      </p>
                    </div>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Management */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Gestion des données</h2>
                <div className="space-y-4">
                  <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-left">
                    Exporter mes données
                  </button>
                  <button className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 text-left">
                    Supprimer mon compte
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Sauvegarder les paramètres
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
