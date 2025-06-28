// Configuration de l'environnement de test
require('dotenv').config({ path: './config/secrets.env' });

// Variables d'environnement spécifiques aux tests
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.TEST_PORT || '3001';
process.env.LOG_LEVEL = 'error'; // Réduire les logs pendant les tests

// Mock des services externes pour éviter les appels réels aux APIs
jest.mock('../backend/services/spotify', () => ({
    getUserProfile: jest.fn(),
    getUserPlaylists: jest.fn(),
    getPlaylistTracks: jest.fn(),
    syncUserPlaylists: jest.fn(),
    saveUserProfile: jest.fn(),
    savePlaylist: jest.fn(),
    getUserTokens: jest.fn()
}));

jest.mock('../backend/services/deezer', () => ({
    getUserProfile: jest.fn(),
    getUserPlaylists: jest.fn(),
    getUserFavorites: jest.fn(),
    getPlaylistTracks: jest.fn()
}));

jest.mock('../backend/services/ytmusic', () => ({
    getUserPlaylists: jest.fn(),
    getPlaylistTracks: jest.fn(),
    searchTracks: jest.fn()
}));

jest.mock('../backend/services/lidarr', () => ({
    getAllArtists: jest.fn(),
    getArtistAlbums: jest.fn(),
    getSystemStatus: jest.fn()
}));

// Configuration des timeouts globaux
jest.setTimeout(30000);

// Mock de Winston logger pour les tests
jest.mock('../backend/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn()
    },
    logExternalServiceError: jest.fn(),
    logExternalServiceSuccess: jest.fn()
}));

// Désactiver les logs console pendant les tests (sauf erreurs critiques)
const originalConsoleError = console.error;
console.log = jest.fn();
console.info = jest.fn();
console.warn = jest.fn();
console.error = (...args) => {
    // Garder seulement les erreurs critiques
    if (args[0] && args[0].includes && args[0].includes('CRITICAL')) {
        originalConsoleError(...args);
    }
};

// Fonction de nettoyage après tous les tests
afterAll(async () => {
    // Fermer les connexions de base de données
    const pool = require('../database/connection');
    if (pool && pool.end) {
        await pool.end();
    }

    // Attendre un peu pour que les connexions se ferment proprement
    await new Promise(resolve => setTimeout(resolve, 1000));
});
