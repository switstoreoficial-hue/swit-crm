import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0a",
        surface: "#111111",
        "surface-2": "#161616",
        border: "#2a2a2a",
        accent: {
          DEFAULT: "#f5c842",
          hover: "#ffd766"
        },
        stage: {
          0: "#6b7280",
          1: "#3b82f6",
          2: "#f5c842",
          3: "#f97316",
          4: "#22c55e",
          5: "#ef4444"
        }
      },
      fontFamily: {
        heading: ["Syne", "system-ui", "sans-serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"]
      },
      boxShadow: {
        sheet: "0 -8px 32px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(245,200,66,0.25), 0 8px 32px rgba(245,200,66,0.18)"
      },
      keyframes: {
        slideUp: {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" }
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        toastIn: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        slideUp: "slideUp 200ms ease-out",
        fadeIn: "fadeIn 150ms ease-out",
        toastIn: "toastIn 200ms ease-out"
      }
    }
  },
  plugins: []
};

export default config;
