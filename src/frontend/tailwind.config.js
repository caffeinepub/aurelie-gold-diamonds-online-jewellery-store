/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-maroon': 'oklch(0.25 0.08 15)',
        'gold': 'oklch(0.75 0.15 85)',
        'gold-shimmer': 'oklch(0.85 0.18 85)',
        'light-pink': 'oklch(0.92 0.05 15)',
        'beige': 'oklch(0.88 0.02 75)',
        'pink-100': 'oklch(0.92 0.05 15)',
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "oklch(0.75 0.15 85)",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "oklch(0.75 0.15 85)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "oklch(0.75 0.15 85)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "oklch(0.75 0.15 85)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "oklch(0.70 0.12 85)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "oklch(0.75 0.15 85)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "oklch(0.75 0.15 85)",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "oklch(0.75 0.15 85)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '0% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'shimmer-glow': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'pulse-gold': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
      },
      animation: {
        shimmer: 'shimmer 3s linear infinite',
        'shimmer-glow': 'shimmer-glow 2s ease-in-out infinite',
        'pulse-gold': 'pulse-gold 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      boxShadow: {
        'gold-glow': '0 0 20px oklch(0.75 0.15 85 / 0.3)',
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
}
