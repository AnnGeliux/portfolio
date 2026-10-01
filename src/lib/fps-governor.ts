/**
 * Governor adaptativo de FPS, compartido por los tres loops de animación
 * del sitio (Membrane canvas, NeuroNoise WebGL, SDF LensStage).
 *
 * Mide el cadence REAL del compositor: cada consumidor llama markFrame(ts)
 * en cada tick de rAF — aunque ese tick salte el dibujo por el cap — para
 * que el EMA nunca se retroalimente con sus propios frames saltados.
 *
 * Publica un cap en una escalera de tiers [60, 45, 30, 24] con histéresis:
 * baja rápido (una evaluación mala) y sube solo tras buen cadence sostenido
 * (~2s), para no oscilar.
 *
 * Puente window.__fpsGov: los pnpm patches de librerías (@paper-design/shaders,
 * @crazygl/core) no pueden importar módulos de la app; leen este contrato:
 *   __fpsGov.markFrame(ts)      — llamar en cada tick de rAF
 *   __fpsGov.getCap(ceiling)    — cap actual, clampado por el techo del consumidor
 * Si el governor aún no cargó, los patches ven undefined y NO aplican cap
 * (comportamiento actual). El governor se carga con Membrane (client:idle,
 * siempre presente), así que arranca en cuanto hidrata el primer fondo.
 */

const TIERS = [60, 45, 30, 24] as const;
const EMA_ALPHA = 0.1; // suavizado exponencial del delta
const EVAL_EVERY = 20; // evaluar tiers cada 20 ticks (~0.3-0.8s)
const DOWNGRADE_FACTOR = 1.3; // EMA > 1.3x el intervalo objetivo → bajar
/**
 * Umbral de subida: el EMA debe caber dentro del 110% del intervalo del tier
 * superior. Con 0.85 (el valor del borrador) el ascenso a 60 exigía EMA <
 * 14.17ms, imposible en un monitor de 60Hz (delta sano ≈ 16.7ms): el governor
 * se quedaba clavado en 45 de forma permanente. Con 1.10 un cadence sano a
 * 60Hz (16.7 < 18.33) sí asciende, mientras una carga sostenida de 25ms
 * (≈40fps) NO asciende desde 45 (25 > 24.44) → sin oscilación.
 */
const UPGRADE_FACTOR = 1.1;
const UPGRADE_STREAK = 6; // 6 evaluaciones buenas seguidas (~2-5s) para subir
const OUTLIER_MS = 250; // deltas mayores (tab sleep) no contaminan el EMA

export class FpsGovernor {
  private lastTs = 0;
  private ema = 1000 / 60;
  private ticks = 0;
  private goodStreak = 0;
  private tierIdx = 0;

  /** API rAF: llamada con el ts del requestAnimationFrame. */
  markFrame(ts: number): void {
    if (!this.lastTs) {
      this.lastTs = ts;
      return;
    }
    const delta = ts - this.lastTs;
    this.lastTs = ts;
    this.absorbDelta(delta);
  }

  /** Hook de testabilidad: inyecta el delta directamente. */
  markFrameNext(delta: number): void {
    this.absorbDelta(delta);
  }

  private absorbDelta(delta: number): void {
    if (delta <= 0 || delta > OUTLIER_MS) return;
    this.ema += (delta - this.ema) * EMA_ALPHA;
    this.ticks++;
    if (this.ticks % EVAL_EVERY === 0) this.evaluate();
  }

  private evaluate(): void {
    const targetInterval = 1000 / TIERS[this.tierIdx];
    if (this.tierIdx < TIERS.length - 1 && this.ema > targetInterval * DOWNGRADE_FACTOR) {
      this.tierIdx++;
      this.goodStreak = 0;
      return;
    }
    if (this.tierIdx > 0) {
      const upperInterval = 1000 / TIERS[this.tierIdx - 1];
      if (this.ema < upperInterval * UPGRADE_FACTOR) {
        if (++this.goodStreak >= UPGRADE_STREAK) {
          this.tierIdx--;
          this.goodStreak = 0;
        }
      } else {
        this.goodStreak = 0;
      }
    }
  }

  /** Cap para un consumidor con techo de diseño propio. */
  getCap(ceiling = 60): number {
    return Math.min(TIERS[this.tierIdx], ceiling);
  }
}

/** Instancia única + puente window para los patches de librerías. */
export const fpsGovernor = new FpsGovernor();

declare global {
  interface Window {
    __fpsGov?: FpsGovernor;
  }
}
if (typeof window !== 'undefined') window.__fpsGov = fpsGovernor;
