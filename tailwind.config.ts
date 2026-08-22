import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Paleta de identidad Fematch (Pastel Rosa, Violeta, Cyan/Turquesa suave)
        fematch: {
          pink: {
            50: '#fdf2f8',   // Pastel blush ultra soft
            100: '#fce7f3',  // Soft baby rose
            200: '#fbcfe8',  // Sweet pastel pink
            300: '#f9a8d4',  // Light candy pink
            400: '#f472b6',  // Vivid pastel pink
            500: '#ec4899',  // Primary Fematch Pink
            600: '#db2777',  // Deep vibrant pink
            700: '#be185d',
            800: '#9d174d',
            900: '#831843',
          },
          violet: {
            50: '#faf5ff',   // Lavender whisper
            100: '#f3e8ff',  // Soft pastel lilac
            200: '#e9d5ff',  // Gentle violet
            300: '#d8b4fe',  // Pastel violet
            400: '#c084fc',  // Bright lavender violet
            500: '#a855f7',  // Primary Fematch Violet
            600: '#9333ea',
            700: '#7e22ce',
            800: '#6b21a8',
            900: '#581c87',
          },
          cyan: {
            50: '#ecfeff',   // Ice turquoise soft
            100: '#cffafe',  // Pastel cyan mist
            200: '#a5f3fc',  // Soft minty turquoise
            300: '#67e8f9',  // Light pastel cyan
            400: '#22d3ee',  // Electric turquoise
            500: '#06b6d4',  // Deep accent cyan
            600: '#0891b2',
            700: '#0e7490',
            800: '#155e75',
            900: '#164e63',
          },
        },
        // Colores dinámicos adaptados al tema de Telegram WebApp
        tg: {
          bg: 'var(--tg-theme-bg-color, #ffffff)',
          'secondary-bg': 'var(--tg-theme-secondary-bg-color, #fdf2f8)',
          text: 'var(--tg-theme-text-color, #1e1e24)',
          hint: 'var(--tg-theme-hint-color, #9ca3af)',
          link: 'var(--tg-theme-link-color, #ec4899)',
          button: 'var(--tg-theme-button-color, #ec4899)',
          'button-text': 'var(--tg-theme-button-text-color, #ffffff)',
          'header-bg': 'var(--tg-theme-header-bg-color, #ffffff)',
          'section-bg': 'var(--tg-theme-section-bg-color, #ffffff)',
          'section-header-text': 'var(--tg-theme-section-header-text-color, #6b7280)',
          'subtitle-text': 'var(--tg-theme-subtitle-text-color, #9ca3af)',
          'destructive-text': 'var(--tg-theme-destructive-text-color, #ef4444)',
        },
      },
      backgroundImage: {
        'fematch-gradient': 'linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #67e8f9 100%)',
        'fematch-gradient-soft': 'linear-gradient(135deg, #fdf2f8 0%, #f3e8ff 50%, #ecfeff 100%)',
        'fematch-gradient-dark': 'linear-gradient(135deg, #3b0764 0%, #1e1b4b 50%, #083344 100%)',
        'fematch-card-overlay': 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(15,23,42,0.88) 100%)',
      },
      boxShadow: {
        'pastel-pink': '0 10px 25px -5px rgba(244, 114, 182, 0.35), 0 8px 10px -6px rgba(244, 114, 182, 0.2)',
        'pastel-violet': '0 10px 25px -5px rgba(192, 132, 252, 0.35), 0 8px 10px -6px rgba(192, 132, 252, 0.2)',
        'pastel-cyan': '0 10px 25px -5px rgba(103, 232, 249, 0.35), 0 8px 10px -6px rgba(103, 232, 249, 0.2)',
        'fematch-glow': '0 0 20px rgba(236, 72, 153, 0.25), 0 0 40px rgba(168, 85, 247, 0.15)',
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top, 0px)',
        'safe-bottom': 'env(safe-area-inset-bottom, 0px)',
        'safe-left': 'env(safe-area-inset-left, 0px)',
        'safe-right': 'env(safe-area-inset-right, 0px)',
      },
    },
  },
  plugins: [],
} satisfies Config
