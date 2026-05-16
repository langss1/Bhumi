/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        moss: {
          50: '#F4F5F0',
          100: '#E6E9DC',
          200: '#CDD5B9',
          300: '#B4C196',
          400: '#9BAD73',
          500: '#8A9A5B', // Moss green
          600: '#717E4A',
          700: '#58623A',
          800: '#3F4629',
          900: '#262A19',
        },
        olive: {
          50: '#F1F5EB',
          100: '#DEEACD',
          200: '#C2D8A4',
          300: '#A5C67C',
          400: '#88B453',
          500: '#6B8E23', // Olive
          600: '#546F1C',
          700: '#3D5114',
          800: '#26330D',
          900: '#0F1405',
        },
      },
    },
  },
  plugins: [],
}
