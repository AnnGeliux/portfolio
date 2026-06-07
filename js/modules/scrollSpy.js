/* PORTFOLIO · scrollSpy.js
   Marca .is-active en el link cuyo href coincide con la sección visible.
   Port de líneas 19–42 del script.js original. */

export default function initScrollSpy({
    navSelector = '[data-nav-link]',
    sectionSelector = 'main section[id]',
    rootMargin = '-45% 0px -45% 0px',
    activeClass = 'is-active',
} = {}) {
    const navLinks = document.querySelectorAll(navSelector);
    const sections = document.querySelectorAll(sectionSelector);

    if (!navLinks.length || !sections.length) return;
    if (!('IntersectionObserver' in window)) return;

    const setActive = (id) => {
        navLinks.forEach((link) => {
            const isActive = link.getAttribute('href') === '#' + id;
            link.classList.toggle(activeClass, isActive);
        });
    };

    const navObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActive(entry.target.id);
                }
            });
        },
        { rootMargin, threshold: 0 }
    );

    sections.forEach((section) => navObserver.observe(section));
}
