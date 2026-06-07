Plan · Practica1 — Fase 1: Arquitectura y Modularidad

     Contexto

     El portafolio en C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\ es 100% vanilla (sin bundler ni package.json)
     y está en formato monolítico:

     - index.html (643 líneas) con proyectos, educación, skills y datos de contacto hardcodeados
     - style.css (1251 líneas, 21 secciones bannered en un solo archivo)
     - script.js (90 líneas, IIFE con 3 responsabilidades entremezcladas: año, scroll-spy, reveal-on-scroll)

     Inconsistencias detectadas que se arreglan en este refactor (vía site.json centralizado):
     - GitHub URL aparece como https://github.com/AnnGeliux en el hero, pero como https://github.com/ (roto) en contacto
     y footer
     - Email del hero: href="aangel.palestina@gmail.com" (sin mailto:, no abre el cliente de correo)

     Resultado esperado de la Fase 1: sitio estático que carga con <script type="module">, contenido dinámico desde
     JSON, CSS dividido en 6 capas ITCSS vía @import, sin build step. Preparado para que la Fase 2 agregue features sin
     tocar markup.

     ---
     A. Estructura final

     Practica1/
     ├── assets/
     │   └── fotoPerfil.jpeg                   (intacto)
     ├── css/
     │   ├── style.css                         orchestrator con 6 @import (reemplaza al actual)
     │   ├── tokens.css                        custom properties (:root)
     │   ├── base.css                          reset, tipografía, fondo decorativo, glass, scrollbar
     │   ├── layout.css                        .container, .section*, .site-footer*
     │   ├── components.css                    .site-nav, .hero, .card, .projects, .timeline, .skills, .contact, .btn,
     .chip, .tag
     │   ├── utilities.css                     .visually-hidden, [data-reveal] states, @keyframes
     │   └── responsive.css                    4 @media (min-width) + prefers-reduced-motion
     ├── data/
     │   ├── site.json                         contacto, brand, nav (single source of truth)
     │   ├── projects.json                     2 proyectos
     │   ├── education.json                    2 entradas de timeline
     │   └── skills.json                       7 grupos de chips
     ├── js/
     │   ├── main.js                           entry module; orquesta todo
     │   └── modules/
     │       ├── year.js                       inyecta año en #year
     │       ├── scrollSpy.js                  IntersectionObserver → .is-active
     │       ├── reveal.js                     IntersectionObserver → .is-visible con stagger WeakMap
     │       ├── navClose.js                   cierra <details> al hacer click en link
     │       ├── site.js                       fetch site.json + puebla hrefs de contacto
     │       ├── projects.js                   fetch projects.json → render en #projects-list
     │       ├── education.js                  fetch education.json → render en #education-list
     │       └── skills.js                     fetch skills.json → render en #skills-list
     ├── index.html                            (modificado: <link> + <script> + 3 contenedores vacíos)
     ├── script.js                             (borrado tras migración)
     └── style.css                             (borrado tras migración)

     ---
     B. Orden de ejecución

     Fase 1 — Setup (sin cambios visibles)

     1. Crear carpetas: css/, js/, js/modules/, data/.
     2. Backup manual: copiar script.js → script.js.bak y style.css → style.css.bak (red de seguridad, se borran al
     final).

     Fase 2 — CSS split (al terminar, el render debe ser idéntico al pre-refactor)

     3. css/tokens.css ← :root { ... } (líneas 10–115 del style.css actual).
     4. css/base.css ← reset moderno (121–176) + tipografía base (271–297) + .bg-aurora/.bg-grid (223–247) + .glass
     (253–265) + scrollbar (1100–1122).
     5. css/layout.css ← .container, .visually-hidden, .skip-link, .section*, .site-footer*.
     6. css/components.css ← .site-nav*, .hero*, .card*, .profile*, .projects*, .tag, .timeline*, .skills*,
     .skill-group*, .chip*, .contact*, .btn* (el más grande, ~530 líneas).
     7. css/utilities.css ← [data-reveal] base + .is-visible, @keyframes spin, @keyframes scroll-dot.
     8. css/responsive.css ← los 4 @media (min-width: ...) (1129–1229) + @media (prefers-reduced-motion) (1235–1251).
     9. Reemplazar style.css con el orchestrator de 6 líneas:
     @import "./tokens.css";
     @import "./base.css";
     @import "./layout.css";
     @import "./components.css";
     @import "./utilities.css";
     @import "./responsive.css";
     10. Verificar Fase 2: abrir index.html en navegador (todavía funciona con file:// porque el HTML no cambió). El
     render visual debe ser byte-idéntico.

     Fase 3 — HTML updates

     11. <link rel="stylesheet" href="./style.css"> — la ruta no cambia (apunta al orchestrator).
     12. Reemplazar <script src="./script.js" defer></script> por <script type="module" src="./js/main.js"></script>.
     13. En #proyectos: borrar los 2 <li class="...projects__item"> hardcodeados. Dejar <ul class="projects"
     id="projects-list" role="list"> vacío.
     14. En #educacion: borrar los 2 <li class="timeline__item"> hardcodeados. Dejar <ol class="timeline"
     id="education-list"> vacío.
     15. En #habilidades: borrar los 7 <li class="skill-group"> hardcodeados. Dejar <ul class="skills" id="skills-list"
     role="list"> vacío.
     16. Class hooks para site.js (deben agregarse AHORA para que site.js pueble los hrefs):
       - Hero CTA "Escríbeme": añadir class="btn btn--primary js-cta-email", href="#" placeholder.
       - Hero CTA "Ver GitHub": añadir class="btn btn--ghost js-cta-github", href="#" placeholder.
       - Contacto · botón email: añadir class="... js-contact-email".
       - Contacto · botón GitHub: añadir class="... js-contact-github".
       - Footer · link email: añadir class="site-footer__link js-footer-email".
       - Footer · link GitHub: añadir class="site-footer__link js-footer-github".
     17. Agregar bloque <noscript> justo después de <body>: "Some content is rendered by JavaScript. Please enable JS to
     view projects, education, and skills."

     Fase 4 — JSON data

     18. data/site.json (ver schemas en D).
     19. data/projects.json — 2 entradas.
     20. data/education.json — 2 entradas.
     21. data/skills.json — 7 grupos.

     Fase 5 — JS modules

     22. js/modules/year.js — export default function initYear({ selector = '#year' } = {}).
     23. js/modules/scrollSpy.js — port literal de líneas 19–42 del script.js actual, parametrizado: { navSelector =
     '[data-nav-link]', sectionSelector = 'main section[id]', rootMargin = '-45% 0px -45% 0px', activeClass =
     'is-active' }.
     24. js/modules/reveal.js — port EXACTO de líneas 45–79 del script.js actual, incluyendo:
       - parentCounters WeakMap para stagger por grupo (CRÍTICO: NO convertir a contador global)
       - Math.min(index, 6) * 60 para el delay (parametrizable: staggerStep, staggerMax)
       - Branch de prefers-reduced-motion: reduce con marcado instantáneo
       - observer.unobserve tras primera intersección
     25. js/modules/navClose.js — port de líneas 82–89: cierra <details> con menu.open = false al click en
     [data-nav-link].
     26. js/modules/site.js — export default async function site(). Fetch a ../../data/site.json. Devuelve { data,
     populateLinks() }. populateLinks() selecciona .js-cta-email, .js-cta-github, .js-contact-email, .js-contact-github,
     .js-footer-email, .js-footer-github y setea href desde data.contact.emailHref / data.contact.githubUrl.
     27. js/modules/projects.js — fetch ../../data/projects.json, itera, y por cada proyecto crea con createElement un
     <li class="card card--glass projects__item" data-reveal> que contiene: .projects__icon (con innerHTML =
     project.iconSvg), h3.project__title, p.project__desc, ul.projects__tags con un li.tag por tag. Lo appendea a
     #projects-list.
     28. js/modules/education.js — fetch ../../data/education.json, itera, crea <li class="timeline__item card
     card--glass" data-reveal> con .timeline__node, .timeline__content, .timeline__period, .timeline__title,
     .timeline__institution, y .timeline__description SOLO si entry.description está presente y no vacío.
     29. js/modules/skills.js — fetch ../../data/skills.json, itera grupos, crea <li class="skill-group card
     card--glass" data-reveal> (añadir skill-group--wide si group.wide === true) con h3.skill-group__title y
     ul.chip-list con un li.chip por item. Si item.meta está presente, añadir <span
     class="chip__meta">${item.meta}</span> dentro del mismo <li>.
     30. js/main.js — orchestrator:
     import initYear from './modules/year.js';
     import initScrollSpy from './modules/scrollSpy.js';
     import initReveal from './modules/reveal.js';
     import initNavClose from './modules/navClose.js';
     import site from './modules/site.js';
     import projects from './modules/projects.js';
     import education from './modules/education.js';
     import skills from './modules/skills.js';

     async function bootstrap() {
       try {
         // Regla de orden: data render ANTES que reveal (para que observer vea los nuevos nodos)
         const [s] = await Promise.all([site(), projects(), education(), skills()]);
         s.populateLinks();
         initYear();
         initScrollSpy();
         initReveal();
         initNavClose();
       } catch (err) {
         console.error('Bootstrap failed:', err);
         // Igual intenta inicializar lo que no dependa de data
         initYear(); initScrollSpy(); initReveal(); initNavClose();
       }
     }
     bootstrap();

     Fase 6 — Limpieza

     31. Borrar script.js.
     32. Borrar style.css (el monolito; el nuevo css/style.css orchestrator es un archivo distinto).
     33. Borrar los .bak después de una release cycle.

     ---
     C. Especificaciones detalladas

     js/main.js

     - Tipo: ES module entry, sin exports
     - Imports: los 8 módulos listados arriba
     - Cuerpo: async function bootstrap() que aguarda Promise.all([site(), projects(), education(), skills()]), llama a
     s.populateLinks(), y luego initYear, initScrollSpy, initReveal, initNavClose en ese orden
     - Try/catch: errores de fetch no rompen la página; el resto de los init* corre igual

     js/modules/year.js

     - Export: default initYear({ selector = '#year' } = {})
     - Comportamiento: document.querySelector(selector)?.textContent = new Date().getFullYear()

     js/modules/scrollSpy.js

     - Export: default initScrollSpy({ navSelector, sectionSelector, rootMargin, activeClass } = {})
     - Comportamiento: port directo de líneas 19–42 de script.js con feature detection de IntersectionObserver

     js/modules/reveal.js

     - Export: default initReveal({ selector, staggerStep, staggerMax, threshold, rootMargin, visibleClass } = {})
     - Comportamiento: port EXACTO de líneas 45–79 de script.js con WeakMap para stagger por parent — NO refactorizar a
     contador global
     - Defaults: selector = '[data-reveal]', staggerStep = 60, staggerMax = 6, threshold = 0.12, rootMargin = '0px 0px
     -8% 0px', visibleClass = 'is-visible'

     js/modules/navClose.js

     - Export: default initNavClose({ menuSelector = '.site-nav__menu', linkSelector = '[data-nav-link]' } = {})
     - Comportamiento: port de líneas 82–89: en click de cualquier link, si menu.open es truthy, set menu.open = false

     js/modules/site.js

     - Export: default async function site(): Promise<{ data, populateLinks }>
     - Fetch path: ../../data/site.json (relativo a js/modules/site.js)
     - populateLinks: setea href de los selectores .js-cta-email, .js-cta-github, .js-contact-email, .js-contact-github,
     .js-footer-email, .js-footer-github usando data.contact.emailHref y data.contact.githubUrl

     js/modules/projects.js

     - Export: default async function projects(): Promise<void>
     - Fetch: ../../data/projects.json
     - Selector target: #projects-list
     - Estructura por item: <li class="card card--glass projects__item" data-reveal> con .projects__icon (innerHTML =
     project.iconSvg), <h3 class="project__title">, <p class="project__desc">, <ul class="projects__tags"> con <li
     class="tag"> por tag

     js/modules/education.js

     - Export: default async function education(): Promise<void>
     - Fetch: ../../data/education.json
     - Selector target: #education-list
     - Estructura por item: <li class="timeline__item card card--glass" data-reveal> con .timeline__node,
     .timeline__content (con .timeline__period, .timeline__title, .timeline__institution, y .timeline__description solo
     si entry.description no vacío)

     js/modules/skills.js

     - Export: default async function skills(): Promise<void>
     - Fetch: ../../data/skills.json
     - Selector target: #skills-list
     - Estructura por grupo: <li class="skill-group card card--glass" data-reveal> (con clase extra skill-group--wide si
     group.wide === true) que contiene <h3 class="skill-group__title"> y <ul class="chip-list"> con <li class="chip">
     por item (con <span class="chip__meta"> si item.meta existe)

     CSS files

     - Todos los partials usan el patrón de header comment: /* PORTFOLIO · <layer> · tokens.css */
     - Orden de @import en style.css: tokens → base → layout → components → utilities → responsive. Load-bearing:
     responsive va último para ganar specificity ties
     - tokens.css: solo :root { ... } (líneas 10–115 del actual)
     - base.css: reset + tipografía + decorativos + glass + scrollbar (resets y elementos)
     - layout.css: primitivas de layout (container, sections, footer shell)
     - components.css: todos los bloques BEM
     - utilities.css: estados (.is-active, [data-reveal].is-visible) y keyframes
     - responsive.css: media queries al final

     ---
     D. JSON schemas

     data/site.json

     {
       "brand": {
         "name": "Angel Francisco Palestina Blancas",
         "shortName": "Angel Palestina",
         "monogram": "AP"
       },
       "contact": {
         "email": "angel.palestina10@gmail.com",
         "githubHandle": "AnnGeliux",
         "githubUrl": "https://github.com/AnnGeliux",
         "emailHref": "mailto:angel.palestina10@gmail.com"
       },
       "nav": [
         { "id": "perfil",       "label": "Perfil",      "cta": false },
         { "id": "proyectos",    "label": "Proyectos",   "cta": false },
         { "id": "educacion",    "label": "Educación",   "cta": false },
         { "id": "habilidades",  "label": "Habilidades", "cta": false },
         { "id": "contacto",     "label": "Contacto",    "cta": true  }
       ]
     }
     - emailHref precomputado evita el bug actual del mailto: faltante
     - nav queda plantado para Fase 2 (no se usa en Fase 1; el nav en HTML sigue estático)

     data/projects.json

     [
       {
         "id": "sistema-gestor-lecturas",
         "title": "Sistema Gestor de Lecturas",
         "description": "Aplicación web construida con Django y MariaDB para gestión de lecturas, libros y metas
     personales...",
         "tags": ["Python", "Django", "MariaDB", "JavaScript", "HTML5/CSS3"],
         "iconSvg": "<svg viewBox=\"0 0 24 24\" ...>...</svg>"
       },
       {
         "id": "automatizacion-flujos",
         "title": "Automatización y Flujos",
         "description": "Creación de flujos de trabajo automatizados con n8n para optimizar procesos repetitivos...",
         "tags": ["n8n", "Python", "JavaScript ES6", "SQL", "MariaDB"],
         "iconSvg": "<svg viewBox=\"0 0 24 24\" ...>...</svg>"
       }
     ]
     - Shape: Project[] con id, title, description, tags[], iconSvg
     - SVGs copiados caracter por caracter desde index.html (líneas ~293–304 y ~327–339)

     data/education.json

     [
       {
         "id": "unitec",
         "type": "degree",
         "period": "Septiembre 2024 — En curso",
         "title": "Ingeniería en Sistemas Computacionales",
         "institution": "Universidad Tecnológica de México (UNITEC)",
         "description": ""
       },
       {
         "id": "deeplearning-ai",
         "type": "certification",
         "period": "Certificación",
         "title": "Neural Networks and Deep Learning",
         "institution": "Dictada por Andrew Ng · DeepLearning.AI",
         "description": "Optimización de redes neuronales profundas (DNN) desde cero usando Python y NumPy."
       }
     ]
     - Shape: EducationEntry[] con id, type, period, title, institution, description?
     - type: "degree" | "certification" — preservado para Fase 2 (no se usa en render actual)
     - description: "" en UNITEC es intencional: el renderer omite el <p> cuando está vacío

     data/skills.json

     [
       {
         "id": "lenguajes",
         "title": "Lenguajes y Tecnologías",
         "items": [
           { "name": "Python" },
           { "name": "JavaScript (ES6)" },
           { "name": "SQL" },
           { "name": "HTML5 / CSS3" }
         ]
       },
       {
         "id": "ia-datos",
         "title": "Inteligencia Artificial & Datos",
         "items": [
           { "name": "Deep Learning / DNNs" },
           { "name": "Transformers" },
           { "name": "Diffusion Models (Flux)" },
           { "name": "NumPy" },
           { "name": "Agentes IA" },
           { "name": "MCP" }
         ]
       },
       {
         "id": "ecosistema-generativo",
         "title": "Ecosistema Generativo",
         "items": [
           { "name": "Hugging Face" },
           { "name": "Diffusers (SDXL)" },
           { "name": "ComfyUI" },
           { "name": "Wan2.1 Video" },
           { "name": "Ollama (LLM local)" }
         ]
       },
       {
         "id": "fullstack",
         "title": "Desarrollo Web · Full-Stack",
         "items": [
           { "name": "Django" },
           { "name": "MariaDB" },
           { "name": "n8n" }
         ]
       },
       {
         "id": "devops",
         "title": "DevOps y Herramientas",
         "items": [
           { "name": "Docker" },
           { "name": "GitHub / GitLab CI" },
           { "name": "VS Code" },
           { "name": "Python venv" },
           { "name": "Jupyter" }
         ]
       },
       {
         "id": "metodologias",
         "title": "Metodologías",
         "items": [
           { "name": "Agile & Scrum" },
           { "name": "MVP Development" }
         ]
       },
       {
         "id": "idiomas",
         "title": "Idiomas",
         "wide": true,
         "items": [
           { "name": "Español", "meta": "· Nativo" },
           { "name": "Inglés",  "meta": "· B1 — Técnico" }
         ]
       }
     ]
     - Shape: SkillGroup[] con id, title, wide?, items: [{ name, meta? }]
     - wide: true SOLO en "Idiomas" → trigger para clase skill-group--wide (full-width a ≥1024px)
     - meta es la anotación punteada que va dentro del mismo <li class="chip">

     ---
     E. Estrategia de inyección al DOM

     Decisión: document.createElement directo, sin <template>.

     Justificación:
     - Los datos son heterogéneos (proyecto tiene SVG + tags; education tiene descripción opcional; skill tiene meta
     opcional). Un <template> único necesitaría un {{#if}} que vanilla JS no tiene — terminaríamos hand-rolling
     condicionales post-cloneNode, más código que createElement con property assignment.
     - Los contenedores quedan como <ul>/<ol> vacíos (3 elementos). No hay SSR-fallback que preservar; <noscript> es
     suficiente.
     - document.createElement permite setear data-reveal trivialmente, y el IntersectionObserver de initReveal recoge
     los nuevos nodos automáticamente porque se crea después del render (regla de orden en main.js).

     Trade-off aceptado: flash breve de sección vacía antes de hidratar. Aceptable para portafolio personal; ya hay
     opacity: 0 en el reveal base.

     ---
     F. CSS @import strategy

     - Orden load-bearing en style.css: tokens → base → layout → components → utilities → responsive. responsive.css
     último para ganar specificity ties.
     - Costo render-blocking: los 6 archivos bloquean el first paint juntos. Para ~32 KB de CSS es despreciable.
     Alternativa (concatenar manual antes de deploy): cat css/*.css > bundle.css — fuera de scope Fase 1.
     - HTTP/1.1 vs HTTP/2: 6 round-trips en HTTP/1.1; HTTP/2 multiplexa. Localhost no impactado.
     - Paths: todos relativos a css/style.css (./tokens.css, etc.). No path traversal.
     - Cache: una vez cacheado tokens.css, no se re-descarga. El split ayuda el caching a largo plazo.

     ---
     G. Verificación

     1. Servir por HTTP (obligatorio para ES modules):
     cd C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1
     python -m http.server 8080
     1. Abrir http://localhost:8080/ en Chrome/Firefox.
     2. Sin errores en consola: DevTools → Console → 0 errores rojos. CORS error = no se está sirviendo por HTTP.
     3. Año en footer: leer "© 2026 ..." (año actual).
     4. Proyectos: 2 cards renderizadas con título, descripción, 5 tags cada una, y SVG icon.
     5. Educación: 2 items en timeline; UNITEC sin párrafo descripción, DeepLearning.AI con "Optimización de redes...".
     6. Skills: 7 cards; "Idiomas" full-width a ≥1024px; meta "· Nativo" y "· B1 — Técnico" visibles.
     7. Reveal on scroll: scrollear; cada [data-reveal] fade-in con stagger ~60ms por grupo.
     8. Reduced motion: DevTools → Rendering → emulate prefers-reduced-motion: reduce → reveal instantáneo sin
     translate.
     9. Scroll-spy: scrollear lento; el link activo (is-active con ::after scaleX(1)) sigue la sección visible.
     10. Mobile menu close: viewport <768px → hamburguesa → click "Proyectos" → menú colapsa Y scrollea a #proyectos.
     11. Links de contacto correctos:
       - Hero "Escríbeme" → mailto angel.palestina10@gmail.com
       - Hero "Ver GitHub" → https://github.com/AnnGeliux
       - Contacto · email → mailto correcto
       - Contacto · GitHub → https://github.com/AnnGeliux
       - Footer · email → mailto correcto
       - Footer · GitHub → https://github.com/AnnGeliux
     12. Visual diff: screenshot a 375 / 768 / 1280 px y comparar con pre-refactor. Pixel-idéntico excepto donde se
     arreglaron los hrefs rotos.

     ---
     H. Riesgos y tradeoffs

     - ES modules + file:// = CORS error. El usuario DEBE servir por HTTP. Recomendar python -m http.server 8080 (Python
     3 stdlib, zero install). Alternativa: VS Code "Live Server" extension.
     - @import es serial y render-blocking. 6 RTTs en HTTP/1.1. Para 32 KB es invisible; si creciera a >200 KB,
     concatenar manual antes de deploy.
     - Reveal stagger WeakMap es crítico. Un refactor a contador global cambiaría la animación visual. Resaltado en
     step 24.
     - JSON en UTF-8 sin BOM. Editores como Notepad pueden guardar con BOM y romper el primer char del parse. Usar VS
     Code con "Save with UTF-8 (no BOM)".
     - 4 fetches en paralelo: site.json, projects.json, education.json, skills.json se disparan en paralelo vía
     Promise.all. Tiempo total = max de los 4, no suma.
     - <noscript> es intencionalmente mínimo — no reproduce projects/education/skills. Aceptable para portafolio
     personal.
     - El nav array en site.json no se usa en Fase 1 — está plantado para Fase 2.
     - No se introduce unsafe-inline styles/scripts. No requiere relajar CSP.

     ---
     I. Out of scope (NO se toca)

     - Diseño visual. Tokens, spacing, tipografía, colores, shadows, animaciones, todas las reglas CSS — preservadas
     verbatim. El único cambio estructural en CSS es en qué archivo vive la regla, no qué dice.
     - Textos de contenido. Headings, body copy, tags, nombres de skills — copiados 1:1 del index.html actual a los
     JSON. Sin copy edits.
     - SVG icons. Los 2 SVGs de proyectos copiados caracter por caracter. Los SVGs de los botones (mail + GitHub mark)
     se quedan en HTML porque son iconos de marca estáticos.
     - Estructura HTML de regiones estáticas. Header, hero (excepto los class hooks y el mailto fix), perfil, shell de
     contacto, shell de footer — todo se queda.
     - El <details>-based mobile menu. No se migra a button + JS toggle. Funciona, es accesible, y navClose.js ya lo
     targetea.
     - Lógica de reveal/scroll-spy. WeakMap stagger, prefers-reduced-motion, thresholds, rootMargins — todos
     preservados.
     - Feature detection de IntersectionObserver en ambos módulos.
     - assets/ folder. fotoPerfil.jpeg intacto, path no cambia.
     - Font preconnect/preload hints. Se quedan como están.
     - Las 2 inconsistencias de URLs (GitHub roto en contacto/footer, mailto faltante en hero) se arreglan vía site.json
     → site.js + class hooks, no editando hrefs en HTML. Ese es el punto de data-driven.
     - Features de Fase 2. Nav data-driven, deep links por proyecto, theme toggle, image optimization — diferidos.

     ---
     Archivos críticos

     - C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\index.html — agregar class hooks, vaciar 3 contenedores,
     cambiar <script> a type="module", agregar <noscript>
     - C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\js\main.js — orchestrator con regla de orden
     data-antes-de-reveal
     - C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\js\modules\reveal.js — preservar WeakMap stagger literal
     - C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\js\modules/site.js — fetch + populateLinks (arregla las 2
     inconsistencias de URLs)
     - C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\css\style.css — orchestrator con 6 @import
     - C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\data\{site,projects,education,skills}.json — 4 archivos de
     datos
