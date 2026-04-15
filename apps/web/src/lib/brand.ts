export const burnerPointBrand = {
  name: 'Burner Point',
  message: 'Private by Design. Stay Anonymous. Stay Connected.',
  colors: {
    deepGreen: '#013220',
    black: '#000000',
    cyberGreen: '#00FF9D',
    neonGreen: '#39FF14',
    metalStart: '#9FA6B2',
    metalEnd: '#E5E7EB',
    dark: '#03110B',
    surface: '#07140F',
    border: '#123425',
    muted: '#617169',
    white: '#FFFFFF',
  },
  typography: {
    primary: 'Neue Haas Grotesk Display',
    fallback: 'Space Grotesk',
    mono: 'DM Mono',
    headlineWeight: 900,
    labelWeight: 600,
    bodyWeight: 400,
  },
  radii: {
    sm: '8px',
    md: '12px',
    lg: '16px',
  },
  motion: {
    quick: '200ms ease-in-out',
    standard: '260ms ease-in-out',
    pressScale: 0.97,
  },
  tone: ['direct', 'minimal', 'confident', 'privacy-first', 'professional'],
} as const;

export const BRAND = burnerPointBrand;

