/* PORTFOLIO · posts.js
   Render de la sección blog: índice + post individual (con Markdown).
   Usa marked.js + DOMPurify desde CDN para renderizar Markdown sanitizado.
   Hash routing opcional: #/posts/<slug>. */

const MARKED_CDN = 'https://cdn.jsdelivr.net/npm/marked@12.0.2/marked.min.js';
const DOMPURIFY_CDN = 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/dist/purify.min.js';

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if ([...document.scripts].some((s) => s.src === src)) {
            resolve();
            return;
        }
        const s = document.createElement('script');
        s.src = src;
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(s);
    });
}

async function ensureMarkdown() {
    if (window.marked && window.DOMPurify) return;
    try {
        await Promise.all([loadScript(MARKED_CDN), loadScript(DOMPURIFY_CDN)]);
        if (window.marked?.setOptions) {
            window.marked.setOptions({ gfm: true, breaks: false });
        }
    } catch (err) {
        console.warn('Markdown libs failed to load:', err);
    }
}

function formatDate(iso, lang) {
    try {
        return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', {
            year: 'numeric', month: 'long', day: 'numeric',
        });
    } catch (e) { return iso; }
}

function renderIndex(list, posts, lang) {
    list.innerHTML = '';
    posts.forEach((post) => {
        const title = post.title?.[lang] || post.slug;
        const excerpt = post.excerpt?.[lang] || '';

        const li = document.createElement('li');
        li.className = 'post-card';

        const time = document.createElement('time');
        time.className = 'post-card__date';
        time.dateTime = post.date;
        time.textContent = formatDate(post.date, lang);

        const h3 = document.createElement('h3');
        h3.className = 'post-card__title';
        const link = document.createElement('a');
        link.href = `#/posts/${post.slug}`;
        link.textContent = title;
        h3.appendChild(link);

        if (excerpt) {
            const p = document.createElement('p');
            p.className = 'post-card__excerpt';
            p.textContent = excerpt;
            li.append(time, h3, p);
        } else {
            li.append(time, h3);
        }

        if (Array.isArray(post.tags) && post.tags.length > 0) {
            const tags = document.createElement('ul');
            tags.className = 'post-card__tags';
            post.tags.forEach((tag) => {
                const t = document.createElement('li');
                t.className = 'tag';
                t.textContent = tag;
                tags.appendChild(t);
            });
            li.appendChild(tags);
        }

        list.appendChild(li);
    });
}

async function renderSingle(list, slug, lang) {
    list.innerHTML = '<li class="post-loading">Cargando…</li>';
    try {
        const res = await fetch(`./data/posts/${slug}.json`);
        if (!res.ok) throw new Error(`Post not found: ${slug}`);
        const post = await res.json();
        await ensureMarkdown();

        const title = post.title?.[lang] || post.slug;
        const body = post.body || '';
        const html = window.marked ? window.marked.parse(body) : `<pre>${body}</pre>`;
        const safe = window.DOMPurify ? window.DOMPurify.sanitize(html) : html;

        list.innerHTML = `
            <li class="post-full">
                <a href="#/posts" class="post-full__back" data-back>← Volver al blog</a>
                <time class="post-full__date" datetime="${post.date}">${formatDate(post.date, lang)}</time>
                <h2 class="post-full__title">${title}</h2>
                <div class="post-full__body">${safe}</div>
            </li>
        `;
    } catch (err) {
        list.innerHTML = `<li class="post-error">No se pudo cargar el post. <a href="#/posts">Volver al índice</a>.</li>`;
        console.error(err);
    }
}

export default async function posts({ i18n } = {}) {
    const list = document.getElementById('posts-list');
    if (!list) return;

    let index = [];
    try {
        const res = await fetch('./data/posts/posts.json');
        if (!res.ok) throw new Error('posts index fetch failed');
        index = await res.json();
    } catch (err) {
        console.warn('posts.json unavailable — section will be empty:', err);
        return;
    }

    const lang = () => i18n?.getLang?.() || 'es';

    function render() {
        const hash = window.location.hash;
        const m = hash.match(/^#\/posts\/(.+)$/);
        if (m) {
            renderSingle(list, m[1], lang());
        } else {
            renderIndex(list, index, lang());
        }
    }

    render();
    window.addEventListener('hashchange', render);

    document.addEventListener('langchange', () => {
        if (list) render();
    });
}
