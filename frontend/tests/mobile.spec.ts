import { test, expect } from '@playwright/test';

test.describe('Mobile Navigation', () => {
    test.beforeEach(async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
    });

    test('should open mobile navigation on burger menu tap', async ({ page }) => {
        // Locate and tap burger menu
        const burgerMenu = page.locator('[data-testid="mobile-burger-menu"]');
        await burgerMenu.tap();

        // Check if navigation is visible
        const mobileNav = page.locator('[data-testid="mobile-navigation"]');
        await expect(mobileNav).toBeVisible();
    });

    test('should close mobile navigation on outside tap', async ({ page }) => {
        // Open navigation
        await page.locator('[data-testid="mobile-burger-menu"]').tap();

        // Tap outside navigation
        await page.tap('main', { position: { x: 300, y: 400 } });

        // Check if navigation is hidden
        const mobileNav = page.locator('[data-testid="mobile-navigation"]');
        await expect(mobileNav).not.toBeVisible();
    });
});

test.describe('Mobile Player Controls', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        // Mock authentication
        await page.evaluate(() => {
            localStorage.setItem('auth-token', 'mock-token');
        });
    });

    test('should expand player on swipe up', async ({ page }) => {
        // Mock current track
        await page.evaluate(() => {
            window.__NEXT_DATA__ = {
                ...window.__NEXT_DATA__,
                props: {
                    pageProps: {
                        currentTrack: {
                            id: '1',
                            title: 'Test Song',
                            artist: 'Test Artist'
                        }
                    }
                }
            };
        });

        const compactPlayer = page.locator('[data-testid="compact-player"]');
        await expect(compactPlayer).toBeVisible();

        // Swipe up on compact player
        await compactPlayer.hover();
        await page.mouse.down();
        await page.mouse.move(187, 300); // Move up
        await page.mouse.up();

        // Check if full screen player is visible
        const fullScreenPlayer = page.locator('[data-testid="fullscreen-player"]');
        await expect(fullScreenPlayer).toBeVisible();
    });

    test('should close full screen player on swipe down', async ({ page }) => {
        // Open full screen player first
        await page.locator('[data-testid="expand-player-button"]').tap();

        const fullScreenPlayer = page.locator('[data-testid="fullscreen-player"]');
        await expect(fullScreenPlayer).toBeVisible();

        // Swipe down to close
        await fullScreenPlayer.hover();
        await page.mouse.down();
        await page.mouse.move(187, 600); // Move down
        await page.mouse.up();

        // Check if full screen player is hidden
        await expect(fullScreenPlayer).not.toBeVisible();
    });

    test('should skip to next track on swipe left', async ({ page }) => {
        await page.locator('[data-testid="expand-player-button"]').tap();

        const fullScreenPlayer = page.locator('[data-testid="fullscreen-player"]');

        // Mock track skip function
        await page.evaluate(() => {
            window.testTrackSkipped = false;
            window.mockPlayerNext = () => {
                window.testTrackSkipped = true;
            };
        });

        // Swipe left
        await fullScreenPlayer.hover();
        await page.mouse.down();
        await page.mouse.move(100, 334); // Move left
        await page.mouse.up();

        // Check if track was skipped
        const trackSkipped = await page.evaluate(() => window.testTrackSkipped);
        expect(trackSkipped).toBe(true);
    });
});

test.describe('PWA Installation', () => {
    test('should show PWA install banner', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        // Mock beforeinstallprompt event
        await page.addInitScript(() => {
            // Simulate PWA install prompt after delay
            setTimeout(() => {
                const event = new Event('beforeinstallprompt');
                event.prompt = () => Promise.resolve();
                event.userChoice = Promise.resolve({ outcome: 'accepted' });
                window.dispatchEvent(event);
            }, 1000);
        });

        await page.goto('/');

        // Wait for install banner to appear
        const installBanner = page.locator('[data-testid="pwa-install-banner"]');
        await expect(installBanner).toBeVisible({ timeout: 10000 });
    });

    test('should handle PWA install acceptance', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        let promptCalled = false;
        await page.addInitScript(() => {
            setTimeout(() => {
                const event = new Event('beforeinstallprompt');
                event.prompt = () => {
                    window.testPromptCalled = true;
                    return Promise.resolve();
                };
                event.userChoice = Promise.resolve({ outcome: 'accepted' });
                window.dispatchEvent(event);
            }, 1000);
        });

        await page.goto('/');

        const installButton = page.locator('[data-testid="pwa-install-button"]');
        await installButton.waitFor({ timeout: 10000 });
        await installButton.tap();

        // Check if prompt was called
        const promptWasCalled = await page.evaluate(() => window.testPromptCalled);
        expect(promptWasCalled).toBe(true);
    });
});

test.describe('Touch Gestures', () => {
    test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/playlists');
    });

    test('should show context menu on long press', async ({ page }) => {
        const playlistCard = page.locator('[data-testid="playlist-card"]').first();

        // Long press simulation
        await playlistCard.hover();
        await page.mouse.down();
        await page.waitForTimeout(800); // Long press duration
        await page.mouse.up();

        // Check if context menu appears
        const contextMenu = page.locator('[data-testid="context-menu"]');
        await expect(contextMenu).toBeVisible();
    });

    test('should handle pull to refresh', async ({ page }) => {
        // Mock refresh function
        await page.evaluate(() => {
            window.testRefreshCalled = false;
            window.mockRefresh = () => {
                window.testRefreshCalled = true;
            };
        });

        // Simulate pull to refresh
        await page.mouse.move(187, 100);
        await page.mouse.down();
        await page.mouse.move(187, 300, { steps: 10 });
        await page.waitForTimeout(100);
        await page.mouse.up();

        // Check if refresh was triggered
        const refreshCalled = await page.evaluate(() => window.testRefreshCalled);
        expect(refreshCalled).toBe(true);
    });
});

test.describe('Responsive Design', () => {
    const viewports = [
        { name: 'iPhone SE', width: 375, height: 667 },
        { name: 'iPhone 12', width: 390, height: 844 },
        { name: 'iPad', width: 768, height: 1024 },
        { name: 'iPad Pro', width: 1024, height: 1366 }
    ];

    viewports.forEach(({ name, width, height }) => {
        test(`should display correctly on ${name}`, async ({ page }) => {
            await page.setViewportSize({ width, height });
            await page.goto('/');

            // Check if layout adapts correctly
            const layout = page.locator('[data-testid="responsive-layout"]');
            await expect(layout).toBeVisible();

            // Take screenshot for visual regression testing
            await page.screenshot({
                path: `test-results/screenshots/responsive-${name.toLowerCase().replace(' ', '-')}.png`,
                fullPage: true
            });
        });
    });

    test('should hide/show elements based on screen size', async ({ page }) => {
        // Test desktop view
        await page.setViewportSize({ width: 1200, height: 800 });
        await page.goto('/');

        const desktopSidebar = page.locator('[data-testid="desktop-sidebar"]');
        await expect(desktopSidebar).toBeVisible();

        const mobileNav = page.locator('[data-testid="mobile-navigation"]');
        await expect(mobileNav).not.toBeVisible();

        // Test mobile view
        await page.setViewportSize({ width: 375, height: 667 });

        await expect(desktopSidebar).not.toBeVisible();
        // Mobile nav is hidden by default, only visible when opened
    });
});

test.describe('Offline Functionality', () => {
    test('should show offline page when network is unavailable', async ({ page, context }) => {
        await page.goto('/');

        // Simulate offline
        await context.setOffline(true);
        await page.reload();

        // Check if offline page is shown
        const offlinePage = page.locator('[data-testid="offline-page"]');
        await expect(offlinePage).toBeVisible();

        const offlineMessage = page.locator('text=Vous êtes hors ligne');
        await expect(offlineMessage).toBeVisible();
    });

    test('should cache important resources', async ({ page }) => {
        await page.goto('/');

        // Check if service worker is registered
        const swRegistered = await page.evaluate(async () => {
            return 'serviceWorker' in navigator &&
                await navigator.serviceWorker.getRegistration() !== undefined;
        });

        expect(swRegistered).toBe(true);
    });
});

test.describe('Performance', () => {
    test('should load quickly on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        const startTime = Date.now();
        await page.goto('/');

        // Wait for main content to be visible
        await page.locator('[data-testid="main-content"]').waitFor();
        const loadTime = Date.now() - startTime;

        // Should load in under 3 seconds on mobile
        expect(loadTime).toBeLessThan(3000);
    });

    test('should handle rapid user interactions', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        const playButton = page.locator('[data-testid="play-button"]');

        // Rapid taps should be handled gracefully
        for (let i = 0; i < 5; i++) {
            await playButton.tap();
            await page.waitForTimeout(100);
        }

        // App should remain responsive
        await expect(playButton).toBeVisible();
    });
});
