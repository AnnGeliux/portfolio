/**
 * Helpers de rutas para assets en /public que respetan el base de GitHub Pages.
 *
 * `base` normaliza `import.meta.env.BASE_URL` (puede venir con o sin barra final)
 * a sin barra final. `asset()` prefija una ruta de /public con ese base, de
 * modo que el mismo código sirve en `/portfolio/` (GitHub Pages) y en `/`
 * (dominio propio) sin tocar nada. Para canonical/OG/JSON-LD usa `Astro.site`
 * directamente en cada página (este módulo no puede importarlo).
 */
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefija una ruta de /public (ej. "/projects/foo.svg") con el base del sitio. */
export const asset = (path: string) =>
  `${base}/${path.replace(/^\//, '')}`;