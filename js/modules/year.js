/* PORTFOLIO · year.js
   Inyecta el año actual en #year del footer. */

export default function initYear({ selector = '#year' } = {}) {
    const el = document.querySelector(selector);
    if (el) {
        el.textContent = new Date().getFullYear();
    }
}
