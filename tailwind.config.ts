import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        observatory: {
          base: "hsl(var(--bg-observatory-base) / <alpha-value>)",
          surface: "hsl(var(--bg-observatory-surface) / <alpha-value>)",
          raised: "hsl(var(--bg-observatory-raised) / <alpha-value>)",
          overlay: "hsl(var(--bg-observatory-overlay) / <alpha-value>)",
          subtle: "hsl(var(--border-subtle) / <alpha-value>)",
        },
        lens: {
          reality: "hsl(var(--lens-reality) / <alpha-value>)",
          simulation: "hsl(var(--lens-simulation) / <alpha-value>)",
          symbolic: "hsl(var(--lens-symbolic) / <alpha-value>)",
          inferred: "hsl(var(--lens-inferred) / <alpha-value>)",
        },
        edge: {
          trust: "hsl(var(--edge-trust) / <alpha-value>)",
          hostility: "hsl(var(--edge-hostility) / <alpha-value>)",
          dependency: "hsl(var(--edge-dependency) / <alpha-value>)",
          gap: "hsl(var(--edge-gap) / <alpha-value>)",
        },
        risk: {
          l1: "hsl(var(--risk-l1) / <alpha-value>)",
          l2: "hsl(var(--risk-l2) / <alpha-value>)",
          l3: "hsl(var(--risk-l3) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      transitionTimingFunction: {
        astral: "var(--ease-astral)",
      },
    },
  },
  plugins: [],
};
export default config;
