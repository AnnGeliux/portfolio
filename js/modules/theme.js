/* PORTFOLIO · theme.js
   Faction picker — 4 temas narrativos (Liminal, Arcadia, Ember, Void).
   Reemplaza al antiguo toggle binario dark/light.

   Persistencia: localStorage bajo la clave "faction". El pre-paint script
   en index.html lee esa clave antes del primer render para evitar FOUC.

   El morphing del monograma se hace en 2 fases temporales:
     0ms     →  add .is-faction-changing al .site-nav
                (CSS expande el cuadrito AP de 2.25rem a 11rem, 400ms)
     200ms   →  swap data-theme en <html> (mitad de la animación)
     400ms   →  remove .is-faction-changing (vuelve al tamaño normal)
   El resto del sitio recibe una transición CSS de 200ms por la clase
   .theme-transitioning (definida en tokens.css) para suavizar el swap. */

const STORAGE_KEY = 'faction';
const VALID_FACTIONS = ['liminal', 'arcadia', 'ember', 'void'];
const MORPH_HALF_MS = 200;
const MORPH_TOTAL_MS = 400;
const TRANSITION_MS = 200;

export default function initFactionPicker({ defaultFaction = 'liminal' } = {}) {
    const root = document.documentElement;
    const picker = document.getElementById('faction-picker');
    const nav = document.querySelector('.site-nav');

    if (!picker || !nav) return;

    const buttons = picker.querySelectorAll('[data-faction]');
    const nameEl = picker.querySelector('[data-faction-name]');
    const swatchEl = picker.querySelector('[data-faction-swatch]');

    // Gradients por facción para el swatch del summary y los dots del menú
    // (los dots del menú ya tienen su propio CSS con [data-faction-dot]).
    const GRADIENTS = {
        liminal: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%)',
        arcadia: 'linear-gradient(135deg, #0891b2 0%, #10b981 100%)',
        ember:   'linear-gradient(135deg, #f97316 0%, #fbbf24 100%)',
        void:    'linear-gradient(135deg, #d946ef 0%, #84cc16 100%)',
    };

    const FACTION_NAMES = {
        liminal: 'Liminal',
        arcadia: 'Arcadia',
        ember:   'Ember',
        void:    'Void',
    };

    const getStored = () => {
        try {
            const v = localStorage.getItem(STORAGE_KEY);
            return VALID_FACTIONS.includes(v) ? v : null;
        } catch (e) { return null; }
    };

    const setStored = (f) => {
        try { localStorage.setItem(STORAGE_KEY, f); } catch (e) { /* ignore */ }
    };

    const applyStatic = (faction) => {
        root.setAttribute('data-theme', faction);
        if (nameEl) nameEl.textContent = FACTION_NAMES[faction] || faction;
        if (swatchEl) swatchEl.style.background = GRADIENTS[faction] || '';
        // Marca aria-selected en el botón correspondiente
        buttons.forEach((b) => {
            b.setAttribute('aria-selected', String(b.dataset.faction === faction));
        });
    };

    const setFaction = (faction) => {
        if (!VALID_FACTIONS.includes(faction)) return;
        if (root.getAttribute('data-theme') === faction) return; // no-op

        // Fase 1: disparar el morphing (CSS hace la animación visual)
        nav.classList.add('is-faction-changing');
        root.classList.add('theme-transitioning');

        // Fase 2: a la mitad del morphing, swap de data-theme
        window.setTimeout(() => {
            applyStatic(faction);
            setStored(faction);
        }, MORPH_HALF_MS);

        // Fase 3: cleanup al final del morphing y de la transición
        window.setTimeout(() => {
            nav.classList.remove('is-faction-changing');
            root.classList.remove('theme-transitioning');
        }, MORPH_TOTAL_MS);
    };

    // Estado inicial: el pre-paint script ya aplicó el data-theme, pero
    // sincronizamos el UI (label del summary + swatch + aria-selected).
    const initial = getStored() || defaultFaction;
    applyStatic(initial);

    // Listeners: cada botón del menú cambia de facción y cierra el details
    buttons.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const faction = btn.dataset.faction;
            setFaction(faction);
            // Cerrar el dropdown después de iniciar la animación
            window.setTimeout(() => { picker.open = false; }, 50);
        });
    });
}
