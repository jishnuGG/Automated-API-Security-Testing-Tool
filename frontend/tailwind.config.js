/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                cyber: {
                    bg: '#0a0a0a',
                    card: '#111111',
                    border: '#1e1e1e',
                    cyan: '#00d2ff',
                    'cyan-dim': '#00a8cc',
                    red: '#ff4444',
                    amber: '#f59e0b',
                    green: '#22c55e',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
