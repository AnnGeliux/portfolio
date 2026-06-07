/* PORTFOLIO · sw.js
   Service Worker mínimo (H.5 · PWA).
   Estrategia: cache-first para assets estáticos (CSS, JS, JSON, imágenes).
   Para index.html: network-first con fallback a cache.
   Bumpear CACHE_VERSION cuando cambien assets para forzar refresh. */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `portfolio-static-${CACHE_VERSION}`;
const HTML_CACHE = `portfolio-html-${CACHE_VERSION}`;

const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './sitemap.xml',
    './robots.txt',
    './css/style.css',
    './css/tokens.css',
    './css/base.css',
    './css/layout.css',
    './css/components.css',
    './css/utilities.css',
    './css/responsive.css',
    './js/main.js',
    './js/modules/year.js',
    './js/modules/scrollSpy.js',
    './js/modules/reveal.js',
    './js/modules/navClose.js',
    './js/modules/site.js',
    './js/modules/projects.js',
    './js/modules/education.js',
    './js/modules/skills.js',
    './js/modules/currently.js',
    './js/modules/posts.js',
    './js/modules/projectModal.js',
    './js/modules/theme.js',
    './js/modules/i18n.js',
    './js/modules/filters.js',
    './js/modules/cv.js',
    './js/modules/stars.js',
    './data/site.json',
    './data/projects.json',
    './data/projects.i18n.es.json',
    './data/projects.i18n.en.json',
    './data/education.json',
    './data/education.i18n.es.json',
    './data/education.i18n.en.json',
    './data/skills.json',
    './data/currently.json',
    './data/posts/posts.json',
    './data/posts/2026-06-porque-deje-n8n.json',
    './data/i18n.es.json',
    './data/i18n.en.json',
    './assets/fotoPerfil.jpeg',
    './assets/favicon.svg',
    './assets/og-image.png',
    './assets/CV-Angel-Palestina.pdf',
    './assets/project-covers/sistema-gestor-lecturas.png',
    './assets/project-covers/challenge-amigo-secreto.png',
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((k) => k !== STATIC_CACHE && k !== HTML_CACHE)
                    .map((k) => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;

    // Solo GET
    if (req.method !== 'GET') return;

    const url = new URL(req.url);

    // Solo mismo origen (no CDN de marked/DOMPurify/Google Fonts)
    if (url.origin !== self.location.origin) return;

    // HTML: network-first con fallback a cache
    if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(HTML_CACHE).then((c) => c.put(req, copy));
                    return res;
                })
                .catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
        );
        return;
    }

    // Todo lo demás: cache-first
    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) return cached;
            return fetch(req).then((res) => {
                if (!res.ok) return res;
                const copy = res.clone();
                caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
                return res;
            });
        })
    );
});
