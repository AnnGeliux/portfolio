# Plan · Practica1 — Fase 2: Faction Picker + Hoja de Ruta al Siguiente Nivel

## Contexto

El portafolio en `C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\` salió de Fase 1 con arquitectura sólida
(ITCSS de 6 capas, ES modules, JSON como single source of truth, i18n, reveal, scroll-spy). El render era
funcional pero la identidad visual dependía de un toggle binario dark/light genérico. Además, hay un loop
roto con GitHub: el portafolio no lleva a GitHub con peso, y GitHub no lleva al portafolio.

Auditoría del estado externo (consultado en esta sesión):
- Perfil `AnnGeliux`: 1 follower, 0 following, sin bio, sin website, sin location, sin README de perfil
- Repos públicos: 2 — `sistemaGestorLecturas` (Python/Django/MariaDB, 7 commits, MIT, README completo, sin demo)
  y `challenge-amigo-secreto` (HTML/CSS/JS vanilla, 1 commit, sin descripción, sin README)
- Stars totales: 0 · Forks totales: 0

Resultado esperado de Fase 2: el visitante aterriza en un sitio que cuenta una historia de "4 facciones" con
morfismo visual, y de ahí puede salir a GitHub con evidencia real (proyectos con links, badges en vivo,
actividad reciente). El portafolio deja de ser una página y se vuelve una superficie viva conectada al
trabajo del autor.

Esta fase se divide en dos mitades independientes:

1. **Faction Picker (implementado en esta sesión)** — el botón de tema deja de ser binario y se vuelve un
   picker de 4 facciones con morphing del monograma.
2. **Hoja de ruta al siguiente nivel (este plan, secciones F–I)** — el roadmap concreto para llevar el
   portafolio de "está bien" a "reclutador lo guarda en bookmarks".

---

## A. Estructura final tras Fase 2 (cambios sobre Fase 1)

```
Practica1/
├── assets/
│   ├── fotoPerfil.jpeg
│   ├── og-image.png                           (NUEVO — 1200×630, ver Fase G)
│   ├── favicon.svg                            (NUEVO — monograma AP)
│   └── project-covers/                        (NUEVO — screenshots de proyectos)
│       ├── sistema-gestor-lecturas.png
│       └── challenge-amigo-secreto.png
├── css/                                      (sin archivos nuevos; los 6 existentes crecen)
│   ├── style.css
│   ├── tokens.css                            (MOD — +3 facciones: arcadia, ember, void)
│   ├── base.css                              (MOD — migrado a tokens RGB para halos/stars/shooting)
│   ├── layout.css
│   ├── components.css                        (MOD — +faction picker + morphing, -theme toggle binario)
│   ├── utilities.css
│   └── responsive.css
├── data/
│   ├── site.json                             (MOD — +factions, +currently)
│   ├── projects.json                         (MOD — +cover, +liveUrl, +repoUrl, +stars, +commits)
│   ├── projects.i18n.json                    (MOD — +role, +year, +techStack con versiones)
│   ├── projects.i18n.en.json                 (MOD — idem)
│   ├── education.json                        (sin cambios en esta fase)
│   ├── skills.json                           (sin cambios)
│   ├── currently.json                        (NUEVO — sección "What I'm doing now")
│   └── posts/                                (NUEVO — blog en JSON, opcional)
│       ├── posts.json                        (índice)
│       └── 2026-06-porque-deje-n8n.json     (post individual)
├── js/
│   ├── main.js                               (MOD — initFactionPicker, +initCurrently, +initPosts)
│   └── modules/
│       ├── year.js
│       ├── scrollSpy.js
│       ├── reveal.js
│       ├── navClose.js                       (MOD — cierra faction-picker al click fuera)
│       ├── site.js                           (MOD — usa site.json.factions, +currently payload)
│       ├── projects.js                       (MOD — renderiza cover, links, badges en vivo)
│       ├── education.js
│       ├── skills.js
│       ├── theme.js                          (MOD — reescrito: initFactionPicker con 4 estados + morphing)
│       ├── currently.js                      (NUEVO — render #currently-list)
│       └── posts.js                          (NUEVO — opcional, render de blog)
├── index.html                                (MOD — pre-paint script, faction-picker, +#currently)
├── design-explorations/                      (NUEVO — screenshots de cada facción para revisión)
└── Plan Fase2-Visual.md                      (este archivo)
```

---

## B. Faction Picker — implementación

### B.1 Concepto

4 facciones con identidad narrativa. El botón del tema deja de ser toggle binario (sun/moon) y se vuelve
un dropdown (`<details>`) con preview de color. Al elegir facción, el monograma "AP" de la nav se expande
de 2.25rem a 11rem mientras el gradient barre de izquierda a derecha; a la mitad del morphing (200ms)
se hace el swap del `data-theme`; al final (400ms) el cuadrito vuelve a su tamaño con la nueva paleta
ya aplicada. El resto del sitio recibe una transición CSS de 200ms para suavizar el cambio de tokens.

| Faction | Sensación | Acento primario | Acento secundario | Fondo |
|---|---|---|---|---|
| **Liminal** (default) | Entre mundos, observación IA | violeta `#a78bfa` | cyan `#22d3ee` | negro azulado `#0a0a14` |
| **Arcadia** | Orden, claridad nórdica, reclutador-friendly | cyan clínico `#0891b2` | menta `#10b981` | slate-50 `#f8fafc` |
| **Ember** | Forja, maker, intensidad creativa | naranja `#f97316` | dorado `#fbbf24` | stone-900 `#1c1917` |
| **Void** | Profundidad, glitch gótico | magenta `#d946ef` | verde tóxico `#84cc16` | casi negro `#0a0a0f` |

Cada facción redefine los mismos 6 slots semánticos (fondo, accent 1, accent 2, texto 1, texto 2, vidrio)
en `tokens.css`. Sin hacks inline — todo el cambio de paleta se hace por override de custom properties.

### B.2 Pre-paint script (anti-FOUC)

En `<head>` de `index.html`, antes del `<link>` del CSS, en línea:

```html
<script>
  (function () {
    try {
      var f = localStorage.getItem('faction');
      if (f) document.documentElement.setAttribute('data-theme', f);
    } catch (e) {}
  })();
</script>
```

Bloquea render por ~1ms; evita el flash de paleta incorrecta al cargar. Mismo patrón que `next-themes`.

### B.3 HTML del picker

Reemplaza el `<button class="js-theme-toggle">` por:

```html
<details class="faction-picker" id="faction-picker">
  <summary class="site-nav__icon-btn" data-i18n-attr="aria-label:nav.theme-aria">
    <span class="faction-picker__swatch" data-faction-swatch aria-hidden="true"></span>
    <span class="faction-picker__name" data-faction-name>Liminal</span>
    <svg class="faction-picker__caret" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M3 4l3 3 3-3" stroke="currentColor" stroke-width="1.5" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </summary>
  <ul class="faction-picker__menu" role="listbox" aria-label="Facción de tema">
    <li><button type="button" data-faction="liminal" role="option">
      <span class="faction-picker__dot" data-faction-dot="liminal"></span>
      <span class="faction-picker__label">
        <strong data-i18n="faction.liminal">Liminal</strong>
        <small data-i18n="faction.liminal-desc">Entre mundos · observación</small>
      </span>
    </button></li>
    <!-- arcadia, ember, void — misma estructura -->
  </ul>
</details>
```

### B.4 CSS — componentes nuevos (en `components.css`)

```css
/* ----- Faction picker ----- */
.faction-picker > summary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  width: auto; height: 2.5rem;
  padding-inline: var(--space-3);
  font-family: var(--font-display);
  border-radius: var(--radius-pill);
}

.faction-picker__swatch {
  width: 1rem; height: 1rem;
  border-radius: var(--radius-circle);
  background: var(--color-gradient);
  box-shadow: 0 0 0 2px var(--color-bg-elevated);
}

.faction-picker__menu {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  min-width: 18rem;
  padding: var(--space-2);
  background-color: var(--color-bg-elevated);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--color-glass-border-hover);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: var(--z-overlay);
  animation: faction-menu-in var(--duration-base) var(--ease-out);
}

/* Dots del menú — gradients fijos por facción (no se reescriben con tokens
   porque necesitamos los pares exactos, no los del :root activo) */
.faction-picker__dot[data-faction-dot="liminal"] { background: linear-gradient(135deg, #a78bfa, #22d3ee); }
.faction-picker__dot[data-faction-dot="arcadia"] { background: linear-gradient(135deg, #0891b2, #10b981); }
.faction-picker__dot[data-faction-dot="ember"]   { background: linear-gradient(135deg, #f97316, #fbbf24); }
.faction-picker__dot[data-faction-dot="void"]    { background: linear-gradient(135deg, #d946ef, #84cc16); }

/* ----- Monograma morphing ----- */
.site-nav__brand-mark {
  position: relative; overflow: hidden; z-index: 0;
  transition: width 400ms var(--ease-spring),
              border-radius 400ms var(--ease-spring),
              box-shadow 400ms var(--ease-out),
              color 200ms var(--ease-out);
}

.site-nav__brand-mark::before {
  content: ""; position: absolute; inset: 0;
  background: var(--color-gradient);
  transform: translateX(-101%);
  transition: transform 400ms var(--ease-in-out);
  z-index: -1;
}

.site-nav.is-faction-changing .site-nav__brand-mark {
  width: 11rem;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-glow-strong);
  color: transparent;
}

.site-nav.is-faction-changing .site-nav__brand-mark::before { transform: translateX(0); }
.site-nav.is-faction-changing .site-nav__brand-name { opacity: 0; }
```

### B.5 JS — `theme.js` reescrito

`initFactionPicker()` con 3 fases temporales:

```js
const STORAGE_KEY = 'faction';
const VALID_FACTIONS = ['liminal', 'arcadia', 'ember', 'void'];
const MORPH_HALF_MS = 200;
const MORPH_TOTAL_MS = 400;

const setFaction = (faction) => {
  if (!VALID_FACTIONS.includes(faction)) return;
  if (root.getAttribute('data-theme') === faction) return;

  // Fase 1: disparar el morphing
  nav.classList.add('is-faction-changing');
  root.classList.add('theme-transitioning');

  // Fase 2: a la mitad, swap de data-theme
  setTimeout(() => {
    root.setAttribute('data-theme', faction);
    setStored(faction);
    applyStatic(faction);  // actualiza swatch, name, aria-selected
  }, MORPH_HALF_MS);

  // Fase 3: cleanup
  setTimeout(() => {
    nav.classList.remove('is-faction-changing');
    root.classList.remove('theme-transitioning');
  }, MORPH_TOTAL_MS);
};
```

### B.6 i18n

Agregar namespace `faction` a `i18n.es.json` e `i18n.en.json`:

```json
"faction": {
  "label": "Facción",
  "liminal": "Liminal", "arcadia": "Arcadia", "ember": "Ember", "void": "Void",
  "liminal-desc": "Entre mundos · observación",
  "arcadia-desc": "Orden · claridad nórdica",
  "ember-desc": "Forja · intensidad maker",
  "void-desc": "Profundidad · glitch gótico"
}
```

### B.7 navClose.js

Extender para cerrar el `faction-picker` al hacer click fuera:

```js
document.addEventListener('click', (e) => {
  if (picker && picker.open && !picker.contains(e.target)) picker.open = false;
  if (menu && menu.open && !menu.contains(e.target)) menu.open = false;
});
```

---

## C. Orden de ejecución (Faction Picker)

1. `tokens.css` — agregar `html[data-theme="arcadia"]`, `html[data-theme="ember"]`, `html[data-theme="void"]`
   con sus 6 slots semánticos. Agregar tokens `--halo-1-rgb`, `--halo-2-rgb`, `--star-color`, `--scrollbar-rgb`,
   `--shoot-*` (estos 5 viajan en `:root` por default Liminal y se reescriben por facción).
2. `base.css` — migrar los gradientes hardcoded a `rgba(var(--halo-N-rgb), alpha)`. Eliminar overrides
   `html.theme-light`. Cambiar `--color-star` a `--star-color` en `.star`.
3. `index.html` — pre-paint script en `<head>`. Reemplazar `<button class="js-theme-toggle">` por
   `<details class="faction-picker">` con las 4 opciones.
4. `data/i18n.es.json` + `data/i18n.en.json` — namespace `faction`.
5. `css/components.css` — +170 líneas: dropdown, dots con gradients fijos, animaciones, monograma morphing.
   Quitar ~30 líneas del viejo theme toggle.
6. `js/modules/theme.js` — reescrito. `initFactionPicker()` con persistencia en `localStorage['faction']`.
7. `js/modules/navClose.js` — agregar click-outside para el picker.
8. `js/main.js` — swap `initTheme` por `initFactionPicker`.
9. `js/modules/stars.js` — eliminar `TINTS_DARK`/`TINTS_LIGHT`/`currentTints()`/`themeObserver`. Las estrellas
   leen `--star-color` del token. (Esto pasa a ser cleanup en `simplify`.)
10. **Verificación con `playwright-cli`:** screenshots de las 4 facciones en 3 viewports (375/768/1280) +
    picker abierto + frame de morphing. Output en `design-explorations/`.

---

## D. Verificación (Faction Picker)

1. Servir por HTTP (obligatorio para ES modules):
   ```
   cd C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1
   python -m http.server 8080
   ```
2. Abrir `http://localhost:8080/`. Sin errores en consola.
3. **Pre-paint:** DevTools → Application → Local Storage → escribir `faction=arcadia` → recargar → el sitio
   debe aparecer en Arcadia **sin flash** de Liminal.
4. **Picker:** click en el summary → dropdown se abre con 4 facciones, dots de color visibles.
5. **Cambio a Arcadia:** click "Arcadia" → el cuadrito AP se expande ~200ms → swap a fondo claro → cuadrito
   vuelve a tamaño normal. La sección "Contacto", el hero, los chips de skills y los halos del fondo
   todos cambian.
6. **Cambio a Ember:** repetir para Ember — fondo stone-900, gradient naranja/dorado.
7. **Cambio a Void:** repetir — fondo casi negro, gradient magenta/verde, las estrellas toman tinte rosado.
8. **Click fuera:** abrir picker → click en `body` (no en el menú) → picker se cierra.
9. **Mobile 375px:** resize → el picker se ve solo (sin brand-name), pero el dropdown es usable.
10. **Persistencia:** elegir Void → recargar → debe seguir en Void.
11. **Reduced motion:** DevTools → Rendering → emulate prefers-reduced-motion: reduce → morphing se ve
    pero los demás keyframes (twinkle, shoot) se pausan.
12. **Limpieza de tokens:** `grep -E "theme-light|js-theme-toggle|portfolio-theme|TINTS_DARK|TINTS_LIGHT"`
    debe devolver 0 resultados.

---

## E. Riesgos y tradeoffs (Faction Picker)

- **Persistencia dual con el viejo `theme: 'light'`:** si el usuario tenía `localStorage['portfolio-theme']='light'`
  del sistema anterior, el primer load lo ignora y arranca en Liminal. La migración es silenciosa.
  Si se quiere un fallback explícito: en `theme.js`, si `localStorage.getItem('faction')` es null y
  `localStorage.getItem('portfolio-theme') === 'light'`, setear `arcadia` y borrar la clave vieja.
- **`prefers-color-scheme` ya no se respeta automáticamente.** Decisión consciente: el usuario eligió facción,
  no el OS. Si el OS está en light, el sitio arranca en Liminal (oscuro). 5 líneas para revertir si molesta.
- **Contraste WCAG:** verificado AA en las 4 paletas para los pares `text-primary` sobre `bg-base`. Si después
  se mete texto sobre `glass-bg` o sobre un accent, hay que re-validar caso por caso.
- **Conicidad con el sitio actual:** el morphing de 400ms + transición CSS de 200ms es un compromiso. Más
  corto se siente abrupto; más largo se siente lento. Si se quiere ajustar: tokens `--morph-duration` y
  `--faction-transition` lo abstraen.
- **El HTML del picker suma ~80 líneas.** Es markup estático, no generado por JS. Tradeoff a favor de SSR
  (se ve antes de que JS hidrate) y en contra de mantener 4 strings repetidos (mitigado con `data-i18n`).
- **Las estrellas se ven monocromas** (mismo color para todas en una facción). Antes tenían tintes random.
  Es intencional — más coherente con la facción — pero si se quiere variedad, la solución es agregar
  tints por facción en el JS y volver al `setProperty('--star-color', ...)` con un `MutationObserver`
  que escuche `data-theme` en vez de `class`.

---

---

# HOJA DE RUTA AL SIGUIENTE NIVEL (secciones F–I)

Esta es la segunda mitad del plan: las áreas de mejora que llevan el portafolio de "está bien" a
"reclutador lo guarda en bookmarks". Ordenadas por impacto/esfuerzo.

Estado actual de GitHub (auditado):
- `AnnGeliux/AnnGeliux` no existe como repo de perfil
- `AnnGeliux/sistemaGestorLecturas`: Python/Django/MariaDB, 7 commits, MIT, README completo, sin demo
- `AnnGeliux/challenge-amigo-secreto`: HTML/CSS/JS, 1 commit, sin descripción, sin README
- 0 stars, 0 forks en todo el perfil

---

## F. Tier 1 — Lo que cambia la primera impresión (1–2 días)

### F.1 Repo de perfil `AnnGeliux/AnnGeliux` con README

**Por qué:** sin este repo, cuando alguien hace click en tu avatar de GitHub desde tu portafolio, aterriza
en un perfil vacío. Es lo que más rápido comunica "este dev está activo".

**Acción concreta:**
1. Crear repo `AnnGeliux/AnnGeliux` (público). Inicializar con `README.md`.
2. Configurar el campo "website" del perfil de GitHub → `https://anngeliux.github.io/portfolio/` (o el dominio
   que decidas) **→** este campo completa el loop Portafolio ↔ GitHub.
3. Contenido del README:
   - Header con tu nombre, tagline, link al portafolio
   - Sección "What I'm working on" (puede linkear a `currently.json` del portafolio)
   - Badges de actividad: `https://github-readme-stats.vercel.app/api?username=AnnGeliux&show_icons=true`
   - Sección "Tech I use" con iconos
   - "Currently learning" con las cosas de tu skills.json que aún no son expert-level
   - Pinned repos: los 2 actuales + espacio para 1-2 más

**Tiempo:** 30–45 min con `https://github.com/rahuldkjain/github-profile-readme-generator`.

**Impacto:** enorme. Es el único cambio que requiere 0 código del lado del portafolio.

### F.2 Webhooks del portafolio a GitHub (badges en vivo)

**Por qué:** hoy tus project cards son estáticos. Un badge que diga "7 commits · actualizado hace 3 días"
o "★ 12" se siente activo.

**Opciones ordenadas por simplicidad:**

**(a) Shields.io — sólo HTML, sin JS:**
```html
<img src="https://img.shields.io/github/stars/AnnGeliux/sistemaGestorLecturas?style=for-the-badge" alt="stars">
<img src="https://img.shields.io/github/last-commit/AnnGeliux/sistemaGestorLecturas?style=for-the-badge" alt="last commit">
```
Costo: 5 min por proyecto. Caveat: Shields.io tiene rate-limits, a veces se ven rotos. Aceptable para un
portafolio personal.

**(b) GitHub Action que actualiza un JSON local cada 24h:**
Workflow en `.github/workflows/refresh-portfolio.yml` que corre un script Python que:
1. Hace `gh api` a cada repo (stars, last commit, language stats)
2. Escribe el resultado en `data/github-stats.json` con un commit automático
3. El portafolio fetcha `data/github-stats.json` y lo renderiza en cada project card

Costo: 2h setup. Más robusto. El badge nunca se rompe. Caveat: tiene un delay de 24h, lo cual está bien
para stats que no necesitan ser en tiempo real.

**Recomendación:** empezar con (a) y migrar a (b) cuando Shields.io se sienta frágil.

### F.3 Project cards con screenshots, links y demo

**Por qué:** el `sistemaGestorLecturas` tiene 7 commits, MIT license, README completo. Le faltan 3 cosas
para ser presentable:
- Screenshot del dashboard (aunque sea una captura de Chrome devtools con datos mock)
- Link "Ver código" al repo
- Link "Ver demo" si lo deployas

**Deploy de `sistemaGestorLecturas`:**
- Railway / Render / Fly.io: gratis con SQLite, 5 min de setup
- Si MariaDB es bloqueante: migrar a SQLite para la demo (Django lo soporta nativamente con un cambio
  de `DATABASES['default']['ENGINE']`)
- Variables de entorno en el panel del hosting
- `git push` → deploy automático

**Schema extendido de `projects.json`:**
```json
{
  "id": "sistema-gestor-lecturas",
  "category": "fullstack",
  "tags": ["Python", "Django", "MariaDB", "JavaScript", "HTML5/CSS3"],
  "cover": "./assets/project-covers/sistema-gestor-lecturas.png",
  "liveUrl": "https://sistema-gestor-lecturas.onrender.com",
  "repoUrl": "https://github.com/AnnGeliux/sistemaGestorLecturas",
  "iconSvg": "..."
}
```

**Tiempo:** 4–6h (incluye deploy). Impacto: muy alto.

### F.4 Conectar el loop Portafolio ↔ GitHub

**Cambios concretos:**
- Hero: agregar un tercer botón "Ver actividad reciente" → `https://github.com/AnnGeliux?tab=overview`
- Footer: además de GitHub, agregar **LinkedIn** (es donde están los reclutadores que no son devs)
- Perfil de GitHub: campo "website" → URL del portafolio (ver F.1)
- Project cards: link al repo + al live (ver F.3)

---

## G. Tier 2 — Lo que diferencia de "otro portafolio más" (1 semana)

### G.1 Sección "Currently" — "What I'm doing now"

**Por qué:** la sección de "highlights" actual (números blandos como "7+ categorías técnicas") no comunica
nada memorable. Reemplazarla por una sección "Currently" en plan Derek Sivers / Simon Willison comunica
"este dev está activo y se puede hablar con él de lo que hace ahora mismo".

**Estructura:**
```
→ Building: Sistema de agentes IA con MCP (Jun 2026)
→ Learning: Diffusion models con SDXL y ComfyUI workflows
→ Reading: "Designing Data-Intensive Applications" — chapter 4
→ Side project: visualizador de attention maps en transformers
```

**Implementación:**
- `data/currently.json` con array de items `{ "icon": "→", "label": "Building", "text": "..." }`
- `js/modules/currently.js` con fetch + render en `#currently-list`
- Sección nueva en `index.html` entre Hero y Perfil (es lo primero que el visitante ve después del hero)
- Reemplaza la lista de `.profile__highlight` actual

**Tiempo:** 2h. **Impacto:** medio-alto.

### G.2 Páginas de proyecto dedicadas (modal o ruta hash)

**Por qué:** el standard de portafolios técnicos en 2026 (ver leerob.io, brittanychiang.com) es: click en
project card → vista detallada con descripción extendida, screenshots, tech stack con versiones, challenges,
links.

**Opciones de routing:**
- **(a) Modal con `<dialog>`:** un solo `index.html`, click abre un modal. Pros: simple. Contras: no hay
  URL compartible, no es indexable por Google.
- **(b) Hash routing (`#/projects/sistema-gestor-lecturas`):** sigue siendo single-page. Pros: URL compartible,
  indexable. Contras: requiere lógica de back/forward.
- **(c) Multi-page estático (`/projects/sistema-gestor-lecturas.html`):** cada proyecto su HTML. Pros: SEO
  máximo, cada post es compartible. Contras: duplicación de layout.

**Recomendación:** (b) hash routing. Encaja con la arquitectura actual (todo en `index.html` + JSON).

**Schema extendido de `projects.i18n.json`:**
```json
"projects": {
  "sistema-gestor-lecturas": {
    "title": "Sistema Gestor de Lecturas",
    "summary": "Aplicación web construida con Django y MariaDB...",
    "details": {
      "role": "Full-stack developer",
      "year": 2025,
      "duration": "3 meses",
      "techStack": [
        { "name": "Python", "version": "3.10+" },
        { "name": "Django", "version": "5.2.4" },
        { "name": "MariaDB", "version": "10.x" },
        { "name": "Chart.js", "version": "latest" }
      ],
      "challenges": [
        "Diseñar el modelo de datos para metas progresivas (anual, mensual, libro)",
        "Implementar el panel de estadísticas con queries agregadas eficientes",
        "Manejar permisos diferenciados admin/usuario sin third-party packages"
      ],
      "learned": [
        "Cómo estructurar un proyecto Django medium-scale sin caer en monolito",
        "Patrones de templates composition con `{% include %}` y `{% extends %}`",
        "El valor de los tests: este proyecto no los tiene, el siguiente sí"
      ]
    }
  }
}
```

**Tiempo:** 6–8h. **Impacto:** muy alto.

### G.3 Blog/writing (opcional pero diferenciador)

**Por qué:** para tu perfil (IA + full-stack), escribir posts cortos de 500–800 palabras te posiciona como
alguien que sabe explicar. Un par de posts al año es suficiente.

**Implementación minimalista (sin build step):**
- `data/posts/posts.json` con índice: `[{ "slug": "2026-06-porque-deje-n8n", "date": "2026-06-15", "title": "..." }]`
- `data/posts/2026-06-porque-deje-n8n.json` con `{ "title", "date", "tags", "body": "Markdown string" }`
- `js/modules/posts.js` que renderiza índice + individual en `#posts-list` y `#post-<slug>` (con hash routing)
- Render del Markdown: `marked.js` cargado desde CDN (~30KB), o `micromark` desde npm si prefieres bundlear
- Feed RSS: derivar de `posts.json` con un script que escribe `feed.xml` (manual, una vez al mes)

**Ejemplos de posts que podrían salir de tu trabajo actual:**
- "Cómo entrené un DNN desde cero: lo que la certificación de Andrew Ng no te dice"
- "Por qué dejé de usar n8n para este workflow y pasé a Python puro"
- "Lo que aprendí haciendo un CRUD con Django + MariaDB que un tutorial nunca te enseña"
- "Mi setup local para SDXL: 4 cosas que wish hubiera sabido antes"

**Tiempo:** 4–6h para el setup + 1h por post. **Impacto:** alto a mediano plazo.

---

## H. Tier 3 — Detalles profesionales (1 día)

### H.1 Open Graph image + favicon custom

**OG image (1200×630):** un HTML estático con el monograma AP sobre el gradient de la facción activa,
capturado a PNG con `playwright-cli` o `puppeteer` (un script de 20 líneas). Se sube como
`./assets/og-image.png` y se referencia en `<head>`:
```html
<meta property="og:image" content="./assets/og-image.png">
```

**Favicon custom:** el mismo monograma AP en formato SVG. Se sube como `./assets/favicon.svg`:
```html
<link rel="icon" type="image/svg+xml" href="./assets/favicon.svg">
```

**Tiempo:** 1h total. **Impacto:** medio.

### H.2 Analytics ético y ligero

**Opciones:**
- **Plausible** (~€9/mes): open-source, sin cookies, sin banner GDPR. Auto-hospedable.
- **Cloudflare Analytics**: gratis si usas Cloudflare, sin cookies.
- **Umami**: open-source, self-hosted gratis, ~$5/mes en Railway.

**Implementación:** un `<script async defer src="...">` antes de `</body>`. Sin configuración adicional.

**Tiempo:** 30 min. **Impacto:** bajo ahora, alto a futuro (saber qué secciones ven los visitantes
informa qué mejorar).

### H.3 Schema.org markup extendido

Ya tienes `itemtype="https://schema.org/Person"` en `<body>`. El contenido dentro necesita microdata:

```html
<body itemscope itemtype="https://schema.org/Person">
  <h1 itemprop="name">Angel Francisco Palestina Blancas</h1>
  <span itemprop="jobTitle">Ingeniero en Sistemas Computacionales</span>
  <span itemprop="knowsAbout">Deep Learning</span>
  <span itemprop="knowsAbout">Transformers</span>
  <!-- ... -->
  <a itemprop="alumniOf" href="https://www.unitec.mx/">UNITEC</a>
  <a itemprop="sameAs" href="https://github.com/AnnGeliux">GitHub</a>
  <a itemprop="sameAs" href="https://linkedin.com/in/...">LinkedIn</a>
</body>
```

O más limpio: un JSON-LD en `<head>` con todo el payload estructurado. Google lo prefiere.

**Tiempo:** 1h. **Impacto:** bajo a corto plazo, alto a largo plazo (knowledge panel cuando alguien
busca tu nombre).

### H.4 Sitemap.xml + robots.txt

Dos archivos estáticos en la raíz. Sin build step, sin JS.

```xml
<!-- sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://anngeliux.github.io/portfolio/</loc></url>
  <url><loc>https://anngeliux.github.io/portfolio/#projects</loc></url>
  <!-- ... -->
</urlset>
```

**Tiempo:** 20 min. **Impacto:** bajo.

### H.5 Service Worker (PWA installable)

Ya tienes casi todo el contenido como JSON estático. Un SW básico de 30 líneas que cachee la primera
visita = sitio offline-ready. El visitante puede instalar tu portafolio como app en su device. Es una
rareza que impresiona.

**Tiempo:** 2h. **Impacto:** bajo ahora, alto como conversación starter ("ah, lo instalé como app").

---

## I. Plan de ejecución recomendado (resumen)

| Fase | Qué incluye | Tiempo | Impacto |
|---|---|---|---|
| **A. Faction Picker** | (implementado en esta sesión) | 2.5h | Diferenciador de diseño |
| **F.1** | Repo perfil GitHub + website link | 1h | Muy alto |
| **F.2** | Badges en vivo de stars/commits | 30 min (a) / 2h (b) | Alto |
| **F.3** | Screenshots + deploy del sistema Django | 5h | Muy alto |
| **F.4** | Loop Portafolio ↔ GitHub (links cruzados) | 30 min | Alto |
| **G.1** | Sección "Currently" | 2h | Medio-alto |
| **G.2** | Páginas de proyecto (hash routing) | 6–8h | Muy alto |
| **G.3** | Blog (setup + 1 post inicial) | 5–6h | Alto a mediano plazo |
| **H.1** | OG image + favicon | 1h | Medio |
| **H.2** | Analytics (Plausible o similar) | 30 min | Bajo ahora |
| **H.3** | Schema.org markup | 1h | Bajo a corto plazo |
| **H.4** | sitemap + robots.txt | 20 min | Bajo |
| **H.5** | Service Worker (PWA) | 2h | Bajo ahora |

**Mi recomendación:** arranca con F.1, F.2(a), F.3, F.4 este fin de semana. Es lo que más mueve la aguja
y requiere 0 código nuevo del lado del portafolio (es contenido + deploy + links). Después, G.2 si quieres
diferenciarte fuerte de la competencia, G.1 si quieres hacerlo rápido.

---

## J. Out of scope (NO se hace en Fase 2)

- Frameworks (React, Vue, Svelte, Astro). El portafolio se queda vanilla ES modules.
- Build step (Vite, Webpack). Todo se sirve como estático.
- Backend. La única red es `fetch` a JSONs locales.
- Hosting migration. Sigue en `python -m http.server` o se sube a GitHub Pages / Netlify / Vercel manual.
- Migrar a TypeScript. El JS sigue siendo JS con JSDoc donde ayude.
- Internacionalización más allá de ES/EN. Si en el futuro agregas PT, el patrón `data/i18n.<lang>.json` ya escala.

---

## K. Archivos críticos de esta fase

- `C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\css\tokens.css` — sistema de 4 facciones, 6 slots cada una
- `C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\css\components.css` — picker + morphing, ~170 líneas nuevas
- `C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\css\base.css` — migrado a tokens RGB, sin `html.theme-light`
- `C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\index.html` — pre-paint script, faction-picker
- `C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\js\modules\theme.js` — `initFactionPicker()` con morphing
- `C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\js\modules\navClose.js` — click-outside para el picker
- `C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\js\modules\stars.js` — simplificado, sin tints random
- `C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\data\i18n.es.json` + `i18n.en.json` — namespace `faction`
- `C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\js\main.js` — `initFactionPicker` en lugar de `initTheme`
- `C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\design-explorations\` — screenshots de las 4 facciones para revisión

**Pendientes para Fases futuras (Tier 1+):**
- `AnnGeliux/AnnGeliux` (repo de perfil nuevo en GitHub, no en este repo local)
- `data/projects.json` schema extendido (cover, liveUrl, repoUrl, stars, commits)
- `data/currently.json` (nuevo)
- `data/posts/posts.json` + posts individuales (nuevo)
- `assets/og-image.png`, `assets/favicon.svg` (nuevos)
- `assets/project-covers/*.png` (nuevos)
- `sitemap.xml`, `robots.txt`, `service-worker.js` (nuevos en raíz)
