// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Dominio propio: https://angelpalestina.dev (GitHub Pages + CNAME).
  // (host en minúsculas = forma canónica; @astrojs/sitemap lo emite así, así
  //  que site debe ir en minúsculas para que canonical/OG/JSON-LD/sitemap coincidan).
  // Legacy: anngeliux.github.io/portfolio (redirige a este dominio).
  site: 'https://angelpalestina.dev',
  base: '/',
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
      // por seguridad, cualquier variante sin slash final. /playground es una
      // herramienta interna de decisión visual: nunca al sitemap.
      filter: (page) =>
        !page.includes('/404') &&
        !page.includes('/playground') &&
        page.endsWith('/'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
    ssr: {
      // @crazygl/* vienen con ESM mal emitido (imports sin extensión, JSON sin
      // import attribute, CSS importado desde JS) que Node externo no puede
      // cargar. Forzando a Vite a procesarlos, todo se resuelve en build.
      // Los patch files (pnpm patch-commit) corrigen solo lo que Vite no puede.
      noExternal: ['@crazygl/hero-sdf-lens-blur', '@crazygl/core'],
    },
  },
});