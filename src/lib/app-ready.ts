/**
 * Contrato único para retirar el overlay de arranque (`.app-loader`) — Task 2
 * del plan flujo-web-integral, revisado por el fix B (2026-09-30).
 *
 * El overlay se retira cuando el CONTENIDO REAL está pintado. La señal canónica
 * es el texto del gooey (el span del gooey es el elemento LCP del home): sale de
 * `GooeyText` en cuanto inyecta su texto, NO del primer frame compuesto. Aquel
 * doble rAF de `Layout.astro` retiraba el overlay antes de que hubiera contenido
 * y dejaba una ventana oscura vacía de ~2.6s (veredicto del fix C).
 *
 * `window.__appReadyMark` (script inline de Layout.astro) es el dueño de la
 * instrumentación: fija `__appReadySource`/`__appReadyAt` y añade `.app-ready`
 * una sola vez. Aquí queda el mismo contrato por si el script inline no está
 * (bloqueado o eliminado): añade la clase y marca la fuente igual.
 *
 * Instrumentación (`window.__appReadySource`): gooey | gooey-reduced | hero |
 * no-hero | timeout | bfcache — imprescindible para saber qué camino retiró el
 * overlay al leer los traces, en vez de suponerlo.
 */
export type AppReadySource =
  | 'gooey'
  | 'gooey-reduced'
  | 'hero'
  | 'no-hero'
  | 'timeout'
  | 'bfcache';

export function markAppReady(source: AppReadySource): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (typeof window.__appReadyMark === 'function') {
    window.__appReadyMark(source);
    return;
  }
  if (document.documentElement.classList.contains('app-ready')) return;
  window.__appReadySource = source;
  window.__appReadyAt = Math.round(performance.now());
  document.documentElement.classList.add('app-ready');
}

/**
 * Igual que `markAppReady`, pero esperando dos frames: los callbacks de rAF
 * corren ANTES del pintado del frame en curso, así que el primer frame que ya
 * incluye el texto inyectado se compone en el segundo. Marca cuando el contenido
 * está en pantalla, no solo en el DOM.
 */
export function markAppReadyAfterPaint(source: AppReadySource): void {
  if (typeof window === 'undefined') return;
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => markAppReady(source));
  });
}

declare global {
  interface Window {
    /** Fuente que retiró el overlay (instrumentación; la fija Layout.astro). */
    __appReadySource?: AppReadySource;
    /** performance.now() en el momento del retiro (instrumentación). */
    __appReadyAt?: number;
    /** Marcador canónico definido por el script inline de Layout.astro. */
    __appReadyMark?: (source: AppReadySource) => void;
  }
}
