import type { Config } from "tailwindcss";

// Design tokens ported 1:1 from the Throughline.html reference artifact.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#14140f",
        "canvas-2": "#22221a",
        ink: "#f2efe8",
        "ink-2": "#f7f4ec",
        "ink-muted": "#b9b4a4",
        "ink-dim": "#8f8a7a",
        "ink-faint": "#767263",
        "ink-ghost": "#6d6a5c",
        "ink-fade": "#5b584c",
        "ink-fog": "#4a4740",
        card: "#1c1c16",
        "card-2": "#1e1e17",
        "card-3": "#1a1a14",
        border: {
          DEFAULT: "#2e2e25",
          strong: "#33332a",
          faint: "#3a3a2e",
        },
        amber: "#c9a86a",
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
