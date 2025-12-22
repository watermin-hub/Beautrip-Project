/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // API 라우트는 Tailwind 클래스를 사용하지 않으므로 제외
    // './app/api/**/*' 제외됨
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#37EAD0',
          main: '#3ED4BE',
        },
      },
    },
  },
  plugins: [],
}

