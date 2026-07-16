import { test, expect } from '@playwright/test';

test.describe('System Testing (Functionality)', () => {
  test('should load the login page and show appropriate fields', async ({ page }) => {
    // Navigate to the app root, which should redirect to login if unauthenticated
    await page.goto('/');
    
    // Verify login page elements
    await expect(page).toHaveTitle(/Netbots/i); // Adjust based on actual title
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should allow user to type in login credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Assuming the placeholder or name attribute
    await page.fill('input[type="email"]', 'test@netbots.io');
    await page.fill('input[type="password"]', 'password123');
    
    const emailValue = await page.inputValue('input[type="email"]');
    expect(emailValue).toBe('test@netbots.io');
  });
});
