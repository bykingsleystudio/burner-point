const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

export function normalizeInternationalPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  let normalized = trimmed.replace(/[^\d+]/g, '');

  if (normalized.startsWith('00')) {
    normalized = `+${normalized.slice(2)}`;
  }

  if (normalized.startsWith('+')) {
    normalized = `+${normalized.slice(1).replace(/\+/g, '')}`;
  } else {
    normalized = normalized.replace(/\+/g, '');
  }

  return normalized;
}

export function isValidInternationalPhone(value: string) {
  return E164_PATTERN.test(normalizeInternationalPhone(value));
}

export function classifyAuthIdentifier(value: string): 'email' | 'phone' | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes('@')) return 'email';
  return normalizeInternationalPhone(trimmed) ? 'phone' : null;
}

export function normalizeAuthIdentifier(value: string) {
  const identifierType = classifyAuthIdentifier(value);
  if (identifierType === 'email') return value.trim().toLowerCase();
  if (identifierType === 'phone') return normalizeInternationalPhone(value);
  return value.trim();
}

export const INTERNATIONAL_PHONE_ERROR = 'Enter a valid phone number with country code.';
