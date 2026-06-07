/* PORTFOLIO · currently.js
   Render de la sección "What I'm doing now" (data/currently.json).
   Patrón equivalente a skills.js / projects.js: fetch + render en #currently-list.
   Sin langchange handler — el contenido es agnóstico de idioma. */

export default async function currently() {
    const list = document.getElementById('currently-list');
    if (!list) return;

    let items = [];
    try {
        const res = await fetch('./data/currently.json');
        if (!res.ok) throw new Error(`currently.json fetch failed: ${res.status}`);
        items = await res.json();
    } catch (err) {
        console.warn('currently.json unavailable — section will be empty:', err);
        return;
    }

    list.innerHTML = '';
    items.forEach((item) => {
        const li = document.createElement('li');
        li.className = 'currently__item';

        const arrow = document.createElement('span');
        arrow.className = 'currently__icon';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = item.icon || '→';

        const label = document.createElement('strong');
        label.className = 'currently__label';
        label.textContent = item.label;

        const text = document.createElement('span');
        text.className = 'currently__text';
        text.textContent = item.text;

        li.append(arrow, label, text);
        list.appendChild(li);
    });
}
