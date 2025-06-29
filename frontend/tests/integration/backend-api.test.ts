import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { api, authApi, userApi, musicApi, playlistApi } from '../../src/services/api';

describe('Backend API Integration Tests', () => {
    let authToken: string;
    let testUserId: string;

    beforeAll(async () => {
        // Setup test environment
        console.log('Setting up integration tests...');
    });

    afterAll(async () => {
        // Cleanup test data
        console.log('Cleaning up integration tests...');
    });

    describe('Authentication API', () => {
        it('should register a new user', async () => {
            const testUser = {
                email: 'test@echo.local',
                password: 'testpassword123',
                displayName: 'Test User'
            };

            try {
                const response = await authApi.register(
                    testUser.email,
                    testUser.password,
                    testUser.displayName
                );

                expect(response.status).toBe(201);
                expect(response.data.user).toBeDefined();
                expect(response.data.user.email).toBe(testUser.email);
                testUserId = response.data.user.id;
            } catch (error: any) {
                // User might already exist, try login instead
                if (error.response?.status === 409) {
                    console.log('User already exists, skipping registration test');
                } else {
                    throw error;
                }
            }
        });

        it('should login with valid credentials', async () => {
            try {
                const response = await authApi.login('test@echo.local', 'testpassword123');

                expect(response.status).toBe(200);
                expect(response.data.token).toBeDefined();
                expect(response.data.user).toBeDefined();

                authToken = response.data.token;
                // Store token for subsequent requests
                localStorage.setItem('auth_token', authToken);
            } catch (error: any) {
                console.error('Login test failed:', error.response?.data || error.message);
                throw error;
            }
        });

        it('should get OAuth URLs', async () => {
            try {
                const spotifyResponse = await authApi.getSpotifyAuthUrl();
                expect(spotifyResponse.status).toBe(200);
                expect(spotifyResponse.data.url).toContain('spotify');

                const deezerResponse = await authApi.getDeezerAuthUrl();
                expect(deezerResponse.status).toBe(200);
                expect(deezerResponse.data.url).toContain('deezer');
            } catch (error: any) {
                console.error('OAuth URL test failed:', error.response?.data || error.message);
                throw error;
            }
        });
    });

    describe('User API', () => {
        it('should get user profile', async () => {
            try {
                const response = await userApi.getProfile();

                expect(response.status).toBe(200);
                expect(response.data.user).toBeDefined();
                expect(response.data.user.email).toBe('test@echo.local');
            } catch (error: any) {
                console.error('Get profile test failed:', error.response?.data || error.message);
                throw error;
            }
        });

        it('should update user profile', async () => {
            try {
                const updates = {
                    displayName: 'Updated Test User',
                    preferences: {
                        theme: 'dark',
                        language: 'fr',
                        autoplay: true
                    }
                };

                const response = await userApi.updateProfile(updates);

                expect(response.status).toBe(200);
                expect(response.data.user.displayName).toBe(updates.displayName);
            } catch (error: any) {
                console.error('Update profile test failed:', error.response?.data || error.message);
                throw error;
            }
        });

        it('should get user listening history', async () => {
            try {
                const response = await userApi.getHistory(10, 0);

                expect(response.status).toBe(200);
                expect(response.data.history).toBeDefined();
                expect(Array.isArray(response.data.history)).toBe(true);
            } catch (error: any) {
                console.error('Get history test failed:', error.response?.data || error.message);
                throw error;
            }
        });

        it('should get user stats', async () => {
            try {
                const response = await userApi.getStats();

                expect(response.status).toBe(200);
                expect(response.data.stats).toBeDefined();
            } catch (error: any) {
                console.error('Get stats test failed:', error.response?.data || error.message);
                throw error;
            }
        });
    });

    describe('Music API', () => {
        it('should search for music', async () => {
            try {
                const response = await musicApi.search('The Weeknd', 'all', 10);

                expect(response.status).toBe(200);
                expect(response.data.tracks || response.data.artists || response.data.albums).toBeDefined();
            } catch (error: any) {
                console.error('Music search test failed:', error.response?.data || error.message);
                throw error;
            }
        });

        it('should get recommendations', async () => {
            try {
                const response = await musicApi.getRecommendations({
                    genres: ['pop', 'rock'],
                    limit: 10
                });

                expect(response.status).toBe(200);
                expect(response.data.tracks).toBeDefined();
                expect(Array.isArray(response.data.tracks)).toBe(true);
            } catch (error: any) {
                console.error('Get recommendations test failed:', error.response?.data || error.message);
                throw error;
            }
        });

        it('should get music genres', async () => {
            try {
                const response = await musicApi.getGenres();

                expect(response.status).toBe(200);
                expect(response.data.genres).toBeDefined();
                expect(Array.isArray(response.data.genres)).toBe(true);
            } catch (error: any) {
                console.error('Get genres test failed:', error.response?.data || error.message);
                throw error;
            }
        });
    });

    describe('Playlist API', () => {
        let testPlaylistId: string;

        it('should create a new playlist', async () => {
            try {
                const playlistData = {
                    name: 'Test Playlist',
                    description: 'Integration test playlist',
                    isPublic: false,
                    type: 'manual'
                };

                const response = await playlistApi.createPlaylist(playlistData);

                expect(response.status).toBe(201);
                expect(response.data.playlist).toBeDefined();
                expect(response.data.playlist.name).toBe(playlistData.name);

                testPlaylistId = response.data.playlist.id;
            } catch (error: any) {
                console.error('Create playlist test failed:', error.response?.data || error.message);
                throw error;
            }
        });

        it('should get user playlists', async () => {
            try {
                const response = await playlistApi.getPlaylists(10, 0);

                expect(response.status).toBe(200);
                expect(response.data.playlists).toBeDefined();
                expect(Array.isArray(response.data.playlists)).toBe(true);
            } catch (error: any) {
                console.error('Get playlists test failed:', error.response?.data || error.message);
                throw error;
            }
        });

        it('should get specific playlist', async () => {
            if (!testPlaylistId) {
                console.log('Skipping get playlist test - no test playlist created');
                return;
            }

            try {
                const response = await playlistApi.getPlaylist(testPlaylistId);

                expect(response.status).toBe(200);
                expect(response.data.playlist).toBeDefined();
                expect(response.data.playlist.id).toBe(testPlaylistId);
            } catch (error: any) {
                console.error('Get playlist test failed:', error.response?.data || error.message);
                throw error;
            }
        });

        it('should update playlist', async () => {
            if (!testPlaylistId) {
                console.log('Skipping update playlist test - no test playlist created');
                return;
            }

            try {
                const updates = {
                    name: 'Updated Test Playlist',
                    description: 'Updated description',
                    isPublic: true
                };

                const response = await playlistApi.updatePlaylist(testPlaylistId, updates);

                expect(response.status).toBe(200);
                expect(response.data.playlist.name).toBe(updates.name);
            } catch (error: any) {
                console.error('Update playlist test failed:', error.response?.data || error.message);
                throw error;
            }
        });

        it('should delete playlist', async () => {
            if (!testPlaylistId) {
                console.log('Skipping delete playlist test - no test playlist created');
                return;
            }

            try {
                const response = await playlistApi.deletePlaylist(testPlaylistId);

                expect(response.status).toBe(200);
            } catch (error: any) {
                console.error('Delete playlist test failed:', error.response?.data || error.message);
                throw error;
            }
        });
    });
});
