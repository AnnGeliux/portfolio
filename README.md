# PortFolioMk1

Portafolio personal de **Angel Francisco Palestina Blancas** (Ann) —
Systems Engineering · Deep Learning · IA.

Sitio en vivo: **<https://anngeliux.github.io/portfolio/>**

## Stack

- **[Astro 6](https://astro.build)** — generador estático, output `static`,
  islas de hidratación selectiva (`client:idle` / `client:visible`).
- **[React 19](https://react.dev)** + **[Framer Motion](https://www.framer.com/motion/)** —
  componentes interactivos (Hero, animaciones de entrada, morfeo de texto).
- **[Tailwind CSS 4](https://tailwindcss.com)** (vía `@tailwindcss/vite`) —
  tokens de diseño centralizados en CSS-first (`@theme` en `src/styles/global.css`).
- **[@paper-design/shaders-react](https://shaders.paper-design.co)** —
  shader del Hero (remplazó a `three.js`; véase `src/components/Hero.tsx` y
  `src/components/ui/GrainGradientBackground.tsx`).
- **[@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)** —
  genera `sitemap-index.xml` + `sitemap-0.xml` en cada build.

Otras dependencias notables: `clsx` + `tailwind-merge` (helper `cn`),
`lucide-react` (iconos), `usehooks-ts`, y las fuentes self-hosteadas
`@fontsource-variable/inter` y `@fontsource-variable/space-grotesk`.

## Requisitos

- **Node `>=22.12.0`**
- **pnpm `11.6.0`** (fijado en `packageManager`)

El helper `cn` y el alias `@/` están en `src/lib/utils.ts` y `tsconfig.json`.

## Comandos

| Comando           | Acción                                              |
| :---------------- | :-------------------------------------------------- |
| `pnpm install`    | Instala dependencias                                |
| `pnpm dev`        | Servidor de desarrollo en `localhost:4321`          |
| `pnpm build`      | Genera el sitio estático en `./dist/`               |
| `pnpm preview`    | Previsualiza el build localmente                    |
| `pnpm check`      | Typecheck del proyecto (`astro check`)             |

## Estructura del contenido

El contenido vive en `src/content/`:

```text
src/content/
├── projects/         # un .md por proyecto
└── certifications/   # un .md por certificación
```

Cada entrada usa frontmatter tipado por las colecciones definidas en
`src/content.config.ts` (`projects` y `certifications`, cargadas con el
`glob` loader). Portadas y logos van en `public/projects` y `public/certs`.

La home (`src/pages/index.astro`) secciona: **Hero · Sobre mí · Educación ·
Habilidades · Proyectos · Certificaciones · Aprendiendo · Idiomas**, con
divisores `Ticker` entre secciones. Existe además `src/pages/404.astro`
(excluida del sitemap a propósito en `astro.config.mjs`).

## Sistema de diseño

Liquid glass y tema claro/oscuro theme-aware. Cada item nombra su archivo
para que se note enseguida si alguno deja de existir.

- **Liquid glass:** utilidades `.glass-card` y `.glass-pill` en
  `src/styles/global.css` (translucidez + blur + reflejo superior). El filtro
  SVG de refracción real se define una sola vez en
  `src/components/ui/liquid-glass.tsx` (`<GlassFilter/>`) y las superficies lo
  referencian por `id`. Se desactivan con `prefers-reduced-motion` /
  `prefers-reduced-transparency`.
- **Theming (claro/oscuro):** tema basado en clase `.dark` en `<html>`, sin
  FOUC (script inline en `src/layouts/Layout.astro` que lee
  `localStorage("portfolio-theme")` y cae a `prefers-color-scheme`). Los tokens
  se sobreescriben en `.dark` dentro de `global.css`; el shader del Hero, el
  glass y el fondo ambiental (`ambient-bg`) son todos theme-aware. Conmutación
  manual en `src/components/ui/theme-toggle.tsx` (Navbar).
- **Fondo del Hero (shader):** `src/components/ui/GrainGradientBackground.tsx`
  (`@paper-design/shaders-react`). Se omite con `prefers-reduced-motion` o en
  móvil, y se pausa cuando el Hero sale del viewport.
- **Fondo ambiental global:** `src/components/ui/asmr-background.tsx` — vórtice
  de partículas reactivo al cursor, fijo detrás de todo el contenido
  (`client:idle`). `ambient-bg` (div estático en `Layout.astro`) da color al
  glass desde el primer paint, antes de que este se hidrate.
- **Morfeo de texto (Hero):** `src/components/ui/gooey-text-morphing.tsx`
  (`GooeyText`) — palabras que transicionan con efecto gooey en el tagline.
- **Tabs expandibles:** `src/components/ui/expandable-tabs.tsx` (Habilidades /
  Aprendiendo).
- **Scroll reveal:** script inline en `Layout.astro` que conmuta `.is-visible`
  en cada `.reveal-item` vía `IntersectionObserver` (reversible al scrollear
  arriba; fallback sin JS revela todo).
- **Tipografía:** Satoshi (variable, self-hosteada en `public/fonts/`,
  pre-cargada en `Layout.astro`) como fuente de texto; Inter y Space Grotesk
  (vía `@fontsource-variable`) como fallbacks/display.

Otros componentes: `Navbar.tsx`, `Footer.astro`, `Ticker.astro` (divisores),
`ui/social-icons.tsx`, `ui/expandable-tabs.tsx`.

## SEO

Configurado para indexación correcta desde el scaffold:

- **Canonical + Open Graph + Twitter cards + JSON-LD `Person`** emitidos desde
  `src/layouts/Layout.astro` (URLs absolutas vía `Astro.site`).
- **Sitemap** autogenerado por `@astrojs/sitemap`; `astro.config.mjs` excluye el
  404 y cualquier variante sin slash final (`trailingSlash: 'always'`).
- **`public/robots.txt`** apunta al sitemap con el base de GitHub Pages.
- **Verificación de Google Search Console** vía meta tag + archivo
  `public/googlec4a028871c1ca36d.html`.
- **`rel="me"`** a GitHub y LinkedIn para identidad cruzada.

## Service worker (kill-switch de la v1)

La v1 (Jekyll) registró `/sw.js` con estrategia cache-first, así que los
visitantes que la cargaron siguen viendo esa versión stale. `public/sw.js` es
un **kill-switch de limpieza única**: reemplaza al SW viejo, vacía los caches,
se desregistra a sí mismo y recarga. El registro (en `Layout.astro`) **solo
ocurre si ya hay un SW controlando la página**, así que los visitantes nuevos
no quedan acoplados a ningún SW. No es PWA; es solo migración.

## Despliegue

El sitio se publica en **GitHub Pages** desde `AnnGeliux.github.io/portfolio`
(ver `site` y `base` en `astro.config.mjs`):

- `site: 'https://anngeliux.github.io'` (en minúsculas, forma canónica que
  usan canonical/OG/JSON-LD/sitemap).
- `base: '/portfolio'`.

Para migrar a dominio custom (p. ej. `anngeliux.dev`): cambiar `site`, dejar
`base: '/'` y crear `public/CNAME` con el dominio.