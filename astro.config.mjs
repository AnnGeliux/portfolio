// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages: el sitio se sirve en AnnGeliux.github.io/portfolio
  // Para migrar a dominio custom (anngeliux.dev): cambiar site y dejar base: '/'
  // + crear public/CNAME con el dominio.
  site: 'https://AnnGeliux.github.io',
  base: '/portfolio',
  output: 'static',

  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },
});