/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        gameTheme: {
          "primary": "#4f46e5", // Indigo-600
          "primary-focus": "#4338ca", // Indigo-700
          "primary-content": "#ffffff",

          "secondary": "#ec4899", // Pink-500
          "secondary-focus": "#db2777", // Pink-600
          "secondary-content": "#ffffff",

          "accent": "#f59e0b", // Amber-500
          "accent-focus": "#d97706", // Amber-600
          "accent-content": "#ffffff",

          "neutral": "#2a2e37",
          "neutral-focus": "#16181d",
          "neutral-content": "#ffffff",

          "base-100": "#ffffff",
          "base-200": "#f9fafb",
          "base-300": "#f3f4f6",
          "base-content": "#1f2937",

          "info": "#3b82f6",
          "success": "#22c55e",
          "warning": "#f59e0b",
          "error": "#ef4444",

          "--rounded-box": "1rem",
          "--rounded-btn": "0.5rem",
          "--rounded-badge": "1.9rem",
          "--animation-btn": "0.25s",
          "--animation-input": "0.2s",
          "--btn-focus-scale": "0.95",
          "--border-btn": "1px",
          "--tab-border": "1px",
          "--tab-radius": "0.5rem",
        },
      },
      "light",
      "dark",
      "cupcake",
      "cyberpunk",
      "retro",
      "valentine",
      "garden",
    ],
  },
}
