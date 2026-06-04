/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        // All colors now point to CSS variables → theme switching works automatically
        bg:       'var(--color-bg)',
        surface:  'var(--color-surface)',
        surface2: 'var(--color-surface2)',
        surface3: 'var(--color-surface3)',
        text1:    'var(--color-text1)',
        text2:    'var(--color-text2)',
        text3:    'var(--color-text3)',
        accent:   'var(--color-accent)',

        'col-todo':      '#6b7fff',
        'col-working':   '#e8a04a',
        'col-completed': '#4ecb83',
        'col-onhold':    '#9b7fe8',

        'pri-high':   '#ff5f6d',
        'pri-medium': '#e8a04a',
        'pri-low':    '#4ecb83',
      },
      backgroundImage: {
        'accent-gradient': 'linear-gradient(135deg, #e8a04a, #f0b060)',
      },
      boxShadow: {
        'card':    '0 8px 30px rgba(0,0,0,0.5)',
        'card-lg': '0 20px 60px rgba(0,0,0,0.6)',
        'accent':  '0 4px 20px rgba(232,160,74,0.3)',
        'glow-todo':      '0 0 10px rgba(107,127,255,0.6)',
        'glow-working':   '0 0 10px rgba(232,160,74,0.6)',
        'glow-completed': '0 0 10px rgba(78,203,131,0.6)',
        'glow-onhold':    '0 0 10px rgba(155,127,232,0.6)',
      },
      borderRadius: { 'xl2': '20px' },
      keyframes: {
        cardIn:   { '0%': { opacity:'0', transform:'translateY(12px) scale(0.97)' }, '100%': { opacity:'1', transform:'translateY(0) scale(1)' } },
        orbFloat: { '0%': { transform:'translate(0,0) scale(1)' }, '100%': { transform:'translate(30px,-40px) scale(1.08)' } },
        slideUp:  { '0%': { opacity:'0', transform:'translateY(24px) scale(0.97)' }, '100%': { opacity:'1', transform:'translateY(0) scale(1)' } },
        fadeIn:   { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        ghostPulse:    { '0%': { opacity:'0.5' }, '100%': { opacity:'1' } },
        completePulse: { '0%': { boxShadow:'0 0 0 0 rgba(78,203,131,0.6)' }, '70%': { boxShadow:'0 0 0 10px transparent' }, '100%': { boxShadow:'0 0 0 0 transparent' } },
      },
      animation: {
        'card-in':        'cardIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        'orb-float':      'orbFloat 12s ease-in-out infinite alternate',
        'slide-up':       'slideUp 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        'fade-in':        'fadeIn 0.15s ease both',
        'ghost-pulse':    'ghostPulse 1s ease-in-out infinite alternate',
        'complete-pulse': 'completePulse 0.5s ease both',
      },
    },
  },
  plugins: [],
}
