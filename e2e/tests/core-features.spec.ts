import { test, expect } from '@playwright/test';

test.describe('Echo Music Player - Core Features', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('should display dashboard with user data', async ({ page }) => {
        // Check dashboard components
        await expect(page.locator('[data-testid="listening-stats"]')).toBeVisible();
        await expect(page.locator('[data-testid="recent-playlists"]')).toBeVisible();
        await expect(page.locator('[data-testid="top-tracks"]')).toBeVisible();
        await expect(page.locator('[data-testid="top-artists"]')).toBeVisible();
    });

    test('should perform music search', async ({ page }) => {
        await page.goto('/search');

        // Search for music
        await page.fill('[data-testid="search-input"]', 'test song');
        await page.press('[data-testid="search-input"]', 'Enter');

        // Should show results
        await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
        await expect(page.locator('[data-testid="track-item"]').first()).toBeVisible();
    });

    test('should create new playlist', async ({ page }) => {
        await page.goto('/playlists');

        // Click create playlist
        await page.click('[data-testid="create-playlist-button"]');

        // Fill playlist form
        await page.fill('[data-testid="playlist-name-input"]', 'My Test Playlist');
        await page.fill('[data-testid="playlist-description-input"]', 'Test playlist description');
        await page.click('[data-testid="save-playlist-button"]');

        // Should show new playlist
        await expect(page.locator('[data-testid="playlist-item"]').first()).toContainText('My Test Playlist');
    });

    test('should play music', async ({ page }) => {
        await page.goto('/search');

        // Search and play a song
        await page.fill('[data-testid="search-input"]', 'test song');
        await page.press('[data-testid="search-input"]', 'Enter');

        // Click play button on first result
        await page.click('[data-testid="play-button"]');

        // Should show player controls
        await expect(page.locator('[data-testid="audio-player"]')).toBeVisible();
        await expect(page.locator('[data-testid="current-track"]')).toBeVisible();
        await expect(page.locator('[data-testid="pause-button"]')).toBeVisible();
    });

    test('should control audio playback', async ({ page }) => {
        // Start playing music first
        await page.goto('/search');
        await page.fill('[data-testid="search-input"]', 'test song');
        await page.press('[data-testid="search-input"]', 'Enter');
        await page.click('[data-testid="play-button"]');

        // Test pause/play
        await page.click('[data-testid="pause-button"]');
        await expect(page.locator('[data-testid="play-button"]')).toBeVisible();

        await page.click('[data-testid="play-button"]');
        await expect(page.locator('[data-testid="pause-button"]')).toBeVisible();

        // Test volume control
        await page.click('[data-testid="volume-slider"]');
        await page.fill('[data-testid="volume-slider"]', '0.5');

        // Test progress bar
        await page.click('[data-testid="progress-bar"]');
    });

    test('should sync with external services', async ({ page }) => {
        await page.goto('/sync');

        // Should show sync interface
        await expect(page.locator('[data-testid="sync-services"]')).toBeVisible();
        await expect(page.locator('[data-testid="spotify-sync"]')).toBeVisible();
        await expect(page.locator('[data-testid="deezer-sync"]')).toBeVisible();

        // Test sync history
        await expect(page.locator('[data-testid="sync-history"]')).toBeVisible();
    });

    test('should display statistics', async ({ page }) => {
        await page.goto('/stats');

        // Should show stats components
        await expect(page.locator('[data-testid="listening-chart"]')).toBeVisible();
        await expect(page.locator('[data-testid="genre-distribution"]')).toBeVisible();
        await expect(page.locator('[data-testid="top-tracks-chart"]')).toBeVisible();
        await expect(page.locator('[data-testid="activity-heatmap"]')).toBeVisible();
    });

    test('should navigate between pages', async ({ page }) => {
        // Test sidebar navigation
        await page.click('[data-testid="nav-search"]');
        await expect(page).toHaveURL('/search');

        await page.click('[data-testid="nav-playlists"]');
        await expect(page).toHaveURL('/playlists');

        await page.click('[data-testid="nav-stats"]');
        await expect(page).toHaveURL('/stats');

        await page.click('[data-testid="nav-sync"]');
        await expect(page).toHaveURL('/sync');

        await page.click('[data-testid="nav-dashboard"]');
        await expect(page).toHaveURL('/dashboard');
    });
});
