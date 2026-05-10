export type RuntimeEnvSource =
  | Record<string, unknown>
  | { get<T = string>(name: string): T | undefined };

const ENV_ALIASES: Record<string, string[]> = {
  JWT_ACCESS_SECRET: ['JWT_ACCESS_SECRET', 'JWT_SECRET'],
  JWT_REFRESH_SECRET: ['JWT_REFRESH_SECRET', 'JWT_SECRET'],
  FLUTTERWAVE_WEBHOOK_SECRET: ['FLUTTERWAVE_WEBHOOK_SECRET', 'FLUTTERWAVE_WEBHOOK_HASH'],
  FLUTTERWAVE_WEBHOOK_HASH: ['FLUTTERWAVE_WEBHOOK_SECRET', 'FLUTTERWAVE_WEBHOOK_HASH'],
  SQUAD_WEBHOOK_SECRET: ['SQUAD_WEBHOOK_SECRET', 'SQUAD_SECRET_KEY'],
  KORAPAY_WEBHOOK_SECRET: ['KORAPAY_WEBHOOK_SECRET', 'KORAPAY_SECRET_KEY'],
  OPAY_WEBHOOK_SECRET: ['OPAY_WEBHOOK_SECRET', 'OPAY_PRIVATE_KEY', 'OPAY_SECRET_KEY'],
  OPAY_SECRET_KEY: ['OPAY_PRIVATE_KEY', 'OPAY_SECRET_KEY'],
  AIRALO_CLIENT_ID: ['AIRALO_API_KEY', 'AIRALO_CLIENT_ID'],
  AIRALO_CLIENT_SECRET: ['AIRALO_API_SECRET', 'AIRALO_CLIENT_SECRET'],
  TREMIL_API_SECRET: ['TREMIL_API_SECRET', 'TREMIL_SECRET'],
  BANDWIDTH_MESSAGING_APPLICATION_ID: ['BANDWIDTH_MESSAGING_APPLICATION_ID', 'BANDWIDTH_APPLICATION_ID'],
  BANDWIDTH_VOICE_APPLICATION_ID: ['BANDWIDTH_VOICE_APPLICATION_ID', 'BANDWIDTH_APPLICATION_ID'],
  S3_BUCKET: ['AWS_BUCKET', 'S3_BUCKET', 'R2_BUCKET'],
  S3_ACCESS_KEY_ID: ['AWS_ACCESS_KEY_ID', 'S3_ACCESS_KEY_ID', 'R2_ACCESS_KEY_ID'],
  S3_SECRET_ACCESS_KEY: ['AWS_SECRET_ACCESS_KEY', 'S3_SECRET_ACCESS_KEY', 'R2_SECRET_ACCESS_KEY'],
  POSTHOG_API_KEY: ['POSTHOG_KEY', 'POSTHOG_API_KEY'],
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

export function resolveConfiguredEnv(name: string, source: RuntimeEnvSource): string | undefined {
  const candidates = ENV_ALIASES[name] ?? [name];
  for (const candidate of candidates) {
    const value = readEnv(source, candidate);
    if (isConfiguredValue(value)) return value;
  }
  return undefined;
}

export function resolveJwtAccessSecret(source: RuntimeEnvSource): string | undefined {
  return resolveConfiguredEnv('JWT_ACCESS_SECRET', source);
}

export function resolveJwtRefreshSecret(source: RuntimeEnvSource): string | undefined {
  return resolveConfiguredEnv('JWT_REFRESH_SECRET', source);
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

  if (readEnv(source, 'NODE_ENV') === 'production') {
    throw new Error('API_URL must be configured in production');
  }

  return 'http://localhost:3001';
}

export function resolveApiUrl(source: RuntimeEnvSource): string {
  return `${resolveApiOrigin(source)}/api`;
}

export function resolveWebhookBaseUrl(source: RuntimeEnvSource): string {
  return `${resolveApiUrl(source)}/webhooks`;
}
