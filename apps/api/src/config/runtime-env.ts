export type RuntimeEnvSource =
  | Record<string, unknown>
  | { get<T = string>(name: string): T | undefined };

const ENV_ALIASES: Record<string, string[]> = {
  CLERK_WEBHOOK_SECRET: ['CLERK_WEBHOOK_SIGNING_SECRET', 'CLERK_WEBHOOK_SECRET'],
  CLERK_WEBHOOK_SIGNING_SECRET: ['CLERK_WEBHOOK_SIGNING_SECRET', 'CLERK_WEBHOOK_SECRET'],
};

function readEnv(source: RuntimeEnvSource, name: string): string | undefined {
  if (typeof (source as { get?: unknown }).get === 'function') {
    const value = (source as { get<T = string>(key: string): T | undefined }).get(name);
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return undefined;
    return String(value);
  }

  const value = (source as Record<string, unknown>)[name];
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return undefined;
  return String(value);
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function ensureHttps(value: string): string {
  const normalized = normalizeUrl(value);
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized.replace(/^\/+/, '')}`;
}

function stripApiSuffix(value: string): string {
  return normalizeUrl(value).replace(/\/api$/i, '');
}

export function isConfiguredValue(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const normalized = value.trim();
  if (!normalized) return false;
  const lower = normalized.toLowerCase();
  return lower !== 'replace_me' && !lower.includes('replace_me');
}

export function hasConfiguredEnv(name: string, source: RuntimeEnvSource): boolean {
  const candidates = ENV_ALIASES[name] ?? [name];
  return candidates.some((candidate) => isConfiguredValue(readEnv(source, candidate)));
}

export function resolveClerkWebhookSigningSecret(source: RuntimeEnvSource): string | undefined {
  for (const candidate of ENV_ALIASES.CLERK_WEBHOOK_SIGNING_SECRET) {
    const value = readEnv(source, candidate);
    if (isConfiguredValue(value)) return value;
  }
  return undefined;
}

export function resolveApiOrigin(source: RuntimeEnvSource): string {
  const apiUrl = readEnv(source, 'API_URL');
  if (isConfiguredValue(apiUrl)) return stripApiSuffix(apiUrl);

  for (const candidate of [
    'RAILWAY_PUBLIC_DOMAIN',
    'RAILWAY_STATIC_URL',
    'RAILWAY_SERVICE_BURNER_POINT_API_URL',
  ]) {
    const value = readEnv(source, candidate);
    if (isConfiguredValue(value)) return ensureHttps(value);
  }

  const appUrl = readEnv(source, 'APP_URL');
  if (isConfiguredValue(appUrl)) return stripApiSuffix(appUrl);

  return 'http://localhost:3001';
}

export function resolveApiUrl(source: RuntimeEnvSource): string {
  return `${resolveApiOrigin(source)}/api`;
}

export function resolveWebhookBaseUrl(source: RuntimeEnvSource): string {
  return `${resolveApiUrl(source)}/webhooks`;
}
