/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#8D8075", // Warm Gray (Mochi)
        background: "#FAF9F6", // Off-white / Cream
        text: "#333333", // Dark Charcoal
        accent: "#768175", // Muted Green (Forest)
        secondary: "#EAE7E2", // Light Taupe for UI elements
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
