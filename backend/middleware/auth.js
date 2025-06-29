const jwt = require('jsonwebtoken');
const db = require('../../database/connection');

// Middleware d'authentification JWT
const authMiddleware = async (req, res, next) => {
    try {
        // Récupération du token depuis l'en-tête Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                error: 'Token manquant',
                message: 'Token d\'authentification requis',
                code: 'AUTH_TOKEN_MISSING'
            });
        }

        // Vérification du format "Bearer TOKEN"
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;

        if (!token) {
            return res.status(401).json({
                error: 'Token invalide',
                message: 'Format de token invalide',
                code: 'AUTH_TOKEN_INVALID_FORMAT'
            });
        }

        // Vérification et décodage du token JWT
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    error: 'Token expiré',
                    message: 'Token d\'authentification expiré',
                    code: 'AUTH_TOKEN_EXPIRED'
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    error: 'Token invalide',
                    message: 'Token d\'authentification invalide',
                    code: 'AUTH_TOKEN_INVALID'
                });
            } else {
                throw jwtError;
            }
        }

        // Vérification de la structure du payload
        if (!decoded.userId || !decoded.email) {
            return res.status(401).json({
                error: 'Token malformé',
                message: 'Payload du token invalide',
                code: 'AUTH_TOKEN_MALFORMED'
            });
        }

        let user;

        // En mode développement, vérifier les utilisateurs de test
        if (process.env.NODE_ENV === 'development') {
            const TEST_USERS = [
                {
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    email: 'test@echo.com',
                    username: 'testuser',
                    display_name: 'Utilisateur Test',
                    is_active: true,
                    email_verified: true,
                    preferences: {
                        theme: 'system',
                        language: 'fr',
                        autoplay: true,
                        crossfade: false,
                        volume: 0.8
                    },
                    connected_services: [],
                    created_at: new Date().toISOString()
                },
                {
                    id: '550e8400-e29b-41d4-a716-446655440001',
                    email: 'admin@echo.com',
                    username: 'admin',
                    display_name: 'Admin Echo',
                    is_active: true,
                    email_verified: true,
                    preferences: {
                        theme: 'dark',
                        language: 'fr',
                        autoplay: true,
                        crossfade: true,
                        volume: 0.9
                    },
                    connected_services: [],
                    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
                }
            ];

            const testUser = TEST_USERS.find(u => u.id === decoded.userId && u.email === decoded.email);
            if (testUser) {
                user = testUser;
            }
        }

        if (!user) {
            // Récupération des informations utilisateur depuis la base de données
            user = await db.findById('users', decoded.userId);

            if (!user) {
                return res.status(401).json({
                    error: 'Utilisateur introuvable',
                    message: 'L\'utilisateur associé au token n\'existe plus',
                    code: 'AUTH_USER_NOT_FOUND'
                });
            }
        }

        // Vérification que l'utilisateur est actif
        if (!user.is_active) {
            return res.status(401).json({
                error: 'Compte désactivé',
                message: 'Ce compte utilisateur a été désactivé',
                code: 'AUTH_USER_INACTIVE'
            });
        }

        // Vérification de l'email (sécurité supplémentaire)
        if (user.email !== decoded.email) {
            return res.status(401).json({
                error: 'Token invalide',
                message: 'Token ne correspond pas à l\'utilisateur',
                code: 'AUTH_TOKEN_USER_MISMATCH'
            });
        }

        // Mise à jour de la dernière activité (optionnel, peut être lourd)
        if (process.env.UPDATE_LAST_ACTIVITY === 'true') {
            try {
                await db.query(
                    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
                    [user.id]
                );
            } catch (updateError) {
                // Log l'erreur mais ne pas faire échouer la requête
                console.warn('⚠️ Impossible de mettre à jour last_login_at:', updateError.message);
            }
        }

        // Ajout des informations utilisateur à la requête
        req.user = {
            id: user.id,
            email: user.email,
            username: user.username,
            displayName: user.display_name,
            preferences: user.preferences,
            connectedServices: user.connected_services,
            isActive: user.is_active,
            emailVerified: user.email_verified,
            createdAt: user.created_at
        };

        // Ajout du token décodé (utile pour le refresh)
        req.tokenPayload = decoded;

        // Log de debug en développement
        if (process.env.LOG_LEVEL === 'debug') {
            console.log(`🔐 Utilisateur authentifié: ${user.username} (${user.email})`);
        }

        next();

    } catch (error) {
        console.error('❌ Erreur dans le middleware d\'authentification:', error);
        res.status(500).json({
            error: 'Erreur d\'authentification',
            message: 'Erreur interne lors de la vérification du token',
            code: 'AUTH_INTERNAL_ERROR'
        });
    }
};

// Middleware optionnel d'authentification (ne bloque pas si pas de token)
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            // Pas de token, mais ce n'est pas bloquant
            req.user = null;
            return next();
        }

        // Si il y a un token, utiliser le middleware normal
        return authMiddleware(req, res, next);

    } catch (error) {
        // En cas d'erreur, continuer sans utilisateur
        req.user = null;
        next();
    }
};

// Middleware de vérification des rôles (pour plus tard)
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentification requise',
                message: 'Vous devez être connecté pour accéder à cette ressource'
            });
        }

        const userRoles = req.user.roles || ['user'];
        const hasRequiredRole = roles.some(role => userRoles.includes(role));

        if (!hasRequiredRole) {
            return res.status(403).json({
                error: 'Permissions insuffisantes',
                message: 'Vous n\'avez pas les permissions nécessaires',
                required: roles,
                current: userRoles
            });
        }

        next();
    };
};

// Middleware de vérification email (pour certaines actions sensibles)
const requireEmailVerified = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentification requise',
            message: 'Vous devez être connecté'
        });
    }

    if (!req.user.emailVerified) {
        return res.status(403).json({
            error: 'Email non vérifié',
            message: 'Vous devez vérifier votre email pour accéder à cette fonctionnalité',
            code: 'EMAIL_NOT_VERIFIED'
        });
    }

    next();
};

// Fonction utilitaire pour générer des tokens
const generateToken = (user, expiresIn = null) => {
    const payload = {
        userId: user.id,
        email: user.email,
        username: user.username,
        iat: Math.floor(Date.now() / 1000)
    };

    const options = {};
    if (expiresIn || process.env.JWT_EXPIRES_IN) {
        options.expiresIn = expiresIn || process.env.JWT_EXPIRES_IN;
    }

    return jwt.sign(payload, process.env.JWT_SECRET, options);
};

// Fonction utilitaire pour générer des refresh tokens
const generateRefreshToken = (user) => {
    const payload = {
        userId: user.id,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '30d' // Refresh token valide 30 jours
    });
};

// Fonction pour valider un refresh token
const validateRefreshToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== 'refresh') {
            throw new Error('Token type invalide');
        }

        return decoded;
    } catch (error) {
        throw new Error('Refresh token invalide');
    }
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware,
    requireRole,
    requireEmailVerified,
    generateToken,
    generateRefreshToken,
    validateRefreshToken
};
