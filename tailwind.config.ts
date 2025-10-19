import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fetchpilot: {
          primary: "#0EA5E9",
          secondary: "#1E293B",
          accent: "#38BDF8",
          bg: "#F8FAFC",
          text: "#0F172A",
        }
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem"
      },
      boxShadow: {
        soft: "0 8px 24px rgba(2, 6, 23, 0.07)"
      }
    },
  },
  plugins: [],
};
export default config;
