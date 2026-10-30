/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        primary: {
          DEFAULT: 'var(--primary)',
          contrast: 'var(--primary-contrast)',
        },
        accent: 'var(--accent)',
        'prio-high': 'var(--prio-high)',
        'prio-med': 'var(--prio-med)',
        'prio-low': 'var(--prio-low)',
        warn: 'var(--warn)',
        // Subtask palette
        subtask: {
          emerald: 'var(--subtask-emerald)',
          lavender: 'var(--subtask-lavender)',
          sky: 'var(--subtask-sky)',
          coral: 'var(--subtask-coral)',
          amber: 'var(--subtask-amber)',
          rose: 'var(--subtask-rose)',
          teal: 'var(--subtask-teal)',
          slate: 'var(--subtask-slate)',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        input: '10px',
      },
      boxShadow: {
        calm: '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        popover: '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
