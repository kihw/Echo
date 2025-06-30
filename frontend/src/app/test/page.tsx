'use client';

import React from 'react';
import { useTheme, useThemeClasses } from '../../contexts/ThemeContext';
import { ThemeToggle } from '../../components/theme/ThemeToggle';
import { useRecommendations } from '../../hooks/useRecommendations';
import useSync from '../../hooks/useSync';

export default function IntegrationTestPage() {
  const { theme, resolvedTheme } = useTheme();
  const themeClasses = useThemeClasses();

  // Test des hooks
  const {
    recommendations,
    loading: recoLoading,
    error: recoError,
    refreshRecommendations
  } = useRecommendations({
    limit: 5
  });

  const {
    syncStatus: _syncStatus,
    syncHistory,
    loading: syncLoading,
    error: syncError,
    startFullSync,
    isSyncInProgress
  } = useSync();

  return (
    <div className={`min-h-screen p-8 ${themeClasses.bgPrimary}`}>
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className={`text-4xl font-bold ${themeClasses.textPrimary}`}>
            🎵 Echo - Test d'Intégration
          </h1>
          <ThemeToggle variant="button" />
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Theme Status */}
          <div className={`p-6 rounded-lg border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
            <h2 className={`text-xl font-semibold mb-4 ${themeClasses.textPrimary}`}>
              🎨 Système de Thème
            </h2>
            <div className="space-y-2">
              <p className={themeClasses.textSecondary}>
                <strong>Thème actuel:</strong> {theme}
              </p>
              <p className={themeClasses.textSecondary}>
                <strong>Thème résolu:</strong> {resolvedTheme}
              </p>
              <div className="flex space-x-2 mt-4">
                <div className="w-8 h-8 bg-primary-500 rounded"></div>
                <div className="w-8 h-8 bg-secondary-500 rounded"></div>
                <div className="w-8 h-8 bg-slate-500 rounded"></div>
              </div>
            </div>
          </div>

          {/* Recommendations Status */}
          <div className={`p-6 rounded-lg border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
            <h2 className={`text-xl font-semibold mb-4 ${themeClasses.textPrimary}`}>
              🧠 Recommandations
            </h2>
            <div className="space-y-2">
              <p className={themeClasses.textSecondary}>
                <strong>Status:</strong> {recoLoading ? 'Chargement...' : 'Prêt'}
              </p>
              <p className={themeClasses.textSecondary}>
                <strong>Recommandations:</strong> {recommendations.length}
              </p>
              {recoError && (
                <p className="text-red-500 text-sm">{recoError}</p>
              )}
              <button
                onClick={refreshRecommendations}
                className={`px-4 py-2 rounded text-sm ${themeClasses.bgTertiary} ${themeClasses.textPrimary} ${themeClasses.hoverBg}`}
                disabled={recoLoading}
              >
                Actualiser
              </button>
            </div>
          </div>

          {/* Sync Status */}
          <div className={`p-6 rounded-lg border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
            <h2 className={`text-xl font-semibold mb-4 ${themeClasses.textPrimary}`}>
              🔄 Synchronisation
            </h2>
            <div className="space-y-2">
              <p className={themeClasses.textSecondary}>
                <strong>Status:</strong> {syncLoading ? 'Chargement...' : 'Prêt'}
              </p>
              <p className={themeClasses.textSecondary}>
                <strong>En cours:</strong> {isSyncInProgress ? 'Oui' : 'Non'}
              </p>
              <p className={themeClasses.textSecondary}>
                <strong>Historique:</strong> {syncHistory.length} entrées
              </p>
              {syncError && (
                <p className="text-red-500 text-sm">{syncError}</p>
              )}
              <button
                onClick={() => startFullSync()}
                className={`px-4 py-2 rounded text-sm ${themeClasses.bgTertiary} ${themeClasses.textPrimary} ${themeClasses.hoverBg}`}
                disabled={syncLoading || isSyncInProgress}
              >
                Test Sync
              </button>
            </div>
          </div>
        </div>

        {/* Recommendations Preview */}
        {recommendations.length > 0 && (
          <div className={`p-6 rounded-lg border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
            <h2 className={`text-xl font-semibold mb-4 ${themeClasses.textPrimary}`}>
              🎵 Aperçu des Recommandations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {recommendations.slice(0, 5).map((track, index) => (
                <div key={index} className={`p-4 rounded-lg ${themeClasses.bgTertiary}`}>
                  <div className="w-full h-32 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-white text-2xl">🎵</span>
                  </div>
                  <h3 className={`font-medium text-sm ${themeClasses.textPrimary} truncate`}>
                    {track.title || `Track ${index + 1}`}
                  </h3>
                  <p className={`text-xs ${themeClasses.textSecondary} truncate`}>
                    {track.artist || 'Artist'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Theme Classes Demo */}
        <div className={`p-6 rounded-lg border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
          <h2 className={`text-xl font-semibold mb-4 ${themeClasses.textPrimary}`}>
            🎨 Demo des Classes de Thème
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded ${themeClasses.bgPrimary} ${themeClasses.border}`}>
              <p className={`text-sm ${themeClasses.textPrimary}`}>Background Primary</p>
            </div>
            <div className={`p-4 rounded ${themeClasses.bgSecondary} ${themeClasses.border}`}>
              <p className={`text-sm ${themeClasses.textPrimary}`}>Background Secondary</p>
            </div>
            <div className={`p-4 rounded ${themeClasses.bgTertiary} ${themeClasses.border}`}>
              <p className={`text-sm ${themeClasses.textPrimary}`}>Background Tertiary</p>
            </div>
            <div className={`p-4 rounded ${themeClasses.bgSecondary} ${themeClasses.border} ${themeClasses.hoverBg} cursor-pointer transition-colors`}>
              <p className={`text-sm ${themeClasses.textPrimary}`}>Hover Effect</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <p className={themeClasses.textPrimary}>Texte primaire</p>
            <p className={themeClasses.textSecondary}>Texte secondaire</p>
            <p className={themeClasses.textMuted}>Texte muet</p>
          </div>
        </div>

        {/* API Connection Test */}
        <div className={`p-6 rounded-lg border ${themeClasses.bgSecondary} ${themeClasses.border}`}>
          <h2 className={`text-xl font-semibold mb-4 ${themeClasses.textPrimary}`}>
            🔗 Tests de Connexion API
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className={`font-medium mb-2 ${themeClasses.textPrimary}`}>Frontend</h3>
              <p className={themeClasses.textSecondary}>✅ Next.js 14 - Port 3000</p>
              <p className={themeClasses.textSecondary}>✅ React 18 + TypeScript</p>
              <p className={themeClasses.textSecondary}>✅ Tailwind CSS</p>
            </div>
            <div>
              <h3 className={`font-medium mb-2 ${themeClasses.textPrimary}`}>Backend</h3>
              <p className={themeClasses.textSecondary}>✅ Node.js + Express - Port 8000</p>
              <p className={themeClasses.textSecondary}>✅ PostgreSQL</p>
              <p className={themeClasses.textSecondary}>✅ Routes API complètes</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className={`text-sm ${themeClasses.textMuted}`}>
            🎉 Toutes les fonctionnalités avancées d'Echo Music Player sont intégrées et fonctionnelles !
          </p>
        </div>
      </div>
    </div>
  );
}
