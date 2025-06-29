const express = require('express');
const bcrypt = require('bcrypt');
const { generateToken, generateRefreshToken } = require('../../middleware/auth');
const db = require('../../../database/connection');

const router = express.Router();

// Configuration pour les utilisateurs de test en mode développement
const TEST_USERS = [
    {
        id: '1',
        email: 'test@echo.com',
        password: 'password123', // En production, ceci serait hashé
        displayName: 'Utilisateur Test',
        preferences: {
            theme: 'system',
            language: 'fr',
            autoplay: true,
            crossfade: false,
            volume: 0.8
        },
        subscription: {
            type: 'free'
        },
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
    },
    {
        id: '2',
        email: 'admin@echo.com',
        password: 'admin123',
        displayName: 'Admin Echo',
        spotifyId: 'spotify_admin_123',
        deezerId: 'deezer_admin_456',
        preferences: {
            theme: 'dark',
            language: 'fr',
            autoplay: true,
            crossfade: true,
            volume: 0.9
        },
        subscription: {
            type: 'premium'
        },
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastLoginAt: new Date().toISOString()
    }
];

// POST /api/auth/login - Connexion avec email/password
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email et mot de passe requis',
                message: 'Veuillez fournir un email et un mot de passe'
            });
        }

        // En mode développement, vérifier d'abord les utilisateurs de test
        if (process.env.NODE_ENV === 'development') {
            const testUser = TEST_USERS.find(u => u.email === email && u.password === password);
            if (testUser) {
                const token = generateToken(testUser.id);
                const refreshToken = generateRefreshToken(testUser.id);

                return res.json({
                    success: true,
                    message: 'Connexion réussie',
                    token,
                    refreshToken,
                    user: {
                        ...testUser,
                        password: undefined // Ne pas renvoyer le mot de passe
                    }
                });
            }
        }

        // Recherche de l'utilisateur dans la base de données
        const userQuery = `
            SELECT u.*, up.theme, up.language, up.autoplay, up.crossfade, up.volume,
                   us.type as subscription_type, us.expires_at
            FROM users u
            LEFT JOIN user_preferences up ON u.id = up.user_id
            LEFT JOIN user_subscriptions us ON u.id = us.user_id
            WHERE u.email = $1
        `;

        const userResult = await db.query(userQuery, [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                error: 'Identifiants invalides',
                message: 'Email ou mot de passe incorrect'
            });
        }

        const user = userResult.rows[0];

        // Vérification du mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Identifiants invalides',
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Mise à jour de la date de dernière connexion
        await db.query(
            'UPDATE users SET last_login_at = NOW() WHERE id = $1',
            [user.id]
        );

        // Génération des tokens
        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Préparation de la réponse utilisateur
        const userResponse = {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            spotifyId: user.spotify_id,
            deezerId: user.deezer_id,
            youtubeId: user.youtube_id,
            preferences: {
                theme: user.theme || 'system',
                language: user.language || 'fr',
                autoplay: user.autoplay !== false,
                crossfade: user.crossfade === true,
                volume: user.volume || 0.8
            },
            subscription: {
                type: user.subscription_type || 'free',
                expiresAt: user.expires_at
            },
            createdAt: user.created_at,
            lastLoginAt: user.last_login_at
        };

        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            refreshToken,
            user: userResponse
        });

    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Une erreur est survenue lors de la connexion'
        });
    }
});

// POST /api/auth/register - Inscription avec email/password
router.post('/register', async (req, res) => {
    try {
        const { email, password, displayName } = req.body;

        if (!email || !password || !displayName) {
            return res.status(400).json({
                error: 'Données manquantes',
                message: 'Email, mot de passe et nom d\'affichage requis'
            });
        }

        // Validation de l'email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                error: 'Email invalide',
                message: 'Veuillez fournir un email valide'
            });
        }

        // Validation du mot de passe
        if (password.length < 6) {
            return res.status(400).json({
                error: 'Mot de passe trop court',
                message: 'Le mot de passe doit contenir au moins 6 caractères'
            });
        }

        // Vérification si l'utilisateur existe déjà
        const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
        const existingUser = await db.query(existingUserQuery, [email]);

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'Utilisateur existant',
                message: 'Un compte avec cet email existe déjà'
            });
        }

        // Hashage du mot de passe
        const saltRounds = 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Création de l'utilisateur
        const insertUserQuery = `
            INSERT INTO users (email, password_hash, display_name, created_at, last_login_at)
            VALUES ($1, $2, $3, NOW(), NOW())
            RETURNING id, email, display_name, created_at, last_login_at
        `;

        const newUser = await db.query(insertUserQuery, [email, passwordHash, displayName]);
        const user = newUser.rows[0];

        // Création des préférences par défaut
        const insertPreferencesQuery = `
            INSERT INTO user_preferences (user_id, theme, language, autoplay, crossfade, volume)
            VALUES ($1, 'system', 'fr', true, false, 0.8)
        `;
        await db.query(insertPreferencesQuery, [user.id]);

        // Génération des tokens
        const token = generateToken(user.id);
        const refreshToken = generateRefreshToken(user.id);

        // Préparation de la réponse utilisateur
        const userResponse = {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            preferences: {
                theme: 'system',
                language: 'fr',
                autoplay: true,
                crossfade: false,
                volume: 0.8
            },
            subscription: {
                type: 'free'
            },
            createdAt: user.created_at,
            lastLoginAt: user.last_login_at
        };

        res.status(201).json({
            success: true,
            message: 'Compte créé avec succès',
            token,
            refreshToken,
            user: userResponse
        });

    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Une erreur est survenue lors de la création du compte'
        });
    }
});

// POST /api/auth/logout - Déconnexion
router.post('/logout', async (req, res) => {
    try {
        // Dans une implémentation complète, on pourrait invalider le token
        // en l'ajoutant à une liste noire ou en mettant à jour la base de données

        res.json({
            success: true,
            message: 'Déconnexion réussie'
        });
    } catch (error) {
        console.error('Erreur lors de la déconnexion:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Une erreur est survenue lors de la déconnexion'
        });
    }
});

// POST /api/auth/refresh - Renouvellement du token
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                error: 'Token manquant',
                message: 'Token de rafraîchissement requis'
            });
        }

        // Ici, on devrait vérifier la validité du refresh token
        // Pour simplifier, on génère un nouveau token

        // En production, extraire l'userId du refresh token
        const userId = '1'; // Placeholder

        const newToken = generateToken(userId);
        const newRefreshToken = generateRefreshToken(userId);

        res.json({
            success: true,
            token: newToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        console.error('Erreur lors du renouvellement du token:', error);
        res.status(500).json({
            error: 'Erreur serveur',
            message: 'Une erreur est survenue lors du renouvellement du token'
        });
    }
});

module.exports = router;
