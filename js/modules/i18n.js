/* PORTFOLIO · i18n.js
   Carga diccionarios ES/EN, aplica [data-i18n] al DOM, dispara
   'langchange' para que proyectos/educación se re-rendericen.
   Estructura:
   - data/i18n.{lang}.json         → strings estáticos de UI
   - data/projects.i18n.{lang}.json → items de proyectos (clave = id)
   - data/education.i18n.{lang}.json → items de educación (clave = id) */

const LANG_EVENT = 'langchange';
const DEFAULT_LANG = 'es';
const SUPPORTED = ['es', 'en'];

function detectInitialLang(storageKey) {
    const stored = localStorage.getItem(storageKey);
    if (SUPPORTED.includes(stored)) return stored;
    const nav = (navigator.language || 'es').toLowerCase();
    if (nav.startsWith('en')) return 'en';
    if (nav.startsWith('es')) return 'es';
    return DEFAULT_LANG;
}

async function fetchJSON(path) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`fetch ${path} failed: ${res.status}`);
    return res.json();
}

function applyStaticTranslations(dict) {
    // textContent
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        const value = dict[key];
        if (typeof value === 'string') {
            // Soporte para {year} interpolation
            el.textContent = value.replace('{year}', new Date().getFullYear());
        }
    });

    // HTML (párrafos con markup — perfil body)
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
        const key = el.getAttribute('data-i18n-html');
        const value = dict[key];
        if (typeof value === 'string') {
            el.innerHTML = value.replace('{year}', new Date().getFullYear());
        }
    });

    // Atributos (aria-label, title, etc.)
    document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
        const spec = el.getAttribute('data-i18n-attr');
        const [attr, key] = spec.split(':');
        const value = dict[key];
        if (attr && value) el.setAttribute(attr, value);
    });
}

export default async function initI18n({
    storageKey = 'portfolio-lang',
    basePath = '../../data',
} = {}) {
    let currentLang = detectInitialLang(storageKey);
    const cache = { ui: {}, projects: {}, education: {} };

    async function loadLang(lang) {
        const [ui, projects, education] = await Promise.all([
            fetchJSON(`${basePath}/i18n.${lang}.json`),
            fetchJSON(`${basePath}/projects.i18n.${lang}.json`),
            fetchJSON(`${basePath}/education.i18n.${lang}.json`),
        ]);
        cache.ui[lang] = ui;
        cache.projects[lang] = projects;
        cache.education[lang] = education;
    }

    // Carga inicial
    await loadLang(currentLang);
    document.documentElement.lang = currentLang === 'en' ? 'en' : 'es-MX';
    applyStaticTranslations(cache.ui[currentLang]);

    async function setLang(newLang) {
        if (!SUPPORTED.includes(newLang) || newLang === currentLang) return;
        if (!cache.ui[newLang]) await loadLang(newLang);

        currentLang = newLang;
        localStorage.setItem(storageKey, newLang);
        document.documentElement.lang = newLang === 'en' ? 'en' : 'es-MX';
        applyStaticTranslations(cache.ui[newLang]);

        document.dispatchEvent(
            new CustomEvent(LANG_EVENT, {
                detail: {
                    lang: newLang,
                    projects: cache.projects[newLang],
                    education: cache.education[newLang],
                },
            })
        );
    }

    // Wire del botón de idioma
    const langBtn = document.querySelector('.js-lang-toggle');
    if (langBtn) {
        langBtn.addEventListener('click', () => {
            const next = currentLang === 'es' ? 'en' : 'es';
            setLang(next);
        });
    }

    return {
        getLang: () => currentLang,
        getProjects: () => cache.projects[currentLang],
        getEducation: () => cache.education[currentLang],
        setLang,
    };
}
