const express = require('express');
const axios = require('axios');
const { generateToken, generateRefreshToken } = require('../../middleware/auth');
const db = require('../../../database/connection');

const router = express.Router();

// Configuration Spotify OAuth2
const SPOTIFY_CONFIG = {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
    scopes: [
        'user-read-private',
        'user-read-email',
        'user-library-read',
        'user-top-read',
        'user-read-recently-played',
        'playlist-read-private',
        'playlist-read-collaborative',
        'user-read-playback-state',
        'user-modify-playback-state',
        'streaming'
    ].join(' ')
};

// URL d'autorisation Spotify
const getAuthUrl = (state = null) => {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: SPOTIFY_CONFIG.clientId,
        scope: SPOTIFY_CONFIG.scopes,
        redirect_uri: SPOTIFY_CONFIG.redirectUri,
        state: state || 'spotify_auth',
        show_dialog: 'true' // Force l'affichage de la boîte de dialogue
    });

    return `https://accounts.spotify.com/authorize?${params.toString()}`;
};

// Échange du code d'autorisation contre un token d'accès
const exchangeCodeForToken = async (code) => {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: SPOTIFY_CONFIG.redirectUri,
                client_id: SPOTIFY_CONFIG.clientId,
                client_secret: SPOTIFY_CONFIG.clientSecret
            }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
        );

        return response.data;
    } catch (error) {
        console.error('❌ Erreur lors de l\'échange du code Spotify:', error.response?.data || error.message);
        throw new Error('Impossible d\'obtenir le token Spotify');
    }
};

// Récupération du profil utilisateur Spotify
const getSpotifyProfile = async (accessToken) => {
    try {
        const response = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('❌ Erreur lors de la récupération du profil Spotify:', error.response?.data || error.message);
        throw new Error('Impossible de récupérer le profil Spotify');
    }
};

// Refresh du token Spotify
const refreshSpotifyToken = async (refreshToken) => {
    try {
        const response = await axios.post('https://accounts.spotify.com/api/token',
            new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: SPOTIFY_CONFIG.clientId,
                client_secret: SPOTIFY_CONFIG.clientSecret
            }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
        );

        return response.data;
    } catch (error) {
        console.error('❌ Erreur lors du refresh du token Spotify:', error.response?.data || error.message);
        throw new Error('Impossible de rafraîchir le token Spotify');
    }
};

// Route: Initier l'authentification Spotify
router.get('/login', (req, res) => {
    try {
        const state = req.query.state || `spotify_${Date.now()}`;
        const authUrl = getAuthUrl(state);

        // Stocker l'état en session si nécessaire
        req.session = req.session || {};
        req.session.spotifyState = state;

        res.json({
            authUrl,
            state,
            message: 'Redirigez vers cette URL pour vous connecter à Spotify'
        });
    } catch (error) {
        console.error('❌ Erreur lors de la génération de l\'URL Spotify:', error);
        res.status(500).json({
            error: 'Erreur de configuration',
            message: 'Impossible de générer l\'URL d\'authentification Spotify'
        });
    }
});

// Route: Callback d'authentification Spotify
router.get('/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;

        // Vérification des erreurs OAuth
        if (error) {
            return res.status(400).json({
                error: 'Autorisation refusée',
                message: `Spotify a retourné une erreur: ${error}`
            });
        }

        if (!code) {
            return res.status(400).json({
                error: 'Code manquant',
                message: 'Code d\'autorisation manquant dans la réponse Spotify'
            });
        }

        // Échange du code contre un token
        const tokenData = await exchangeCodeForToken(code);
        const { access_token, refresh_token, expires_in, scope } = tokenData;

        // Récupération du profil utilisateur Spotify
        const spotifyProfile = await getSpotifyProfile(access_token);

        // Recherche d'un utilisateur existant avec cet email
        let user = await db.query(
            'SELECT * FROM users WHERE email = $1',
            [spotifyProfile.email]
        );

        if (user.rows.length === 0) {
            // Création d'un nouveau compte utilisateur
            const newUser = await db.create('users', {
                email: spotifyProfile.email,
                username: spotifyProfile.id,
                display_name: spotifyProfile.display_name || spotifyProfile.id,
                profile_picture: spotifyProfile.images?.[0]?.url || null,
                email_verified: true, // Spotify vérifie les emails
                connected_services: JSON.stringify({
                    spotify: {
                        connected: true,
                        userId: spotifyProfile.id,
                        lastSync: new Date().toISOString()
                    },
                    deezer: { connected: false, userId: null, lastSync: null },
                    youtubeMusic: { connected: false, userId: null, lastSync: null },
                    lidarr: { connected: false, lastSync: null }
                }),
                auth_tokens: JSON.stringify({
                    spotify: {
                        access_token,
                        refresh_token,
                        expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
                        scope
                    }
                })
            });

            user = { rows: [newUser] };
        } else {
            // Mise à jour des tokens Spotify pour l'utilisateur existant
            const existingUser = user.rows[0];
            const updatedConnectedServices = {
                ...existingUser.connected_services,
                spotify: {
                    connected: true,
                    userId: spotifyProfile.id,
                    lastSync: new Date().toISOString()
                }
            };

            const updatedAuthTokens = {
                ...existingUser.auth_tokens,
                spotify: {
                    access_token,
                    refresh_token,
                    expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
                    scope
                }
            };

            await db.update('users', existingUser.id, {
                connected_services: JSON.stringify(updatedConnectedServices),
                auth_tokens: JSON.stringify(updatedAuthTokens),
                profile_picture: spotifyProfile.images?.[0]?.url || existingUser.profile_picture,
                last_login_at: new Date()
            });
        }

        const currentUser = user.rows[0];

        // Génération des tokens JWT Echo
        const echoToken = generateToken(currentUser);
        const echoRefreshToken = generateRefreshToken(currentUser);

        // Log de succès
        console.log(`✅ Authentification Spotify réussie pour: ${currentUser.email}`);

        // Réponse avec les tokens et informations utilisateur
        res.json({
            success: true,
            message: 'Authentification Spotify réussie',
            user: {
                id: currentUser.id,
                email: currentUser.email,
                username: currentUser.username,
                displayName: currentUser.display_name,
                profilePicture: currentUser.profile_picture,
                connectedServices: currentUser.connected_services
            },
            tokens: {
                accessToken: echoToken,
                refreshToken: echoRefreshToken,
                expiresIn: 3600 // 1 heure
            },
            spotify: {
                connected: true,
                profile: {
                    id: spotifyProfile.id,
                    name: spotifyProfile.display_name,
                    email: spotifyProfile.email,
                    country: spotifyProfile.country,
                    followers: spotifyProfile.followers?.total || 0,
                    product: spotifyProfile.product
                }
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors du callback Spotify:', error);
        res.status(500).json({
            error: 'Erreur d\'authentification',
            message: 'Impossible de finaliser l\'authentification Spotify',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Route: Déconnexion Spotify
router.post('/disconnect', async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.status(401).json({
                error: 'Non authentifié',
                message: 'Vous devez être connecté pour déconnecter Spotify'
            });
        }

        // Récupération de l'utilisateur
        const user = await db.findById('users', userId);
        if (!user) {
            return res.status(404).json({
                error: 'Utilisateur introuvable'
            });
        }

        // Mise à jour des services connectés
        const updatedConnectedServices = {
            ...user.connected_services,
            spotify: {
                connected: false,
                userId: null,
                lastSync: null
            }
        };

        // Suppression des tokens Spotify
        const updatedAuthTokens = { ...user.auth_tokens };
        delete updatedAuthTokens.spotify;

        await db.update('users', userId, {
            connected_services: JSON.stringify(updatedConnectedServices),
            auth_tokens: JSON.stringify(updatedAuthTokens)
        });

        res.json({
            success: true,
            message: 'Spotify déconnecté avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur lors de la déconnexion Spotify:', error);
        res.status(500).json({
            error: 'Erreur de déconnexion',
            message: 'Impossible de déconnecter Spotify'
        });
    }
});

// Route: Statut de la connexion Spotify
router.get('/status', async (req, res) => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return res.json({
                connected: false,
                message: 'Non authentifié'
            });
        }

        const user = await db.findById('users', userId);
        if (!user) {
            return res.json({
                connected: false,
                message: 'Utilisateur introuvable'
            });
        }

        const spotifyService = user.connected_services?.spotify || {};
        const spotifyTokens = user.auth_tokens?.spotify || {};

        res.json({
            connected: spotifyService.connected || false,
            userId: spotifyService.userId,
            lastSync: spotifyService.lastSync,
            tokenValid: spotifyTokens.expires_at ? new Date(spotifyTokens.expires_at) > new Date() : false,
            scope: spotifyTokens.scope
        });

    } catch (error) {
        console.error('❌ Erreur lors de la vérification du statut Spotify:', error);
        res.status(500).json({
            error: 'Erreur de statut',
            message: 'Impossible de vérifier le statut Spotify'
        });
    }
});

module.exports = router;
