import { test, expect } from '@playwright/test';

// Test data storage
let testCredentials: { username: string; password: string };

test.describe('SignUpPage Component Tests', () => {
  test.beforeEach(async () => {
    // Generate unique test credentials for each test to ensure isolation
    const timestamp = Date.now() + Math.random();
    testCredentials = {
      username: `testuser_${timestamp}`,
      password: `testpass_${timestamp}`,
    };
  });

  test('should render signup form with all required fields', async ({
    page,
  }) => {
    await page.goto('/signup');

    // Use user-facing locators and web-first assertions
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByPlaceholder('Create a password')).toBeVisible();
    await expect(page.getByPlaceholder('Confirm your password')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Continue to Avatar Selection' })
    ).toBeVisible();

    // Check page title/branding using text locator
    await expect(page.getByText('Join Metaverse')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/signup');

    // Submit empty form using role-based locator
    await page
      .getByRole('button', { name: 'Continue to Avatar Selection' })
      .click();

    // Check HTML5 validation attributes
    await expect(page.getByLabel('Username')).toHaveAttribute('required');
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.goto('/signup');

    // Use getByLabel for form inputs - more user-facing
    await page.getByLabel('Username').fill('testuser');
    await page.getByPlaceholder('Create a password').fill('password123');
    await page
      .getByPlaceholder('Confirm your password')
      .fill('differentpassword');

    await page
      .getByRole('button', { name: 'Continue to Avatar Selection' })
      .click();

    // Use text-based locator for error message
    await expect(page.getByText('Passwords do not match')).toBeVisible();
  });

  test('should successfully signup new user', async ({ page }) => {
    await page.goto('/signup');

    // Fill form using user-facing locators
    await page.getByLabel('Username').fill(testCredentials.username);
    await page
      .getByPlaceholder('Create a password')
      .fill(testCredentials.password);
    await page
      .getByPlaceholder('Confirm your password')
      .fill(testCredentials.password);

    await page
      .getByRole('button', { name: 'Continue to Avatar Selection' })
      .click();

    // Should navigate to avatar selection
    await page.waitForURL('**/avatar-selection');
    await expect(page).toHaveURL(/avatar-selection/);
  });

  test('should show error for existing username', async ({ page }) => {
    await page.goto('/signup');

    // Try to signup with admin username which already exists
    await page.getByLabel('Username').fill('admin');
    await page.getByPlaceholder('Create a password').fill('newpassword');
    await page.getByPlaceholder('Confirm your password').fill('newpassword');

    await page
      .getByRole('button', { name: 'Continue to Avatar Selection' })
      .click();

    await expect(page.getByText('Username already exists')).toBeVisible();
  });

  test('should navigate to signin page', async ({ page }) => {
    await page.goto('/signup');

    // Use getByRole for link navigation
    await page.getByRole('link', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/signin/);
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/signup');

    const passwordInput = page.getByPlaceholder('Create a password');
    // Use more specific locator for toggle button - assuming it has an accessible name or icon
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
});
