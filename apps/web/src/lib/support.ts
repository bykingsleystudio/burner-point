const DEFAULT_SUPPORT_EMAIL = 'info@burnerpoint.com';
const DEFAULT_TELEGRAM_SUPPORT_URL = 'https://t.me/burnerpoint';
const DEFAULT_TELEGRAM_COMMUNITY_URL = 'https://t.me/burnerpointapp';

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT_EMAIL;

export const SUPPORT_EMAIL_HREF = `mailto:${SUPPORT_EMAIL}`;

export const TELEGRAM_SUPPORT_URL =
  process.env.NEXT_PUBLIC_SUPPORT_TELEGRAM_URL?.trim() || DEFAULT_TELEGRAM_SUPPORT_URL;

export const TELEGRAM_COMMUNITY_URL =
  process.env.NEXT_PUBLIC_COMMUNITY_TELEGRAM_URL?.trim() || DEFAULT_TELEGRAM_COMMUNITY_URL;

export const TELEGRAM_SUPPORT_HANDLE = TELEGRAM_SUPPORT_URL.split('/').filter(Boolean).pop()
  ? `@${TELEGRAM_SUPPORT_URL.split('/').filter(Boolean).pop()}`
  : '@burnerpoint';

export const TELEGRAM_COMMUNITY_HANDLE = TELEGRAM_COMMUNITY_URL.split('/').filter(Boolean).pop()
  ? `@${TELEGRAM_COMMUNITY_URL.split('/').filter(Boolean).pop()}`
  : '@burnerpointapp';

export const SUPPORT_CONTACTS = {
  email: SUPPORT_EMAIL,
  emailHref: SUPPORT_EMAIL_HREF,
  telegramPrimary: TELEGRAM_SUPPORT_URL,
  telegramPrimaryHandle: TELEGRAM_SUPPORT_HANDLE,
  telegramApp: TELEGRAM_COMMUNITY_URL,
  telegramAppHandle: TELEGRAM_COMMUNITY_HANDLE,
} as const;

export function buildSupportMailto(subject?: string) {
  if (!subject) return SUPPORT_EMAIL_HREF;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
