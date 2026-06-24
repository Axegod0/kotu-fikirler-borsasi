/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#00ff88',
          'green-dim': '#00cc6a',
          red: '#ff3366',
          'red-dim': '#cc2952',
          yellow: '#ffcc00',
          blue: '#00ccff',
          'blue-dim': '#0099cc',
        },
        dark: {
          900: '#0a0a0f',
          850: '#0e0e16',
          800: '#12121a',
          750: '#161620',
          700: '#1a1a28',
          600: '#222235',
          500: '#2a2a42',
        },
        chart: {
          grid: 'rgba(0,255,136,0.05)',
          line: 'rgba(0,255,136,0.15)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      animation: {
        'ticker': 'ticker 30s linear infinite',
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        'arrow-up': 'arrow-up 0.5s ease-out forwards',
        'arrow-down': 'arrow-down 0.5s ease-out forwards',
        'scan-line': 'scan-line 3s linear infinite',
        'glow-green': 'glow-green 2s ease-in-out infinite',
        'flicker': 'flicker 0.15s infinite',
        'slide-in-up': 'slide-in-up 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.4s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'count-up': 'count-up 0.6s ease-out',
        'shake': 'shake 0.5s ease-in-out',
        'bounce-subtle': 'bounce-subtle 1.5s ease-in-out infinite',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'pulse-neon': {
          '0%, 100%': { opacity: '1', textShadow: '0 0 8px #00ff88, 0 0 20px #00ff88' },
          '50%': { opacity: '0.7', textShadow: '0 0 4px #00ff88' },
        },
        'arrow-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'arrow-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'glow-green': {
          '0%, 100%': { boxShadow: '0 0 5px #00ff88, 0 0 10px #00ff88, 0 0 20px #00ff8855' },
          '50%': { boxShadow: '0 0 10px #00ff88, 0 0 25px #00ff88, 0 0 40px #00ff8855' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'count-up': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-2px)' },
          '80%': { transform: 'translateX(2px)' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      boxShadow: {
        'neon-green': '0 0 10px #00ff88, 0 0 20px #00ff8855',
        'neon-red': '0 0 10px #ff3366, 0 0 20px #ff336655',
        'neon-yellow': '0 0 10px #ffcc00, 0 0 20px #ffcc0055',
        'card': '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(0,255,136,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,136,0.04) 1px, transparent 1px)
        `,
        'radial-glow': 'radial-gradient(ellipse at center, rgba(0,255,136,0.08) 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
    },
  },
  plugins: [],
};
