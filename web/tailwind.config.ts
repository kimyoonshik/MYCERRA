import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1f6f4a",
          dark: "#135034",
          light: "#e8f3ec",
        },
        risk: {
          green: "#16a34a",
          yellow: "#ca8a04",
          red: "#dc2626",
          black: "#111827",
        },
      },
    },
  },
  plugins: [],
};

export default config;
