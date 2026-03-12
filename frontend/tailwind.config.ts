import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#f7f0e4",
          raised: "#fffaf0",
          glass: "rgba(255, 250, 240, 0.82)",
        },
        accent: {
          DEFAULT: "#2563eb",
          cyan: "#0ea5e9",
          ember: "#d97706",
        },
        text: {
          primary: "#1f2937",
          muted: "#5f6b7a",
        },
        border: {
          glass: "rgba(148, 163, 184, 0.35)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 12px 36px rgba(37, 99, 235, 0.16)",
        "glow-lg": "0 22px 58px rgba(37, 99, 235, 0.2)",
        "glow-cyan": "0 14px 42px rgba(14, 165, 233, 0.18)",
        panel: "0 16px 44px rgba(31, 41, 55, 0.12)",
      },
      backgroundImage: {
        "gradient-accent": "linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)",
        "gradient-surface": "linear-gradient(180deg, #f7f0e4 0%, #fffaf0 100%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 4s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out both",
        shimmer: "shimmer 2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
