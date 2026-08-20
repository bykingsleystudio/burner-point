import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Burner Point',
    short_name: 'Burner Point',
    description: 'Private phone numbers, OTP verification, rentals, eSIM, proxies, and secure communication tools.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#013220',
    theme_color: '#013220',
    orientation: 'portrait-primary',
    categories: ['productivity', 'utilities', 'business'],
    icons: [
      {
        src: '/assets/burner-point-logo-icon.svg',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/assets/burner-point-logo-icon.svg',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
      {
        src: '/assets/burner-point-logo-icon-gradient.svg',
        type: 'image/svg+xml',
        purpose: 'any',
      },
    ],
  };
}
