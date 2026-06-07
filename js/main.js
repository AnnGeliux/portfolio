/* PORTFOLIO · main.js
   Entry ES module. Orquesta los 12 módulos.
   Orden de carga:
   1. initI18n()            — resuelve idioma y aplica [data-i18n] al DOM
   2. data render (site, projects, education, skills)
      - projects/education escuchan 'langchange' y se re-renderizan
   3. initYear, initScrollSpy, initReveal, initNavClose
   4. initFactionPicker, initFilters, initCv */

import initYear from './modules/year.js';
import initScrollSpy from './modules/scrollSpy.js';
import initReveal from './modules/reveal.js';
import initNavClose from './modules/navClose.js';
import site from './modules/site.js';
import projects from './modules/projects.js';
import education from './modules/education.js';
import skills from './modules/skills.js';
import currently from './modules/currently.js';
import posts from './modules/posts.js';
import initFactionPicker from './modules/theme.js';
import initI18n from './modules/i18n.js';
import initFilters from './modules/filters.js';
import initCv from './modules/cv.js';
import { initProjectModal } from './modules/projectModal.js';
import { initStars, initShootingStars } from './modules/stars.js';

async function bootstrap() {
    // 1. i18n debe estar listo ANTES de que los módulos de data rendericen,
    //    para que lean el idioma correcto desde la primera pintura.
    let i18n = null;
    try {
        i18n = await initI18n();
    } catch (err) {
        console.error('i18n failed to initialize:', err);
    }

    try {
        // 2. Data render — pasan { i18n } para usar el lang resuelto
        const [s] = await Promise.all([
            site(),
            projects({ i18n }),
            education({ i18n }),
            skills(),
            currently(),
            posts({ i18n }),
        ]);
        s.populateLinks();
    } catch (err) {
        console.error('Data bootstrap failed:', err);
    } finally {
        // 3. Init que no depende de data
        initYear();
        initScrollSpy();
        initReveal();
        initNavClose();

        // 4. Features Fase 2
        initFactionPicker();
        initFilters();
        initCv();
        initProjectModal({ i18n });

        // 5. Fondo decorativo: estrellas estáticas + fugaces
        initStars();
        initShootingStars();

        // 6. Service worker (PWA · H.5)
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('./sw.js')
                .catch((err) => console.warn('SW registration failed:', err));
        }
    }
}

bootstrap();
