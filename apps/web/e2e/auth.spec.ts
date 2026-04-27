import { test, expect } from '@playwright/test'

// Use a unique email per run to avoid conflicts between test runs
const TEST_EMAIL = `e2e-${Date.now()}@vipsos-test.local`
const TEST_PASSWORD = 'Test123456!'

test.describe('Authentication', () => {
  test('sign up with a new account and land on dashboard', async ({ page }) => {
    await page.goto('/auth/signup')

    // Fill out the sign-up form
    await page.locator('input[type="text"]').fill('E2E Test User')
    await page.locator('input[type="email"]').fill(TEST_EMAIL)
    await page.locator('input[type="password"]').fill(TEST_PASSWORD)
    await page.locator('input[type="checkbox"]').check()

    await page.locator('button[type="submit"]').click()

    // After signup, should redirect to /dashboard (auto-confirmed in local dev)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.locator('h1, [class*="font-semibold"]').first()).toBeVisible()
  })

  test('log in with existing credentials and land on dashboard', async ({ page }) => {
    await page.goto('/auth/login')
    await page.locator('input[type="email"]').fill(TEST_EMAIL)
    await page.locator('input[type="password"]').fill(TEST_PASSWORD)
    await page.locator('button[type="submit"]').first().click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
  })

  test('unauthenticated user redirected to login when accessing /workflows', async ({ page }) => {
    await page.context().clearCookies()
    // Clear localStorage to remove Supabase session
    await page.goto('/auth/login')
    await page.evaluate(() => localStorage.clear())
    await page.goto('/workflows')
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 })
  })

  test('shows error on invalid login credentials', async ({ page }) => {
    await page.goto('/auth/login')
    await page.locator('input[type="email"]').fill('nonexistent@example.com')
    await page.locator('input[type="password"]').fill('wrongpassword')
    await page.locator('button[type="submit"]').first().click()
    // Should stay on login page and show an error
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 })
    await expect(page.locator('text=/invalid|incorrect|failed/i')).toBeVisible({ timeout: 3000 })
  })
})
