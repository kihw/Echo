const request = require('supertest');
const { app } = require('../../backend/app');
const pool = require('../../database/connection');
const jwt = require('jsonwebtoken');

jest.setTimeout(30000);

describe('Playlist Generation Integration Tests', () => {
    let authToken;
    let testUserId;
    let server;

    beforeAll(async () => {
        server = app.listen(0);

        // Créer un utilisateur de test
        const result = await pool.query(`
            INSERT INTO users (id, email, created_at) 
            VALUES (uuid_generate_v4(), 'test-playlist@example.com', NOW()) 
            RETURNING id
        `);
        testUserId = result.rows[0].id;

        // Générer un token JWT valide pour les tests
        authToken = jwt.sign(
            { id: testUserId, email: 'test-playlist@example.com' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        // Nettoyer les données de test
        await pool.query('DELETE FROM playlist_tracks WHERE playlist_id IN (SELECT id FROM playlists WHERE user_id = $1)', [testUserId]);
        await pool.query('DELETE FROM playlists WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
        await server.close();
    });

    describe('Playlist Generation API', () => {
        test('should generate a similarity-based playlist', async () => {
            const playlistData = {
                algorithm: 'similarity',
                targetSize: 20,
                name: 'Test Similarity Playlist',
                description: 'Playlist générée par les tests',
                seedTracks: [
                    { id: 'spotify:track:test1', name: 'Test Track 1' }
                ],
                audioFeatures: {
                    danceability: { min: 0.5, max: 1.0 },
                    energy: { min: 0.6, max: 1.0 }
                }
            };

            const response = await request(app)
                .post('/api/playlists/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send(playlistData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('playlistId');
            expect(response.body.playlist).toHaveProperty('name', playlistData.name);
            expect(response.body.playlist).toHaveProperty('algorithm_used', 'similarity');
        });

        test('should generate a mood-based playlist', async () => {
            const playlistData = {
                algorithm: 'mood',
                targetSize: 15,
                name: 'Test Mood Playlist',
                audioFeatures: {
                    valence: { min: 0.7, max: 1.0 }, // Happy mood
                    energy: { min: 0.5, max: 0.8 }
                }
            };

            const response = await request(app)
                .post('/api/playlists/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send(playlistData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.playlist).toHaveProperty('algorithm_used', 'mood');
        });

        test('should generate a genre-based playlist', async () => {
            const playlistData = {
                algorithm: 'genre',
                targetSize: 25,
                name: 'Test Genre Playlist',
                seedGenres: ['rock', 'alternative'],
                rules: {
                    genreVariety: 0.3,
                    includeSimilarGenres: true
                }
            };

            const response = await request(app)
                .post('/api/playlists/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send(playlistData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.playlist).toHaveProperty('algorithm_used', 'genre');
        });

        test('should generate a hybrid playlist', async () => {
            const playlistData = {
                algorithm: 'hybrid',
                targetSize: 30,
                name: 'Test Hybrid Playlist',
                seedTracks: [
                    { id: 'spotify:track:test1', name: 'Test Track 1' }
                ],
                seedArtists: [
                    { id: 'spotify:artist:test1', name: 'Test Artist 1' }
                ],
                audioFeatures: {
                    danceability: { min: 0.4, max: 0.8 },
                    energy: { min: 0.5, max: 0.9 }
                },
                rules: {
                    diversityWeight: 0.7,
                    popularityWeight: 0.3
                }
            };

            const response = await request(app)
                .post('/api/playlists/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send(playlistData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.playlist).toHaveProperty('algorithm_used', 'hybrid');
        });

        test('should validate playlist generation parameters', async () => {
            // Test avec taille invalide
            const invalidData = {
                algorithm: 'similarity',
                targetSize: 150, // Trop grand
                name: 'Invalid Playlist'
            };

            await request(app)
                .post('/api/playlists/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);
        });

        test('should validate algorithm parameter', async () => {
            const invalidData = {
                algorithm: 'invalid_algorithm',
                targetSize: 20,
                name: 'Invalid Algorithm Playlist'
            };

            await request(app)
                .post('/api/playlists/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);
        });

        test('should require authentication', async () => {
            const playlistData = {
                algorithm: 'similarity',
                targetSize: 20,
                name: 'Unauthorized Playlist'
            };

            await request(app)
                .post('/api/playlists/generate')
                .send(playlistData)
                .expect(401);
        });
    });

    describe('Playlist Analysis API', () => {
        let testPlaylistId;

        beforeAll(async () => {
            // Créer une playlist de test
            const result = await pool.query(`
                INSERT INTO playlists (id, user_id, name, algorithm_used, track_count, created_at, updated_at)
                VALUES (uuid_generate_v4(), $1, 'Test Analysis Playlist', 'similarity', 0, NOW(), NOW())
                RETURNING id
            `, [testUserId]);
            testPlaylistId = result.rows[0].id;
        });

        test('should analyze playlist audio features', async () => {
            const response = await request(app)
                .get(`/api/playlists/generate/${testPlaylistId}/analysis`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('playlistId', testPlaylistId);
            expect(response.body).toHaveProperty('analysis');
            expect(response.body.analysis).toHaveProperty('audioFeatures');
            expect(response.body.analysis).toHaveProperty('genres');
            expect(response.body.analysis).toHaveProperty('diversity');
        });

        test('should get playlist recommendations', async () => {
            const response = await request(app)
                .get(`/api/playlists/generate/${testPlaylistId}/recommendations`)
                .set('Authorization', `Bearer ${authToken}`)
                .query({ limit: 10 })
                .expect(200);

            expect(response.body).toHaveProperty('recommendations');
            expect(Array.isArray(response.body.recommendations)).toBe(true);
            expect(response.body.recommendations.length).toBeLessThanOrEqual(10);
        });
    });

    describe('Playlist Generation Rules', () => {
        test('should apply diversity rules', async () => {
            const playlistData = {
                algorithm: 'similarity',
                targetSize: 20,
                name: 'Diversity Test Playlist',
                rules: {
                    diversityWeight: 0.8,
                    maxSameArtist: 2,
                    maxSameAlbum: 1
                }
            };

            const response = await request(app)
                .post('/api/playlists/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send(playlistData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.playlist).toHaveProperty('generation_params');
        });

        test('should apply temporal rules', async () => {
            const playlistData = {
                algorithm: 'tempo',
                targetSize: 15,
                name: 'Tempo Test Playlist',
                rules: {
                    tempoProgression: 'ascending',
                    tempoRange: { min: 80, max: 140 }
                },
                audioFeatures: {
                    tempo: { min: 80, max: 140 }
                }
            };

            const response = await request(app)
                .post('/api/playlists/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send(playlistData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.playlist).toHaveProperty('algorithm_used', 'tempo');
        });

        test('should apply discovery rules', async () => {
            const playlistData = {
                algorithm: 'discovery',
                targetSize: 25,
                name: 'Discovery Test Playlist',
                rules: {
                    discoveryWeight: 0.9,
                    maxPopularity: 50, // Favoriser les tracks moins populaires
                    includeNewReleases: true
                }
            };

            const response = await request(app)
                .post('/api/playlists/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send(playlistData)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.playlist).toHaveProperty('algorithm_used', 'discovery');
        });
    });

    describe('Playlist Export and Sharing', () => {
        let testPlaylistId;

        beforeAll(async () => {
            const result = await pool.query(`
                INSERT INTO playlists (id, user_id, name, algorithm_used, track_count, is_public, created_at, updated_at)
                VALUES (uuid_generate_v4(), $1, 'Test Export Playlist', 'similarity', 0, true, NOW(), NOW())
                RETURNING id
            `, [testUserId]);
            testPlaylistId = result.rows[0].id;
        });

        test('should export playlist to Spotify format', async () => {
            const response = await request(app)
                .get(`/api/playlists/generate/${testPlaylistId}/export/spotify`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('format', 'spotify');
            expect(response.body).toHaveProperty('tracks');
            expect(response.body).toHaveProperty('metadata');
        });

        test('should export playlist to M3U format', async () => {
            const response = await request(app)
                .get(`/api/playlists/generate/${testPlaylistId}/export/m3u`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.headers['content-type']).toContain('audio/x-mpegurl');
        });

        test('should generate shareable link', async () => {
            const response = await request(app)
                .post(`/api/playlists/generate/${testPlaylistId}/share`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ expiresIn: '7d' })
                .expect(200);

            expect(response.body).toHaveProperty('shareUrl');
            expect(response.body).toHaveProperty('expiresAt');
        });
    });
});

describe('Playlist Performance Tests', () => {
    let authToken;
    let testUserId;

    beforeAll(async () => {
        const result = await pool.query(`
            INSERT INTO users (id, email, created_at) 
            VALUES (uuid_generate_v4(), 'test-performance@example.com', NOW()) 
            RETURNING id
        `);
        testUserId = result.rows[0].id;

        authToken = jwt.sign(
            { id: testUserId, email: 'test-performance@example.com' },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );
    });

    afterAll(async () => {
        await pool.query('DELETE FROM playlist_tracks WHERE playlist_id IN (SELECT id FROM playlists WHERE user_id = $1)', [testUserId]);
        await pool.query('DELETE FROM playlists WHERE user_id = $1', [testUserId]);
        await pool.query('DELETE FROM users WHERE id = $1', [testUserId]);
    });

    test('should generate playlist within acceptable time', async () => {
        const startTime = Date.now();

        const playlistData = {
            algorithm: 'hybrid',
            targetSize: 50, // Playlist plus grande
            name: 'Performance Test Playlist'
        };

        const response = await request(app)
            .post('/api/playlists/generate')
            .set('Authorization', `Bearer ${authToken}`)
            .send(playlistData)
            .expect(201);

        const endTime = Date.now();
        const duration = endTime - startTime;

        expect(response.body).toHaveProperty('success', true);
        expect(duration).toBeLessThan(10000); // Moins de 10 secondes
    });

    test('should handle multiple concurrent playlist generations', async () => {
        const concurrentRequests = 5;
        const playlistPromises = [];

        for (let i = 0; i < concurrentRequests; i++) {
            const playlistData = {
                algorithm: 'similarity',
                targetSize: 20,
                name: `Concurrent Test Playlist ${i}`
            };

            const promise = request(app)
                .post('/api/playlists/generate')
                .set('Authorization', `Bearer ${authToken}`)
                .send(playlistData);

            playlistPromises.push(promise);
        }

        const responses = await Promise.all(playlistPromises);

        responses.forEach(response => {
            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('success', true);
        });
    });
});
