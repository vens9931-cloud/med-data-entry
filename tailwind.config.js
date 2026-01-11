/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs personnalisées pour les colonnes
        'col-fixed': '#3B82F6',      // Bleu pour colonnes fixes
        'col-variable': '#10B981',    // Vert pour colonnes variables
        'col-calculated': '#FCD34D',  // Jaune pour colonnes calculées
      },
    },
  },
  plugins: [],
}
