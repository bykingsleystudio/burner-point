import { expect, test } from '@playwright/test';

test.describe('Landing and auth regressions', () => {
  test('homepage keeps conversion CTAs and real-color marquee surfaces', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(
      page.getByRole('heading', {
        name: /don't want to give out your phone number\?/i,
      }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Get Started' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign In' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Learn More' }).first()).toBeVisible();

    const firstFlag = page.locator('.bp-flag-swatch').first();
    await expect(firstFlag).toBeVisible();
    await expect
      .poll(async () => firstFlag.evaluate((node) => (node as HTMLElement).style.backgroundImage))
      .toContain('flagcdn.com');

    const trustedGoogleChip = page.locator('.bp-trusted-marquee [style*="66,133,244"]').first();
    await expect(trustedGoogleChip).toBeVisible();
  });

  test('login stays inside a compact laptop viewport and provider buttons remain balanced', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('/auth/login', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    const form = page.locator('form');
    const formBox = await form.boundingBox();
    expect(formBox).not.toBeNull();
    expect(Math.round(formBox!.y + formBox!.height)).toBeLessThanOrEqual(756);

    const providerButtons = page.getByRole('button', { name: /continue with/i });
    await expect(providerButtons).toHaveCount(3);

    const heights = await providerButtons.evaluateAll((nodes) =>
      nodes.map((node) => Math.round(node.getBoundingClientRect().height)),
    );
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(2);
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(68);

    await page.getByRole('button', { name: 'Forgot password?' }).click();
    await expect(page.getByRole('button', { name: /send reset code/i })).toBeVisible();
  });

  test('signup stays inside a single desktop viewport without vertical spill', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/auth/signup', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();

    const form = page.locator('form');
    const formBox = await form.boundingBox();
    expect(formBox).not.toBeNull();
    expect(Math.round(formBox!.y + formBox!.height)).toBeLessThanOrEqual(888);

    const providerButtons = page.getByRole('button', { name: /continue with/i });
    await expect(providerButtons).toHaveCount(3);
  });
});
