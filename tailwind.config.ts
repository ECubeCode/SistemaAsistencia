import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4B2E83",
          dark: "#33205C",
          light: "#6B45AE",
        },
        accent: {
          DEFAULT: "#29ABE2",
          dark: "#1C87B8",
          light: "#6FC8ED",
        },
        neutral: {
          DEFAULT: "#8C8C8C",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
