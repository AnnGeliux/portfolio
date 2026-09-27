# PortFolioMk1

Portafolio personal de **Angel Francisco Palestina Blancas** — full-stack con
IA: de Transformers a sistemas multiagente.

**Live:** <https://angelpalestina.dev> · **GitHub:** <https://github.com/AnnGeliux/portfolio>

Sitio estático data-driven: proyectos, certificaciones y artículos viven como
Markdown con frontmatter tipado; cada push a `main` regenera y despliega el
sitio completo.

## Stack

| Capa | Herramienta |
| :--- | :--- |
| SSG | [Astro 6](https://astro.build) — output `static`, islas React (`client:idle`/`client:visible`) |
| Interactividad | [React 19](https://react.dev) + [Framer Motion](https://www.framer.com/motion/) |
| Estilos | [Tailwind CSS 4](https://tailwindcss.com) vía `@tailwindcss/vite`, tokens CSS-first (`@theme`) |
| Shaders | [@paper-design/shaders-react](https://shaders.paper-design.co) — fondo del Hero (`NeuroNoiseBackground`) y galería `/playground` |
| SEO | [@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/) — `sitemap-index.xml` + `sitemap-0.xml` por build |

Utilidades: `cn` (`clsx` + `tailwind-merge`, en `src/lib/utils.ts`),
`lucide-react`, `usehooks-ts`. Fuentes self-hosteadas: Satoshi (texto,
`public/fonts/`), Inter y Space Grotesk (`@fontsource-variable`).

## Quickstart

Requisitos: **Node >= 22.12.0**, **pnpm 11.6.0** (fijado en `packageManager`).

```bash
pnpm install   # dependencias
pnpm dev       # dev server en localhost:4321
pnpm check     # typecheck (astro check)
pnpm build     # sitio estático en ./dist/
pnpm preview   # previsualiza el build
```

## Estructura

```text
src/
├── content/
│   ├── projects/         # un .md por proyecto (frontmatter tipado)
│   ├── certifications/   # un .md por certificación
│   └── blog/             # un .md por artículo
├── content.config.ts     # schemas de las colecciones (glob loader)
├── pages/                # rutas; 404 y /playground excluidos del sitemap
├── components/           # Hero, Navbar, Footer, ui/*
├── layouts/Layout.astro  # head, JSON-LD, theming sin FOUC
└── styles/global.css     # tokens @theme, utilidades .glass-card/.glass-pill
```

Contenido actual: **3 proyectos** — **MCP Inspector** (proxy MITM para depurar
conexiones MCP), **itCoffee** (gestión multi-sucursal para cafeterías,
Next.js + NestJS) y **Sistema gestor de lecturas** (Django + MariaDB) —,
**10 certificaciones** y artículos de blog. Portadas en `public/projects/`.

La home (`src/pages/index.astro`) secciona: **Hero · Sobre mí · Educación ·
Habilidades · Proyectos · Certificaciones · Aprendiendo · Idiomas**, con
divisores `Ticker` entre secciones.

## Sistema de diseño

- **Liquid glass** — `.glass-card` / `.glass-pill` en `global.css` con filtro
  SVG de refracción definido una sola vez (`ui/liquid-glass.tsx`); se
  desactiva con `prefers-reduced-motion` / `prefers-reduced-transparency`.
- **Tema claro/oscuro** — clase `.dark` en `<html>`, sin FOUC (script inline
  en `Layout.astro` que lee `localStorage("portfolio-theme")` con fallback a
  `prefers-color-scheme`); toggle en `ui/theme-toggle.tsx` (Navbar). Hero,
  glass y fondo ambiental son theme-aware.
- **Motion** — scroll reveal vía `IntersectionObserver` (reversible, fallback
  sin JS); morfeo de texto gooey en el tagline del Hero
  (`ui/gooey-text-morphing.tsx`); tabs expandibles
  (`ui/expandable-tabs.tsx`) para Habilidades / Aprendiendo.
- **Fondos** — `NeuroNoiseBackground` (shader del Hero; se omite en móvil /
  reduced-motion y se pausa fuera del viewport) y `asmr-background.tsx`
  (vórtice de partículas global reactivo al cursor; `ambient-bg` da color al
  glass desde el primer paint).

Otros componentes: `Navbar.tsx`, `Footer.astro`, `Ticker.astro` (divisores),
`ui/social-icons.tsx`.

## SEO & AI visibility

- **Canonical + Open Graph + Twitter cards + JSON-LD `Person`** emitidos desde
  `Layout.astro` con URLs absolutas (`Astro.site`).
- **Sitemap** autogenerado con `trailingSlash: 'always'`; 404 y `/playground`
  excluidos en `astro.config.mjs`.
- **`public/robots.txt`** abierto a crawlers (incluidos GPTBot / ClaudeBot) y
  apuntando al sitemap.
- **[`/llms.txt`](https://angelpalestina.dev/llms.txt)** — perfil,
  certificaciones y proyectos resumidos en formato llms.txt para agentes de
  IA.
- **Google Search Console** verificada (meta tag + archivo HTML);
  `rel="me"` a GitHub y LinkedIn para identidad cruzada.

## Service worker (kill-switch de la v1)

La v1 (Jekyll) registró `/sw.js` cache-first y sus visitantes quedaron con
una copia stale. `public/sw.js` es un kill-switch de limpieza única: vacía
caches, se desregistra y recarga — y solo se registra si ya hay un SW
controlando la página, así que nadie nuevo queda acoplado. No es PWA; es solo
migración.

## Despliegue

GitHub Pages desde `main` (push = deploy automático). Configuración en
`astro.config.mjs`:

```js
site: 'https://angelpalestina.dev',  // canónica, en minúsculas
base: '/',
```

El dominio custom vive en `public/CNAME` (`angelpalestina.dev`).