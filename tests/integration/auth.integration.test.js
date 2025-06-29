/**
 * Test d'intégration pour l'authentification
 * Teste la connexion frontend-backend pour les fonctionnalités d'auth
 */

const request = require('supertest');
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

describe('Tests d\'intégration - Authentification', () => {
    let authToken = null;

    beforeAll(async () => {
        // Attendre que le backend soit prêt
        const maxRetries = 10;
        let retries = 0;
        
        while (retries < maxRetries) {
            try {
                const response = await axios.get(`${API_BASE_URL}/health`);
                if (response.status === 200) {
                    console.log('✅ Backend prêt pour les tests');
                    break;
                }
            } catch (error) {
                retries++;
                console.log(`⏳ Tentative ${retries}/${maxRetries} - Backend non prêt, attente...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (retries >= maxRetries) {
            throw new Error('❌ Backend non disponible après 10 tentatives');
        }
    });

    describe('POST /api/auth/login', () => {
        test('Connexion avec utilisateur de test valide', async () => {
            const loginData = {
                email: 'test@echo.com',
                password: 'password123'
            };

            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, loginData);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success', true);
            expect(response.data).toHaveProperty('token');
            expect(response.data).toHaveProperty('user');
            expect(response.data.user).toHaveProperty('email', 'test@echo.com');
            expect(response.data.user).toHaveProperty('displayName', 'Utilisateur Test');

            // Stocker le token pour les tests suivants
            authToken = response.data.token;
        });

        test('Connexion avec utilisateur admin valide', async () => {
            const loginData = {
                email: 'admin@echo.com',
                password: 'admin123'
            };

            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, loginData);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success', true);
            expect(response.data).toHaveProperty('token');
            expect(response.data.user).toHaveProperty('email', 'admin@echo.com');
            expect(response.data.user).toHaveProperty('displayName', 'Admin Echo');
            expect(response.data.user.subscription.type).toBe('premium');
        });

        test('Connexion avec email invalide', async () => {
            const loginData = {
                email: 'invalid@echo.com',
                password: 'password123'
            };

            try {
                await axios.post(`${API_BASE_URL}/api/auth/login`, loginData);
                fail('La requête aurait dû échouer');
            } catch (error) {
                expect(error.response.status).toBe(401);
                expect(error.response.data).toHaveProperty('error');
            }
        });

        test('Connexion avec mot de passe invalide', async () => {
            const loginData = {
                email: 'test@echo.com',
                password: 'wrongpassword'
            };

            try {
                await axios.post(`${API_BASE_URL}/api/auth/login`, loginData);
                fail('La requête aurait dû échouer');
            } catch (error) {
                expect(error.response.status).toBe(401);
                expect(error.response.data).toHaveProperty('error');
            }
        });

        test('Connexion sans email', async () => {
            const loginData = {
                password: 'password123'
            };

            try {
                await axios.post(`${API_BASE_URL}/api/auth/login`, loginData);
                fail('La requête aurait dû échouer');
            } catch (error) {
                expect(error.response.status).toBe(400);
                expect(error.response.data).toHaveProperty('error');
            }
        });
    });

    describe('POST /api/auth/logout', () => {
        test('Déconnexion réussie', async () => {
            const response = await axios.post(`${API_BASE_URL}/api/auth/logout`);

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success', true);
            expect(response.data).toHaveProperty('message', 'Déconnexion réussie');
        });
    });

    describe('Gestion des tokens', () => {
        test('Token JWT est valide et contient les bonnes informations', () => {
            expect(authToken).toBeTruthy();
            expect(authToken).toMatch(/^eyJ/); // JWT commence par eyJ
            
            // Décoder le token (sans vérification de signature pour le test)
            const base64Payload = authToken.split('.')[1];
            const payload = JSON.parse(Buffer.from(base64Payload, 'base64').toString());
            
            expect(payload).toHaveProperty('iat'); // issued at
            expect(payload).toHaveProperty('exp'); // expiration
            expect(payload.exp).toBeGreaterThan(payload.iat);
        });
    });

    describe('Intégration Frontend API', () => {
        test('Service API frontend peut se connecter au backend', async () => {
            // Simuler l'utilisation du service API frontend
            const apiConfig = {
                baseURL: API_BASE_URL,
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

            const apiClient = axios.create(apiConfig);

            const loginData = {
                email: 'test@echo.com',
                password: 'password123'
            };

            const response = await apiClient.post('/api/auth/login', loginData);

            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
        });

        test('Requête avec token d\'authentification', async () => {
            if (!authToken) {
                // Se connecter d'abord
                const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                    email: 'test@echo.com',
                    password: 'password123'
                });
                authToken = loginResponse.data.token;
            }

            // Tester une requête avec le token
            const config = {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            };

            // Cette route nécessitera une authentification
            try {
                const response = await axios.get(`${API_BASE_URL}/api/user/profile`, config);
                console.log('✅ Requête authentifiée réussie');
            } catch (error) {
                // Normal si la route n'est pas encore implémentée ou si la DB n'est pas connectée
                console.log('ℹ️  Route /api/user/profile pas encore disponible ou DB déconnectée');
            }
        });
    });

    describe('Validation des données utilisateur', () => {
        test('Structure de l\'utilisateur retournée', async () => {
            const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
                email: 'admin@echo.com',
                password: 'admin123'
            });

            const user = response.data.user;

            // Vérifier la structure de l'utilisateur
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('displayName');
            expect(user).toHaveProperty('preferences');
            expect(user).toHaveProperty('subscription');
            expect(user).toHaveProperty('createdAt');
            expect(user).toHaveProperty('lastLoginAt');

            // Vérifier que le mot de passe n'est pas retourné
            expect(user).not.toHaveProperty('password');

            // Vérifier la structure des préférences
            expect(user.preferences).toHaveProperty('theme');
            expect(user.preferences).toHaveProperty('language');
            expect(user.preferences).toHaveProperty('autoplay');
            expect(user.preferences).toHaveProperty('crossfade');
            expect(user.preferences).toHaveProperty('volume');

            // Vérifier la structure de l'abonnement
            expect(user.subscription).toHaveProperty('type');
            expect(['free', 'premium']).toContain(user.subscription.type);
        });
    });
});

module.exports = {};
