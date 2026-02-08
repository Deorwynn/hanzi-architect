import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'blueprint-bg': '#0f1419',
        'blueprint-card': '#101c24',
        'blueprint-accent': '#00d2ff',
      },
      boxShadow: {
        glow: '0 0 15px rgba(0, 210, 255, 0.3)',
      },
    },
  },
  plugins: [],
};
export default config;
