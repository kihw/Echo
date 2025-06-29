import { test, expect } from '@playwright/test';

test.describe('Echo Music Player - Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should load the homepage', async ({ page }) => {
        await expect(page).toHaveTitle(/Echo Music Player/);
        await expect(page.locator('h1')).toContainText('Echo');
    });

    test('should redirect to login when not authenticated', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL('/auth/login');
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await page.goto('/auth/login');

        // Fill login form
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');

        // Submit form
        await page.click('[data-testid="login-button"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.goto('/auth/login');

        await page.fill('[data-testid="email-input"]', 'invalid@example.com');
        await page.fill('[data-testid="password-input"]', 'wrongpassword');

        await page.click('[data-testid="login-button"]');

        // Should show error message
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    });

    test('should register new user successfully', async ({ page }) => {
        await page.goto('/auth/register');

        // Fill registration form
        await page.fill('[data-testid="name-input"]', 'New User');
        await page.fill('[data-testid="email-input"]', 'newuser@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.fill('[data-testid="confirm-password-input"]', 'password123');

        // Submit form
        await page.click('[data-testid="register-button"]');

        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('[data-testid="user-name"]')).toContainText('New User');
    });

    test('should logout successfully', async ({ page }) => {
        // Login first
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');

        await expect(page).toHaveURL('/dashboard');

        // Logout
        await page.click('[data-testid="user-menu"]');
        await page.click('[data-testid="logout-button"]');

        // Should redirect to home
        await expect(page).toHaveURL('/');
    });

    test('should persist session on page reload', async ({ page }) => {
        // Login
        await page.goto('/auth/login');
        await page.fill('[data-testid="email-input"]', 'test@example.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');

        await expect(page).toHaveURL('/dashboard');

        // Reload page
        await page.reload();

        // Should still be authenticated
        await expect(page).toHaveURL('/dashboard');
        await expect(page.locator('[data-testid="user-name"]')).toBeVisible();
    });
});
