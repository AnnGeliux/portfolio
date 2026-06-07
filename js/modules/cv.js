/* PORTFOLIO · cv.js
   Hook de tracking para descargas de CV.
   La descarga real la hace el atributo `download` del <a class="js-cv-download">.
   Este módulo queda como punto de extensión para analítica futura. */

export default function initCv({
    selector = '.js-cv-download',
    filenameAttr = 'download',
} = {}) {
    const links = document.querySelectorAll(selector);
    if (!links.length) return;

    links.forEach((link) => {
        link.addEventListener('click', () => {
            const filename = link.getAttribute(filenameAttr) || 'cv.pdf';
            // Hook analítica (placeholder — no romper si window.dataLayer no existe)
            if (typeof window !== 'undefined' && window.dataLayer) {
                window.dataLayer.push({
                    event: 'cv_download',
                    cv_filename: filename,
                });
            }
        });
    });
}
