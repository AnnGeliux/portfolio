// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // GitHub Pages: el sitio se sirve en anngeliux.github.io/portfolio
  // (host en minúsculas = forma canónica; @astrojs/sitemap lo emite así, así
  // que site debe ir en minúsculas para que canonical/OG/JSON-LD/sitemap coincidan).
  // Para migrar a dominio custom (anngeliux.dev): cambiar site y dejar base: '/'
  // + crear public/CNAME con el dominio.
  site: 'https://anngeliux.github.io',
  base: '/portfolio',
  // Slash final consistente → evita que el sitemap duplique /portfolio y /portfolio/.
  trailingSlash: 'always',
  output: 'static',

  integrations: [
    react(),
    // Genera /sitemap-index.xml + /sitemap-0.xml en cada build.
    // Site single-page: solo lista la home (https://AnnGeliux.github.io/portfolio/).
    // El 404 se excluye por defecto (no debe ir al sitemap).
    // Si se añaden páginas de proyecto, crearlas en src/pages y se listan solas.
    sitemap({
      // Excluye el 404 (Google prohíbe URLs no indexables en el sitemap) y,
      // por seguridad, cualquier variante sin slash final.
      filter: (page) => !page.includes('/404') && page.endsWith('/'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});