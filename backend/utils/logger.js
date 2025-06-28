const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Créer le dossier de logs s'il n'existe pas
const logDirectory = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true });
}

// Configuration des formats de log
const logFormat = winston.format.combine(
    winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
        format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level}] ${message}`;

        // Ajouter les métadonnées si présentes
        if (Object.keys(meta).length > 0) {
            log += ' ' + JSON.stringify(meta, null, 2);
        }

        return log;
    })
);

// Configuration du logger principal
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'echo-music-player' },
    transports: [
        // Fichier pour tous les logs
        new winston.transports.File({
            filename: path.join(logDirectory, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),

        // Fichier pour les erreurs uniquement
        new winston.transports.File({
            filename: path.join(logDirectory, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),

        // Fichier pour les API calls
        new winston.transports.File({
            filename: path.join(logDirectory, 'api.log'),
            level: 'debug',
            maxsize: 5242880, // 5MB
            maxFiles: 3
        })
    ]
});

// Ajouter la console en développement
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}

// Logger spécialisé pour les requêtes HTTP
const requestLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'echo-api-requests' },
    transports: [
        new winston.transports.File({
            filename: path.join(logDirectory, 'requests.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 3
        })
    ]
});

// Logger spécialisé pour les services externes (Spotify, Deezer, etc.)
const externalServiceLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'echo-external-services' },
    transports: [
        new winston.transports.File({
            filename: path.join(logDirectory, 'external-services.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 3
        })
    ]
});

// Logger spécialisé pour la base de données
const databaseLogger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'echo-database' },
    transports: [
        new winston.transports.File({
            filename: path.join(logDirectory, 'database.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 3
        })
    ]
});

// Middleware pour logger les requêtes Express
const requestLoggerMiddleware = (req, res, next) => {
    const start = Date.now();

    // Logger la requête entrante
    requestLogger.info('Incoming request', {
        method: req.method,
        url: req.url,
        userAgent: req.get('user-agent'),
        ip: req.ip,
        requestId: req.requestId
    });

    // Capturer la réponse
    const originalSend = res.send;
    res.send = function (data) {
        const duration = Date.now() - start;

        requestLogger.info('Request completed', {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration: `${duration}ms`,
            requestId: req.requestId,
            responseSize: Buffer.byteLength(data || '', 'utf8')
        });

        return originalSend.call(this, data);
    };

    next();
};

// Fonction pour logger les erreurs de service externe
const logExternalServiceError = (serviceName, operation, error, context = {}) => {
    externalServiceLogger.error(`${serviceName} ${operation} failed`, {
        service: serviceName,
        operation,
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        context
    });
};

// Fonction pour logger les succès de service externe
const logExternalServiceSuccess = (serviceName, operation, context = {}) => {
    externalServiceLogger.info(`${serviceName} ${operation} success`, {
        service: serviceName,
        operation,
        context
    });
};

// Fonction pour logger les opérations de base de données
const logDatabaseOperation = (operation, query, duration, context = {}) => {
    databaseLogger.info(`Database ${operation}`, {
        operation,
        query: query.substring(0, 200), // Limiter la taille du log
        duration: `${duration}ms`,
        context
    });
};

// Fonction pour logger les erreurs de base de données
const logDatabaseError = (operation, query, error, context = {}) => {
    databaseLogger.error(`Database ${operation} failed`, {
        operation,
        query: query.substring(0, 200),
        error: error.message,
        code: error.code,
        context
    });
};

// Stream pour Morgan (logging HTTP)
const stream = {
    write: (message) => {
        requestLogger.info(message.trim());
    }
};

// Configuration Morgan pour les requêtes HTTP
const morganConfig = 'combined';

module.exports = {
    logger,
    requestLogger,
    externalServiceLogger,
    databaseLogger,
    requestLoggerMiddleware,
    logExternalServiceError,
    logExternalServiceSuccess,
    logDatabaseOperation,
    logDatabaseError,
    stream,
    morganConfig
};
