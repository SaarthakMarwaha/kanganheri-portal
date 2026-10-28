import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

const config: Config = {
  // Only generate CSS for classes actually used in the source
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx}",
  ],

  // Enable dark mode via CSS class (supports manual toggle + system preference)
  darkMode: ["class"],

  theme: {
    extend: {
      // ── Design Tokens (mapped from CSS Custom Properties) ───────────────
      colors: {
        // Semantic background/foreground tokens
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",

        // Primary brand color (saffron-inspired, civic warmth)
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          50: "hsl(var(--primary-50) / <alpha-value>)",
          100: "hsl(var(--primary-100) / <alpha-value>)",
          200: "hsl(var(--primary-200) / <alpha-value>)",
          700: "hsl(var(--primary-700) / <alpha-value>)",
          800: "hsl(var(--primary-800) / <alpha-value>)",
        },

        // Secondary (earthy green — nature, agriculture)
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },

        // Civic green (verified business badge, resolved complaints)
        "civic-green": {
          DEFAULT: "hsl(var(--civic-green) / <alpha-value>)",
          foreground: "hsl(var(--civic-green-foreground) / <alpha-value>)",
          light: "hsl(var(--civic-green-light) / <alpha-value>)",
        },

        // Warning amber (pending complaints, mandi price dip)
        "warning-amber": {
          DEFAULT: "hsl(var(--warning-amber) / <alpha-value>)",
          foreground: "hsl(var(--warning-amber-foreground) / <alpha-value>)",
          light: "hsl(var(--warning-amber-light) / <alpha-value>)",
        },

        // Danger red (emergency contacts, rejected status)
        "danger-red": {
          DEFAULT: "hsl(var(--danger-red) / <alpha-value>)",
          foreground: "hsl(var(--danger-red-foreground) / <alpha-value>)",
          light: "hsl(var(--danger-red-light) / <alpha-value>)",
        },

        // Muted / disabled
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },

        // Card surfaces
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },

        // Popover / dropdown surfaces
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },

        // Form element border/ring
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",

        // Chart / data visualization
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },

        // Accent (for interactive highlights)
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },

        // Destructive (form errors, danger actions)
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
      },

      // ── Border Radius ────────────────────────────────────────
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "calc(var(--radius) + 8px)",
      },

      // ── Fluid Typography ─────────────────────────────────────
      fontSize: {
        // Fluid scale using CSS clamp() — defined in globals.css
        // These override Tailwind defaults with responsive values
        xs: ["var(--text-xs)", { lineHeight: "1.5" }],
        sm: ["var(--text-sm)", { lineHeight: "1.5" }],
        base: ["var(--text-base)", { lineHeight: "1.6" }],
        lg: ["var(--text-lg)", { lineHeight: "1.55" }],
        xl: ["var(--text-xl)", { lineHeight: "1.5" }],
        "2xl": ["var(--text-2xl)", { lineHeight: "1.4" }],
        "3xl": ["var(--text-3xl)", { lineHeight: "1.35" }],
        "4xl": ["var(--text-4xl)", { lineHeight: "1.25" }],
        "5xl": ["var(--text-5xl)", { lineHeight: "1.2" }],
      },

      // ── Spacing Tokens ────────────────────────────────────────
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
        "section": "var(--section-padding)",
      },

      // ── Font Families ─────────────────────────────────────────
      fontFamily: {
        // Latin: Inter loaded via next/font/google
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        // Hindi: Noto Sans Devanagari loaded via next/font/google
        devanagari: ["var(--font-noto-devanagari)", "sans-serif"],
        // Monospace for tracking IDs
        mono: ["var(--font-mono)", ...defaultTheme.fontFamily.mono],
      },

      // ── Animation ─────────────────────────────────────────────
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-8px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
        "pulse-ring": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.7", transform: "scale(1.05)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out forwards",
        "slide-in-left": "slide-in-left 0.25s ease-out forwards",
        shimmer: "shimmer 2s linear infinite",
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
      },

      // ── Max Width / Prose ─────────────────────────────────────
      maxWidth: {
        prose: "65ch",
        "screen-2xl": "1400px",
      },

      // ── Box Shadows ───────────────────────────────────────────
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        "card-hover":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        emergency:
          "0 0 0 3px hsl(var(--danger-red) / 0.3), 0 4px 6px -1px rgb(0 0 0 / 0.2)",
      },

      // ── Grid Template Columns ────────────────────────────────
      gridTemplateColumns: {
        "auto-fill-card": "repeat(auto-fill, minmax(280px, 1fr))",
        "auto-fill-sm": "repeat(auto-fill, minmax(200px, 1fr))",
      },
    },
  },

  plugins: [
    // Animation utilities
    require("tailwindcss-animate"),

    // Custom utilities
    plugin(({ addUtilities, addComponents, theme }) => {
      // ── Shimmer skeleton loader utility ──────────────────────
      addUtilities({
        ".skeleton": {
          background:
            "linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--border)) 50%, hsl(var(--muted)) 75%)",
          backgroundSize: "1000px 100%",
          animation: "shimmer 2s linear infinite",
          borderRadius: "var(--radius)",
        },
        // ── Focus ring (WCAG 2.1 AA compliant) ──────────────
        ".focus-ring": {
          "&:focus-visible": {
            outline: "2px solid hsl(var(--ring))",
            outlineOffset: "2px",
          },
        },
        // ── Devanagari line height override ──────────────────
        ".leading-devanagari": {
          lineHeight: "1.7",
        },
        // ── Semantic section padding ─────────────────────────
        ".section-padding": {
          paddingTop: "var(--section-padding)",
          paddingBottom: "var(--section-padding)",
        },
      });

      // ── Card component base ──────────────────────────────────
      addComponents({
        ".card-base": {
          backgroundColor: "hsl(var(--card))",
          color: "hsl(var(--card-foreground))",
          borderRadius: "var(--radius)",
          border: "1px solid hsl(var(--border))",
          boxShadow: theme("boxShadow.card"),
          transition: "box-shadow 0.2s ease, transform 0.2s ease",
          "&:hover": {
            boxShadow: theme("boxShadow.card-hover"),
          },
        },
      });
    }),
  ],
};

export default config;
