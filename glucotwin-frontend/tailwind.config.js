/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#00d4aa",
        "primary-dark": "#00a87e",
        secondary: "#6c63ff",
        danger: "#ff4757",
        warning: "#ffa502",
        success: "#2ed573",
        bg: "#050d1a",
        "bg-card": "#0a1628",
        "bg-card-hover": "#0f1f3d",
        border: "#1a2e4a",
      },
      fontFamily: {
        sans: ["'DM Sans'", "sans-serif"],
        mono: ["'Space Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
