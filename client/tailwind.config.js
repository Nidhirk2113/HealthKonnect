export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { brand: { 50: '#effaf4', 100: '#d9f3e4', 500: '#279461', 600: '#1f7b50', 700: '#17623f' }, ink: '#20332b' },
      boxShadow: { soft: '0 10px 30px rgba(27,71,49,.08)' },
    },
  },
  plugins: [],
};
