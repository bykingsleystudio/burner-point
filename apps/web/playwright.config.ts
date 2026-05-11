import fs from 'fs';
import path from 'path';
import { defineConfig, devices } from '@playwright/test';

function readEnvFile(fileName: string) {
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) return {};

  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).reduce<Record<string, string>>((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return acc;
    const separator = trimmed.indexOf('=');
    if (separator === -1) return acc;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    acc[key] = rawValue.replace(/^['"]|['"]$/g, '');
    return acc;
  }, {});
}

const productionEnv = readEnvFile('../../.env.production');
const webServerEnv = {
  ...process.env,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || productionEnv.NEXT_PUBLIC_APP_URL || 'https://burnerpoint.com',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || productionEnv.NEXT_PUBLIC_API_URL || 'https://api.burnerpoint.com',
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || productionEnv.NEXT_PUBLIC_WS_URL || 'wss://api.burnerpoint.com',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || productionEnv.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    productionEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    productionEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
};

for (const [key, value] of Object.entries(webServerEnv)) {
  if (value && !process.env[key]) {
    process.env[key] = value;
  }
}

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  workers: process.env.CI ? 2 : 1,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: webServerEnv,
      },
});
