import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#00FF9D',
          black: '#050505',
          dark: '#0A0A0A',
          surface: '#111111',
          border: '#1A1A1A',
          muted: '#888888',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
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
