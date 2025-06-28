const request = require('supertest');
const { app } = require('../../backend/app');
const pool = require('../../database/connection');
const jwt = require('jsonwebtoken');
const dataSyncService = require('../../backend/services/dataSync');
const spotifyService = require('../../backend/services/spotify');
const deezerService = require('../../backend/services/deezer');

jest.setTimeout(60000); // Tests de sync peuvent être plus longs

describe('Data Synchronization Integration Tests', () => {
    let authToken;
    let testUserId;
    let server;

    beforeAll(async () => {
        server = app.listen(0);

        // Créer un utilisateur de test
        const result = await pool.query(`
            INSERT INTO users (id, email, created_at) 
            VALUES (uuid_generate_v4(), 'test-sync@example.com', NOW()) 
            RETURNING id
        `);
        testUserId = result.rows[0].id;

        authToken = jwt.sign(
            { id: testUserId, email: 'test-sync@example.com' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        // Nettoyer les données de test
        await pool.query('DELETE FROM sync_logs WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM playlist_tracks WHERE playlist_id IN (SELECT id FROM playlists WHERE user_id = $1)', [testUserId]);
        await pool.query('DELETE FROM playlists WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM user_profiles WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        await server.close();
    });

    describe('Service Connectivity Tests', () => {
        test('should test Spotify service connectivity', async () => {
            const response = await request(app)
                .get('/api/sync/test/spotify')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('service', 'Spotify');
            expect(response.body).toHaveProperty('status');
        });

        test('should test Deezer service connectivity', async () => {
            const response = await request(app)
                .get('/api/sync/test/deezer')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('service', 'Deezer');
            expect(response.body).toHaveProperty('status');
        });

        test('should test YouTube Music service connectivity', async () => {
            const response = await request(app)
                .get('/api/sync/test/ytmusic')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('service', 'YouTube Music');
            expect(response.body).toHaveProperty('status');
        });

        test('should test Lidarr service connectivity', async () => {
            const response = await request(app)
                .get('/api/sync/test/lidarr')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('service', 'Lidarr');
            expect(response.body).toHaveProperty('status');
        });

        test('should test all services connectivity', async () => {
            const response = await request(app)
                .get('/api/sync/test/all')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('services');
            expect(response.body.services).toHaveProperty('spotify');
            expect(response.body.services).toHaveProperty('deezer');
            expect(response.body.services).toHaveProperty('ytmusic');
            expect(response.body.services).toHaveProperty('lidarr');
        });
    });

    describe('Individual Service Import Tests', () => {
        test('should import Spotify playlists', async () => {
            // Mock Spotify service pour les tests
            const mockPlaylists = {
                total: 2,
                playlists: [
                    {
                        id: 'spotify_playlist_1',
                        name: 'Test Spotify Playlist 1',
                        description: 'Test playlist',
                        public: false,
                        trackCount: 10,
                        images: []
                    }
                ]
            };

            jest.spyOn(spotifyService, 'getUserPlaylists').mockResolvedValue(mockPlaylists);
            jest.spyOn(spotifyService, 'getPlaylistTracks').mockResolvedValue({
                tracks: [
                    {
                        id: 'track_1',
                        name: 'Test Track 1',
                        artists: [{ name: 'Test Artist' }],
                        album: { name: 'Test Album', images: [] },
                        duration_ms: 180000
                    }
                ]
            });

            const response = await request(app)
                .post('/api/sync/import/spotify')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accessToken: 'mock_spotify_token'
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('service', 'Spotify');
            expect(response.body.stats).toHaveProperty('playlists');

            // Vérifier que les données ont été sauvegardées
            const savedPlaylists = await pool.query(
                'SELECT * FROM playlists WHERE user_id = $1 AND spotify_id IS NOT NULL',
                [testUserId]
            );
            expect(savedPlaylists.rows.length).toBeGreaterThan(0);
        });

        test('should import Deezer favorites', async () => {
            const mockFavorites = {
                tracks: [
                    {
                        id: 'deezer_track_1',
                        title: 'Test Deezer Track',
                        artist: { name: 'Test Deezer Artist' },
                        album: { title: 'Test Deezer Album' },
                        duration: 200
                    }
                ]
            };

            jest.spyOn(deezerService, 'getUserFavorites').mockResolvedValue(mockFavorites);

            const response = await request(app)
                .post('/api/sync/import/deezer')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accessToken: 'mock_deezer_token'
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('service', 'Deezer');
        });

        test('should handle import errors gracefully', async () => {
            // Simuler une erreur de service
            jest.spyOn(spotifyService, 'getUserPlaylists').mockRejectedValue(
                new Error('Service unavailable')
            );

            const response = await request(app)
                .post('/api/sync/import/spotify')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    accessToken: 'invalid_token'
                })
                .expect(500);

            expect(response.body).toHaveProperty('success', false);
            expect(response.body).toHaveProperty('error');
        });
    });

    describe('Complete Data Synchronization', () => {
        test('should perform complete data sync', async () => {
            const syncData = {
                services: {
                    spotify: {
                        accessToken: 'mock_spotify_token',
                        refreshToken: 'mock_refresh_token'
                    },
                    deezer: {
                        accessToken: 'mock_deezer_token'
                    }
                }
            };

            // Mock des services pour le test complet
            jest.spyOn(spotifyService, 'syncUserPlaylists').mockResolvedValue({
                syncedCount: 3,
                totalCount: 5
            });

            jest.spyOn(dataSyncService, 'syncDeezerData').mockResolvedValue({
                status: 'success',
                playlists: 2,
                tracks: 50,
                artists: 0
            });

            jest.spyOn(dataSyncService, 'syncLidarrData').mockResolvedValue({
                status: 'success',
                playlists: 0,
                tracks: 0,
                artists: 10
            });

            const response = await request(app)
                .post('/api/sync/import/all')
                .set('Authorization', `Bearer ${authToken}`)
                .send(syncData)
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('syncId');
            expect(response.body.summary).toHaveProperty('totalPlaylists');
            expect(response.body.summary).toHaveProperty('totalTracks');
            expect(response.body.summary).toHaveProperty('totalArtists');

            // Vérifier que le log de sync a été créé
            const syncLogs = await pool.query(
                'SELECT * FROM sync_logs WHERE user_id = $1',
                [testUserId]
            );
            expect(syncLogs.rows.length).toBeGreaterThan(0);
        });

        test('should handle partial sync failures', async () => {
            const syncData = {
                services: {
                    spotify: {
                        accessToken: 'invalid_token'
                    },
                    deezer: {
                        accessToken: 'valid_token'
                    }
                }
            };

            // Mock des services avec succès partiel
            jest.spyOn(spotifyService, 'syncUserPlaylists').mockRejectedValue(
                new Error('Spotify sync failed')
            );

            jest.spyOn(dataSyncService, 'syncDeezerData').mockResolvedValue({
                status: 'success',
                playlists: 1,
                tracks: 25,
                artists: 0
            });

            const response = await request(app)
                .post('/api/sync/import/all')
                .set('Authorization', `Bearer ${authToken}`)
                .send(syncData)
                .expect(200);

            expect(response.body).toHaveProperty('success', false); // Échec partiel
            expect(response.body.summary).toHaveProperty('errors');
            expect(response.body.summary.errors).toBeGreaterThan(0);
        });

        test('should track sync progress', async () => {
            // Démarrer une synchronisation
            const syncData = {
                services: {
                    spotify: { accessToken: 'token' }
                }
            };

            jest.spyOn(spotifyService, 'syncUserPlaylists').mockImplementation(
                () => new Promise(resolve => setTimeout(() => resolve({ syncedCount: 1, totalCount: 1 }), 1000))
            );

            // Démarrer la sync en arrière-plan
            const syncPromise = request(app)
                .post('/api/sync/import/all')
                .set('Authorization', `Bearer ${authToken}`)
                .send(syncData);

            // Vérifier le statut pendant la sync
            await new Promise(resolve => setTimeout(resolve, 100));

            const statusResponse = await request(app)
                .get('/api/sync/status')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(statusResponse.body).toHaveProperty('inProgress');

            // Attendre la fin de la sync
            await syncPromise;
        });

        test('should get sync history', async () => {
            const response = await request(app)
                .get('/api/sync/history')
                .set('Authorization', `Bearer ${authToken}`)
                .query({ limit: 5 })
                .expect(200);

            expect(response.body).toHaveProperty('history');
            expect(Array.isArray(response.body.history)).toBe(true);
        });
    });

    describe('Data Validation and Integrity', () => {
        test('should validate synchronized data integrity', async () => {
            // Créer des données de test
            const playlistId = await pool.query(`
                INSERT INTO playlists (id, user_id, name, spotify_id, track_count, created_at, updated_at)
                VALUES (uuid_generate_v4(), $1, 'Test Playlist', 'spotify_test', 5, NOW(), NOW())
                RETURNING id
            `, [testUserId]);

            const testPlaylistId = playlistId.rows[0].id;

            // Ajouter des tracks de test
            for (let i = 0; i < 5; i++) {
                const trackResult = await pool.query(`
                    INSERT INTO tracks (id, title, artist, spotify_id, created_at)
                    VALUES (uuid_generate_v4(), $1, $2, $3, NOW())
                    RETURNING id
                `, [`Test Track ${i}`, 'Test Artist', `spotify_track_${i}`]);

                await pool.query(`
                    INSERT INTO playlist_tracks (playlist_id, track_id, position, added_at)
                    VALUES ($1, $2, $3, NOW())
                `, [testPlaylistId, trackResult.rows[0].id, i]);
            }

            // Valider l'intégrité
            const response = await request(app)
                .get('/api/sync/validate')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('validation');
            expect(response.body.validation).toHaveProperty('playlists');
            expect(response.body.validation).toHaveProperty('tracks');
            expect(response.body.validation).toHaveProperty('integrity');
        });

        test('should detect and report data inconsistencies', async () => {
            // Créer une playlist avec un count incorrect
            await pool.query(`
                INSERT INTO playlists (id, user_id, name, track_count, created_at, updated_at)
                VALUES (uuid_generate_v4(), $1, 'Inconsistent Playlist', 10, NOW(), NOW())
            `, [testUserId]); // Count: 10, mais aucune track

            const response = await request(app)
                .get('/api/sync/validate')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.validation).toHaveProperty('inconsistencies');
            expect(response.body.validation.inconsistencies.length).toBeGreaterThan(0);
        });
    });

    describe('Sync Performance and Rate Limiting', () => {
        test('should respect API rate limits', async () => {
            const syncData = {
                services: {
                    spotify: { accessToken: 'token' }
                }
            };

            // Simuler plusieurs syncs rapides
            const promises = Array(3).fill().map(() =>
                request(app)
                    .post('/api/sync/import/spotify')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(syncData)
            );

            const responses = await Promise.allSettled(promises);

            // Au moins une requête devrait être throttled ou en attente
            const hasThrottling = responses.some(result =>
                result.status === 'fulfilled' &&
                (result.value.status === 429 || result.value.body.message?.includes('en cours'))
            );

            expect(hasThrottling).toBe(true);
        });

        test('should handle large dataset synchronization', async () => {
            const startTime = Date.now();

            // Mock d'un large dataset
            jest.spyOn(spotifyService, 'syncUserPlaylists').mockResolvedValue({
                syncedCount: 50,
                totalCount: 100
            });

            const syncData = {
                services: {
                    spotify: { accessToken: 'token' }
                }
            };

            const response = await request(app)
                .post('/api/sync/import/spotify')
                .set('Authorization', `Bearer ${authToken}`)
                .send(syncData)
                .expect(200);

            const duration = Date.now() - startTime;

            expect(response.body).toHaveProperty('success', true);
            expect(duration).toBeLessThan(30000); // Moins de 30 secondes
        });
    });

    afterEach(() => {
        // Restaurer les mocks après chaque test
        jest.restoreAllMocks();
    });
});
