import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        applus: {
          blue: "#0a70eb",
          text: "#3a414a",
          border: "#8a96a3",
          panel: "#ffffff",
          muted: "#eef2f7",
          accent: "#f3c340",
          shell: "#f4f7fb"
        }
      },
      boxShadow: {
        panel: "0 6px 20px rgba(38, 67, 108, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
