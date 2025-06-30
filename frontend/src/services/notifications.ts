/**
 * Service de notifications utilisateur pour Echo Music Player
 * Remplace les console.error par des notifications UX appropriées
 */

import { toast } from 'react-hot-toast';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

interface NotificationOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  id?: string;
}

class NotificationService {
  private defaultOptions: NotificationOptions = {
    duration: 4000,
    position: 'top-right'
  };

  success(message: string, options?: NotificationOptions) {
    return toast.success(message, {
      ...this.defaultOptions,
      ...options
    });
  }

  error(message: string, options?: NotificationOptions) {
    return toast.error(message, {
      ...this.defaultOptions,
      duration: 6000, // Erreurs restent plus longtemps
      ...options
    });
  }

  warning(message: string, options?: NotificationOptions) {
    return toast(message, {
      ...this.defaultOptions,
      icon: '⚠️',
      ...options
    });
  }

  info(message: string, options?: NotificationOptions) {
    return toast(message, {
      ...this.defaultOptions,
      icon: 'ℹ️',
      ...options
    });
  }

  loading(message: string, options?: NotificationOptions) {
    return toast.loading(message, {
      ...this.defaultOptions,
      ...options
    });
  }

  // Messages spécifiques au domaine musical
  syncSuccess(service: string) {
    this.success(`✅ Synchronisation ${service} réussie`);
  }

  syncError(service: string, error?: string) {
    this.error(`❌ Erreur de synchronisation ${service}${error ? `: ${error}` : ''}`);
  }

  trackAdded(trackName: string) {
    this.success(`🎵 "${trackName}" ajouté à la playlist`);
  }

  trackNotFound() {
    this.error('🔍 Piste introuvable');
  }

  networkError() {
    this.error('🌐 Problème de connexion réseau');
  }

  authError() {
    this.error('🔑 Erreur d\'authentification');
  }

  playbackError() {
    this.error('⏯️ Erreur de lecture audio');
  }

  // Dismiss notification
  dismiss(toastId?: string) {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }

  // Promise-based notifications
  async promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    },
    options?: NotificationOptions
  ): Promise<T> {
    return toast.promise(promise, messages, {
      ...this.defaultOptions,
      ...options
    });
  }
}

// Instance singleton
const notifications = new NotificationService();

export default notifications;

// Utilitaires pour faciliter l'usage
export const notify = {
  success: (message: string, options?: NotificationOptions) => notifications.success(message, options),
  error: (message: string, options?: NotificationOptions) => notifications.error(message, options),
  warning: (message: string, options?: NotificationOptions) => notifications.warning(message, options),
  info: (message: string, options?: NotificationOptions) => notifications.info(message, options),
  loading: (message: string, options?: NotificationOptions) => notifications.loading(message, options),
  dismiss: (toastId?: string) => notifications.dismiss(toastId),
  
  // Domain-specific
  sync: {
    success: (service: string) => notifications.syncSuccess(service),
    error: (service: string, error?: string) => notifications.syncError(service, error)
  },
  
  track: {
    added: (name: string) => notifications.trackAdded(name),
    notFound: () => notifications.trackNotFound()
  },
  
  network: {
    error: () => notifications.networkError()
  },
  
  auth: {
    error: () => notifications.authError()
  },
  
  playback: {
    error: () => notifications.playbackError()
  }
};
