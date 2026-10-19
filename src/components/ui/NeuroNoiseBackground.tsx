import { useEffect, useRef, useState } from 'react';
import { NeuroNoise } from '@paper-design/shaders-react';
import { hasWebGL2 } from '@/lib/utils';
import { useTheme } from '@/stores/theme';

/**
 * Fondo del hero con el shader "neuro-noise" de @paper-design/shaders-react.
 *
 * Elegido en /playground (2026-09-26) tras comparar los 19 candidatos de la
 * galería con la paleta del sitio. Reemplaza a GrainGradientBackground.tsx
 * (que queda en el repo como referencia; RawShaderLines.tsx conserva la
 * recreación WebGL cruda del viejo shader-lines de three.js).
 *
 * Config: colorFront #eba8ff, colorMid #7300ff sobre colorBack, brightness
 * 0.4, contrast 0.4, speed 0.5 — mismos valores con los que se aprobó en la
 * galería. El blanco del hero sigue ganando el contraste vía .hero-scrim.
 *
 * Theme-aware: colorBack sigue el átomo `$theme` de nanostores (#050010 en
 * oscuro, #fff en claro) sin MutationObserver propio. El fallback CSS es
 * también theme-aware (clase .hero-shader-fallback en global.css, keyed por
 * .dark) para que el color base coincide desde el primer paint — sin flash.
 *
 * Guards de rendimiento (NeuroNoise = 15 iteraciones sin/cos fijas por
 * píxel: costo constante, pero no trivial como GrainGradient):
 *  - Hidrata con client:visible (index.astro): solo carga al entrar al viewport.
 *  - WebGL2 requerido (#version 300 es): probe único y cacheado antes de montar;
 *    sin soporte → fallback CSS. (iOS 15+ / Android moderno lo cumplen.)
 *  - prefers-reduced-motion → fallback CSS estático (sin WebGL).
 *  - IntersectionObserver pausa el RAF (speed=0) al salir del viewport.
 *  - visibilitychange pausa al ocultar la pestaña.
 *  - maxPixelCount dinámico: 600k en desktop; 350k si la pantalla es angosta
 *    (<640px CSS) o el device reporta poca potencia (hardwareConcurrency<4).
 *    NeuroNoise renderiza líneas finas: el escalado por CSS desde ~0.7×/eje
 *    es imperceptible en pantallas de DPR alto.
 * Tunable: subir a 800k = más nítido en desktop; bajar a 250k = más fluido.
 */

const FRONT = '#eba8ff';
const MID = '#7300ff';
const BACK_DARK = '#050010';
const BACK_LIGHT = '#ffffff';

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}


/** Cap de píxeles según potencia aproximada del device. */
function maxPixelCountForDevice(): number {
  if (typeof window === 'undefined') return 600_000;
  const narrow = window.innerWidth < 640;
  const weak =
    (navigator.hardwareConcurrency ?? 8) < 4 ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (narrow || weak) return 350_000;
  return 600_000;
}

export function NeuroNoiseBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [intersecting, setIntersecting] = useState(true);
  const [visible, setVisible] = useState(
    () => (typeof document !== 'undefined' ? !document.hidden : true),
  );
  const running = intersecting && visible;

  // Tema del portafolio suscrito al átomo `$theme` (nanostores).
  const theme = useTheme();

  // Decisión shader-vs-fallback. Tras el mount y solo en el cliente (evita
  // mismatch de hidratación: SSR y primer render del cliente usan el fallback).
  const useShader = mounted && !prefersReducedMotion() && hasWebGL2();

  // Cap de píxeles calculado una vez por mount (no re-responde a resizes:
  // el hero no cambia de tamaño de device a mitad de sesión).
  const [maxPixelCount] = useState(maxPixelCountForDevice);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!useShader || !el) return;

    // Pausar al salir del viewport (ahorro de GPU); reanuda al volver a entrar.
    const io = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      { threshold: 0 },
    );
    io.observe(el);

    // Pausar al ocultar la pestaña y REANUDAR al volver a ser visible.
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [useShader]);

  // Fallback CSS (SSR, pre-mount, reduced-motion o sin WebGL2). Theme-aware
  // vía .hero-shader-fallback (global.css, keyed por .dark) → sin flash.
  if (!useShader) {
    return (
      <div
        ref={ref}
        aria-hidden
        className="hero-shader-fallback absolute inset-0 h-full w-full"
      />
    );
  }

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 h-full w-full">
      <NeuroNoise
        width="100%"
        height="100%"
        fit="cover"
        colorFront={FRONT}
        colorMid={MID}
        colorBack={theme === 'dark' ? BACK_DARK : BACK_LIGHT}
        brightness={0.4}
        contrast={0.4}
        speed={running ? 0.5 : 0}
        maxPixelCount={maxPixelCount}
      />
    </div>
  );
}

export default NeuroNoiseBackground;