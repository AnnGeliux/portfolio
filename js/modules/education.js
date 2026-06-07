/* PORTFOLIO · education.js
   Carga data/education.json (id, type, icon-asoc, descripción base) y mezcla
   con data/education.i18n.{lang}.json para period traducido.
   Re-renderiza en 'langchange'. */

export default async function education({ i18n } = {}) {
    const list = document.getElementById('education-list');
    if (!list) return;

    const res = await fetch('./data/education.json');
    if (!res.ok) throw new Error(`education.json fetch failed: ${res.status}`);
    const entries = await res.json();

    function render() {
        list.innerHTML = '';
        const translated = i18n?.getEducation?.() ?? {};

        entries.forEach((entry) => {
            const i18nItem = translated[entry.id] ?? {};
            const period = i18nItem.period ?? entry.period;

            const li = document.createElement('li');
            li.className = 'timeline__item card card--glass';
            li.setAttribute('data-reveal', '');

            const node = document.createElement('div');
            node.className = 'timeline__node';
            node.setAttribute('aria-hidden', 'true');

            const content = document.createElement('div');
            content.className = 'timeline__content';

            const periodEl = document.createElement('span');
            periodEl.className = 'timeline__period';
            periodEl.textContent = period;

            const titleEl = document.createElement('h3');
            titleEl.className = 'timeline__title';
            titleEl.textContent = entry.title;

            const institutionEl = document.createElement('p');
            institutionEl.className = 'timeline__institution';
            institutionEl.textContent = entry.institution;

            content.append(periodEl, titleEl, institutionEl);

            if (entry.description && entry.description.trim() !== '') {
                const description = document.createElement('p');
                description.className = 'timeline__description';
                description.textContent = entry.description;
                content.appendChild(description);
            }

            li.append(node, content);
            list.appendChild(li);
        });
    }

    render();

    document.addEventListener('langchange', () => {
        render();
    });
}
