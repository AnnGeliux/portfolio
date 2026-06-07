/* PORTFOLIO · stars.js
   Genera las estrellas estáticas de fondo y orquesta las estrellas fugaces.

   Características:
   - Estrellas estáticas con tamaño, posición y animación aleatorios.
     El color viene del token --star-color de la facción activa (tokens.css).
   - Estrellas fugaces con duración, longitud, grosor, ángulo y posición
     aleatorios (cada una es única).
   - Accesibilidad: respeta prefers-reduced-motion; pausa con visibilitychange.

   API:
   - initStars()                  → crea N estrellas en #bg-stars
   - initShootingStars()          → lanza fugaces aleatorias
*/

const STAR_COUNT = 120;

/* Distribución de tamaños: 70% chicas, 25% medianas, 5% grandes. */
function pickSize() {
    const r = Math.random();
    if (r < 0.7) return 's--sm';
    if (r < 0.95) return 's--md';
    return 's--lg';
}

/* Construye un <span> estrella con posición, tamaño y animación aleatorios.
   El color lo provee el CSS via --star-color (varía por facción). */
function buildStar() {
    const star = document.createElement('span');
    star.className = `star ${pickSize()}`;
    star.style.setProperty('--x', `${Math.random() * 100}%`);
    star.style.setProperty('--y', `${Math.random() * 100}%`);
    star.style.setProperty(
        '--twinkle-dur',
        `${(3 + Math.random() * 4).toFixed(2)}s`
    );
    star.style.setProperty(
        '--twinkle-delay',
        `${(-Math.random() * 6).toFixed(2)}s`
    );
    return star;
}

export function initStars({
    containerSelector = '#bg-stars',
    count = STAR_COUNT,
} = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    // Evita duplicados si se llama dos veces (HMR, re-init, etc.)
    if (container.childElementCount >= count) return;

    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
        frag.appendChild(buildStar());
    }
    container.appendChild(frag);

    // ----- Scheduler de tilt / destello direccional -----
    // Mantiene un máximo del `maxTiltRatio` (25%) de estrellas con la clase
    // .s--tilt a la vez. Cada 1.5–2.5s quita el tilt a una y se lo da a otra
    // aleatoria, así el efecto es continuo y no se siente artificial.
    startTiltScheduler(container, { maxTiltRatio: 0.25 });
}

/* Distribuye la clase .s--tilt entre un porcentaje máximo de estrellas,
   rotando cuál está tilted con un ritmo aleatorio.

   Por qué un scheduler y no determinismo por estrella: si cada estrella
   decidiera con 25% de probabilidad, siempre tendríamos ~25% activas, pero
   el efecto se vería estático. Rotando cada cierto tiempo, la sensación
   es de "estrellas que parpadean con destello" en momentos distintos. */
function startTiltScheduler(container, { maxTiltRatio = 0.25 } = {}) {
    // Respetar reduced-motion: no aplicamos tilt
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) return;

    const stars = Array.from(container.querySelectorAll('.star'));
    if (stars.length === 0) return;

    const maxTilted = Math.max(1, Math.floor(stars.length * maxTiltRatio));
    const tilted = new Set();

    const applyTilt = (star) => {
        // Duración aleatoria del destello entre 1.5s y 2.5s.
        const dur = 1.5 + Math.random() * 1.0;
        star.style.setProperty('--tilt-dur', `${dur.toFixed(2)}s`);
        // Forzar reflow para que la animación se reinicie si la estrella
        // ya tenía la clase (p.ej. cuando se vuelve a seleccionar).
        star.classList.remove('s--tilt');
        // eslint-disable-next-line no-unused-expressions
        star.offsetWidth; // forzar reflow
        star.classList.add('s--tilt');
    };

    const removeTilt = (star) => {
        star.classList.remove('s--tilt');
        // Limpiamos --tilt-dur para que la próxima vez que entre arranque
        // con la duración que el scheduler asigne.
        star.style.removeProperty('--tilt-dur');
    };

    // Asignación inicial: el `maxTilted` estrellas se activan ya con un
    // delay escalonado (0–1.2s) para que no aparezcan todas a la vez.
    const pickRandom = () => stars[Math.floor(Math.random() * stars.length)];
    for (let i = 0; i < maxTilted; i++) {
        const star = pickRandom();
        if (tilted.has(star)) continue;
        tilted.add(star);
        setTimeout(() => applyTilt(star), Math.random() * 1200);
    }

    // Rotación: cada 1.5–2.5s sustituimos una estrella tilted por otra.
    let intervalId = null;
    const rotate = () => {
        // 1) Quitar tilt a una de las que están activas.
        const current = Array.from(tilted);
        if (current.length > 0) {
            const victim = current[Math.floor(Math.random() * current.length)];
            removeTilt(victim);
            tilted.delete(victim);
        }
        // 2) Añadir tilt a una nueva que no esté activa.
        for (let tries = 0; tries < 20; tries++) {
            const candidate = pickRandom();
            if (!tilted.has(candidate)) {
                tilted.add(candidate);
                applyTilt(candidate);
                break;
            }
        }
    };

    const tick = () => {
        rotate();
        intervalId = setTimeout(tick, 1500 + Math.random() * 1000);
    };
    intervalId = setTimeout(tick, 1500 + Math.random() * 1000);

    // Pausar con la pestaña oculta
    const onVisibility = () => {
        if (document.hidden) {
            if (intervalId) clearTimeout(intervalId);
            intervalId = null;
        } else if (!intervalId) {
            tick();
        }
    };
    document.addEventListener('visibilitychange', onVisibility);
}

/* Lanza una estrella fugaz con todos sus parámetros aleatorios:
   - duration:        0.7s – 2.5s  (lenta ↔ rápida)
   - length:          50px – 220px (corta ↔ larga)
   - thickness:       1px – 3px    (fina ↔ gruesa)
   - angle:           185° – 225°  (casi horizontal izquierda ↔ 45° diagonal)
   - startX:          -10% a 105%  (cualquier punto del ancho)
   - startY:          -10% a 25%   (parte superior, asomando un poco)
   - delay:           cuándo aparece (lo gestiona el scheduler)

   Con transform-origin en left center y un gradiente cola→cabeza
   (transparente→opaco), rotar entre 185° y 225° deja la cabeza brillante
   apuntando hacia abajo-izquierda, liderando el movimiento de la
   traslación (translateX(-120vw), translateY(60vh)). */
function spawnShootingStar(container) {
    const star = document.createElement('span');
    star.className = 'shooting-star';

    const startX = -10 + Math.random() * 115; // cubre todo el ancho
    const startY = -10 + Math.random() * 35;  // asoma desde arriba
    const length = 50 + Math.random() * 170;
    const thickness = 1 + Math.random() * 2; // 1–3px
    const duration = 0.7 + Math.random() * 1.8;
    // 185° = casi horizontal apuntando a la izquierda (cola ligeramente arriba)
    // 225° = 45° diagonal, cabeza firme hacia abajo-izquierda
    const angle = 185 + Math.random() * 40;

    star.style.setProperty('--start-x', `${startX.toFixed(1)}%`);
    star.style.setProperty('--start-y', `${startY.toFixed(1)}%`);
    star.style.setProperty('--length', `${length.toFixed(0)}px`);
    star.style.setProperty('--thickness', `${thickness.toFixed(1)}px`);
    star.style.setProperty('--shoot-dur', `${duration.toFixed(2)}s`);
    star.style.setProperty('--shoot-angle', `${angle.toFixed(1)}deg`);

    container.appendChild(star);

    // Limpieza al terminar la animación. Fallback por si animationend no dispara
    // (p.ej. si el usuario cambia reduced-motion en medio de la animación).
    const cleanup = () => {
        if (star.parentNode) star.parentNode.removeChild(star);
    };
    star.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, (duration + 0.2) * 1000);
}

export function initShootingStars({
    containerSelector = '#bg-shooting-stars',
    minDelay = 2500,   // más frecuente que antes (5s → 2.5s)
    maxDelay = 9000,
    chanceOfBurst = 0.15, // 15% de las veces sale un par con offset
} = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) return () => {};

    // Respetar reduced-motion: no generamos fugaces
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) return () => {};

    let timeoutId = null;
    let stopped = false;

    const fire = () => {
        spawnShootingStar(container);
        // Ocasionalmente lanzar una segunda fugaz con un pequeño offset
        // (efecto "lluvia de meteoritos" muy sutil).
        if (Math.random() < chanceOfBurst) {
            setTimeout(() => spawnShootingStar(container), 200 + Math.random() * 300);
        }
        scheduleNext();
    };

    const scheduleNext = () => {
        if (stopped) return;
        const delay = minDelay + Math.random() * (maxDelay - minDelay);
        timeoutId = setTimeout(fire, delay);
    };

    // Pausar cuando la pestaña está oculta (ahorra ciclos y batería)
    const onVisibility = () => {
        if (document.hidden) {
            stopped = true;
            if (timeoutId) clearTimeout(timeoutId);
        } else {
            stopped = false;
            scheduleNext();
        }
    };
    document.addEventListener('visibilitychange', onVisibility);

    scheduleNext();

    // Devuelve función de cleanup
    return () => {
        stopped = true;
        if (timeoutId) clearTimeout(timeoutId);
        document.removeEventListener('visibilitychange', onVisibility);
    };
}
