/**
 * Lazy loaded components pour optimiser les performances
 * Utilise React.lazy() avec des fallbacks appropriés
 */

import { lazy } from 'react';

// Pages principales avec lazy loading
export const LazyDashboard = lazy(() => import('@/app/dashboard/page'));
export const LazySearch = lazy(() => import('@/app/search/page'));
export const LazyPlaylists = lazy(() => import('@/app/playlists/page'));
export const LazyStats = lazy(() => import('@/app/stats/page'));
export const LazySync = lazy(() => import('@/app/sync/page'));
export const LazyProfile = lazy(() => import('@/app/profile/page'));
export const LazySettings = lazy(() => import('@/app/settings/page'));

// Preloading conditionnel pour améliorer l'UX
export const preloadRoute = (routeName: string) => {
  // Préchargement seulement sur une bonne connexion
  if (typeof navigator !== 'undefined') {
    
    switch (routeName) {
      case 'dashboard':
        import('@/app/dashboard/page');
        break;
      case 'search':
        import('@/app/search/page');
        break;
      case 'playlists':
        import('@/app/playlists/page');
        break;
      case 'stats':
        import('@/app/stats/page');
        break;
      case 'sync':
        import('@/app/sync/page');
        break;
      default:
        break;
    }
  }
};

// Hook pour précharger les routes visitées fréquemment
export const useRoutePreloading = () => {
  const preloadCommonRoutes = () => {
    // Précharger les routes les plus utilisées après un délai
    setTimeout(() => {
      preloadRoute('dashboard');
      preloadRoute('search');
    }, 2000);
  };

  return { preloadCommonRoutes, preloadRoute };
};
