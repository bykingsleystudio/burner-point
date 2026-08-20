# Burner Point Logo Implementation Guide

## Approved Assets

All approved web assets live in `apps/web/public/assets/`:

- `burner-point-logo-wordmark.svg`: standard full logo with wordmark.
- `burner-point-logo-wordmark-gradient.svg`: gradient full logo with wordmark.
- `burner-point-logo-icon.svg`: standard icon/logomark for compact spaces.
- `burner-point-logo-icon-gradient.svg`: gradient icon/logomark for clean backgrounds.
- `burner-point-combination-mark.svg`: standard combination mark for primary horizontal branding.
- `burner-point-combination-mark-gradient.svg`: gradient combination mark for dark or simple backgrounds.

The supplied source file named `log icon.svg` was normalized to `burner-point-logo-icon.svg`.

## Usage Standard

| Context | Asset | Reason |
| --- | --- | --- |
| Public header and structured data | `burner-point-combination-mark.svg` | Primary brand recognition with symbol and name together. |
| Public footer on dark backgrounds | `burner-point-combination-mark-gradient.svg` | Preserves contrast while allowing the approved gradient treatment. |
| Auth header | `burner-point-combination-mark-gradient.svg` | Full brand lockup remains legible in the dark auth surface. |
| Dashboard desktop navigation | `burner-point-combination-mark.svg` | Horizontal navigation has enough room for the complete mark. |
| Dashboard mobile navigation | `burner-point-logo-icon.svg` | Compact viewport requires the icon-only mark. |
| Browser favicon and PWA icon | `burner-point-logo-icon.svg` | The icon remains recognizable at small sizes. |
| Alternate PWA icon | `burner-point-logo-icon-gradient.svg` | Approved gradient alternative for clean device surfaces. |

## Maintenance Rules

Use the supplied assets through stable `/assets/burner-point-*.svg` paths. Do not recreate the mark with text, CSS shapes, initials, or icon-library substitutes. Lucide icons remain appropriate for product actions and navigation controls; they are not brand marks and should not be replaced with the logo.

When adding a new brand surface, choose the complete combination mark first. Use the icon-only asset only when the available space cannot accommodate the name. Use standard colors on complex or image backgrounds and gradient colors on clean, controlled backgrounds.

Legacy logo files remain in the asset directory for compatibility with external references, but application source should reference only the approved `burner-point-*.svg` assets above.