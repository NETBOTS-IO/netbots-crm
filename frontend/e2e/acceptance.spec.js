import { test, expect } from '@playwright/test';

test.describe('Acceptance Testing (Business Viability)', () => {
  test('unauthenticated users should not access protected business dashboards', async ({ page }) => {
    // Attempt to directly navigate to a protected business route
    await page.goto('/super-dashboard');
    
    // The business rule states unauthenticated users must be redirected to login
    await expect(page).toHaveURL(/.*login/);
  });

  test('unauthenticated users should not access lead pipeline', async ({ page }) => {
    // Attempt to access leads
    await page.goto('/leads');
    
    // Acceptance criteria: Must redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
