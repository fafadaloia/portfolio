/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Faculty Glyphic"', 'sans-serif'],
      },
      colors: {
        primary: '#3AAFA9',
        secondary: '#2B7A78',
        accent: '#287470',
        lightBg: '#DEF2F1',
        darkBg: '#17252A',
        lightText: '#3AAFA9',
        darkText: '#3AAFA9',
        linkLight: '#287470',
        linkDark: '#46D8D1',
        buttonLightFrom: '#3AAFA9',
        buttonLightTo: '#2B7A78',
        buttonDarkFrom: '#3AAFA9',
        buttonDarkTo: '#2B7A78',
        buttonTextLight: '#DEF2F1',
        buttonTextDark: '#17252A',
      },
    },
  },
  plugins: [],
};
