/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          // Core brand colors
          primary: '#013220',
          'primary-dark': '#000E0A',
          accent: '#00FF9D',
          'accent-muted': '#00CC7E',
          
          // Legacy names for compatibility
          deep: '#013220',
          'deep-green': '#013220',
          green: '#00FF9D',
          cyber: '#00FF9D',
          neon: '#39FF14',
          'neon-green': '#39FF14',
          black: '#000000',
          dark: '#03110B',
          surface: '#07140F',
          card: '#07140F',
          border: '#123425',
          mutedGreen: '#617169',
          metalStart: '#9FA6B2',
          metalEnd: '#E5E7EB',
          muted: '#9FA6B2',
          metal: '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        brand: ['var(--font-brand)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        bp: '8px',
        'bp-md': '12px',
        'bp-lg': '16px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(0,255,157,0.15)',
        'glow-lg': '0 0 40px rgba(0,255,157,0.2)',
      },
      spacing: {
        safe: 'var(--safe-area-inset-left)',
        'safe-r': 'var(--safe-area-inset-right)',
        'safe-t': 'var(--safe-area-inset-top)',
        'safe-b': 'var(--safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
