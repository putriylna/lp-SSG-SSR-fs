// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", "sans-serif"],
      },
      colors: {
        primary: "#FBBF24", // Yellow primary accent
        beige: "#F5F5DC", // Soft beige accent
      },
      borderRadius: {
        "2xl": "16px",
      },
      boxShadow: {
        soft: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
      },
      transitionProperty: {
        transform: "transform",
      },
    },
  },
  plugins: [],
};
