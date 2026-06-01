import type {Config} from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-poppins)', 'sans-serif'],
        body: ['var(--font-poppins)', 'sans-serif'],
        headline: ['var(--font-poppins)', 'sans-serif'],
        code: ['monospace'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        chart: {
          '1': 'var(--chart-1)',
          '2': 'var(--chart-2)',
          '3': 'var(--chart-3)',
          '4': 'var(--chart-4)',
          '5': 'var(--chart-5)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar-background)',
          foreground: 'var(--sidebar-foreground)',
          primary: 'var(--sidebar-primary)',
          'primary-foreground': 'var(--sidebar-primary-foreground)',
          accent: 'var(--sidebar-accent)',
          'accent-foreground': 'var(--sidebar-accent-foreground)',
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
        // Liquid Glass tokens — Apple iOS 26 design language.
        // Why: iki katman üzerine yığılan glass yüzeylerde renk geçirgenliği
        // tutarlı kalsın diye `glass.white.X` / `glass.black.X` shorthand.
        // Kullanım: `bg-glass-white-8`, `border-glass-black-12`.
        glass: {
          white: {
            5: 'rgba(255, 255, 255, 0.05)',
            8: 'rgba(255, 255, 255, 0.08)',
            12: 'rgba(255, 255, 255, 0.12)',
            20: 'rgba(255, 255, 255, 0.20)',
            40: 'rgba(255, 255, 255, 0.40)',
            60: 'rgba(255, 255, 255, 0.60)',
            72: 'rgba(255, 255, 255, 0.72)',
          },
          black: {
            5: 'rgba(0, 0, 0, 0.05)',
            8: 'rgba(0, 0, 0, 0.08)',
            12: 'rgba(0, 0, 0, 0.12)',
            20: 'rgba(0, 0, 0, 0.20)',
            40: 'rgba(0, 0, 0, 0.40)',
            60: 'rgba(0, 0, 0, 0.60)',
            72: 'rgba(0, 0, 0, 0.72)',
          },
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      backdropBlur: {
        // Liquid Glass blur tiers — refractive layered surfaces.
        // glass-1: tight, satır içi sıvı yüzeyler (badge, chip)
        // glass-2: ortak Card/Popover (default)
        // glass-3: prominent surfaces (Dialog, Sheet, Bottom Nav)
        'glass-1': '8px',
        'glass-2': '20px',
        'glass-3': '40px',
      },
      backdropSaturate: {
        // Vibrancy boost — altta kalan rengin daha canlı geçmesi için
        // backdrop-saturate-glass yardımcı sınıfı.
        glass: '180%',
      },
      boxShadow: {
        // Multi-layer soft shadow — Apple "depth-on-glass" pattern.
        // glass-soft: small card / popover
        // glass-prominent: dialog / sheet / modal
        'glass-soft':
          '0 1px 2px 0 rgba(0, 0, 0, 0.04), 0 4px 12px -2px rgba(0, 0, 0, 0.08)',
        'glass-prominent':
          '0 2px 4px 0 rgba(0, 0, 0, 0.06), 0 16px 32px -8px rgba(0, 0, 0, 0.18), 0 1px 0 0 rgba(255, 255, 255, 0.5) inset',
        'glass-prominent-dark':
          '0 2px 4px 0 rgba(0, 0, 0, 0.4), 0 16px 32px -8px rgba(0, 0, 0, 0.6), 0 1px 0 0 rgba(255, 255, 255, 0.08) inset',
      },
      transitionTimingFunction: {
        // Apple-grade spring curves — UI motion compliance with iOS 26.
        'spring': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'spring-out': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
        'story-progress': {
          from: { width: '0%' },
          to: { width: '100%' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'story-progress': 'story-progress var(--story-duration, 5s) linear forwards',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
