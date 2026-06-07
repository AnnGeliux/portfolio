/* PORTFOLIO · navClose.js
   Cierra los <details> de la nav (menú móvil + faction picker) cuando
   se hace click en un link de navegación, o cuando se hace click fuera
   del componente. */

export default function initNavClose({
    menuSelector = '.site-nav__menu',
    pickerSelector = '#faction-picker',
    linkSelector = '[data-nav-link]',
} = {}) {
    const menu = document.querySelector(menuSelector);
    const picker = document.querySelector(pickerSelector);

    // 1) Cerrar el menú móvil al hacer click en un link de navegación
    if (menu) {
        const links = document.querySelectorAll(linkSelector);
        links.forEach((link) => {
            link.addEventListener('click', () => {
                if (menu.open) menu.open = false;
            });
        });
    }

    // 2) Cerrar el faction picker (y el menú móvil) al hacer click fuera
    const closeAll = (e) => {
        if (picker && picker.open && !picker.contains(e.target)) {
            picker.open = false;
        }
        if (menu && menu.open && !menu.contains(e.target)) {
            menu.open = false;
        }
    };

    document.addEventListener('click', closeAll);
}
