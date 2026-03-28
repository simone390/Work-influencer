/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f0fd',
          100: '#d1e2fb',
          200: '#a3c5f7',
          300: '#75a8f3',
          400: '#478bef',
          500: '#0071e3',
          600: '#0071e3',
          700: '#005bb5',
          800: '#004488',
          900: '#002e5a',
          950: '#001a33',
        },
        apple: {
          blue: '#0071e3',
          gray: '#f5f5f7',
          dark: '#1d1d1f',
          secondary: '#6e6e73',
          border: '#d2d2d7',
          green: '#34c759',
          orange: '#ff9500',
          red: '#ff3b30',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        pill: '980px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.12)',
        'apple-focus': '0 0 0 3px rgba(0, 113, 227, 0.12)',
      },
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease',
      },
    },
  },
  plugins: [],
}
