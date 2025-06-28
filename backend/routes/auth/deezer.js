const express = require('express');
const axios = require('axios');
const { generateToken, generateRefreshToken } = require('../../middleware/auth');
const db = require('../../../database/connection');

const router = express.Router();

// Configuration Deezer OAuth2
const DEEZER_CONFIG = {
  appId: process.env.DEEZER_APP_ID,
  secretKey: process.env.DEEZER_SECRET_KEY,
  redirectUri: process.env.DEEZER_REDIRECT_URI,
  perms: [
    'basic_access',
    'email',
    'offline_access',
    'manage_library',
    'manage_community',
    'delete_library',
    'listening_history'
  ].join(',')
};

// URL d'autorisation Deezer
const getAuthUrl = (state = null) => {
  const params = new URLSearchParams({
    app_id: DEEZER_CONFIG.appId,
    redirect_uri: DEEZER_CONFIG.redirectUri,
    perms: DEEZER_CONFIG.perms,
    state: state || 'deezer_auth'
  });

  return `https://connect.deezer.com/oauth/auth.php?${params.toString()}`;
};

// Échange du code d'autorisation contre un token d'accès
const exchangeCodeForToken = async (code) => {
  try {
    const response = await axios.get('https://connect.deezer.com/oauth/access_token.php', {
      params: {
        app_id: DEEZER_CONFIG.appId,
        secret: DEEZER_CONFIG.secretKey,
        code: code,
        output: 'json'
      }
    });

    // Deezer retourne les données dans le format "access_token=TOKEN&expires=SECONDS"
    const data = response.data;
    if (typeof data === 'string') {
      const params = new URLSearchParams(data);
      return {
        access_token: params.get('access_token'),
        expires_in: parseInt(params.get('expires')) || 3600
      };
    }

    return data;
  } catch (error) {
    console.error('❌ Erreur lors de l\'échange du code Deezer:', error.response?.data || error.message);
    throw new Error('Impossible d\'obtenir le token Deezer');
  }
};

// Récupération du profil utilisateur Deezer
const getDeezerProfile = async (accessToken) => {
  try {
    const response = await axios.get('https://api.deezer.com/user/me', {
      params: {
        access_token: accessToken
      }
    });

    return response.data;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil Deezer:', error.response?.data || error.message);
    throw new Error('Impossible de récupérer le profil Deezer');
  }
};

// Route: Initier l'authentification Deezer
router.get('/login', (req, res) => {
  try {
    const state = req.query.state || `deezer_${Date.now()}`;
    const authUrl = getAuthUrl(state);

    // Stocker l'état en session si nécessaire
    req.session = req.session || {};
    req.session.deezerState = state;

    res.json({
      authUrl,
      state,
      message: 'Redirigez vers cette URL pour vous connecter à Deezer'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la génération de l\'URL Deezer:', error);
    res.status(500).json({
      error: 'Erreur de configuration',
      message: 'Impossible de générer l\'URL d\'authentification Deezer'
    });
  }
});

// Route: Callback d'authentification Deezer
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error_reason } = req.query;

    // Vérification des erreurs OAuth
    if (error_reason) {
      return res.status(400).json({
        error: 'Autorisation refusée',
        message: `Deezer a retourné une erreur: ${error_reason}`
      });
    }

    if (!code) {
      return res.status(400).json({
        error: 'Code manquant',
        message: 'Code d\'autorisation manquant dans la réponse Deezer'
      });
    }

    // Échange du code contre un token
    const tokenData = await exchangeCodeForToken(code);
    const { access_token, expires_in } = tokenData;

    if (!access_token) {
      return res.status(400).json({
        error: 'Token invalide',
        message: 'Impossible d\'obtenir le token d\'accès Deezer'
      });
    }

    // Récupération du profil utilisateur Deezer
    const deezerProfile = await getDeezerProfile(access_token);

    // Recherche d'un utilisateur existant avec cet email
    let user = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [deezerProfile.email]
    );

    if (user.rows.length === 0) {
      // Création d'un nouveau compte utilisateur
      const newUser = await db.create('users', {
        email: deezerProfile.email,
        username: deezerProfile.name || `deezer_${deezerProfile.id}`,
        display_name: deezerProfile.firstname ?
          `${deezerProfile.firstname} ${deezerProfile.lastname || ''}`.trim() :
          deezerProfile.name,
        profile_picture: deezerProfile.picture_big || deezerProfile.picture_medium || null,
        email_verified: true, // Deezer vérifie les emails
        connected_services: JSON.stringify({
          spotify: { connected: false, userId: null, lastSync: null },
          deezer: {
            connected: true,
            userId: deezerProfile.id.toString(),
            lastSync: new Date().toISOString()
          },
          youtubeMusic: { connected: false, userId: null, lastSync: null },
          lidarr: { connected: false, lastSync: null }
        }),
        auth_tokens: JSON.stringify({
          deezer: {
            access_token,
            expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
            scope: DEEZER_CONFIG.perms
          }
        })
      });

      user = { rows: [newUser] };
    } else {
      // Mise à jour des tokens Deezer pour l'utilisateur existant
      const existingUser = user.rows[0];
      const updatedConnectedServices = {
        ...existingUser.connected_services,
        deezer: {
          connected: true,
          userId: deezerProfile.id.toString(),
          lastSync: new Date().toISOString()
        }
      };

      const updatedAuthTokens = {
        ...existingUser.auth_tokens,
        deezer: {
          access_token,
          expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
          scope: DEEZER_CONFIG.perms
        }
      };

      await db.update('users', existingUser.id, {
        connected_services: JSON.stringify(updatedConnectedServices),
        auth_tokens: JSON.stringify(updatedAuthTokens),
        profile_picture: deezerProfile.picture_big || existingUser.profile_picture,
        last_login_at: new Date()
      });
    }

    const currentUser = user.rows[0];

    // Génération des tokens JWT Echo
    const echoToken = generateToken(currentUser);
    const echoRefreshToken = generateRefreshToken(currentUser);

    // Log de succès
    console.log(`✅ Authentification Deezer réussie pour: ${currentUser.email}`);

    // Réponse avec les tokens et informations utilisateur
    res.json({
      success: true,
      message: 'Authentification Deezer réussie',
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
      deezer: {
        connected: true,
        profile: {
          id: deezerProfile.id,
          name: deezerProfile.name,
          email: deezerProfile.email,
          firstname: deezerProfile.firstname,
          lastname: deezerProfile.lastname,
          country: deezerProfile.country,
          lang: deezerProfile.lang,
          picture: deezerProfile.picture_big
        }
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors du callback Deezer:', error);
    res.status(500).json({
      error: 'Erreur d\'authentification',
      message: 'Impossible de finaliser l\'authentification Deezer',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Route: Déconnexion Deezer
router.post('/disconnect', async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Non authentifié',
        message: 'Vous devez être connecté pour déconnecter Deezer'
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
      deezer: {
        connected: false,
        userId: null,
        lastSync: null
      }
    };

    // Suppression des tokens Deezer
    const updatedAuthTokens = { ...user.auth_tokens };
    delete updatedAuthTokens.deezer;

    await db.update('users', userId, {
      connected_services: JSON.stringify(updatedConnectedServices),
      auth_tokens: JSON.stringify(updatedAuthTokens)
    });

    res.json({
      success: true,
      message: 'Deezer déconnecté avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la déconnexion Deezer:', error);
    res.status(500).json({
      error: 'Erreur de déconnexion',
      message: 'Impossible de déconnecter Deezer'
    });
  }
});

// Route: Statut de la connexion Deezer
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

    const deezerService = user.connected_services?.deezer || {};
    const deezerTokens = user.auth_tokens?.deezer || {};

    res.json({
      connected: deezerService.connected || false,
      userId: deezerService.userId,
      lastSync: deezerService.lastSync,
      tokenValid: deezerTokens.expires_at ? new Date(deezerTokens.expires_at) > new Date() : false,
      scope: deezerTokens.scope
    });

  } catch (error) {
    console.error('❌ Erreur lors de la vérification du statut Deezer:', error);
    res.status(500).json({
      error: 'Erreur de statut',
      message: 'Impossible de vérifier le statut Deezer'
    });
  }
});

module.exports = router;
