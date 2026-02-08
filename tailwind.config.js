/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  theme: {
    extend: {
      fontFamily: {
        oxanium: ['Oxanium', 'sans-serif'],
        share: ['Share Tech Mono', 'monospace'],
      },
      animation: {
        dangerPulse: 'dangerPulse 0.35s ease-in-out infinite alternate',
      },
      keyframes: {
        dangerPulse: {
          '0%': { boxShadow: '0 0 8px rgba(220, 38, 38, 0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(220, 38, 38, 0.8)' },
        },
      },
    },
  },
  plugins: [],
};
