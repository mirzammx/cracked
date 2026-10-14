import type { Config } from "tailwindcss";

// Design tokens ported 1:1 from the Throughline.html reference artifact.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0e0f13",
        "canvas-2": "#1b1d26",
        ink: "#f5f6fa",
        "ink-2": "#ffffff",
        "ink-muted": "#c3c7d4",
        "ink-dim": "#9aa0b2",
        "ink-faint": "#828899",
        "ink-ghost": "#737a8c",
        "ink-fade": "#5f6577",
        "ink-fog": "#4b5063",
        card: "#171920",
        "card-2": "#1a1c24",
        "card-3": "#15171d",
        border: {
          DEFAULT: "#2a2d38",
          strong: "#333746",
          faint: "#3b3f4f",
        },
        amber: "#f5b942",
      },
      fontFamily: {
        sans: ["var(--font-instrument-sans)", "Helvetica Neue", "Helvetica", "sans-serif"],
        serif: ["var(--font-instrument-serif)", "Georgia", "serif"],
      },
      keyframes: {
        riseIn: {
          from: { transform: "translateY(18px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        popIn: {
          from: { transform: "translateY(-50%) scale(0.8)", opacity: "0" },
          to: { transform: "translateY(-50%) scale(1)", opacity: "1" },
        },
      },
      animation: {
        riseIn: "riseIn 260ms cubic-bezier(0.2,0.9,0.2,1)",
        fadeIn: "fadeIn 180ms ease",
        popIn: "popIn 420ms cubic-bezier(0.2,0.9,0.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;
