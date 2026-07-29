/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        surface: '#121214',
        surfaceLight: '#1E1E21',
        primary: '#FF1464',
        secondary: '#E5FF00',
        text: '#FAFAF7',
        textSecondary: '#A1A1AA',
        textMuted: '#71717A',
        border: 'rgba(255, 255, 255, 0.08)',
        borderLight: 'rgba(255, 255, 255, 0.15)',
        surfaceGlass: 'rgba(255, 255, 255, 0.05)',
        quantumViolet: '#8B5CF6',
        emeraldAction: '#10B981',
        rubyWarning: '#EF4444',
      },
      fontFamily: {
        display: ['Anton-Regular', 'sans-serif'],
        'display-secondary': ['Rubik-Bold', 'sans-serif'],
        body: ['Inter-Regular', 'Assistant-Regular', 'sans-serif'],
      },
      borderRadius: {
        none: '0px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        xxl: '32px',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
      },
      fontSize: {
        'hero': ['34px', { lineHeight: '38px', letterSpacing: '-0.04em' }],
        'h1': ['28px', { lineHeight: '32px', letterSpacing: '-0.03em' }],
        'h2': ['24px', { lineHeight: '28px', letterSpacing: '-0.02em' }],
        'h3': ['20px', { lineHeight: '24px' }],
        'body': ['16px', { lineHeight: '24px' }],
        'caption': ['14px', { lineHeight: '20px' }],
        'label': ['12px', { lineHeight: '18px' }],
      },
      boxShadow: {
        'quantum-glow': '0 0 15px rgba(139, 92, 246, 0.5)',
        'emerald-glow': '0 0 15px rgba(16, 185, 129, 0.5)',
        'ruby-glow': '0 0 15px rgba(239, 68, 68, 0.5)',
      },
      textShadow: {
        'hero': '0 2px 8px rgba(0,0,0,0.5)',
      }
    },
  },
  plugins: [],
}
