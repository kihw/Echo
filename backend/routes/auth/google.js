const express = require('express');
const axios = require('axios');
const { generateToken, generateRefreshToken } = require('../../middleware/auth');
const db = require('../../../database/connection');

const router = express.Router();

// Configuration Google OAuth2 pour YouTube Music
const GOOGLE_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
  scopes: [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtubepartner'
  ].join(' ')
};

// URL d'autorisation Google
const getAuthUrl = (state = null) => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: GOOGLE_CONFIG.clientId,
    redirect_uri: GOOGLE_CONFIG.redirectUri,
    scope: GOOGLE_CONFIG.scopes,
    state: state || 'google_auth',
    access_type: 'offline', // Pour obtenir un refresh token
    prompt: 'consent' // Force l'affichage du consentement
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// Échange du code d'autorisation contre un token d'accès
const exchangeCodeForToken = async (code) => {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CONFIG.clientId,
      client_secret: GOOGLE_CONFIG.clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_CONFIG.redirectUri
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de l\'échange du code Google:', error.response?.data || error.message);
    throw new Error('Impossible d\'obtenir le token Google');
  }
};

// Récupération du profil utilisateur Google
const getGoogleProfile = async (accessToken) => {
  try {
    const response = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil Google:', error.response?.data || error.message);
    throw new Error('Impossible de récupérer le profil Google');
  }
};

// Refresh du token Google
const refreshGoogleToken = async (refreshToken) => {
  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CONFIG.clientId,
      client_secret: GOOGLE_CONFIG.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors du refresh du token Google:', error.response?.data || error.message);
    throw new Error('Impossible de rafraîchir le token Google');
  }
};

// Route: Initier l'authentification Google
router.get('/login', (req, res) => {
  try {
    const state = req.query.state || `google_${Date.now()}`;
    const authUrl = getAuthUrl(state);

    // Stocker l'état en session si nécessaire
    req.session = req.session || {};
    req.session.googleState = state;

    res.json({
      authUrl,
      state,
      message: 'Redirigez vers cette URL pour vous connecter à Google/YouTube Music'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la génération de l\'URL Google:', error);
    res.status(500).json({
      error: 'Erreur de configuration',
      message: 'Impossible de générer l\'URL d\'authentification Google'
    });
  }
});

// Route: Callback d'authentification Google
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Vérification des erreurs OAuth
    if (error) {
      return res.status(400).json({
        error: 'Autorisation refusée',
        message: `Google a retourné une erreur: ${error}`
      });
    }

    if (!code) {
      return res.status(400).json({
        error: 'Code manquant',
        message: 'Code d\'autorisation manquant dans la réponse Google'
      });
    }

    // Échange du code contre un token
    const tokenData = await exchangeCodeForToken(code);
    const { access_token, refresh_token, expires_in, scope } = tokenData;

    // Récupération du profil utilisateur Google
    const googleProfile = await getGoogleProfile(access_token);

    // Recherche d'un utilisateur existant avec cet email
    let user = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [googleProfile.email]
    );

    if (user.rows.length === 0) {
      // Création d'un nouveau compte utilisateur
      const newUser = await db.create('users', {
        email: googleProfile.email,
        username: googleProfile.email.split('@')[0], // Utilise la partie avant @
        display_name: googleProfile.name || googleProfile.email,
        profile_picture: googleProfile.picture || null,
        email_verified: googleProfile.verified_email || false,
        connected_services: JSON.stringify({
          spotify: { connected: false, userId: null, lastSync: null },
          deezer: { connected: false, userId: null, lastSync: null },
          youtubeMusic: {
            connected: true,
            userId: googleProfile.id,
            lastSync: new Date().toISOString()
          },
          lidarr: { connected: false, lastSync: null }
        }),
        auth_tokens: JSON.stringify({
          google: {
            access_token,
            refresh_token,
            expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
            scope
          }
        })
      });

      user = { rows: [newUser] };
    } else {
      // Mise à jour des tokens Google pour l'utilisateur existant
      const existingUser = user.rows[0];
      const updatedConnectedServices = {
        ...existingUser.connected_services,
        youtubeMusic: {
          connected: true,
          userId: googleProfile.id,
          lastSync: new Date().toISOString()
        }
      };

      const updatedAuthTokens = {
        ...existingUser.auth_tokens,
        google: {
          access_token,
          refresh_token,
          expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
          scope
        }
      };

      await db.update('users', existingUser.id, {
        connected_services: JSON.stringify(updatedConnectedServices),
        auth_tokens: JSON.stringify(updatedAuthTokens),
        profile_picture: googleProfile.picture || existingUser.profile_picture,
        last_login_at: new Date()
      });
    }

    const currentUser = user.rows[0];

    // Génération des tokens JWT Echo
    const echoToken = generateToken(currentUser);
    const echoRefreshToken = generateRefreshToken(currentUser);

    // Log de succès
    console.log(`✅ Authentification Google/YouTube Music réussie pour: ${currentUser.email}`);

    // Réponse avec les tokens et informations utilisateur
    res.json({
      success: true,
      message: 'Authentification Google/YouTube Music réussie',
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
      google: {
        connected: true,
        profile: {
          id: googleProfile.id,
          name: googleProfile.name,
          email: googleProfile.email,
          picture: googleProfile.picture,
          verified_email: googleProfile.verified_email,
          locale: googleProfile.locale
        },
        youtubeMusic: {
          enabled: scope.includes('youtube'),
          permissions: scope.split(' ')
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors du callback Google:', error);
    res.status(500).json({
      error: 'Erreur d\'authentification',
      message: 'Impossible de finaliser l\'authentification Google/YouTube Music',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route: Déconnexion Google/YouTube Music
router.post('/disconnect', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour déconnecter Google/YouTube Music'
      });
    }

    // Récupération de l'utilisateur
    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur introuvable'
      });
    }

    // Révocation du token Google (optionnel mais recommandé)
    try {
      const googleTokens = user.auth_tokens?.google;
      if (googleTokens?.access_token) {
        await axios.post(`https://oauth2.googleapis.com/revoke?token=${googleTokens.access_token}`);
      }
    } catch (revokeError) {
      console.warn('⚠️ Impossible de révoquer le token Google:', revokeError.message);
    }

    // Mise à jour des services connectés
    const updatedConnectedServices = {
      ...user.connected_services,
      youtubeMusic: {
        connected: false,
        userId: null,
        lastSync: null
      }
    };

    // Suppression des tokens Google
    const updatedAuthTokens = { ...user.auth_tokens };
    delete updatedAuthTokens.google;

    await db.update('users', userId, {
      connected_services: JSON.stringify(updatedConnectedServices),
      auth_tokens: JSON.stringify(updatedAuthTokens)
    });

    res.json({
      success: true,
      message: 'Google/YouTube Music déconnecté avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion Google:', error);
    res.status(500).json({
      error: 'Erreur de déconnexion',
      message: 'Impossible de déconnecter Google/YouTube Music'
    });
  }
});

// Route: Statut de la connexion Google/YouTube Music
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

    const youtubeService = user.connected_services?.youtubeMusic || {};
    const googleTokens = user.auth_tokens?.google || {};

    res.json({
      connected: youtubeService.connected || false,
      userId: youtubeService.userId,
      lastSync: youtubeService.lastSync,
      tokenValid: googleTokens.expires_at ? new Date(googleTokens.expires_at) > new Date() : false,
      scope: googleTokens.scope,
      hasRefreshToken: !!googleTokens.refresh_token
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut Google:', error);
    res.status(500).json({
      error: 'Erreur de statut',
      message: 'Impossible de vérifier le statut Google/YouTube Music'
    });
  }
});

// Route: Refresh du token Google
router.post('/refresh', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Vous devez être connecté'
      });
    }

    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur introuvable'
      });
    }

    const googleTokens = user.auth_tokens?.google;
    if (!googleTokens?.refresh_token) {
      return res.status(400).json({
        error: 'Refresh token manquant',
        message: 'Aucun refresh token disponible pour Google'
      });
    }

    // Refresh du token
    const newTokenData = await refreshGoogleToken(googleTokens.refresh_token);

    // Mise à jour des tokens
    const updatedAuthTokens = {
      ...user.auth_tokens,
      google: {
        ...googleTokens,
        access_token: newTokenData.access_token,
        expires_at: new Date(Date.now() + newTokenData.expires_in * 1000).toISOString(),
        // Le refresh token peut être renouvelé ou rester le même
        refresh_token: newTokenData.refresh_token || googleTokens.refresh_token
      }
    };

    await db.update('users', userId, {
      auth_tokens: JSON.stringify(updatedAuthTokens)
    });

    res.json({
      success: true,
      message: 'Token Google refreshé avec succès',
      expiresAt: updatedAuthTokens.google.expires_at
    });

  } catch (error) {
    console.error('❌ Erreur lors du refresh Google:', error);
    res.status(500).json({
      error: 'Erreur de refresh',
      message: 'Impossible de rafraîchir le token Google'
    });
  }
});

module.exports = router;
