/* PORTFOLIO · projects.js
   Carga data/projects.json (categoría, iconSvg, tags, cover, links, stats)
   y mezcla con data/projects.i18n.{lang}.json (title + description + details).
   Re-renderiza en 'langchange'. Expone openProject(id) para el modal. */

import { openProjectModal } from './projectModal.js';

const GITHUB_REPO_RE = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/;

function extractRepoFromUrl(url) {
    if (!url) return null;
    const m = url.match(GITHUB_REPO_RE);
    return m ? { owner: m[1], repo: m[2] } : null;
}

function buildBadges(repoUrl) {
    const repo = extractRepoFromUrl(repoUrl);
    if (!repo) return null;
    const { owner, repo: name } = repo;
    return {
        stars:   `https://img.shields.io/github/stars/${owner}/${name}?style=flat-square&label=stars`,
        commits: `https://img.shields.io/github/last-commit/${owner}/${name}?style=flat-square&label=last+commit`,
        alt: { stars: `${name} stars`, commits: `${name} last commit` },
    };
}

function buildLinks(project) {
    const links = [];
    if (project.repoUrl) {
        links.push({ href: project.repoUrl, label: 'Ver código', icon: 'code' });
    }
    if (project.liveUrl) {
        links.push({ href: project.liveUrl, label: 'Ver demo', icon: 'play' });
    }
    return links;
}

function iconSvg(kind) {
    const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    if (kind === 'code') return `<svg ${common}><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`;
    if (kind === 'play') return `<svg ${common}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    if (kind === 'arrow') return `<svg ${common}><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
    return '';
}

export default async function projects({ i18n } = {}) {
    const list = document.getElementById('projects-list');
    if (!list) return;

    const res = await fetch('./data/projects.json');
    if (!res.ok) throw new Error(`projects.json fetch failed: ${res.status}`);
    const items = await res.json();

    function render() {
        list.innerHTML = '';
        const translated = i18n?.getProjects?.() ?? {};

        items.forEach((project) => {
            const i18nItem = translated[project.id] ?? {};
            const title = i18nItem.title ?? project.id;
            const description = i18nItem.description ?? '';
            const hasDetails = Boolean(i18nItem.details);

            const li = document.createElement('li');
            li.className = 'card card--glass projects__item';
            li.setAttribute('data-reveal', '');
            li.dataset.category = project.category;
            li.dataset.projectId = project.id;
            if (hasDetails) {
                li.setAttribute('role', 'button');
                li.setAttribute('tabindex', '0');
                li.setAttribute('aria-label', `${title} — ver detalles`);
            }

            const iconWrap = document.createElement('div');
            iconWrap.className = 'projects__icon';
            iconWrap.setAttribute('aria-hidden', 'true');
            iconWrap.innerHTML = project.iconSvg;

            const titleEl = document.createElement('h3');
            titleEl.className = 'projects__title';
            titleEl.textContent = title;

            const descEl = document.createElement('p');
            descEl.className = 'projects__description';
            descEl.textContent = description;

            const tags = document.createElement('ul');
            tags.className = 'projects__tags';
            tags.setAttribute('role', 'list');
            project.tags.forEach((tagName) => {
                const tag = document.createElement('li');
                tag.className = 'tag';
                tag.textContent = tagName;
                tags.appendChild(tag);
            });

            // Badges de GitHub (stars + last commit) si hay repoUrl
            const badges = buildBadges(project.repoUrl);
            let badgeRow = null;
            if (badges) {
                badgeRow = document.createElement('div');
                badgeRow.className = 'projects__badges';
                const starsImg = document.createElement('img');
                starsImg.src = badges.stars;
                starsImg.alt = badges.alt.stars;
                starsImg.loading = 'lazy';
                const commitsImg = document.createElement('img');
                commitsImg.src = badges.commits;
                commitsImg.alt = badges.alt.commits;
                commitsImg.loading = 'lazy';
                badgeRow.append(starsImg, commitsImg);
            }

            // Links del proyecto (repo + live) + "Ver detalles" si hay details
            const links = buildLinks(project);
            if (links.length > 0 || hasDetails) {
                const actions = document.createElement('div');
                actions.className = 'projects__actions';

                links.forEach((link) => {
                    const a = document.createElement('a');
                    a.href = link.href;
                    a.target = '_blank';
                    a.rel = 'noopener noreferrer';
                    a.className = 'projects__link';
                    a.innerHTML = `${iconSvg(link.icon)}<span>${link.label}</span>`;
                    actions.appendChild(a);
                });

                if (hasDetails) {
                    const detail = document.createElement('button');
                    detail.type = 'button';
                    detail.className = 'projects__link projects__link--detail';
                    detail.innerHTML = `${iconSvg('arrow')}<span>Ver detalles</span>`;
                    detail.addEventListener('click', (e) => {
                        e.stopPropagation();
                        openProjectModal(project.id);
                    });
                    actions.appendChild(detail);
                }

                li.append(iconWrap, titleEl, descEl, tags);
                if (badgeRow) li.appendChild(badgeRow);
                li.appendChild(actions);
            } else {
                li.append(iconWrap, titleEl, descEl, tags);
                if (badgeRow) li.appendChild(badgeRow);
            }

            // Click en la card abre el modal (si hay details)
            if (hasDetails) {
                const openModal = () => openProjectModal(project.id);
                li.addEventListener('click', openModal);
                li.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openModal();
                    }
                });
            }

            list.appendChild(li);
        });
    }

    render();

    document.addEventListener('langchange', () => {
        render();
        // Si el modal está abierto, re-renderízalo también
        const modal = document.getElementById('project-modal');
        if (modal && modal.open) {
            const id = modal.dataset.projectId;
            if (id) openProjectModal(id);
        }
    });
}
