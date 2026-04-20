/**
 * Regenerate app icon, splash, and Android notification icon (PNG).
 * Run from apps/mobile: node scripts/generate-brand-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '..', 'assets');

fs.mkdirSync(assetsDir, { recursive: true });

const BRAND_BG = '#0A0A0A';
const BRAND_ACCENT = '#00FF9D';

/** App icon: 1024×1024, neon frame + inner mark (no text — reliable across libsvg builds). */
const iconSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="${BRAND_BG}"/>
  <rect x="192" y="192" width="640" height="640" rx="160" fill="${BRAND_ACCENT}"/>
  <rect x="352" y="352" width="320" height="320" rx="72" fill="${BRAND_BG}"/>
  <circle cx="512" cy="512" r="88" fill="${BRAND_ACCENT}"/>
</svg>`;

/** Splash: 1284×2778 (iPhone 13 Pro Max–style canvas), centered mark. */
const splashSvg = `
<svg width="1284" height="2778" xmlns="http://www.w3.org/2000/svg">
  <rect width="1284" height="2778" fill="${BRAND_BG}"/>
  <g transform="translate(642, 1180)">
    <rect x="-200" y="-200" width="400" height="400" rx="100" fill="${BRAND_ACCENT}"/>
    <rect x="-110" y="-110" width="220" height="220" rx="50" fill="${BRAND_BG}"/>
    <circle r="56" fill="${BRAND_ACCENT}"/>
  </g>
  <text x="642" y="1520" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif"
    font-size="42" font-weight="600" fill="#FFFFFF" letter-spacing="0.2em">BURNER POINT</text>
  <text x="642" y="1575" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, sans-serif"
    font-size="22" fill="#666666">Private By Design</text>
</svg>`;

/** Android notification: white glyph on transparent (material-style). */
const notificationSvg = `
<svg width="96" height="96" xmlns="http://www.w3.org/2000/svg">
  <rect width="96" height="96" fill="none"/>
  <rect x="18" y="18" width="60" height="60" rx="14" fill="#FFFFFF" fill-opacity="0.95"/>
  <rect x="32" y="32" width="32" height="32" rx="8" fill="${BRAND_BG}"/>
  <circle cx="48" cy="48" r="10" fill="#FFFFFF"/>
</svg>`;

async function main() {
  await sharp(Buffer.from(iconSvg)).png().toFile(path.join(assetsDir, 'icon.png'));

  await sharp(Buffer.from(splashSvg)).png().toFile(path.join(assetsDir, 'splash.png'));

  await sharp(Buffer.from(notificationSvg)).png().toFile(path.join(assetsDir, 'notification-icon.png'));

  console.log('Wrote icon.png, splash.png, notification-icon.png →', assetsDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
