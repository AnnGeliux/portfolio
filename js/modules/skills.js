/* PORTFOLIO · skills.js
   Carga data/skills.json y renderiza grupos de chips en #skills-list. */

export default async function skills() {
    const list = document.getElementById('skills-list');
    if (!list) return;

    const res = await fetch('./data/skills.json');
    if (!res.ok) throw new Error(`skills.json fetch failed: ${res.status}`);
    const groups = await res.json();

    groups.forEach((group) => {
        const li = document.createElement('li');
        const classes = ['skill-group', 'card', 'card--glass'];
        if (group.wide === true) classes.push('skill-group--wide');
        li.className = classes.join(' ');
        li.setAttribute('data-reveal', '');

        const title = document.createElement('h3');
        title.className = 'skill-group__title';
        title.textContent = group.title;

        const chips = document.createElement('ul');
        chips.className = 'skill-group__chips';
        chips.setAttribute('role', 'list');

        group.items.forEach((item) => {
            const chip = document.createElement('li');
            chip.className = 'chip';
            chip.appendChild(document.createTextNode(item.name + ' '));
            if (item.meta) {
                const meta = document.createElement('span');
                meta.className = 'chip__meta';
                meta.textContent = item.meta;
                chip.appendChild(meta);
            }
            chips.appendChild(chip);
        });

        li.append(title, chips);
        list.appendChild(li);
    });
}
