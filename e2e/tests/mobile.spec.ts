import { test, expect, devices } from '@playwright/test';

test.use(devices['iPhone 12']);

test.describe('Echo Music Player - Mobile Experience', () => {
    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('should display mobile navigation correctly', async ({ page }) => {
        // Should show mobile burger menu
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();

        // Open mobile menu
        await page.click('[data-testid="mobile-menu-button"]');
        await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();

        // Test navigation links
        await page.click('[data-testid="mobile-nav-search"]');
        await expect(page).toHaveURL('/search');
    });

    test('should display mobile player controls', async ({ page }) => {
        // Start playing music
        await page.goto('/search');
        await page.fill('[data-testid="search-input"]', 'test song');
        await page.press('[data-testid="search-input"]', 'Enter');
        await page.click('[data-testid="play-button"]');

        // Should show mobile player
        await expect(page.locator('[data-testid="mobile-player"]')).toBeVisible();
        await expect(page.locator('[data-testid="mobile-player-controls"]')).toBeVisible();
    });

    test('should support touch gestures', async ({ page }) => {
        // Start playing music
        await page.goto('/search');
        await page.fill('[data-testid="search-input"]', 'test song');
        await page.press('[data-testid="search-input"]', 'Enter');
        await page.click('[data-testid="play-button"]');

        // Open full screen player
        await page.click('[data-testid="current-track"]');
        await expect(page.locator('[data-testid="fullscreen-player"]')).toBeVisible();

        // Test swipe gestures (simulate with touch events)
        const player = page.locator('[data-testid="fullscreen-player"]');
        await player.swipeLeft();

        // Should skip to next track (if available)
        // await expect(page.locator('[data-testid="next-track-indicator"]')).toBeVisible();
    });

    test('should handle responsive layout changes', async ({ page }) => {
        // Test different viewport sizes
        await page.setViewportSize({ width: 320, height: 568 }); // iPhone SE
        await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();

        await page.setViewportSize({ width: 768, height: 1024 }); // Tablet
        await expect(page.locator('[data-testid="tablet-layout"]')).toBeVisible();
    });

    test('should optimize touch interactions', async ({ page }) => {
        // Test touch-friendly button sizes
        const playButton = page.locator('[data-testid="play-button"]').first();
        const boundingBox = await playButton.boundingBox();

        // Buttons should be at least 44px for touch (iOS guideline)
        expect(boundingBox?.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
    });

    test('should display mobile-optimized search', async ({ page }) => {
        await page.goto('/search');

        // Should show mobile search interface
        await expect(page.locator('[data-testid="mobile-search"]')).toBeVisible();

        // Test search input focus behavior
        await page.click('[data-testid="search-input"]');
        await expect(page.locator('[data-testid="search-input"]')).toBeFocused();
    });

    test('should handle mobile playlist management', async ({ page }) => {
        await page.goto('/playlists');

        // Should show mobile playlist layout
        await expect(page.locator('[data-testid="mobile-playlists"]')).toBeVisible();

        // Test playlist creation on mobile
        await page.click('[data-testid="mobile-create-playlist"]');
        await page.fill('[data-testid="playlist-name-input"]', 'Mobile Playlist');
        await page.click('[data-testid="save-playlist-button"]');

        await expect(page.locator('[data-testid="playlist-item"]').first()).toContainText('Mobile Playlist');
    });

    test('should support pull-to-refresh', async ({ page }) => {
        await page.goto('/dashboard');

        // Simulate pull-to-refresh gesture
        await page.touchscreen.swipeDown(0, 0, 0, 100);

        // Should trigger refresh
        await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible();
    });
});
