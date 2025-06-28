const crypto = require('crypto');
const db = require('../../database/connection');

// Configuration du chiffrement
const ENCRYPTION_KEY = process.env.TOKEN_ENCRYPTION_KEY || crypto.randomBytes(32);
const ALGORITHM = 'aes-256-gcm';

/**
 * Service de gestion des tokens d'authentification
 * Gère le stockage sécurisé, le chiffrement et le refresh des tokens OAuth
 */
class TokenManager {

  /**
   * Chiffre un token avant stockage
   * @param {string} token - Token à chiffrer
   * @returns {object} - Objet contenant le token chiffré et les métadonnées
   */
  static encryptToken(token) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
      cipher.setAAD(Buffer.from('echo-auth'));

      let encrypted = cipher.update(token, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag();

      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
        algorithm: ALGORITHM
      };
    } catch (error) {
      console.error('❌ Erreur lors du chiffrement du token:', error);
      throw new Error('Impossible de chiffrer le token');
    }
  }

  /**
   * Déchiffre un token
   * @param {object} encryptedData - Données chiffrées
   * @returns {string} - Token déchiffré
   */
  static decryptToken(encryptedData) {
    try {
      const { encrypted, iv, authTag } = encryptedData;

      const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
      decipher.setAAD(Buffer.from('echo-auth'));
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('❌ Erreur lors du déchiffrement du token:', error);
      throw new Error('Impossible de déchiffrer le token');
    }
  }

  /**
   * Stocke les tokens d'un service pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} service - Nom du service (spotify, deezer, google)
   * @param {object} tokens - Tokens à stocker
   */
  static async storeTokens(userId, service, tokens) {
    try {
      // Récupération de l'utilisateur
      const user = await db.findById('users', userId);
      if (!user) {
        throw new Error('Utilisateur introuvable');
      }

      // Chiffrement des tokens sensibles
      const encryptedTokens = { ...tokens };
      if (tokens.access_token) {
        encryptedTokens.access_token_encrypted = this.encryptToken(tokens.access_token);
        delete encryptedTokens.access_token;
      }
      if (tokens.refresh_token) {
        encryptedTokens.refresh_token_encrypted = this.encryptToken(tokens.refresh_token);
        delete encryptedTokens.refresh_token;
      }

      // Ajout des métadonnées
      encryptedTokens.stored_at = new Date().toISOString();
      encryptedTokens.service = service;

      // Mise à jour des tokens dans la base
      const existingTokens = user.auth_tokens || {};
      const updatedTokens = {
        ...existingTokens,
        [service]: encryptedTokens
      };

      await db.update('users', userId, {
        auth_tokens: JSON.stringify(updatedTokens)
      });

      console.log(`✅ Tokens ${service} stockés pour l'utilisateur ${userId}`);
      return true;

    } catch (error) {
      console.error(`❌ Erreur lors du stockage des tokens ${service}:`, error);
      throw error;
    }
  }

  /**
   * Récupère les tokens d'un service pour un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} service - Nom du service
   * @returns {object|null} - Tokens déchiffrés ou null
   */
  static async getTokens(userId, service) {
    try {
      const user = await db.findById('users', userId);
      if (!user || !user.auth_tokens) {
        return null;
      }

      const serviceTokens = user.auth_tokens[service];
      if (!serviceTokens) {
        return null;
      }

      // Déchiffrement des tokens
      const decryptedTokens = { ...serviceTokens };

      if (serviceTokens.access_token_encrypted) {
        decryptedTokens.access_token = this.decryptToken(serviceTokens.access_token_encrypted);
        delete decryptedTokens.access_token_encrypted;
      }

      if (serviceTokens.refresh_token_encrypted) {
        decryptedTokens.refresh_token = this.decryptToken(serviceTokens.refresh_token_encrypted);
        delete decryptedTokens.refresh_token_encrypted;
      }

      return decryptedTokens;

    } catch (error) {
      console.error(`❌ Erreur lors de la récupération des tokens ${service}:`, error);
      return null;
    }
  }

  /**
   * Vérifie si un token est valide (non expiré)
   * @param {object} tokens - Tokens à vérifier
   * @returns {boolean} - True si valide
   */
  static isTokenValid(tokens) {
    if (!tokens || !tokens.expires_at) {
      return false;
    }

    const expirationDate = new Date(tokens.expires_at);
    const now = new Date();

    // Considère le token comme expiré 5 minutes avant l'expiration réelle
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    return expirationDate.getTime() > (now.getTime() + bufferTime);
  }

  /**
   * Refresh automatique d'un token si nécessaire
   * @param {string} userId - ID de l'utilisateur
   * @param {string} service - Nom du service
   * @returns {object|null} - Tokens refreshés ou null
   */
  static async refreshTokenIfNeeded(userId, service) {
    try {
      const tokens = await this.getTokens(userId, service);
      if (!tokens) {
        return null;
      }

      // Si le token est encore valide, le retourner
      if (this.isTokenValid(tokens)) {
        return tokens;
      }

      // Si pas de refresh token, impossible de refresh
      if (!tokens.refresh_token) {
        console.warn(`⚠️ Pas de refresh token pour ${service}, utilisateur ${userId}`);
        return null;
      }

      console.log(`🔄 Refresh du token ${service} pour l'utilisateur ${userId}`);

      // Refresh selon le service
      let newTokens;
      switch (service) {
        case 'spotify':
          newTokens = await this.refreshSpotifyToken(tokens.refresh_token);
          break;
        case 'google':
          newTokens = await this.refreshGoogleToken(tokens.refresh_token);
          break;
        case 'deezer':
          // Deezer n'a pas de refresh token, il faut re-authentifier
          console.warn('⚠️ Deezer ne supporte pas le refresh token');
          return null;
        default:
          throw new Error(`Service ${service} non supporté pour le refresh`);
      }

      // Stockage des nouveaux tokens
      await this.storeTokens(userId, service, {
        ...tokens,
        ...newTokens,
        expires_at: new Date(Date.now() + newTokens.expires_in * 1000).toISOString()
      });

      return await this.getTokens(userId, service);

    } catch (error) {
      console.error(`❌ Erreur lors du refresh du token ${service}:`, error);
      return null;
    }
  }

  /**
   * Refresh d'un token Spotify
   * @param {string} refreshToken - Refresh token Spotify
   * @returns {object} - Nouveaux tokens
   */
  static async refreshSpotifyToken(refreshToken) {
    const axios = require('axios');

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token',
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.SPOTIFY_CLIENT_ID,
          client_secret: process.env.SPOTIFY_CLIENT_SECRET
        }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
      );

      return response.data;
    } catch (error) {
      console.error('❌ Erreur refresh Spotify:', error.response?.data || error.message);
      throw new Error('Impossible de rafraîchir le token Spotify');
    }
  }

  /**
   * Refresh d'un token Google
   * @param {string} refreshToken - Refresh token Google
   * @returns {object} - Nouveaux tokens
   */
  static async refreshGoogleToken(refreshToken) {
    const axios = require('axios');

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erreur refresh Google:', error.response?.data || error.message);
      throw new Error('Impossible de rafraîchir le token Google');
    }
  }

  /**
   * Supprime tous les tokens d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} service - Service spécifique (optionnel)
   */
  static async revokeTokens(userId, service = null) {
    try {
      const user = await db.findById('users', userId);
      if (!user) {
        throw new Error('Utilisateur introuvable');
      }

      let updatedTokens = user.auth_tokens || {};

      if (service) {
        // Suppression d'un service spécifique
        delete updatedTokens[service];
        console.log(`✅ Tokens ${service} révoqués pour l'utilisateur ${userId}`);
      } else {
        // Suppression de tous les tokens
        updatedTokens = {};
        console.log(`✅ Tous les tokens révoqués pour l'utilisateur ${userId}`);
      }

      await db.update('users', userId, {
        auth_tokens: JSON.stringify(updatedTokens)
      });

      return true;

    } catch (error) {
      console.error('❌ Erreur lors de la révocation des tokens:', error);
      throw error;
    }
  }

  /**
   * Nettoyage des tokens expirés (tâche de maintenance)
   */
  static async cleanupExpiredTokens() {
    try {
      console.log('🧹 Nettoyage des tokens expirés...');

      // Récupération de tous les utilisateurs avec des tokens
      const users = await db.query(
        'SELECT id, auth_tokens FROM users WHERE auth_tokens IS NOT NULL'
      );

      let cleanedCount = 0;

      for (const user of users.rows) {
        const tokens = user.auth_tokens;
        let hasExpiredTokens = false;
        const cleanedTokens = { ...tokens };

        for (const [service, serviceTokens] of Object.entries(tokens)) {
          if (!this.isTokenValid(serviceTokens)) {
            // Token expiré et pas de refresh token
            if (!serviceTokens.refresh_token_encrypted) {
              delete cleanedTokens[service];
              hasExpiredTokens = true;
              console.log(`🗑️ Token expiré supprimé: ${service} pour utilisateur ${user.id}`);
            }
          }
        }

        if (hasExpiredTokens) {
          await db.update('users', user.id, {
            auth_tokens: JSON.stringify(cleanedTokens)
          });
          cleanedCount++;
        }
      }

      console.log(`✅ Nettoyage terminé: ${cleanedCount} utilisateurs mis à jour`);
      return cleanedCount;

    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des tokens:', error);
      throw error;
    }
  }
}

module.exports = TokenManager;
