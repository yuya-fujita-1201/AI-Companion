/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#0a7ea4",
        background: "#ffffff",
        surface: "#f5f5f5",
        foreground: "#11181C",
        muted: "#687076",
        border: "#e2e8f0",
        success: "#22C55E",
        warning: "#F59E0B",
        error: "#EF4444",
      },
      fontFamily: {
        rounded: ["'M PLUS Rounded 1c'", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(17, 24, 28, 0.08)",
        bubble: "0 8px 20px rgba(17, 24, 28, 0.12)",
      },
    },
  },
  plugins: [],
}
