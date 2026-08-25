/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // COMPSPHERE Design System
        bg: {
          primary: "#020807",
          secondary: "#03100E",
          surface: "#051715",
        },
        brand: {
          primary: "#00F5C8",
          secondary: "#00DDB5",
          accent: "#71FFE7",
          dim: "rgba(0,245,200,0.12)",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#D5EAE5",
          muted: "#9AB8B1",
        },
        border: {
          DEFAULT: "rgba(0,255,210,0.12)",
          strong: "rgba(0,255,210,0.25)",
        },
        // Status colors
        status: {
          verified: "#00F5C8",
          pending: "#F5C800",
          dropped: "#F55B00",
          waitlist: "#A855F7",
          submitted: "#00D5F5",
        },
        // Shadcn/ui token overrides (mapped to dark theme)
        background: "#020807",
        foreground: "#F4FFFC",
        card: {
          DEFAULT: "#051715",
          foreground: "#F4FFFC",
        },
        popover: {
          DEFAULT: "#051715",
          foreground: "#F4FFFC",
        },
        primary: {
          DEFAULT: "#00F5C8",
          foreground: "#020807",
        },
        secondary: {
          DEFAULT: "#03100E",
          foreground: "#A4BBB6",
        },
        muted: {
          DEFAULT: "#051715",
          foreground: "#607873",
        },
        accent: {
          DEFAULT: "#071F1B",
          foreground: "#00F5C8",
        },
        destructive: {
          DEFAULT: "#F55B00",
          foreground: "#F4FFFC",
        },
        input: "rgba(0,255,210,0.12)",
        ring: "#00F5C8",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #00F5C8 0%, #00DDB5 50%, #71FFE7 100%)",
        "white-gradient": "linear-gradient(180deg, #FFFFFF 0%, #F1FFFB 45%, #B8F4E6 100%)",
        "dark-gradient": "linear-gradient(180deg, #020807 0%, #03100E 100%)",
        "glow-gradient": "radial-gradient(ellipse at center, rgba(0,245,200,0.15) 0%, transparent 70%)",
        "surface-gradient": "linear-gradient(135deg, rgba(0,245,200,0.05) 0%, rgba(0,0,0,0) 100%)",
      },
      boxShadow: {
        "brand-glow": "0 0 30px rgba(0,245,200,0.3), 0 0 60px rgba(0,245,200,0.1)",
        "brand-glow-sm": "0 0 15px rgba(0,245,200,0.2)",
        "glass": "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
        "panel": "0 4px 24px rgba(0,0,0,0.5)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "count-down": "count-down 1s linear",
        marquee: "marquee 40s linear infinite",
        "marquee-reverse": "marquee-reverse 45s linear infinite",
        "float-slow": "float-slow 8s ease-in-out infinite",
        "spin-slow": "spin-slow 24s linear infinite",
        "scan-line": "scan-line 3s ease-in-out infinite",
        "modal-in": "modal-in 1.1s cubic-bezier(0.16, 1, 0.3, 1) both",
        "modal-out": "modal-out 0.25s cubic-bezier(0.4, 0, 0.6, 1) both",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(0,245,200,0.2)" },
          "50%": { boxShadow: "0 0 30px rgba(0,245,200,0.4)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "marquee-reverse": {
          "0%": { transform: "translateX(-50%)" },
          "100%": { transform: "translateX(0)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-18px) rotate(2deg)" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "scan-line": {
          "0%, 100%": { top: "0%" },
          "50%": { top: "92%" },
        },
        "modal-in": {
          "0%": {
            opacity: "0",
            transform: "translate(-50%, -50%) perspective(1200px) rotateY(-12deg) scale(0.94)",
          },
          "100%": {
            opacity: "1",
            transform: "translate(-50%, -50%) perspective(1200px) rotateY(0deg) scale(1)",
          },
        },
        "modal-out": {
          "0%": {
            opacity: "1",
            transform: "translate(-50%, -50%) perspective(1200px) rotateY(0deg) scale(1)",
          },
          "100%": {
            opacity: "0",
            transform: "translate(-50%, -50%) perspective(1200px) rotateY(-12deg) scale(0.94)",
          },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
