import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          deep: '#013220',
          'deep-green': '#013220',
          green: '#00FF9D',
          cyber: '#00FF9D',
          neon: '#39FF14',
          'neon-green': '#39FF14',
          black: '#000000',
          dark: '#03110B',
          surface: '#07140F',
          border: '#123425',
          mutedGreen: '#617169',
          metalStart: '#9FA6B2',
          metalEnd: '#E5E7EB',
          muted: '#888888',
          metal: '#E5E7EB',
        },
      },
      fontFamily: {
        sans: ['Neue Haas Grotesk Display', 'Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
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
    },
  },
  plugins: [],
};
export default config;
