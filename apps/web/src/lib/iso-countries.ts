import { getCountryDataList, getEmojiFlag, type TCountryCode } from 'countries-list';

/** All ISO 3166-1 alpha-2 territories from countries-list (180+ regions), sorted A–Z. */
export function getAllIsoAlpha2Sorted(): readonly TCountryCode[] {
  const codes = getCountryDataList().map((c) => c.iso2);
  return [...new Set(codes)].sort((a, b) => a.localeCompare(b));
}

export function isoToFlagEmoji(iso: TCountryCode): string {
  return getEmojiFlag(iso);
}
