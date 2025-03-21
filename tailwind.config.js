/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: "jit",
  darkMode: "class",
  content: ["./**/*.tsx"],
  plugins: [],
  theme: {
    fontSize: {
      xs: ["12px", "16px"],
      sm: ["12px", "16px"],
      base: ["14px", "20px"],
      lg: ["16px", "24px"],
      xl: ["18px", "28px"],
      "2xl": ["20px", "32px"],
      "3xl": ["24px", "40px"]
    }
  }
}
