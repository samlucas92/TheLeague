/** @type {import('tailwindcss').Config} */
export default {
	content: ['./index.html', './src/**/*.{ts,tsx}'],
	theme: {
		extend: {
			colors: {
				ink: '#172026',
				mint: '#39A96B',
				coral: '#E85D4F',
				gold: '#D39A2D',
				steel: '#587083'
			}
		}
	},
	plugins: []
};
