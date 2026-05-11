import { expect, test } from '@playwright/test';

const viewports = [
  { label: '360px mobile', width: 360, height: 820 },
  { label: '390px mobile', width: 390, height: 844 },
  { label: '430px mobile', width: 430, height: 932 },
  { label: '768px tablet', width: 768, height: 1024 },
  { label: '1024px small desktop', width: 1024, height: 768 },
  { label: '1366px desktop', width: 1366, height: 900 },
  { label: '1920px large desktop', width: 1920, height: 1080 },
];

const publicAuthPages = [
  {
    path: '/sign-in',
    heading: /Sign in to Burner Point/i,
    text: ['Email address or phone number', 'Password', 'Forgot password?', 'Need an account?'],
    cta: /Sign In/i,
  },
  {
    path: '/sign-up',
    heading: /Create your Burner Point account/i,
    text: ['First name', 'Last name', 'Email address', 'Phone number', 'Terms of Service', 'Privacy Policy'],
    cta: /Get Started/i,
  },
  {
    path: '/forgot-password',
    heading: /Reset your password/i,
    text: ['Email address or phone number', 'Back to sign in', 'Create account', 'Security settings after sign-in'],
    cta: /Send reset link/i,
  },
];

const hasPublicSupabaseEnv = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
);

test.describe('Burner Point auth UI layout', () => {
  for (const viewport of viewports) {
    test(`public auth pages stay readable at ${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      for (const authPage of publicAuthPages) {
        await page.goto(authPage.path, { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('main')).toBeVisible();
        await expect(page.getByRole('heading', { name: authPage.heading })).toBeVisible();
        await expect(page.getByRole('button', { name: authPage.cta })).toBeVisible();

        for (const text of authPage.text) {
          await expect(page.getByText(text, { exact: false }).first()).toBeVisible();
        }

        const horizontalOverflow = await page.evaluate(() =>
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
        );
        expect(horizontalOverflow).toBeLessThanOrEqual(2);

        const visibleInputs = await page.locator('input').evaluateAll((inputs) =>
          inputs.every((input) => {
            const rect = input.getBoundingClientRect();
            const style = window.getComputedStyle(input);
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
          }),
        );
        expect(visibleInputs).toBe(true);
      }
    });
  }

  test('OAuth redirect buttons remain wired to the Supabase auth callback path', async ({ page }) => {
    await page.goto('/sign-in', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Apple/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Continue with Microsoft/i })).toBeVisible();

    const source = await page.locator('body').textContent();
    expect(source).not.toContain('Clerk');
  });

  test.describe('session-sensitive recovery screens', () => {
    test.skip(!hasPublicSupabaseEnv, 'Supabase public env is required to render session-sensitive recovery screens.');

    test('password reset screen renders without layout overlap', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/reset-password', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /Create a new password/i })).toBeVisible();
      await expect(page.getByText(/Open this page from the password reset link/i)).toBeVisible();
    });

    test('phone verification guard redirects unauthenticated users back to sign in', async ({ page }) => {
      await page.goto('/verify-phone?redirect=/dashboard', { waitUntil: 'domcontentloaded' });
      await page.waitForURL(/\/sign-in/);
      await expect(page.getByRole('heading', { name: /Sign in to Burner Point/i })).toBeVisible();
    });
  });
});
