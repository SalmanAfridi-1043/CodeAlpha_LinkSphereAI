/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#6C63FF",
        secondary: "#1E1E2E",
        accent: "#FF6584",
        dark: "#0F0F1A",
        light: "#F5F5FF",
      },
    },
  },
  plugins: [],
};
