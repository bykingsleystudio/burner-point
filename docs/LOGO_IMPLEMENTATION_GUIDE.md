# Burner Point Logo Implementation Guide

## Approved Assets

All approved web assets live in `apps/web/public/assets/`:

- `burner-point-horizontal-gradient.svg`: gradient horizontal brand logo without a background.
- `burner-point-icon-plain.svg`: plain icon/logomark without a background.
- `burner-point-icon-gradient.svg`: gradient icon/logomark with its supplied background treatment.
- `burner-point-icon-plain-background.svg`: plain icon/logomark with its supplied background treatment.
- `burner-point-wordmark-gradient.svg`: gradient wordmark without a background.
- `burner-point-wordmark-black.svg`: black wordmark without a background for light surfaces.
- `burner-point-wordmark-white.svg`: white wordmark without a background for dark surfaces.

The earlier combination-mark exports remain available for compatibility, but new UI work should use the explicit system above.

The supplied source files were normalized to stable `burner-point-*.svg` names. In particular, `log icon.svg` became `burner-point-icon-plain-background.svg` and `Logo Iconic Mark with no background.svg` became `burner-point-icon-plain.svg`.

## Usage Standard

| Context | Asset | Reason |
| --- | --- | --- |
| Website homepage, navbar, hero, and footer | `burner-point-horizontal-gradient.svg` | The gradient horizontal mark is the primary web brand expression. |
| Auth header | `burner-point-horizontal-gradient.svg` | Keeps the full brand lockup legible on the dark auth surface. |
| Dashboard desktop navigation | `burner-point-horizontal-gradient.svg` | Uses the full gradient mark where horizontal space is available. |
| Dashboard mobile and loading animation | `burner-point-icon-gradient.svg` | Compact contexts use the gradient icon. |
| Mobile app icon and alternate PWA icon | `burner-point-icon-gradient.svg` | Gradient icon is the app-facing mark. |
| Browser favicon | `burner-point-icon-plain.svg` | Plain icon remains crisp at favicon sizes. |
| Light-mode wordmark-only surfaces | `burner-point-wordmark-black.svg` | Black wordmark provides contrast on light backgrounds. |
| Dark-mode wordmark-only surfaces | `burner-point-wordmark-white.svg` | White wordmark provides contrast on dark backgrounds. |
| Email, documents, invoices, and printing | `burner-point-icon-plain.svg` or `burner-point-wordmark-black.svg` | Plain marks reproduce reliably across controlled and monochrome output. |

## Maintenance Rules

Use the supplied assets through stable `/assets/burner-point-*.svg` paths. Do not recreate the mark with text, CSS shapes, initials, or icon-library substitutes. Lucide icons remain appropriate for product actions and navigation controls; they are not brand marks and should not be replaced with the logo.

When adding a new brand surface, choose the horizontal gradient logo for web brand presence. Use the gradient icon when space is constrained or the mark is app-like. Use the plain icon for favicons, documents, invoices, and black-and-white output. Use the black or white wordmark when the symbol is already present or when a wordmark-only lockup fits the layout better.

Legacy logo files remain in the asset directory for compatibility with external references, but application source should reference only the approved `burner-point-*.svg` assets above.