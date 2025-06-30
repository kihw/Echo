/**
 * Service de gestion de la mémoire pour éviter les fuites
 * Monitoring et nettoyage automatique
 */

import React from 'react';
import { log } from './logger';

interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface MemoryAlert {
  level: 'warning' | 'critical';
  usage: number;
  threshold: number;
  timestamp: Date;
}

class MemoryManager {
  private listeners = new Set<() => void>();
  private timers = new Set<any>();
  private observers = new Set<IntersectionObserver | MutationObserver | ResizeObserver>();
  private abortControllers = new Set<AbortController>();
  private monitoringInterval?: any;
  
  private readonly WARNING_THRESHOLD = 0.8; // 80% de la mémoire
  private readonly CRITICAL_THRESHOLD = 0.9; // 90% de la mémoire
  private readonly CHECK_INTERVAL = 30000; // 30 secondes

  constructor() {
    this.startMonitoring();
    this.setupPageUnloadCleanup();
  }

  private startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.CHECK_INTERVAL);
  }

  private checkMemoryUsage() {
    if (!('memory' in performance)) return;

    const memory = (performance as any).memory as MemoryUsage;
    const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

    if (usage > this.CRITICAL_THRESHOLD) {
      this.handleMemoryAlert({
        level: 'critical',
        usage,
        threshold: this.CRITICAL_THRESHOLD,
        timestamp: new Date()
      });
    } else if (usage > this.WARNING_THRESHOLD) {
      this.handleMemoryAlert({
        level: 'warning',
        usage,
        threshold: this.WARNING_THRESHOLD,
        timestamp: new Date()
      });
    }
  }

  private handleMemoryAlert(alert: MemoryAlert) {
    log.warn(`Alerte mémoire ${alert.level}`, {
      usage: `${(alert.usage * 100).toFixed(1)}%`,
      threshold: `${(alert.threshold * 100).toFixed(1)}%`
    }, 'MemoryManager');

    if (alert.level === 'critical') {
      this.forceCleanup();
    }
  }

  private setupPageUnloadCleanup() {
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // Cleanup on page visibility change (mobile)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.softCleanup();
      }
    });
  }

  // Enregistrer des ressources pour nettoyage automatique
  registerEventListener(
    element: EventTarget,
    event: string,
    handler: any,
    options?: any
  ): () => void {
    element.addEventListener(event, handler, options);
    
    const cleanup = () => {
      element.removeEventListener(event, handler, options);
      this.listeners.delete(cleanup);
    };
    
    this.listeners.add(cleanup);
    return cleanup;
  }

  registerTimer(timer: any): void {
    this.timers.add(timer);
  }

  registerObserver(observer: IntersectionObserver | MutationObserver | ResizeObserver): void {
    this.observers.add(observer);
  }

  registerAbortController(controller: AbortController): void {
    this.abortControllers.add(controller);
  }

  // Nettoyage manuel de ressources spécifiques
  unregisterTimer(timer: any): void {
    clearTimeout(timer);
    clearInterval(timer);
    this.timers.delete(timer);
  }

  unregisterObserver(observer: IntersectionObserver | MutationObserver | ResizeObserver): void {
    observer.disconnect();
    this.observers.delete(observer);
  }

  unregisterAbortController(controller: AbortController): void {
    controller.abort();
    this.abortControllers.delete(controller);
  }

  // Nettoyage doux (garde les ressources essentielles)
  private softCleanup(): void {
    // Clear expired timers only
    this.timers.forEach(_timer => {
      // Note: Impossible de vérifier si un timer est expiré sans état supplémentaire
      // Pour l'instant, on garde tous les timers actifs
    });

    // Force garbage collection if available (dev tools)
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  // Nettoyage complet (urgence mémoire)
  private forceCleanup(): void {
    log.info('Nettoyage forcé de la mémoire', undefined, 'MemoryManager');

    // Clear all timers
    this.timers.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    this.timers.clear();

    // Disconnect all observers
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();

    // Abort all controllers
    this.abortControllers.forEach(controller => {
      controller.abort();
    });
    this.abortControllers.clear();

    // Force garbage collection
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  // Nettoyage complet à la fermeture
  cleanup(): void {
    log.info('Nettoyage complet de la mémoire', undefined, 'MemoryManager');

    // Stop monitoring
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    // Remove all listeners
    this.listeners.forEach(cleanup => cleanup());
    this.listeners.clear();

    this.forceCleanup();
  }

  // Obtenir les statistiques mémoire
  getMemoryStats(): MemoryUsage | null {
    if (!('memory' in performance)) return null;
    
    return (performance as any).memory as MemoryUsage;
  }

  // Obtenir un rapport détaillé
  getDetailedReport() {
    const memory = this.getMemoryStats();
    
    return {
      memory: memory ? {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(1)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(1)} MB`,
        usage: memory ? `${((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(1)}%` : 'N/A'
      } : null,
      resources: {
        listeners: this.listeners.size,
        timers: this.timers.size,
        observers: this.observers.size,
        abortControllers: this.abortControllers.size
      }
    };
  }
}

// Instance singleton
export const memoryManager = new MemoryManager();

// Hook React pour la gestion automatique des ressources
export function useMemoryCleanup() {
  const cleanup = () => {
    // Cleanup spécifique au composant si nécessaire
  };

  React.useEffect(() => {
    return cleanup;
  }, []);

  return {
    registerEventListener: memoryManager.registerEventListener.bind(memoryManager),
    registerTimer: memoryManager.registerTimer.bind(memoryManager),
    registerObserver: memoryManager.registerObserver.bind(memoryManager),
    registerAbortController: memoryManager.registerAbortController.bind(memoryManager)
  };
}

export default memoryManager;
