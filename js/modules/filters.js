/* PORTFOLIO · filters.js
   Filtrado de proyectos por data-category.
   Persiste el filtro actual entre re-renders por cambio de idioma.
   Respeta prefers-reduced-motion (sin animación). */

export default function initFilters({
    barSelector = '.filter-bar',
    listSelector = '#projects-list',
    emptySelector = '.projects__empty',
    activeClass = 'is-active',
    hiddenClass = 'is-hidden',
    leavingClass = 'is-leaving',
} = {}) {
    const bar = document.querySelector(barSelector);
    const list = document.querySelector(listSelector);
    const empty = document.querySelector(emptySelector);

    if (!bar || !list) return;

    let currentFilter = bar.querySelector(`.${activeClass}`)?.dataset.filter ?? 'all';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function applyFilter() {
        const items = list.querySelectorAll('.projects__item');
        let visibleCount = 0;

        items.forEach((item) => {
            const category = item.dataset.category;
            const matches = currentFilter === 'all' || category === currentFilter;

            if (reducedMotion || !item.animate) {
                item.classList.toggle(hiddenClass, !matches);
            } else if (matches) {
                // Mostrar (inverso de leaving)
                item.classList.remove(leavingClass);
                requestAnimationFrame(() => item.classList.remove(hiddenClass));
            } else {
                item.classList.add(leavingClass);
                setTimeout(() => {
                    // Re-check que sigue oculto y que el filtro no cambió
                    if (item.dataset.category !== currentFilter && currentFilter !== 'all') {
                        item.classList.add(hiddenClass);
                    }
                }, 200);
            }

            if (matches) visibleCount += 1;
        });

        if (empty) empty.classList.toggle('is-visible', visibleCount === 0 && items.length > 0);
    }

    bar.addEventListener('click', (e) => {
        const btn = e.target.closest(`.filter-bar__btn`);
        if (!btn) return;

        bar.querySelectorAll(`.${activeClass}`).forEach((b) => b.classList.remove(activeClass));
        btn.classList.add(activeClass);
        currentFilter = btn.dataset.filter;
        applyFilter();
    });

    // Re-aplicar después de un re-render por cambio de idioma
    document.addEventListener('langchange', () => {
        // Pequeño defer para que el DOM esté repintado
        setTimeout(applyFilter, 0);
    });

    // Estado inicial
    applyFilter();

    // Exponer para uso externo (tests, etc.)
    return {
        refresh: applyFilter,
        getCurrent: () => currentFilter,
    };
}
