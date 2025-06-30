/**
 * Error Boundary React pour capturer et gérer les erreurs d'interface
 * Conforme aux best practices React et logging centralisé
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { log } from '../../services/logger';
import { notify } from '../../services/notifications';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Met à jour le state pour afficher l'UI de fallback au prochain rendu
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log l'erreur de manière centralisée
    log.error('React Error Boundary déclenché', {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack
      }
    }, 'ErrorBoundary');

    // Notification utilisateur discrète
    notify.error('Une erreur inattendue s\'est produite. L\'équipe a été notifiée.');

    // Callback optionnel pour traitement personnalisé
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // En production, envoyer à un service de monitoring
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(error, errorInfo);
    }

    // Stocker les détails pour debug
    this.setState({ error, errorInfo });
  }

  private sendToMonitoring(_error: Error, _errorInfo: ErrorInfo) {
    // Placeholder pour intégration future avec Sentry, LogRocket, etc.
    // window.Sentry?.captureException(error, {
    //   contexts: {
    //     react: {
    //       componentStack: errorInfo.componentStack
    //     }
    //   }
    // });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI personnalisé ou par défaut
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 text-red-500">
                <svg
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  className="h-12 w-12"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Oups, quelque chose s'est mal passé
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Une erreur inattendue s'est produite. Notre équipe a été automatiquement notifiée.
              </p>
              
              {/* Détails d'erreur pour développement */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Détails techniques (dev)
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap text-xs text-red-600 bg-red-50 p-3 rounded border">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Réessayer
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Recharger la page
              </button>
              
              <a
                href="/"
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-center"
              >
                Retour à l'accueil
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook pour utiliser Error Boundary avec des hooks
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    log.error('Erreur gérée manuellement', { error, errorInfo }, 'useErrorHandler');
    notify.error('Une erreur s\'est produite lors de cette action.');
  };
}

// HOC pour wrapper automatiquement les composants
export function withErrorBoundary<P = {}>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...(props as any)} />
      </ErrorBoundary>
    );
  };
}

// Composant d'erreur spécialisé pour les fonctionnalités spécifiques
export function MusicPlayerErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 mb-2">
              Erreur du lecteur audio
            </h3>
            <p className="text-sm text-red-600">
              Le lecteur audio a rencontré un problème. Essayez de recharger la page.
            </p>
          </div>
        </div>
      }
      onError={(error, errorInfo) => {
        log.error('Erreur dans le lecteur audio', { error, errorInfo }, 'MusicPlayerErrorBoundary');
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
