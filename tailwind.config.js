/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}", "./src/**/*.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          50: "#f8f9fb",
          100: "#f0f1f5",
          200: "#e2e4eb",
          300: "#cdd0da",
          400: "#9ea3b3",
          500: "#6b7080",
          600: "#3a3a4e",
          700: "#2a2a3a",
          800: "#1e1e2a",
          900: "#13131a",
          950: "#0a0a0f",
        },
      },
    },
  },
  plugins: [],
};
