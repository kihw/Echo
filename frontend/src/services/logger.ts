/**
 * Service de logging centralisé pour l'application Echo Music Player
 * Remplace les console.log/error par un système configurable
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: any;
  source?: string;
}

class Logger {
  private logLevel: LogLevel = 'info';
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Limite pour éviter les fuites mémoire

  constructor() {
    // Configurer le niveau de log selon l'environnement
    this.logLevel = this.isDevelopment ? 'debug' : 'warn';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[level] >= levels[this.logLevel];
  }

  private createLogEntry(level: LogLevel, message: string, context?: any, source?: string): LogEntry {
    return {
      level,
      message,
      timestamp: new Date(),
      context,
      source
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    
    // Maintenir la limite de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  debug(message: string, context?: any, source?: string) {
    if (!this.shouldLog('debug')) return;
    
    const entry = this.createLogEntry('debug', message, context, source);
    this.addLog(entry);
    
    if (this.isDevelopment && typeof window !== 'undefined') {
      // Only use console in development and when available
      // eslint-disable-next-line no-console
      console.debug(`[DEBUG] ${source ? `[${source}] ` : ''}${message}`, context || '');
    }
  }

  info(message: string, context?: any, source?: string) {
    if (!this.shouldLog('info')) return;
    
    const entry = this.createLogEntry('info', message, context, source);
    this.addLog(entry);
    
    if (this.isDevelopment && typeof window !== 'undefined') {
      // Only use console in development and when available
      // eslint-disable-next-line no-console
      console.info(`[INFO] ${source ? `[${source}] ` : ''}${message}`, context || '');
    }
  }

  warn(message: string, context?: any, source?: string) {
    if (!this.shouldLog('warn')) return;
    
    const entry = this.createLogEntry('warn', message, context, source);
    this.addLog(entry);
    
    if (this.isDevelopment && typeof window !== 'undefined') {
      // Only use console in development and when available
      // eslint-disable-next-line no-console
      console.warn(`[WARN] ${source ? `[${source}] ` : ''}${message}`, context || '');
    }
    
    // En production, envoyer à un service de monitoring
    if (!this.isDevelopment) {
      this.sendToMonitoring('warn', entry);
    }
  }

  error(message: string, context?: any, source?: string) {
    if (!this.shouldLog('error')) return;
    
    const entry = this.createLogEntry('error', message, context, source);
    this.addLog(entry);
    
    // Always log errors, but conditionally use console
    if (typeof window !== 'undefined' || this.isDevelopment) {
      // eslint-disable-next-line no-console
      console.error(`[ERROR] ${source ? `[${source}] ` : ''}${message}`, context || '');
    }
    
    // En production, envoyer à un service de monitoring
    if (!this.isDevelopment) {
      this.sendToMonitoring('error', entry);
    }
  }

  private sendToMonitoring(_level: 'warn' | 'error', _entry: LogEntry) {
    // Placeholder pour intégration future avec Sentry, LogRocket, etc.
    // window.Sentry?.captureMessage(entry.message, level);
  }

  // Obtenir les logs récents (utile pour debug en développement)
  getRecentLogs(count = 20): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Nettoyer les logs (utile pour les tests)
  clearLogs() {
    this.logs = [];
  }

  // Configurer le niveau de log
  setLogLevel(level: LogLevel) {
    this.logLevel = level;
  }
}

// Instance singleton
const logger = new Logger();

export default logger;

// Utilitaires pour faciliter l'usage
export const log = {
  debug: (message: string, context?: any, source?: string) => logger.debug(message, context, source),
  info: (message: string, context?: any, source?: string) => logger.info(message, context, source),
  warn: (message: string, context?: any, source?: string) => logger.warn(message, context, source),
  error: (message: string, context?: any, source?: string) => logger.error(message, context, source)
};
