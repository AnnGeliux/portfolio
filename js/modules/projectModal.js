/* PORTFOLIO · projectModal.js
   Modal <dialog> nativo que muestra los details extendidos de un proyecto:
   role, year, duration, techStack[], challenges[], learned[], links.

   API:
   - openProjectModal(projectId)  → abre el modal con los datos del proyecto
   - closeProjectModal()          → cierra si está abierto
   - initProjectModal({ i18n })   → wire inicial (se llama desde main.js) */

let dialog = null;
let lastOpenedId = null;
let i18nInstance = null;

const I18N_KEYS = {
    role:        { es: 'Rol',           en: 'Role' },
    year:        { es: 'Año',           en: 'Year' },
    duration:    { es: 'Duración',      en: 'Duration' },
    techStack:   { es: 'Stack técnico', en: 'Tech stack' },
    challenges:  { es: 'Retos',         en: 'Challenges' },
    learned:     { es: 'Aprendizajes',  en: 'What I learned' },
    closeAria:   { es: 'Cerrar',        en: 'Close' },
    liveDemo:    { es: 'Ver demo',      en: 'View live demo' },
    sourceCode:  { es: 'Ver código',    en: 'View source' },
};

function t(key, lang) {
    return (I18N_KEYS[key] && I18N_KEYS[key][lang]) || key;
}

function buildModalHTML(project, translated, lang) {
    const { title, description, details = {} } = translated;
    const { role, year, duration, techStack = [], challenges = [], learned = [] } = details;

    const meta = [];
    if (role) meta.push(`<span><strong>${t('role', lang)}:</strong> ${role}</span>`);
    if (year) meta.push(`<span><strong>${t('year', lang)}:</strong> ${year}</span>`);
    if (duration) meta.push(`<span><strong>${t('duration', lang)}:</strong> ${duration}</span>`);

    const techItems = techStack.map((t) =>
        `<li class="project-modal__tech"><strong>${t.name}</strong>${t.version ? ` <span class="project-modal__tech-ver">${t.version}</span>` : ''}</li>`
    ).join('');

    const challengeItems = challenges.map((c) => `<li>${c}</li>`).join('');
    const learnedItems = learned.map((l) => `<li>${l}</li>`).join('');

    const links = [];
    if (project.liveUrl) links.push(`<a href="${project.liveUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--primary">${t('liveDemo', lang)}</a>`);
    if (project.repoUrl) links.push(`<a href="${project.repoUrl}" target="_blank" rel="noopener noreferrer" class="btn btn--ghost">${t('sourceCode', lang)}</a>`);

    return `
        <article class="project-modal__inner">
            <button type="button" class="project-modal__close" data-modal-close aria-label="${t('closeAria', lang)}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <header class="project-modal__header">
                <h2 class="project-modal__title">${title}</h2>
                <p class="project-modal__description">${description}</p>
            </header>
            ${meta.length > 0 ? `<div class="project-modal__meta">${meta.join('')}</div>` : ''}
            ${techItems ? `
                <section class="project-modal__section">
                    <h3>${t('techStack', lang)}</h3>
                    <ul class="project-modal__tech-list" role="list">${techItems}</ul>
                </section>
            ` : ''}
            ${challengeItems ? `
                <section class="project-modal__section">
                    <h3>${t('challenges', lang)}</h3>
                    <ul class="project-modal__list" role="list">${challengeItems}</ul>
                </section>
            ` : ''}
            ${learnedItems ? `
                <section class="project-modal__section">
                    <h3>${t('learned', lang)}</h3>
                    <ul class="project-modal__list" role="list">${learnedItems}</ul>
                </section>
            ` : ''}
            ${links.length > 0 ? `<footer class="project-modal__footer">${links.join('')}</footer>` : ''}
        </article>
    `;
}

async function fetchProjectAndTranslated(id) {
    const lang = i18nInstance?.getLang?.() || 'es';
    const [projectRes, i18nRes] = await Promise.all([
        fetch('./data/projects.json'),
        fetch(`./data/projects.i18n.${lang}.json`),
    ]);
    if (!projectRes.ok) throw new Error('projects.json fetch failed');
    if (!i18nRes.ok) throw new Error('projects i18n fetch failed');
    const projects = await projectRes.json();
    const i18nMap = await i18nRes.json();
    const project = projects.find((p) => p.id === id);
    const translated = i18nMap[id] || {};
    return { project, translated, lang };
}

async function openProjectModal(projectId) {
    if (!dialog) {
        dialog = document.getElementById('project-modal');
        if (!dialog) {
            console.warn('project-modal <dialog> not found in DOM');
            return;
        }
        // Cerrar al hacer click en el backdrop
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.close();
        });
        // Cerrar con el botón interno
        dialog.addEventListener('click', (e) => {
            const closer = e.target.closest('[data-modal-close]');
            if (closer) dialog.close();
        });
    }

    lastOpenedId = projectId;
    dialog.dataset.projectId = projectId;

    try {
        const { project, translated, lang } = await fetchProjectAndTranslated(projectId);
        if (!project) return;
        dialog.innerHTML = buildModalHTML(project, translated, lang);
        if (!dialog.open) dialog.showModal();
    } catch (err) {
        console.error('openProjectModal failed:', err);
    }
}

function closeProjectModal() {
    if (dialog && dialog.open) dialog.close();
}

export { openProjectModal, closeProjectModal };

// Wire del langchange para re-renderizar si el modal está abierto
export function initProjectModal({ i18n } = {}) {
    i18nInstance = i18n;
    document.addEventListener('langchange', () => {
        if (dialog && dialog.open && lastOpenedId) {
            openProjectModal(lastOpenedId);
        }
    });
}
