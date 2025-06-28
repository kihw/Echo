const request = require('supertest');
const { app } = require('../../backend/app');
const pool = require('../../database/connection');

// Configuration des tests
jest.setTimeout(30000);

describe('OAuth Authentication Integration Tests', () => {
    let server;
    let testUserId;

    beforeAll(async () => {
        // Démarrer le serveur pour les tests
        server = app.listen(0); // Port dynamique
    });

    afterAll(async () => {
        // Nettoyer après les tests
        if (testUserId) {
            await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        }
        await server.close();
        await pool.end();
    });

    beforeEach(async () => {
        // Créer un utilisateur de test
        const result = await pool.query(`
            INSERT INTO users (id, email, created_at) 
            VALUES (uuid_generate_v4(), 'test@example.com', NOW()) 
            RETURNING id
        `);
        testUserId = result.rows[0].id;
    });

    afterEach(async () => {
        // Nettoyer l'utilisateur de test
        if (testUserId) {
            await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        }
    });

    describe('Spotify OAuth Flow', () => {
        test('should initiate Spotify OAuth flow', async () => {
            const response = await request(app)
                .get('/api/auth/spotify/login')
                .expect(302);

            expect(response.headers.location).toContain('accounts.spotify.com');
            expect(response.headers.location).toContain('client_id');
            expect(response.headers.location).toContain('response_type=code');
        });

        test('should handle Spotify OAuth callback', async () => {
            const mockCode = 'test_auth_code';
            const response = await request(app)
                .get(`/api/auth/spotify/callback?code=${mockCode}`)
                .expect(302);

            // En cas d'erreur de token (attendu en test), redirection vers erreur
            expect(response.headers.location).toContain('error');
        });

        test('should handle Spotify OAuth errors', async () => {
            const response = await request(app)
                .get('/api/auth/spotify/callback?error=access_denied')
                .expect(302);

            expect(response.headers.location).toContain('error=access_denied');
        });
    });

    describe('Deezer OAuth Flow', () => {
        test('should initiate Deezer OAuth flow', async () => {
            const response = await request(app)
                .get('/api/auth/deezer/login')
                .expect(302);

            expect(response.headers.location).toContain('connect.deezer.com');
            expect(response.headers.location).toContain('app_id');
            expect(response.headers.location).toContain('response_type=code');
        });

        test('should handle Deezer OAuth callback', async () => {
            const mockCode = 'test_auth_code';
            const response = await request(app)
                .get(`/api/auth/deezer/callback?code=${mockCode}`)
                .expect(302);

            // En cas d'erreur de token (attendu en test), redirection vers erreur
            expect(response.headers.location).toContain('error');
        });
    });

    describe('Google OAuth Flow', () => {
        test('should initiate Google OAuth flow', async () => {
            const response = await request(app)
                .get('/api/auth/google/login')
                .expect(302);

            expect(response.headers.location).toContain('accounts.google.com');
            expect(response.headers.location).toContain('client_id');
            expect(response.headers.location).toContain('response_type=code');
        });

        test('should handle Google OAuth callback', async () => {
            const mockCode = 'test_auth_code';
            const response = await request(app)
                .get(`/api/auth/google/callback?code=${mockCode}`)
                .expect(302);

            // En cas d'erreur de token (attendu en test), redirection vers erreur
            expect(response.headers.location).toContain('error');
        });
    });
});

describe('Protected Routes Integration Tests', () => {
    let authToken;
    let testUserId;

    beforeAll(async () => {
        // Créer un utilisateur de test et générer un token
        const result = await pool.query(`
            INSERT INTO users (id, email, created_at) 
            VALUES (uuid_generate_v4(), 'test@example.com', NOW()) 
            RETURNING id
        `);
        testUserId = result.rows[0].id;

        // Simuler un token JWT valide (en pratique, utiliser jsonwebtoken)
        authToken = 'Bearer test_jwt_token';
    });

    afterAll(async () => {
        if (testUserId) {
            await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        }
    });

    test('should reject requests without authentication', async () => {
        await request(app)
            .get('/api/user/profile')
            .expect(401);
    });

    test('should reject requests with invalid token', async () => {
        await request(app)
            .get('/api/user/profile')
            .set('Authorization', 'Bearer invalid_token')
            .expect(401);
    });

    // Note: Tests avec token valide nécessiteraient une configuration JWT plus complexe
});

describe('API Health and Basic Functionality', () => {
    test('should return health status', async () => {
        const response = await request(app)
            .get('/health')
            .expect(200);

        expect(response.body).toHaveProperty('status', 'OK');
        expect(response.body).toHaveProperty('service', 'Echo Music Player API');
        expect(response.body).toHaveProperty('database');
    });

    test('should return API information', async () => {
        const response = await request(app)
            .get('/api')
            .expect(200);

        expect(response.body).toHaveProperty('name', 'Echo Music Player API');
        expect(response.body).toHaveProperty('endpoints');
    });

    test('should return 404 for non-existent routes', async () => {
        const response = await request(app)
            .get('/api/non-existent')
            .expect(404);

        expect(response.body).toHaveProperty('error', 'Route non trouvée');
    });

    test('should handle rate limiting', async () => {
        // Effectuer de nombreuses requêtes pour déclencher la limitation
        const requests = Array(110).fill().map(() =>
            request(app).get('/api/test')
        );

        const responses = await Promise.allSettled(requests);

        // Au moins une requête devrait être limitée (429)
        const rateLimited = responses.some(
            result => result.status === 'fulfilled' &&
                result.value.status === 429
        );

        expect(rateLimited).toBe(true);
    });
});

describe('Database Integration Tests', () => {
    test('should connect to database', async () => {
        const response = await request(app)
            .get('/api/test/db')
            .expect(200);

        expect(response.body).toHaveProperty('message', 'Connexion base de données OK');
        expect(response.body).toHaveProperty('userCount');
    });

    test('should handle database errors gracefully', async () => {
        // Simuler une erreur de base de données en exécutant une requête invalide
        const originalQuery = pool.query;
        pool.query = jest.fn().mockRejectedValue(new Error('Database connection failed'));

        const response = await request(app)
            .get('/api/test/db')
            .expect(500);

        expect(response.body).toHaveProperty('error', 'Erreur de base de données');

        // Restaurer la fonction originale
        pool.query = originalQuery;
    });
});

describe('CORS and Security Headers', () => {
    test('should include CORS headers', async () => {
        const response = await request(app)
            .get('/api')
            .expect(200);

        expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('should include security headers', async () => {
        const response = await request(app)
            .get('/api')
            .expect(200);

        expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
        expect(response.headers).toHaveProperty('x-frame-options');
    });

    test('should handle preflight requests', async () => {
        const response = await request(app)
            .options('/api/test')
            .set('Origin', 'http://localhost:3001')
            .set('Access-Control-Request-Method', 'POST')
            .expect(204);

        expect(response.headers).toHaveProperty('access-control-allow-methods');
    });
});
