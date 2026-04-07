## BurnerPoint SVG Asset Placement Guide

### Where to put your SVG files

Place all three SVG files in this exact location in your project:

```
burner-point/
└── apps/
    └── web/
        └── public/
            └── assets/
                ├── logo.svg          ← Full brand logo (horizontal, with wordmark)
                ├── logo-mark.svg     ← Logo mark / icon only (square, no text)
                └── icon.svg          ← Favicon / small icon (16×16 or 32×32 optimized)
```

### How to create the folder (Windows PowerShell)

```powershell
New-Item -ItemType Directory -Force -Path "C:\Users\HP\projects\burner-point\burner-point\apps\web\public\assets"
```

Then drag your SVG files from wherever they are into that folder.

---

### How each SVG is used in the codebase

**`logo.svg`** — Full horizontal logo, used in:
- `apps/web/src/app/auth/login/page.tsx` — Login page header
- `apps/web/src/app/auth/register/page.tsx` — Register page header
- `apps/web/src/app/dashboard/layout.tsx` — Sidebar logo area

Reference in Next.js components:
```tsx
import Image from 'next/image'

<Image
  src="/assets/logo.svg"
  alt="BurnerPoint"
  width={140}
  height={32}
  priority
/>
```

**`logo-mark.svg`** — Square icon only, used in:
- `apps/web/src/app/dashboard/layout.tsx` — Collapsed sidebar icon
- `apps/web/src/app/dashboard/credits/page.tsx` — Payment footer
- All Open Graph / meta images

Reference:
```tsx
<Image
  src="/assets/logo-mark.svg"
  alt="BurnerPoint"
  width={28}
  height={28}
/>
```

**`icon.svg`** — Favicon, used in:
- `apps/web/src/app/layout.tsx` — Add to the `<head>` via metadata

In `apps/web/src/app/layout.tsx`, add to the `metadata` export:
```tsx
export const metadata: Metadata = {
  title: 'BurnerPoint — Privacy-first Phone Numbers',
  description: 'Privacy is not a feature. It is the foundation.',
  icons: {
    icon: '/assets/icon.svg',
    shortcut: '/assets/icon.svg',
    apple: '/assets/logo-mark.svg',
  },
}
```

---

### SVG optimization checklist before placing

Before placing your SVGs, run them through https://svgomg.net/ or install svgo:

```powershell
npm install -g svgo
svgo apps/web/public/assets/logo.svg
svgo apps/web/public/assets/logo-mark.svg
svgo apps/web/public/assets/icon.svg
```

This removes unnecessary metadata, comments, and editor-specific attributes that
inflate file size without affecting rendering.

---

### Critical: viewBox and sizing

Make sure each SVG file has a `viewBox` attribute, not just `width`/`height`:

```svg
<!-- Good — scales correctly with any width/height prop -->
<svg viewBox="0 0 140 32" xmlns="http://www.w3.org/2000/svg">

<!-- Bad — fixed size, won't scale -->
<svg width="140" height="32" xmlns="http://www.w3.org/2000/svg">
```

If your SVGs only have `width`/`height`, convert them:
1. Open in VS Code
2. Note the current width and height values
3. Add `viewBox="0 0 {width} {height}"`
4. Remove `width` and `height` attributes (or keep them as defaults)

---

### Dashboard sidebar logo update

Once your SVG files are placed, update the sidebar logo in
`apps/web/src/app/dashboard/layout.tsx`.

Find this section (currently uses a div with text):
```tsx
{/* Logo */}
<div className="flex items-center gap-2 px-4 h-16 border-b border-brand-border">
  <div className="w-7 h-7 rounded bg-brand-green flex items-center justify-center flex-shrink-0">
    <Shield size={14} className="text-black"/>
  </div>
  <span className="font-bold text-sm tracking-tight">BurnerPoint</span>
</div>
```

Replace with:
```tsx
{/* Logo — uses SVG assets from /public/assets/ */}
<div className="flex items-center gap-2 px-4 h-16 border-b border-brand-border">
  {sidebarOpen ? (
    <Image
      src="/assets/logo.svg"
      alt="BurnerPoint"
      width={120}
      height={28}
      className="flex-shrink-0"
      priority
    />
  ) : (
    <Image
      src="/assets/logo-mark.svg"
      alt="BurnerPoint"
      width={28}
      height={28}
      className="flex-shrink-0"
    />
  )}
</div>
```

Add `import Image from 'next/image'` at the top of layout.tsx.

---

### Auth pages logo update

In `apps/web/src/app/auth/login/page.tsx`, find the logo div:
```tsx
<div className="inline-flex items-center gap-2 mb-4">
  <div className="w-8 h-8 rounded bg-brand-green flex items-center justify-center">
    <Shield size={16} className="text-black" />
  </div>
  <span className="text-xl font-bold tracking-tight">BurnerPoint</span>
</div>
```

Replace with:
```tsx
<div className="inline-flex items-center justify-center mb-4">
  <Image
    src="/assets/logo.svg"
    alt="BurnerPoint"
    width={160}
    height={36}
    priority
  />
</div>
```

Apply the same replacement in `register/page.tsx`.

---

### Mobile app (Expo) — SVG assets

For React Native, copy the SVGs to:
```
apps/mobile/assets/
├── logo.svg
├── logo-mark.svg
└── icon.svg
```

Install react-native-svg if not already present:
```powershell
cd apps/mobile
npx expo install react-native-svg
npx expo install react-native-svg-transformer
```

Add to `metro.config.js` (create if it doesn't exist):
```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'svg'];

module.exports = config;
```

Then import and use SVGs as React components:
```tsx
import LogoMark from '../../assets/logo-mark.svg';

<LogoMark width={40} height={40} />
```
