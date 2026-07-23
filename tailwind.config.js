/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}", "./src/**/*.html"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        pretendard: ["Pretendard", "sans-serif"],
      },
      colors: {
        surface: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
        figma: {
          canvas: "#f3f4f6",
          panel: "#ffffff",
          border: "#e5e7eb",
          hover: "#f3f4f6",
          active: "#e5e7eb",
          accent: "#6366f1",
          "accent-hover": "#4f46e5",
          text: "#1e293b",
          subtext: "#64748b",
          muted: "#94a3b8",
        },
      },
      boxShadow: {
        "figma-sm": "0 1px 2px 0 rgba(15, 23, 42, 0.05)",
        "figma-md": "0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 4px -1px rgba(15, 23, 42, 0.04)",
        "figma-lg": "0 10px 25px -3px rgba(15, 23, 42, 0.1), 0 4px 10px -2px rgba(15, 23, 42, 0.05)",
      },
    },
  },
  plugins: [],
};
