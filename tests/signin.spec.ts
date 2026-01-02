import { test, expect } from '@playwright/test';

// Test data storage
let testCredentials: { username: string; password: string };

test.describe('SignInPage Component Tests', () => {
  test.beforeEach(async () => {
    // Generate unique test credentials for each test to ensure isolation
    const timestamp = Date.now() + Math.random();
    testCredentials = {
      username: `testuser_${timestamp}`,
      password: `testpass_${timestamp}`,
    };
  });

  test('should render signin form with all required fields', async ({
    page,
  }) => {
    await page.goto('/signin');

    // Check form elements are present using user-facing locators
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();

    // Check page title/branding using text locator
    await expect(page.getByText('2D Metaverse')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/signin');

    // Submit empty form using role-based locator
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should show HTML5 validation
    await expect(page.getByLabel('Username')).toHaveAttribute('required');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/signin');

    await page.getByLabel('Username').fill('nonexistentuser');
    await page.getByPlaceholder('Enter your password').fill('wrongpassword');

    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('should successfully signin with valid credentials', async ({
    page,
  }) => {
    await page.goto('/signin');

    await page
      .getByLabel('Username')
      .fill(process.env.TEST_ADMIN_USERNAME || 'admin');
    await page
      .getByPlaceholder('Enter your password')
      .fill(process.env.TEST_ADMIN_PASSWORD || 'pass123');

    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should navigate to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/signin');

    await page.getByRole('link', { name: 'Sign up' }).click();

    await expect(page).toHaveURL(/signup/);
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/signin');

    const passwordInput = page.getByPlaceholder('Enter your password');
    const toggleButton = page
      .getByRole('button')
      .filter({ has: page.locator('svg') })
      .first();

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle
    await toggleButton.click();

    // Should show password
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click toggle again
    await toggleButton.click();

    // Should hide password
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should redirect authenticated users to dashboard', async ({ page }) => {
    // First sign in to set up authentication
    await page.goto('/signin');
    await page
      .getByLabel('Username')
      .fill(process.env.TEST_ADMIN_USERNAME || 'admin');
    await page
      .getByPlaceholder('Enter your password')
      .fill(process.env.TEST_ADMIN_PASSWORD || 'pass123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('**/dashboard');

    // Now try to access signin page again
    await page.goto('/signin');

    // Should redirect to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show loading state during signin', async ({ page }) => {
    await page.goto('/signin');

    await page
      .getByLabel('Username')
      .fill(process.env.TEST_ADMIN_USERNAME || 'admin');
    await page
      .getByPlaceholder('Enter your password')
      .fill(process.env.TEST_ADMIN_PASSWORD || 'pass123');

    // Start the signin process
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Check for loading text
    await expect(page.getByText('Signing In...')).toBeVisible();

    // Wait for completion
    await page.waitForURL('**/dashboard');
  });
});
