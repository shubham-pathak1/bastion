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
                // Bastion color palette - True dark mode
                bastion: {
                    // Backgrounds - True blacks
                    bg: '#000000',
                    'bg-elevated': '#0a0a0a',
                    surface: '#111111',
                    'surface-hover': '#1a1a1a',
                    'surface-active': '#222222',

                    // Borders - Subtle
                    border: '#1f1f1f',
                    'border-hover': '#333333',

                    // Accent - Electric cyan/teal
                    accent: '#00e5ff',
                    'accent-hover': '#00c8e0',
                    'accent-muted': 'rgba(0, 229, 255, 0.15)',
                    'accent-glow': 'rgba(0, 229, 255, 0.4)',

                    // Semantic colors
                    success: '#00d68f',
                    'success-muted': 'rgba(0, 214, 143, 0.15)',
                    warning: '#ffb800',
                    'warning-muted': 'rgba(255, 184, 0, 0.15)',
                    danger: '#ff3b5c',
                    'danger-muted': 'rgba(255, 59, 92, 0.15)',

                    // Text - High contrast
                    text: {
                        primary: '#ffffff',
                        secondary: '#b3b3b3',
                        muted: '#666666',
                        inverse: '#000000',
                    }
                }
            },
            fontFamily: {
                sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
                heading: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
                mono: ['SF Mono', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
            },
            fontSize: {
                'xs': ['0.75rem', { lineHeight: '1rem' }],
                'sm': ['0.8125rem', { lineHeight: '1.25rem' }],
                'base': ['0.875rem', { lineHeight: '1.5rem' }],
                'lg': ['1rem', { lineHeight: '1.5rem' }],
                'xl': ['1.125rem', { lineHeight: '1.75rem' }],
                '2xl': ['1.25rem', { lineHeight: '1.75rem' }],
                '3xl': ['1.5rem', { lineHeight: '2rem' }],
                '4xl': ['2rem', { lineHeight: '2.25rem' }],
                '5xl': ['2.5rem', { lineHeight: '2.75rem' }],
                '6xl': ['3.5rem', { lineHeight: '1' }],
            },
            letterSpacing: {
                'tighter': '-0.04em',
                'tight': '-0.02em',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'glow': 'glow 2s ease-in-out infinite alternate',
                'shimmer': 'shimmer 2s linear infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                glow: {
                    '0%': { boxShadow: '0 0 5px rgba(0, 229, 255, 0.2)' },
                    '100%': { boxShadow: '0 0 25px rgba(0, 229, 255, 0.5)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
            },
            borderRadius: {
                'xl': '0.875rem',
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            boxShadow: {
                'glow': '0 0 20px rgba(0, 229, 255, 0.3)',
                'glow-lg': '0 0 40px rgba(0, 229, 255, 0.4)',
                'inner-glow': 'inset 0 0 20px rgba(0, 229, 255, 0.1)',
            },
            backdropBlur: {
                'xs': '2px',
            },
        },
    },
    plugins: [],
}
