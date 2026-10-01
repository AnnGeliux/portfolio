import { describe, expect, it } from 'vitest';
import { FpsGovernor } from './fps-governor';

const tick = (g: FpsGovernor, delta: number) => {
  // simula ticks de rAF: el governor lleva su propio reloj interno
  g.markFrameNext(delta);
};

describe('FpsGovernor', () => {
  it('mantiene 60fps con cadence sano (16.7ms)', () => {
    const g = new FpsGovernor();
    for (let i = 0; i < 500; i++) tick(g, 16.7);
    expect(g.getCap(60)).toBe(60);
  });

  it('baja de tier bajo carga sostenida (25ms ≈ 40fps → 45)', () => {
    const g = new FpsGovernor();
    for (let i = 0; i < 500; i++) tick(g, 16.7);
    for (let i = 0; i < 200; i++) tick(g, 25); // ~40fps reales
    expect(g.getCap(60)).toBeLessThanOrEqual(45);
    expect(g.getCap(60)).toBeGreaterThanOrEqual(30);
  });

  it('sigue bajando con carga severa (45ms ≈ 22fps → 30 o 24)', () => {
    const g = new FpsGovernor();
    for (let i = 0; i < 500; i++) tick(g, 16.7);
    for (let i = 0; i < 200; i++) tick(g, 25);
    for (let i = 0; i < 400; i++) tick(g, 45);
    expect(g.getCap(60)).toBeLessThanOrEqual(30);
  });

  it('recupera tier tras cadence sano sostenido (histéresis)', () => {
    const g = new FpsGovernor();
    for (let i = 0; i < 500; i++) tick(g, 16.7);
    for (let i = 0; i < 400; i++) tick(g, 45); // degradado
    expect(g.getCap(60)).toBeLessThanOrEqual(30);
    for (let i = 0; i < 2000; i++) tick(g, 16.7); // recuperación
    expect(g.getCap(60)).toBe(60);
  });

  it('respeta el techo del consumidor', () => {
    const g = new FpsGovernor();
    for (let i = 0; i < 500; i++) tick(g, 16.7);
    expect(g.getCap(30)).toBe(30); // Membrane: nunca más de 30 aunque el sistema dé 60
  });

  it('ignora outliers (delta > 250ms, pestaña dormida)', () => {
    const g = new FpsGovernor();
    for (let i = 0; i < 500; i++) tick(g, 16.7);
    tick(g, 5000); // tab sleep
    for (let i = 0; i < 100; i++) tick(g, 16.7);
    expect(g.getCap(60)).toBe(60);
  });
});
