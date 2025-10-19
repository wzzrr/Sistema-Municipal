/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: { extend: {} },
  corePlugins: { preflight: false }, // seguimos usando tu base CSS
  plugins: [],
};
