import { expect, test } from '@playwright/test';

const identifier = process.env.PW_E2E_SMOKE_IDENTIFIER;
const password = process.env.PW_E2E_SMOKE_PASSWORD;
const runLiveOAuth = process.env.PW_E2E_RUN_LIVE_OAUTH === 'true';

test.describe('Live auth smoke', () => {
  test.skip(!identifier || !password, 'Set PW_E2E_SMOKE_IDENTIFIER and PW_E2E_SMOKE_PASSWORD to run the live auth smoke test.');

  test('dedicated smoke account can sign in end to end', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByLabel(/email or phone number/i).fill(identifier!);
    await page.getByLabel('Password').fill(password!);
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 30_000 });
    expect(page.url()).toMatch(/\/(dashboard|onboarding|auth\/phone-verify)/);
  });

  test.describe('Configured OAuth handoff', () => {
    test.skip(!runLiveOAuth, 'Set PW_E2E_RUN_LIVE_OAUTH=true to verify live Clerk provider redirects.');

    for (const provider of ['Google', 'Apple', 'Microsoft'] as const) {
      test(`starts the ${provider} Clerk OAuth handoff`, async ({ page, baseURL }) => {
        await page.goto('/auth/login');

        await page.getByRole('button', { name: new RegExp(`Continue with ${provider}`, 'i') }).click();
        await page.waitForURL((url) => !url.pathname.startsWith('/auth/login'), { timeout: 30_000 });

        const destination = new URL(page.url());
        const appOrigin = new URL(baseURL || 'http://127.0.0.1:3000');
        const movedOffLogin =
          destination.pathname === '/sso-callback' ||
          destination.origin !== appOrigin.origin;

        expect(movedOffLogin).toBeTruthy();
      });
    }
  });
});
