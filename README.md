# PortFolioMk1

Portafolio personal de **Angel Palestina** — Systems Engineering · Deep Learning · IA.
Construido con Astro, React y Tailwind CSS.

## Contenido

- **Proyectos:** trabajos destacados (p. ej. Sistema Gestor de Lecturas).
- **Certificaciones:** credenciales de DeepLearning.AI con enlace verificable.

El contenido vive en `src/content/`:

```text
src/content/
├── projects/         # un .md por proyecto
└── certifications/   # un .md por certificación
```

Cada entrada usa frontmatter tipado por la colección definida en
`src/content.config.ts`. Logos y portadas van en `public/certs` y
`public/projects`.

## Sistema de diseño

- **Liquid glass:** utilidades `.glass-card` y `.glass-pill` en
  `src/styles/global.css` (translucidez + blur + reflejo superior). Se
  desactivan con `prefers-reduced-motion` / `prefers-reduced-transparency`.
- **Shader WebGL:** `src/components/ui/shader-lines.tsx`, fondo animado del
  Hero con `three`. Se omite con `prefers-reduced-motion` o en móvil, y se
  pausa cuando el Hero sale del viewport.
- **Gradiente de scroll:** `src/components/ui/text-gradient-scroll.tsx`
  (framer-motion) — texto que se revela al hacer scroll (Sobre mí y título de
  Habilidades).
- **`cn`** en `src/lib/utils.ts` y alias `@/` configurado en `tsconfig.json`.

Dependencias añadidas: `three`, `clsx`, `tailwind-merge` (además de
`framer-motion` y `lucide-react`).

## Comandos

| Comando           | Acción                                            |
| :---------------- | :------------------------------------------------ |
| `pnpm install`    | Instala dependencias                              |
| `pnpm dev`        | Servidor de desarrollo en `localhost:4321`        |
| `pnpm build`      | Genera el sitio estático en `./dist/`             |
| `pnpm preview`    | Previsualiza el build localmente                  |

## Despliegue

El sitio se publica en GitHub Pages desde `AnnGeliux.github.io/portfolio`
(ver `site` y `base` en `astro.config.mjs`).