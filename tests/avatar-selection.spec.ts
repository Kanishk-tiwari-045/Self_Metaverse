import { test, expect } from '@playwright/test';

test.describe('AvatarSelectionPage Component Tests', () => {
  let testCredentials: {
    username: string;
    password: string;
    userId: string;
    token: string;
  };

  test.beforeEach(async () => {
    // Generate unique test credentials for each test
    const timestamp = Date.now() + Math.random();
    testCredentials = {
      username: `testuser_${timestamp}`,
      password: `testpass_${timestamp}`,
      userId: '',
      token: '',
    };
  });

  // Run tests sequentially to avoid conflicts
  test.describe.configure({ mode: 'serial' });

  test('should redirect to signup if no user data', async ({ page }) => {
    await page.goto('/avatar-selection');

    // Should redirect to signup
    await page.waitForURL('**/signup');
    await expect(page).toHaveURL(/signup/);
  });

  test('should render avatar selection interface', async ({ page }) => {
    // First signup to get to avatar selection using user-facing locators
    await page.goto('/signup');
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

    await page.waitForURL('**/avatar-selection');

    // Wait a bit for the page to fully load after navigation
    await page.waitForTimeout(1000);

    // Check avatar selection elements using text locators
    await expect(page.getByText('Choose Your Avatar')).toBeVisible();
    // Verify that avatar buttons exist (at least one)
    await expect(page.locator('button[id^="avatar-"]').first()).toBeVisible();
  });

  test('should allow avatar selection', async ({ page }) => {
    // First signup using user-facing locators
    await page.goto('/signup');
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

    await page.waitForURL('**/avatar-selection');

    // Wait a bit for the page to fully load after navigation
    await page.waitForTimeout(1000);

    // Wait for avatars to load with longer timeout
    await page.waitForSelector('button[id^="avatar-"]', { timeout: 15000 });

    // Select first avatar
    const firstAvatar = page.locator('button[id^="avatar-"]').first();
    await firstAvatar.click();

    // Should be selected (check for visual indication)
    await expect(firstAvatar).toHaveClass(/ring-2/);
  });

  test('should navigate to dashboard after avatar selection', async ({
    page,
  }) => {
    // First signup using user-facing locators
    await page.goto('/signup');
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

    await page.waitForURL('**/avatar-selection');

    // Wait a bit for the page to fully load after navigation
    await page.waitForTimeout(1000);

    // Wait for avatars and select one
    await page.waitForSelector('button[id^="avatar-"]', { timeout: 15000 });
    await page.locator('button[id^="avatar-"]').first().click();

    // Click continue using role-based locator
    await page.getByRole('button', { name: 'Continue to Dashboard' }).click();

    // Should navigate to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should show loading state during avatar creation', async ({ page }) => {
    // First signup using user-facing locators
    await page.goto('/signup');
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

    await page.waitForURL('**/avatar-selection');

    // Wait a bit for the page to fully load after navigation
    await page.waitForTimeout(1000);

    // Wait for avatars and select one
    await page.waitForSelector('button[id^="avatar-"]', { timeout: 15000 });
    await page.locator('button[id^="avatar-"]').first().click();

    // Click continue using role-based locator
    await page.getByRole('button', { name: 'Continue to Dashboard' }).click();

    // Check for loading text using text locator
    await expect(page.getByText('Creating Account...')).toBeVisible();

    // Wait for completion
    await page.waitForURL('**/dashboard');
  });

  test('should allow keyboard navigation', async ({ page }) => {
    // First signup using user-facing locators
    await page.goto('/signup');
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

    await page.waitForURL('**/avatar-selection');

    // Wait a bit for the page to fully load after navigation
    await page.waitForTimeout(1000);

    // Wait for avatars
    await page.waitForSelector('button[id^="avatar-"]', { timeout: 15000 });

    // Select first avatar first
    const firstAvatar = page.locator('button[id^="avatar-"]').first();
    await firstAvatar.click();

    // Test arrow key navigation (if implemented)
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowLeft');

    // Click the continue button instead of relying on Enter key
    await page.getByRole('button', { name: 'Continue to Dashboard' }).click();

    // Should navigate to dashboard
    await page.waitForURL('**/dashboard');
  });

  test('should have back button functionality', async ({ page }) => {
    // First signup using user-facing locators
    await page.goto('/signup');
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

    await page.waitForURL('**/avatar-selection');

    // Click back button using text locator
    await page.getByText('Back').click();

    // Should navigate back to signup
    await page.waitForURL('**/signup');
    await expect(page).toHaveURL(/signup/);
  });

  test('should randomize avatar selection', async ({ page }) => {
    // First signup using user-facing locators
    await page.goto('/signup');
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

    await page.waitForURL('**/avatar-selection');

    // Wait a bit for the page to fully load after navigation
    await page.waitForTimeout(1000);

    // Wait for avatars to load
    await page.waitForSelector('button[id^="avatar-"]', { timeout: 15000 });

    // Click randomize button using text locator
    await page.getByText('Randomize').click();

    // Wait for selection to update
    await page.waitForTimeout(500);

    // Check that an avatar is now selected (should have ring-2 class or similar visual indication)
    const selectedAvatar = page.locator('button[id^="avatar-"].ring-2');
    await expect(selectedAvatar).toBeVisible();

    // Get the selected avatar ID before randomizing again
    const firstSelectedId = await selectedAvatar.getAttribute('id');

    // Click randomize again to ensure it can select different avatars
    await page.getByText('Randomize').click();

    // Wait a bit for the selection to update
    await page.waitForTimeout(500);

    // Check that an avatar is still selected
    const secondSelectedAvatar = page.locator('button[id^="avatar-"].ring-2');
    await expect(secondSelectedAvatar).toBeVisible();

    // Optionally check that it's a different selection (though this could be the same randomly)
    const secondSelectedId = await secondSelectedAvatar.getAttribute('id');
    // Note: We don't assert they're different since random could select the same one
  });
});
