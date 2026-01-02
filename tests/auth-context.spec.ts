import { test, expect } from '@playwright/test';

test.describe('AuthContext Component Tests', () => {
  test('should clear authentication state on logout', async ({ page }) => {
    // Sign in using user-facing locators
    await page.goto('/signin');
    await page
      .getByLabel('Username')
      .fill(process.env.TEST_ADMIN_USERNAME || 'admin');
    await page
      .getByLabel('Password')
      .fill(process.env.TEST_ADMIN_PASSWORD || 'pass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL('**/dashboard');

    // Click username dropdown using role-based locator
    await page.getByRole('button', { name: 'admin ▼' }).click();

    // Click logout using text locator
    await page.getByText('Logout').click();

    // Should redirect to signin
    await page.waitForURL('**/signin');
    await expect(page).toHaveURL(/signin/);

    // Check localStorage is cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const user = await page.evaluate(() => localStorage.getItem('user'));

    expect(token).toBeNull();
    expect(user).toBeNull();
  });

  test('should handle admin role correctly', async ({ page }) => {
    // Sign in as admin using user-facing locators
    await page.goto('/signin');
    await page
      .getByLabel('Username')
      .fill(process.env.TEST_ADMIN_USERNAME || 'admin');
    await page
      .getByLabel('Password')
      .fill(process.env.TEST_ADMIN_PASSWORD || 'pass123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await page.waitForURL('**/dashboard');

    // Check admin indicator in dropdown using role-based locator
    await page.getByRole('button', { name: 'admin ▼' }).click();
    await expect(
      page.locator('.text-blue-400.text-xs').filter({ hasText: 'Admin' })
    ).toBeVisible();

    // Check admin panel button is visible using text locator
    await expect(page.getByText('Admin Panel')).toBeVisible();
  });

  test('should protect routes for unauthenticated users', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard');

    // Should redirect to signin
    await page.waitForURL('**/signin');
    await expect(page).toHaveURL(/signin/);
  });

  test('should protect admin routes for non-admin users', async ({ page }) => {
    // First create a regular user by signing up
    const timestamp = Date.now();
    const username = `testuser_${timestamp}`;
    const password = `testpass_${timestamp}`;

    await page.goto('/signup');
    await page.getByLabel('Username').fill(username);
    await page.getByPlaceholder('Create a password').fill(password);
    await page.getByPlaceholder('Confirm your password').fill(password);
    await page
      .getByRole('button', { name: 'Continue to Avatar Selection' })
      .click();

    await page.waitForURL('**/avatar-selection');

    // Select avatar and continue using user-facing locators
    await page.waitForSelector('button[id^="avatar-"]', { timeout: 15000 });
    await page.locator('button[id^="avatar-"]').first().click();
    await page.getByRole('button', { name: 'Continue to Dashboard' }).click();

    await page.waitForURL('**/dashboard');

    // Try to access admin panel
    await page.goto('/admin');

    // Should redirect (either to dashboard or signin)
    await page.waitForURL((url) => url.pathname !== '/admin');
    expect(page.url()).not.toContain('/admin');
  });
});
