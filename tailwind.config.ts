import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class", // 👈 alterna con la clase .dark en <html>
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          light: "#e6e5dd", // fondo claro
          dark: "#181618",  // fondo oscuro
        },
        textcolor: {
          light: "#181618", // texto oscuro
          dark: "#e6e5dd",  // texto claro
        },
      },
    },
  },
  plugins: [],
};
export default config;
