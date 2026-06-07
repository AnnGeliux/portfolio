# 📖 Manual Completo · Practica1

> Tu portafolio personal. 100% vanilla, sin build step, sin backend. Git + un editor es todo lo que necesitas.

**Ubicación:** `C:\Users\Ann Palestina\Desktop\PRACTICAS\Practica1\`
**Stack:** HTML + CSS + JavaScript (ES modules) + JSON
**Deploy:** GitHub Pages / Netlify / Vercel / cualquier static host
**Autor del contenido:** Angel Francisco Palestina Blancas

---

## Tabla de contenidos

1. [Visión general del proyecto](#1-visión-general-del-proyecto)
2. [Setup inicial · qué necesitas instalar](#2-setup-inicial--qué-necesitas-instalar)
3. [Cómo correr el sitio localmente](#3-cómo-correr-el-sitio-localmente)
4. [Estructura de archivos · mapa completo](#4-estructura-de-archivos--mapa-completo)
5. [Sistema de facciones (tema)](#5-sistema-de-facciones-tema)
6. [Internacionalización (ES/EN)](#6-internacionalización-esen)
7. [Cómo agregar contenido](#7-cómo-agregar-contenido)
   - 7.1 [Agregar un post del blog](#71-agregar-un-post-del-blog)
   - 7.2 [Eliminar un post del blog](#72-eliminar-un-post-del-blog)
   - 7.3 [Agregar un proyecto](#73-agregar-un-proyecto)
   - 7.4 [Actualizar Currently](#74-actualizar-currently)
   - 7.5 [Agregar educación / certificación](#75-agregar-educación--certificación)
   - 7.6 [Agregar skill o grupo de skills](#76-agregar-skill-o-grupo-de-skills)
8. [Trabajar con imágenes](#8-trabajar-con-imágenes)
9. [Deploy a producción](#9-deploy-a-producción)
10. [Operaciones de mantenimiento](#10-operaciones-de-mantenimiento)
11. [Personalización visual](#11-personalización-visual)
12. [Troubleshooting · qué hacer cuando algo se rompe](#12-troubleshooting--qué-hacer-cuando-algo-se-rompe)
13. [Apéndice · referencia rápida](#13-apéndice--referencia-rápida)

---

## 1. Visión general del proyecto

El sitio se compone de estas secciones, renderizadas dinámicamente desde JSON:

| # | Sección | ID HTML | Fuente de datos |
|---|---|---|---|
| 1 | Hero (presentación) | `#inicio` | Hardcoded en `index.html` |
| 2 | Currently (qué hago ahora) | `#actualmente` | `data/currently.json` |
| 3 | Perfil profesional | `#perfil` | Hardcoded en `index.html` + `data/i18n.*.json` |
| 4 | Proyectos | `#proyectos` | `data/projects.json` + 2 i18n |
| 5 | Educación | `#educacion` | `data/education.json` + 2 i18n |
| 6 | Habilidades | `#habilidades` | `data/skills.json` |
| 7 | Blog | `#blog` | `data/posts/posts.json` + 1 archivo por post × 2 i18n |
| 8 | Contacto | `#contacto` | Hardcoded + `data/site.json` |

**Filosofía del código:**
- **JSON como fuente de verdad** (single source of truth). Para cambiar contenido, editas JSON; no tocas HTML.
- **CSS en 6 capas ITCSS**: `tokens → base → layout → components → utilities → responsive`.
- **JS modular** (ES modules). Cada responsabilidad en su archivo.
- **Sin build step**. Lo que ves en el repo es lo que se sirve.
- **i18n por convención**: `data/i18n.<lang>.json` para strings de UI, `data/<cosa>.i18n.<lang>.json` para contenido.

---

## 2. Setup inicial · qué necesitas instalar

### Software necesario

| Software | Versión mínima | Para qué | Verificar |
|---|---|---|---|
| **Python** | 3.8+ | Servidor local de desarrollo | `python --version` |
| **Node.js** | 20+ | Ejecutar los CLIs de `scripts/` | `node --version` |
| **Git** | 2.x | Versionado + deploy a GitHub | `git --version` |
| **VS Code** (recomendado) | cualquiera | Editor + ver JSON bonito | `code --version` |
| **ImageMagick** | 7.x | Generar imágenes placeholder | `magick --version` |

### Instalación por plataforma

**Windows (tu caso):**
```powershell
# Python: ya lo tenés instalado (verificado en PATH)
# Node: descargar de https://nodejs.org (LTS)
# Git: descargar de https://git-scm.com
# ImageMagick: ya lo tenés (en C:/Program Files/ImageMagick-7.1.2-Q16-HDRI)
# VS Code: ya lo tenés

# Verificar todo de una vez
python --version
node --version
git --version
magick --version
code --version
```

**macOS:**
```bash
brew install python node git imagemagick
brew install --cask visual-studio-code
```

**Linux (Debian/Ubuntu):**
```bash
sudo apt install python3 nodejs git imagemagick
# VS Code: snap install code --classic
```

### Editor recomendado (VS Code)

Extensiones útiles (opcionales):
- **JSON** (built-in)
- **Markdown All in One** — para escribir posts
- **Live Preview** — para previsualizar el sitio
- **Stylelint** — si quieres validar CSS

Configuración mínima recomendada en `.vscode/settings.json` (opcional):
```json
{
  "editor.formatOnSave": true,
  "files.associations": {
    "*.json": "jsonc"
  }
}
```

### Configurar Git (solo la primera vez)

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
git init
```

---

## 3. Cómo correr el sitio localmente

### Opción A · Servidor HTTP simple con Python (recomendado)

```bash
cd "C:/Users/Ann Palestina/Desktop/PRACTICAS/Practica1"
python -m http.server 8080
```

Luego abre <http://localhost:8080/> en el navegador.

**Para parar el servidor:** `Ctrl+C` en la terminal.

### Opción B · Con Node (alternativa)

```bash
npx serve -l 8080
```

### Opción C · Con VS Code (Live Server extension)

Instala la extensión "Live Server" de Ritwick Dey, click derecho en `index.html` → "Open with Live Server".

### ¿Por qué necesito un servidor? ¿No puedo abrir el `index.html` con doble click?

**No.** El sitio usa **ES modules** (`<script type="module">`), que los navegadores **bloquean** cuando se abre vía `file://` por políticas CORS. Siempre necesitas servirlo por HTTP. La opción A (Python) es la más simple y no requiere instalar nada extra.

### Verificación rápida

Después de levantar el servidor, abre la consola del navegador (`F12` → Console). Si todo está bien, debería decir:
```
0 errors, 0 warnings
```

Si ves errores de tipo `CORS` o `module`, es porque estás abriendo con `file://` en vez de por HTTP.

---

## 4. Estructura de archivos · mapa completo

```
Practica1/
│
├── index.html                          ← Plantilla principal. Tiene la estructura HTML.
│                                          El contenido dinámico se inyecta desde JSON vía JS.
│
├── manifest.json                       ← PWA manifest (nombre, colores, ícono)
├── sitemap.xml                         ← Mapa del sitio para Google
├── robots.txt                          ← Instrucciones para crawlers
├── sw.js                               ← Service Worker (PWA offline)
│
├── css/                                ← 6 capas ITCSS, importadas en orden
│   ├── style.css                       ← Orchestrator: @import de las 6 capas
│   ├── tokens.css                      ← Custom properties (:root). Aquí viven
│   │                                     los colores, fuentes, espaciados, sombras.
│   │                                     Y LAS 4 FACCIONES (Liminal/Arcadia/Ember/Void).
│   ├── base.css                        ← Reset + tipografía + fondo decorativo
│   │                                     (estrellas, halos) + glass + scrollbar
│   ├── layout.css                      ← .container, .section, .site-footer
│   ├── components.css                  ← .site-nav, .hero, .card, .projects,
│   │                                     .timeline, .skills, .chip, .tag, .btn,
│   │                                     .project-modal, .currently, .posts, .post-card
│   ├── utilities.css                   ← [data-reveal] + @keyframes
│   └── responsive.css                  ← Media queries + prefers-reduced-motion
│
├── js/
│   ├── main.js                         ← Entry point. Orquesta todos los módulos.
│   └── modules/
│       ├── year.js                     ← Inyecta el año actual en #year
│       ├── scrollSpy.js                ← Marca el link activo de la nav según scroll
│       ├── reveal.js                   ← IntersectionObserver → animación de aparición
│       ├── navClose.js                 ← Cierra <details> (menú móvil, faction picker)
│       ├── site.js                     ← Carga site.json y puebla hrefs de contacto
│       ├── projects.js                 ← Carga projects.json + i18n → render en #projects-list
│       ├── education.js                ← Idem para #education-list
│       ├── skills.js                   ← Idem para #skills-list
│       ├── currently.js                ← Idem para #currently-list
│       ├── posts.js                    ← Idem para #posts-list (blog) + hash routing
│       ├── projectModal.js             ← <dialog> nativo con detalles extendidos del proyecto
│       ├── theme.js                    ← Faction picker (4 temas)
│       ├── i18n.js                     ← Carga diccionarios ES/EN, aplica [data-i18n]
│       ├── filters.js                  ← Filtros de proyectos por categoría
│       ├── cv.js                       ← Hook de tracking para descargas de CV
│       └── stars.js                    ← Genera las 120 estrellas + estrellas fugaces
│
├── data/                               ← ⚠️ FUENTE DE VERDAD DEL CONTENIDO ⚠️
│   ├── site.json                       ← Brand, contact, nav, CV URL
│   ├── currently.json                  ← 4 items "What I'm doing now"
│   ├── education.json                  ← Lista de educación (id, period, title, institution, description)
│   ├── education.i18n.json             ← Traducciones de period
│   ├── education.i18n.en.json          ← Idem en inglés
│   ├── skills.json                     ← 7 grupos de skills (lenguajes, IA, devops, etc.)
│   ├── projects.json                   ← Lista de proyectos (id, category, tags, iconSvg, cover, links, stats)
│   ├── projects.i18n.json              ← Títulos, descripciones y details (ES)
│   ├── projects.i18n.en.json           ← Idem en inglés
│   ├── i18n.es.json                    ← Strings de UI en español (nav, hero, btn, etc.)
│   ├── i18n.en.json                    ← Idem en inglés
│   └── posts/                          ← Blog
│       ├── posts.json                  ← Índice de posts (slug, date, title, excerpt, tags)
│       └── <slug>.json                 ← Un archivo por post (slug, date, title, tags, body Markdown)
│
├── assets/
│   ├── fotoPerfil.jpeg                 ← Tu foto de perfil (hero)
│   ├── CV-Angel-Palestina.pdf          ← Tu CV en PDF
│   ├── favicon.svg                     ← Ícono del sitio (monograma AP con gradient)
│   ├── og-image.png                    ← Imagen Open Graph (1200×630) para compartir en redes
│   └── project-covers/                 ← Covers de proyectos (800×500 cada uno)
│       ├── sistema-gestor-lecturas.png
│       └── challenge-amigo-secreto.png
│
├── scripts/                            ← 🛠️ CLIs para agregar contenido
│   ├── new-post.mjs                    ← Wizard para crear un post
│   ├── remove-post.mjs                 ← Wizard para eliminar un post
│   ├── new-project.mjs                 ← Wizard para crear un proyecto
│   └── cover-placeholder.mjs           ← Genera un cover PNG con ImageMagick
│
└── design-explorations/                ← Screenshots de diseño y assets en proceso
    ├── 01-liminal-1280.png
    ├── 02-picker-open.png
    ├── ... (otros screenshots de facciones)
    ├── 12-20-*.png                     ← Screenshots de verificación de Fase 2
    └── profile-README.md               ← README listo para crear el repo de perfil GitHub
```

### Archivos que **no debes tocar manualmente** (los manejan los scripts)

- `data/posts/posts.json` → lo modifica `new-post.mjs` / `remove-post.mjs`
- `data/posts/<slug>.json` → lo crea `new-post.mjs`
- `data/projects.json` → lo modifica `new-project.mjs`
- `data/projects.i18n.json` + `.en.json` → los modifica `new-project.mjs`

Si los editas a mano, asegúrate de mantener la sintaxis JSON válida (sin comas trailing, comillas dobles, etc.). VS Code marca los errores con línea exacta.

---

## 5. Sistema de facciones (tema)

El sitio tiene 4 facciones (temas) que el visitante puede elegir. Cada una redefine los mismos 6 slots semánticos:

| Faction | Sensación | Color primario | Color secundario | Fondo |
|---|---|---|---|---|
| **Liminal** (default) | Entre mundos, observación IA | violeta `#a78bfa` | cyan `#22d3ee` | negro azulado `#0a0a14` |
| **Arcadia** | Orden, claridad nórdica, recruiter-friendly | cyan clínico `#0891b2` | menta `#10b981` | slate-50 `#f8fafc` (claro) |
| **Ember** | Forja, maker, intensidad creativa | naranja `#f97316` | dorado `#fbbf24` | stone-900 `#1c1917` |
| **Void** | Profundidad, glitch gótico | magenta `#d946ef` | verde tóxico `#84cc16` | casi negro `#0a0a0f` |

### Cómo funciona técnicamente

- Las facciones se aplican con `html[data-theme="<id>"]` en el `<html>`.
- Cada facción redefine custom properties en `css/tokens.css` (líneas 129-260).
- La elección se persiste en `localStorage['faction']`.
- Un script anti-FOUC en `index.html` (líneas ~40-47) lee `localStorage` antes del primer render.
- El morphing del monograma AP al cambiar facción dura 400ms.

### Cómo agregar una nueva facción

1. Abre `css/tokens.css`.
2. Copia el bloque de cualquier facción existente (por ejemplo, la de Ember, líneas 172-215).
3. Pégala al final del archivo y renombra `html[data-theme="ember"]` a `html[data-theme="<nuevo-id>"]`.
4. Cambia los valores de los tokens (colores, sombras).
5. Abre `js/modules/theme.js` y agrega el nuevo ID al array `VALID_FACTIONS` (línea 17).
6. En el mismo archivo, agrega un nombre a `FACTION_NAMES` y un gradient a `GRADIENTS`.
7. En `index.html`, busca la `<details class="faction-picker">` y agrega un nuevo `<li>` con el botón.
8. En `data/i18n.es.json` y `i18n.en.json`, agrega las claves `<nuevo-id>` y `<nuevo-id>-desc` en el namespace `faction`.
9. En `css/components.css`, busca el bloque `.faction-picker__dot[data-faction-dot="<ids existentes>"]` y agrega tu nueva facción con su gradient.

### Cómo cambiar la facción default

1. En `index.html` línea ~115, el atributo `data-theme` se setea dinámicamente. Para cambiar el default, edita el fallback en `js/modules/theme.js` línea 22 (`defaultFaction = 'liminal'`).
2. Si quieres que respete `prefers-color-scheme: light` del OS, edita el pre-paint script en `index.html` para detectar el media query y mapearlo a `arcadia` cuando el OS está en light.

---

## 6. Internacionalización (ES/EN)

Todo el contenido traducible se maneja con 2 archivos por idioma:
- **Strings de UI** (nav, botones, labels) → `data/i18n.<lang>.json`
- **Contenido dinámico** (proyectos, educación) → `data/<cosa>.i18n.<lang>.json`

### Cómo agregar un nuevo idioma

1. Crea `data/i18n.<nuevo>.json` copiando `data/i18n.es.json` y traduciendo los valores.
2. Crea `data/projects.i18n.<nuevo>.json`, `data/education.i18n.<nuevo>.json` (misma estructura que los ES/EN).
3. En `js/modules/i18n.js` línea 11, agrega el nuevo código al array `SUPPORTED`.
4. En el mismo archivo, línea 16-18, agrega la detección del idioma en `detectInitialLang`.
5. En el HTML, busca el botón `.js-lang-toggle` (en `index.html`, dentro del nav). Si quieres que el toggle muestre un menú de idiomas en vez de alternar entre 2, tendrás que refactorizarlo (más complejo).

### Cómo traducir un string nuevo

Si agregas un nuevo string en el HTML con `data-i18n="mi.clave"`, debes agregarlo en **ambos** archivos:
- `data/i18n.es.json` (en el namespace correspondiente)
- `data/i18n.en.json`

Si no existe en el diccionario, el `i18n.js` lo deja con el texto hardcoded que pusiste en el HTML (fallback).

### Tipos de directivas de traducción

| Atributo | Qué hace | Ejemplo |
|---|---|---|
| `data-i18n="clave"` | Reemplaza el `textContent` | `<span data-i18n="nav.proyectos">Proyectos</span>` |
| `data-i18n-html="clave"` | Reemplaza el `innerHTML` (permite markup) | `<p data-i18n-html="perfil.body-1">...</p>` |
| `data-i18n-attr="<attr>:<clave>"` | Reemplaza un atributo (aria-label, etc.) | `<a data-i18n-attr="aria-label:nav.theme-aria">...</a>` |

Los placeholders `{year}` se interpolan automáticamente con el año actual.

---

## 7. Cómo agregar contenido

### 7.1 Agregar un post del blog

**Forma recomendada (con CLI):**

```bash
cd "C:/Users/Ann Palestina/Desktop/PRACTICAS/Practica1"
node scripts/new-post.mjs "Título del post"
```

El script te preguntará:
- Slug (sugerido automáticamente, podés cambiarlo)
- Idioma inicial (es/en)
- Tags (separados por coma)
- Excerpt opcional (1-2 frases)

Después:
- Crea `data/posts/<slug>.json` con un esqueleto Markdown
- Actualiza `data/posts/posts.json` agregando el slug al índice
- Te ofrece abrir el archivo en tu editor

**Después de que el script termine:**

1. Edita el archivo `data/posts/<slug>.json` y reemplaza el body con tu contenido en Markdown.
2. Si lo escribiste en español, agrega la traducción al campo `title.en` (y opcionalmente `excerpt.en`).
3. Si lo escribiste en inglés, agrega la traducción al campo `title.es`.
4. Verifica localmente: `python -m http.server 8080` y abre <http://localhost:8080/#blog>.
5. Commit: `git add data/posts/ && git commit -m "post: <slug>"`

**Forma manual (sin CLI):**

1. Crea `data/posts/<slug>.json` con esta estructura:
   ```json
   {
     "slug": "mi-post",
     "date": "2026-06-15",
     "title": {
       "es": "Título en español",
       "en": "Title in English"
     },
     "tags": ["tag1", "tag2"],
     "excerpt": {
       "es": "Resumen corto en español",
       "en": "Short excerpt in English"
     },
     "body": "## Sección 1\n\nTu Markdown aquí.\n\n```js\nconst code = 'se renderiza con highlighting';\n```\n"
   }
   ```

2. Edita `data/posts/posts.json` y agrega el slug al inicio del array:
   ```json
   [
     {
       "slug": "mi-post",
       "date": "2026-06-15",
       "title": { "es": "...", "en": "..." },
       "tags": ["..."],
       "excerpt": { "es": "...", "en": "..." }
     },
     { "slug": "post-anterior", ... }
   ]
   ```

3. Verifica y commitea.

**Markdown soportado:**
- Headings (`## H2`, `### H3`)
- Bold (`**texto**`) e italic (`*texto*`)
- Code inline (`` `código` ``) y code blocks (``` ```js ... ``` ```)
- Listas ordenadas y desordenadas
- Links (`[texto](url)`)
- Blockquotes (`> cita`)

NO se soporta HTML crudo (se sanitiza con DOMPurify por seguridad).

### 7.2 Eliminar un post del blog

**Con CLI:**
```bash
node scripts/remove-post.mjs mi-post
```
Te pide confirmación y limpia ambos archivos.

**Manualmente:**
1. Borra `data/posts/<slug>.json`
2. Quita la entrada del slug en `data/posts/posts.json`
3. Commit: `git add -u data/posts/ && git commit -m "post: remove <slug>"`

### 7.3 Agregar un proyecto

**Con CLI (recomendado):**
```bash
node scripts/new-project.mjs
```

Te preguntará:
- Título (ES, EN)
- Descripción corta (ES, EN)
- Categoría (`deep-learning`, `fullstack`, `automation`, `other`)
- Tags (separados por coma — el icono se elige por los tags)
- URL del repo (opcional)
- URL de demo (opcional)
- Rol, año, duración

Después:
- Genera ID automático desde el título
- Selecciona icono SVG basado en los tags (lookup table)
- Actualiza `data/projects.json` + los 2 archivos i18n
- Genera un cover placeholder con ImageMagick (opcional)
- Ofrece abrir `projects.i18n.json` en tu editor

**Después del script:**
1. Rellena los placeholders de `challenges[]` y `learned[]` en `data/projects.i18n.json`
2. Si tienes un screenshot real del proyecto, reemplaza `assets/project-covers/<id>.png`
3. Si el repo tiene más stars/commits de los que dice, edítalos a mano
4. Verifica localmente
5. Commit: `git add data/ assets/ && git commit -m "project: <id>"`

**Tags que activan iconos específicos** (si tu tag no está aquí, se usa el icono "default"):
- `python`, `py` → ícono de Python
- `django` → ícono de Django
- `javascript`, `js` → ícono de JS
- `html` → ícono de HTML
- `css` → ícono de CSS
- `react` → ícono de React
- `api` → ícono de API
- `database`, `db`, `sql` → ícono de DB
- `ai`, `ml`, `deep-learning` → ícono de AI
- `n8n` → ícono de n8n

**Colores por tag (para el cover placeholder):**
- `python` → `#3776ab` (azul Python)
- `django` → `#0c4b33` (verde oscuro)
- `javascript` → `#f7df1e` (amarillo JS)
- `html` → `#e34c26` (naranja HTML5)
- `css` → `#264de4` (azul CSS3)
- `react` → `#61dafb` (cyan React)
- `ai`, `ml` → `#a78bfa` (violeta Liminal)
- `n8n` → `#ea4b71` (rosa n8n)

Para agregar un nuevo mapeo tag → icono/color, edita `scripts/new-project.mjs` líneas 19-50.

### 7.4 Actualizar Currently

Edita `data/currently.json` directamente:
```json
[
  { "icon": "→", "label": "Building",  "text": "Lo que estoy construyendo" },
  { "icon": "→", "label": "Learning",  "text": "Lo que estoy aprendiendo" },
  { "icon": "→", "label": "Reading",   "text": "Lo que estoy leyendo" },
  { "icon": "→", "label": "Side proj", "text": "Mi proyecto paralelo" }
]
```

Los `icon` aceptados: `→` (default), `◐`, `◇`, `★`, `▲`, `●`. Para íconos custom, edita `js/modules/currently.js` línea 51 y `css/components.css` línea `.currently__icon`.

Commit: `git add data/currently.json && git commit -m "currently: update"`.

### 7.5 Agregar educación / certificación

**Edita `data/education.json`:**
```json
[
  {
    "id": "mi-uni",
    "type": "degree",
    "period": "Septiembre 2024 — En curso",
    "title": "Ingeniería en Sistemas",
    "institution": "Mi Universidad",
    "description": ""
  }
]
```

Tipos válidos: `degree` (se renderiza con un nodo en el timeline), `certification`.

**Si el `period` se traduce a inglés**, edita `data/education.i18n.json` y `data/education.i18n.en.json`:
```json
{
  "mi-uni": {
    "period": "September 2024 — Ongoing"
  }
}
```

Commit: `git add data/ && git commit -m "education: add <id>"`.

### 7.6 Agregar skill o grupo de skills

Edita `data/skills.json`:
```json
[
  {
    "id": "nuevo-grupo",
    "title": "Nuevo Grupo",
    "items": [
      { "name": "Skill 1" },
      { "name": "Skill 2", "meta": "· B2" }
    ]
  }
]
```

- `"wide": true` en un grupo hace que ocupe todo el ancho (útil para grupos cortos como "Idiomas").
- `"meta"` es texto opcional en monoespaciado, separado por punto (ej. `· B1`).

Commit: `git add data/skills.json && git commit -m "skills: add <grupo>"`.

---

## 8. Trabajar con imágenes

### Tipos de imágenes en el proyecto

| Imagen | Ubicación | Tamaño | Cómo se genera |
|---|---|---|---|
| Foto de perfil | `assets/fotoPerfil.jpeg` | 240×240 px (display), alta res recomendado | Tú (cámara) |
| CV | `assets/CV-Angel-Palestina.pdf` | PDF | Tú (editor de docs) |
| Favicon | `assets/favicon.svg` | Vector (32×32 viewBox) | Tú (código SVG) |
| OG image | `assets/og-image.png` | 1200×630 px | Tú (o script) |
| Cover de proyecto | `assets/project-covers/<id>.png` | 800×500 px | `scripts/cover-placeholder.mjs` o tú |

### Reemplazar la foto de perfil

1. Toma una foto cuadrada (mínimo 480×480 px para retina, recomendado 960×960).
2. Optimízala con [TinyPNG](https://tinypng.com) o similar.
3. Sobrescribe `assets/fotoPerfil.jpeg`.
4. Commit.

### Reemplazar el CV

1. Exporta tu CV como PDF.
2. Sobrescribe `assets/CV-Angel-Palestina.pdf`.
3. Si el nombre del archivo cambia, actualiza `data/site.json` línea 21 (`cv.url`).

### Generar un cover de proyecto manualmente

Si quieres un cover custom (en vez del placeholder), tienes 3 opciones:

**Opción A · Captura de pantalla del proyecto deployado** (recomendado para proyectos con demo):
```bash
# 1. Asegúrate de que el proyecto esté corriendo (e.g. localhost:8000)
# 2. Usa playwright-cli para capturar
playwright-cli open http://localhost:8000/
playwright-cli screenshot --filename=C:/Users/Ann Palestina/Desktop/PRACTICAS/Practica1/assets/project-covers/mi-proyecto.png
```

**Opción B · Cover con gradient + título** (lo que hace `cover-placeholder.mjs`):
```bash
node scripts/cover-placeholder.mjs ./assets/project-covers/mi-proyecto.png "Mi Proyecto" "#a78bfa"
```

**Opción C · Diseño custom con Figma/Canva:**
Diseña a 800×500, exporta PNG, guárdalo en `assets/project-covers/<id>.png`.

### Regenerar el OG image (1200×630)

El OG image es lo que se muestra cuando compartes tu URL en Twitter, LinkedIn, etc. Para regenerarlo con tu info actual:

```bash
magick -size 1200x630 xc:'#0a0a14' \
  \( -size 600x600 xc:'#a78bfa' -blur 0x150 \) -gravity northwest -geometry +50-100 -compose screen -composite \
  \( -size 500x500 xc:'#22d3ee' -blur 0x140 \) -gravity southeast -geometry -100+100 -compose screen -composite \
  -font 'Arial-Bold' -pointsize 38 -fill '#a78bfa' -gravity north -annotate +0+100 'ANGEL FRANCISCO' \
  -font 'Arial-Bold' -pointsize 84 -fill white -gravity north -annotate +0+150 'Palestina Blancas' \
  -font 'Arial' -pointsize 28 -fill '#a1a1aa' -gravity north -annotate +0+260 'Ingeniería en Sistemas Computacionales' \
  -font 'Arial' -pointsize 24 -fill '#22d3ee' -gravity north -annotate +0+310 'Deep Learning · Transformers · Full-Stack' \
  -font 'Arial' -pointsize 22 -fill '#71717a' -gravity south -annotate +0+40 'anngeliux.github.io/portfolio' \
  ./assets/og-image.png
```

(El script exacto que generamos está en el historial; ajústalo con tu info actual.)

---

## 9. Deploy a producción

### Opción A · GitHub Pages (recomendado, gratis)

1. **Crea el repo en GitHub** (si no lo has hecho):
   ```bash
   # Opción 1: con gh CLI
   gh repo create AnnGeliux/AnnGeliux.github.io --public --source=. --remote=origin
   
   # Opción 2: manual
   # 1. Crea el repo en github.com (vacío, sin README)
   # 2. Conecta local:
   git remote add origin https://github.com/AnnGeliux/AnnGeliux.github.io.git
   ```

2. **Commit inicial y push:**
   ```bash
   cd "C:/Users/Ann Palestina/Desktop/PRACTICAS/Practica1"
   git add .
   git commit -m "feat: initial commit"
   git branch -M main
   git push -u origin main
   ```

3. **Habilita GitHub Pages:**
   - Ve a `https://github.com/AnnGeliux/AnnGeliux.github.io/settings/pages`
   - Source: `Deploy from a branch`
   - Branch: `main`, folder: `/ (root)`
   - Save
   - Espera 1-2 minutos. Tu sitio estará en `https://anngeliux.github.io/AnnGeliux.github.io/`

4. **Configurar el dominio custom** (opcional):
   - En el mismo panel, en "Custom domain" escribe `tudominio.com`
   - En tu proveedor DNS, crea un CNAME de `www` → `anngeliux.github.io`
   - Crea un archivo `CNAME` en la raíz del repo con `tudominio.com` dentro

### Opción B · Netlify (drag & drop)

1. Ve a <https://app.netlify.com/drop>
2. Arrastra la carpeta `Practica1/` (sin la carpeta `.git`)
3. Listo, te dan una URL tipo `https://random-name.netlify.app`
4. Opcionalmente conecta tu dominio

### Opción C · Vercel

```bash
npm install -g vercel
cd "C:/Users/Ann Palestina/Desktop/PRACTICAS/Practica1"
vercel
```

Sigue los prompts. Listo.

### Post-deploy: verificar que todo funciona

1. Abre tu URL en un navegador.
2. Abre la consola del navegador (F12) y verifica **0 errors, 0 warnings**.
3. Prueba cambiar de facción (debe persistir al recargar).
4. Prueba el toggle de idioma.
5. Click en un proyecto → debe abrir el modal con details.
6. Click en un post del blog → debe cargar con Markdown renderizado.
7. Click en "LinkedIn" / "GitHub" → debe abrir en pestaña nueva.
8. Click en "Descargar CV" → debe descargar el PDF.

Si alguno falla, abre la consola y mira el error. Los más comunes:
- 404 en un asset → el path es incorrecto, revisa `data/site.json` y los paths en JSON.
- Service Worker no se registra → GitHub Pages sirve en HTTPS, debería funcionar. Si no, deshabilita el SW temporalmente comentando las líneas 53-58 de `js/main.js`.
- Fonts de Google no cargan → necesitas conexión a internet; o descarga las fuentes y sírvelas localmente.

---

## 10. Operaciones de mantenimiento

### Actualizar dependencias (no hay, es vanilla)

No aplica. El proyecto no tiene `package.json` ni `node_modules`. Lo único de Node son los 4 scripts en `scripts/`, que son standalone (cero dependencias).

### Actualizar el CV

1. Edita tu CV en tu editor favorito (Word, Google Docs, LaTeX, etc.).
2. Exporta como PDF → `CV-Angel-Palestina.pdf` (o el nombre que quieras).
3. Sobrescribe `assets/CV-Angel-Palestina.pdf`.
4. Si el nombre del archivo cambió, actualiza `data/site.json` línea 21.
5. Commit.

### Cambiar tu email o redes sociales

Edita `data/site.json`:
```json
{
  "contact": {
    "email": "nuevo@email.com",
    "githubHandle": "NuevoUsuario",
    "githubUrl": "https://github.com/NuevoUsuario",
    "linkedinUrl": "https://www.linkedin.com/in/nuevo-perfil"
  }
}
```

El sitio lee estos valores y los inyecta en todos los hrefs automáticamente (`js/modules/site.js`).

### Cambiar el año del footer (se hace automático)

El footer dice "© {year}". El `js/modules/i18n.js` reemplaza `{year}` con `new Date().getFullYear()` automáticamente. No tienes que hacer nada — el 1 de enero se actualiza solo.

### Regenerar el README de tu perfil de GitHub

Si quieres actualizar el README de `AnnGeliux/AnnGeliux`, edita `design-explorations/profile-README.md` y cópialo al repo de GitHub. (O conecta el repo de perfil como submodule si te complica.)

### Cambiar las facciones

Ver sección 5.

### Backup antes de cambios grandes

```bash
cd "C:/Users/Ann Palestina/Desktop/PRACTICAS/Practica1"
git add .
git commit -m "backup: antes de <cambio>"
```

Si algo se rompe:
```bash
git reset --hard HEAD~1
```

---

## 11. Personalización visual

### Cambiar colores sin agregar una facción nueva

Si solo quieres ajustar un color en una facción existente, edita `css/tokens.css` líneas 129-260. Cada facción es un bloque con ~30 tokens que se redefinen.

### Cambiar tipografías

Las fuentes se cargan en `index.html` líneas 24-29:
```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />
```

Para cambiar:
1. Ve a <https://fonts.google.com>, elige tus fuentes.
2. Reemplaza el link con el código que te da Google.
3. Actualiza `--font-display`, `--font-body`, `--font-mono` en `css/tokens.css` líneas 35-37.

### Cambiar espaciados, radios, sombras

Todos viven en `css/tokens.css` en `:root` (líneas 6-123). Cambiar un valor aquí lo propaga a todo el sitio.

### Cambiar el orden de las secciones

Edita `index.html` y mueve los bloques `<section>...</section>`. **Ojo:** actualiza también los eyebrows numéricos (01, 02, 03...) para mantener consistencia visual.

### Cambiar la animación del faction picker

La duración del morphing está en `js/modules/theme.js`:
```js
const MORPH_HALF_MS = 200;
const MORPH_TOTAL_MS = 400;
```

Y la transición CSS en `css/tokens.css` línea 264-272 (`.theme-transitioning`).

---

## 12. Troubleshooting · qué hacer cuando algo se rompe

### El sitio no carga · 404 o pantalla en blanco

1. Verifica que el server está corriendo: `curl http://localhost:8080/`
2. Si no: `python -m http.server 8080` desde la raíz de `Practica1/`
3. Abre la consola del navegador. Si hay error de CORS, es porque abriste con `file://` en vez de `http://`.

### La facción no cambia al hacer click

1. Abre la consola y busca errores.
2. Verifica que `js/modules/theme.js` está siendo cargado.
3. Limpia `localStorage`: en DevTools → Application → Local Storage → Clear.

### El cambio de idioma no funciona

1. Verifica que los archivos `i18n.es.json` y `i18n.en.json` no tienen errores de sintaxis JSON.
2. Abre la consola: si ves "i18n failed to initialize", hay un error en uno de los archivos.

### Un proyecto no aparece

1. Verifica que el `id` del proyecto en `data/projects.json` coincide con la clave en `data/projects.i18n.json`.
2. Si el `id` tiene caracteres especiales (tildes, espacios), corrígelos. El `id` debe ser kebab-case.

### El modal de proyecto no abre al hacer click

1. Abre la consola y busca errores.
2. Verifica que el proyecto tiene `details` en su archivo i18n (sin `details`, el modal no se abre).

### El blog no carga un post

1. Verifica que el slug en `data/posts/posts.json` coincide con el nombre del archivo en `data/posts/<slug>.json`.
2. Si el JSON tiene comillas mal escapadas, `JSON.parse` falla y el post no carga. Pega el JSON en <https://jsonlint.com> para validarlo.

### El service worker no se actualiza

1. En DevTools → Application → Service Workers → "Unregister" + "Update".
2. O en la consola: `navigator.serviceWorker.getRegistrations().then(rs => rs.forEach(r => r.unregister()))`.
3. Cambia `CACHE_VERSION` en `sw.js` línea 6.

### Los íconos de la nav no se ven bien en una facción

El icono del sol/luna del viejo sistema de tema se quitó. Si quieres volver a un toggle binario, necesitas:
1. Agregar un `<button class="js-theme-toggle">` en `index.html`.
2. Revertir `js/modules/theme.js` a un toggle simple.
3. Quitar el `<details class="faction-picker">` completo.

(Esto es destructivo, perderías las 4 facciones. Mejor ajustarlas en `css/tokens.css`.)

### El cover de un proyecto se ve mal

1. Si usaste `cover-placeholder.mjs`, puedes regenerarlo:
   ```bash
   node scripts/cover-placeholder.mjs ./assets/project-covers/mi-proyecto.png "Título" "#color"
   ```
2. Si quieres un cover real, captura el proyecto deployado con `playwright-cli screenshot`.

### HMR / Live reload no funciona

El sitio no tiene HMR. Para ver cambios:
1. Recarga la página manualmente (`Ctrl+R` o `F5`).
2. Si es CSS: hard reload (`Ctrl+Shift+R`).
3. Si es JS: hard reload para que se recargue el módulo.
4. Si tocaste JSON: hard reload.

### Los tests de Playwright fallan

1. Verifica que el server está corriendo (`curl http://localhost:8080/`).
2. Verifica que el SW no está sirviendo versiones cacheadas (límpialo).
3. Si un screenshot se ve mal, regenera con `playwright-cli screenshot --filename=...`.

---

## 13. Apéndice · referencia rápida

### Comandos más usados

```bash
# Levantar el servidor local
cd "C:/Users/Ann Palestina/Desktop/PRACTICAS/Practica1"
python -m http.server 8080

# Crear un post
node scripts/new-post.mjs "Título del post"

# Crear un proyecto
node scripts/new-project.mjs

# Generar cover placeholder
node scripts/cover-placeholder.mjs ./assets/project-covers/foo.png "Mi Proyecto" "#a78bfa"

# Validar JSON
node -e "JSON.parse(require('fs').readFileSync('data/projects.json'))"

# Levantar Playwright para tests visuales
playwright-cli open http://localhost:8080/
```

### Estructura de un post (referencia)

```json
{
  "slug": "mi-post",
  "date": "2026-06-15",
  "title": { "es": "...", "en": "..." },
  "excerpt": { "es": "...", "en": "..." },
  "tags": ["tag1", "tag2"],
  "body": "Markdown aquí..."
}
```

### Estructura de un proyecto (referencia)

`data/projects.json`:
```json
{
  "id": "mi-proyecto",
  "category": "fullstack",
  "tags": ["Python", "Django"],
  "iconSvg": "<svg ...>...</svg>",
  "cover": "./assets/project-covers/mi-proyecto.png",
  "repoUrl": "https://github.com/usuario/repo",
  "liveUrl": "https://mi-proyecto.com",
  "stars": 0,
  "commits": 12
}
```

`data/projects.i18n.json` (ES):
```json
{
  "mi-proyecto": {
    "title": "Título",
    "description": "Descripción corta",
    "details": {
      "role": "Full-stack developer",
      "year": 2026,
      "duration": "3 meses",
      "techStack": [
        { "name": "Python", "version": "3.10+" },
        { "name": "Django", "version": "5.x" }
      ],
      "challenges": ["Reto 1", "Reto 2"],
      "learned": ["Aprendizaje 1", "Aprendizaje 2"]
    }
  }
}
```

### Estructura de una entrada de educación (referencia)

`data/education.json`:
```json
{
  "id": "mi-uni",
  "type": "degree",
  "period": "2024 — En curso",
  "title": "Ingeniería en Sistemas",
  "institution": "Universidad X",
  "description": "Descripción opcional"
}
```

`data/education.i18n.json` (opcional, solo si `period` se traduce):
```json
{
  "mi-uni": {
    "period": "2024 — Ongoing"
  }
}
```

### Estructura de un grupo de skills (referencia)

```json
{
  "id": "lenguajes",
  "title": "Lenguajes y Tecnologías",
  "items": [
    { "name": "Python" },
    { "name": "JavaScript", "meta": "· ES6+" }
  ]
}
```

### Atajos de teclado en el navegador (DevTools)

| Atajo | Acción |
|---|---|
| `F12` | Abrir/cerrar DevTools |
| `Ctrl+Shift+R` | Hard reload (ignora cache) |
| `Ctrl+Shift+C` | Inspeccionar elemento |
| `Ctrl+Shift+I` | Inspeccionar (alternativo) |
| `Ctrl+Shift+J` | Abrir consola |
| `Ctrl+Shift+Delete` | Limpiar datos de navegación |

### Variables CSS más usadas (tokens)

| Token | Valor (Liminal) | Qué cambia |
|---|---|---|
| `--color-bg-base` | `#0a0a14` | Fondo del body |
| `--color-bg-elevated` | `#12121f` | Fondo de cards/modals |
| `--color-text-primary` | `#f4f4f5` | Color de texto principal |
| `--color-text-secondary` | `#a1a1aa` | Color de texto secundario |
| `--color-accent-violet` | `#a78bfa` | Acento primario (variable por facción) |
| `--color-accent-cyan` | `#22d3ee` | Acento secundario (variable por facción) |
| `--color-gradient` | `linear-gradient(...)` | Gradient principal (botones, monograma) |
| `--space-3` | `0.75rem` | Espaciado base 4px |
| `--radius-md` | `0.75rem` | Radio de bordes medio |
| `--shadow-glow` | `0 0 32px ...` | Sombra brillante |
| `--duration-base` | `300ms` | Duración de animaciones |
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Curva de easing |

Lista completa en `css/tokens.css` líneas 6-123.

### Checklist para un cambio completo (post + proyecto)

- [ ] Levantar server local: `python -m http.server 8080`
- [ ] Crear contenido con el CLI correspondiente
- [ ] Editar el archivo generado (Markdown para post, JSON i18n para proyecto)
- [ ] Verificar en el navegador: <http://localhost:8080/>
- [ ] Probar en otra facción (cambiar tema)
- [ ] Probar en otro idioma (toggle EN)
- [ ] Probar responsive (DevTools, mobile/tablet/desktop)
- [ ] Verificar consola: 0 errors, 0 warnings
- [ ] `git add` + `git commit` con mensaje descriptivo
- [ ] `git push` (si está deployado en GitHub Pages)

---

## ¿Necesitas más ayuda?

- **Documentación de MDN** (HTML/CSS/JS): <https://developer.mozilla.org>
- **Documentación de marked.js** (Markdown renderer): <https://marked.js.org>
- **Documentación de DOMPurify** (sanitizador): <https://github.com/cure53/DOMPurify>
- **Shields.io** (badges): <https://shields.io>
- **Playwright** (screenshots/tests): <https://playwright.dev>

Si tienes un problema que no está en este manual, guarda los pasos para reproducirlo y crea una issue en tu repo de GitHub (o una nota en `design-explorations/`).
