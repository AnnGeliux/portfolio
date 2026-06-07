/* PORTFOLIO · reveal.js
   IntersectionObserver que añade .is-visible a [data-reveal].
   Port EXACTO del comportamiento original: WeakMap para stagger por parent,
   branch de prefers-reduced-motion con marcado instantáneo, unobserve tras
   primera intersección. CRÍTICO: NO convertir parentCounters a global. */

export default function initReveal({
    selector = '[data-reveal]',
    staggerStep = 60,
    staggerMax = 6,
    threshold = 0.12,
    rootMargin = '0px 0px -8% 0px',
    visibleClass = 'is-visible',
} = {}) {
    const revealEls = document.querySelectorAll(selector);
    if (!revealEls.length) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion || !('IntersectionObserver' in window)) {
        // Sin animación: mostrar todo de inmediato
        revealEls.forEach((el) => el.classList.add(visibleClass));
        return;
    }

    // Pequeño escalonado para grupos cercanos (proyectos, skills)
    const parentCounters = new WeakMap();

    revealEls.forEach((el) => {
        const parent = el.parentElement;
        const index = parentCounters.get(parent) ?? 0;
        parentCounters.set(parent, index + 1);
        if (index > 0) {
            el.style.setProperty('--reveal-delay', `${Math.min(index, staggerMax) * staggerStep}ms`);
        }
    });

    const revealObserver = new IntersectionObserver(
        (entries, observer) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(visibleClass);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold, rootMargin }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
}
