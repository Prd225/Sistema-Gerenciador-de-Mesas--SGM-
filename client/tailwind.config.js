/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        // SGM Semantic Surface & Brand tokens
        canvas: 'var(--bg-canvas)',
        app: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        'surface-elevated': 'var(--bg-surface-elevated)',
        'border-subtle': 'var(--border-subtle)',
        'border-muted': 'var(--border-muted)',
        'text-main': 'var(--text-main)',
        'text-muted-custom': 'var(--text-muted)',
        'brand-purple': 'var(--brand-purple)',
        'brand-purple-hover': 'var(--brand-purple-hover)',
        'brand-green': 'var(--brand-green)',
        'brand-gold': 'var(--brand-gold)',
        'brand-red': 'var(--brand-red)',
        'brand-cyan': 'var(--brand-cyan)',
      },
      borderColor: {
        subtle: 'var(--border-subtle)',
        muted: 'var(--border-muted)',
      },
      textColor: {
        main: 'var(--text-main)',
        'muted-custom': 'var(--text-muted)',
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};
