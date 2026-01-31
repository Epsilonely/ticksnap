/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  safelist: ['text-price-rise', 'text-price-fall', 'text-price-unchanged'],
  theme: {
    extend: {
      fontFamily: {
        pretendard: ['Pretendard'],
        righteous: ['Righteous', 'Pretendard'],
        spoqahansans: ['SpoqaHanSans'],
      },
    },
  },
  plugins: [],
};
