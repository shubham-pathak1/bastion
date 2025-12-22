/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                bastion: {
                    bg: '#000000',
                    'bg-deep': '#030303',
                    surface: '#0A0A0A',
                    'surface-hover': '#151515',
                    border: '#1E1E1E',
                    'border-highlight': '#333333',

                    // Monochromatic Palette
                    primary: '#FFFFFF',
                    secondary: '#A0A0A0',
                    muted: '#666666',

                    accent: '#FFFFFF',
                    'accent-dim': 'rgba(255, 255, 255, 0.1)',

                    success: '#FFFFFF',
                    warning: '#A0A0A0',
                    danger: '#FFFFFF',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
                display: ['Outfit', 'sans-serif'],
            },
            boxShadow: {
                'glow-sm': '0 0 10px rgba(255, 255, 255, 0.1)',
                'glow-md': '0 0 20px rgba(255, 255, 255, 0.2)',
                'glow-lg': '0 0 30px rgba(255, 255, 255, 0.3)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
            },
            backgroundImage: {
                'monochrome-gradient': 'linear-gradient(to right, #FFFFFF, #A0A0A0)',
                'glass-gradient': 'linear-gradient(145deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
                'tilt': 'tilt 10s infinite linear',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 5px rgba(0, 240, 255, 0.1)' },
                    '50%': { boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' },
                },
                tilt: {
                    '0%, 50%, 100%': { transform: 'rotate(0deg)' },
                    '25%': { transform: 'rotate(0.5deg)' },
                    '75%': { transform: 'rotate(-0.5deg)' },
                },
            },
        },
    },
    plugins: [],
}
