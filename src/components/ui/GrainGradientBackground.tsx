import { useEffect, useRef, useState } from 'react';
import { GrainGradient } from '@paper-design/shaders-react';

/**
 * Fondo del hero con el shader "grain-gradient" de @paper-design/shaders-react.
 *
 * Config: colors #7300ff/#eba8ff/#00bfff/#2b00ff sobre colorBack #000,
 * softness 0.5, intensity 0.5, noise 0.25, shape "corners", speed 1.
 *
 * Guards de rendimiento:
 *  - Hidrata con client:visible (desde index.astro): solo carga al entrar al viewport.
 *  - prefers-reduced-motion → fallback CSS estático (sin WebGL).
 *  - IntersectionObserver pausa el RAF (speed=0) al salir del viewport.
 *  - visibilitychange pausa al ocultar la pestaña.
 *  - maxPixelCount 1.2M (era 2M): cap de píxeles renderizados. Solo muerde en
 *    celulares con DPR alto (2.5-3), donde corta hasta ~40% del trabajo GPU;
 *    como el grain es ruido, escalar por CSS desde ~0.77×/eje es imperceptible.
 *    En gama baja (DPR 2, ya bajo el cap) no cambia nada. Tunable: 1M = más
 *    fluido, 1.5M = más nítido.
 * El shader corre igual en móvil y desktop (parity): GrainGradient + maxPixelCount
 * es lo bastante liviano para GPU móviles. Solo cae al fallback con reduced-motion.
 * El `colorBack #000` opaco mantiene el hero siempre-oscuro (tapa las capas -z-40/-z-50).
 */

const COLORS = ['#7300ff', '#eba8ff', '#00bfff', '#2b00ff'];

// Fallback estático (reduced-motion / pre-mount): los colores de marca sobre negro, sin RAF.
const FALLBACK_STYLE: React.CSSProperties = {
  background:
    'radial-gradient(120% 120% at 25% 15%, rgba(0,191,255,0.18), transparent 55%), ' +
    'radial-gradient(120% 120% at 80% 90%, rgba(115,0,255,0.22), transparent 55%), ' +
    'radial-gradient(120% 120% at 90% 10%, rgba(235,168,255,0.12), transparent 50%), ' +
    '#000',
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function GrainGradientBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  // El shader corre si está en viewport AND la pestaña es visible. Se trackean
  // por separado para poder REANUDAR al volver de un fondo/otra app en móvil:
  // antes onVisibility solo pausaba (running=false) y nunca restauraba, así que
  // la animación quedaba congelada para siempre tras la primera vez que la
  // pestaña se ocultaba. El GrainGradient avanza el tiempo mientras speed!=0,
  // así que "loop" es infinito por naturaleza; el stop era este bug de reanudación.
  const [intersecting, setIntersecting] = useState(true);
  const [visible, setVisible] = useState(
    () => (typeof document !== 'undefined' ? !document.hidden : true),
  );
  const running = intersecting && visible;

  // Decisión de si usamos el shader WebGL o el fallback CSS. Tras el mount,
  // para que el render del servidor y el primer render del cliente coincidan
  // (ambos usan el fallback) y evitar mismatch de hidratación. El shader corre
  // en cualquier tamaño de pantalla (parity móvil+desktop); solo cae al fallback
  // con prefers-reduced-motion.
  const useShader = mounted && !prefersReducedMotion();

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

    // Pausar al ocultar la pestaña y REANUDAR al volver a ser visible. El bug
    // anterior: solo pausaba, nunca restauraba → animación congelada para siempre
    // tras la primera ocultada (cambiar de app / apagar pantalla en móvil).
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [useShader]);

  // Fallback CSS (SSR, pre-mount, móvil o reduced-motion).
  if (!useShader) {
    return (
      <div ref={ref} aria-hidden className="absolute inset-0 h-full w-full" style={FALLBACK_STYLE} />
    );
  }

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 h-full w-full">
      <GrainGradient
        width="100%"
        height="100%"
        fit="cover"
        colors={COLORS}
        colorBack="#000000"
        softness={0.5}
        intensity={0.5}
        noise={0.25}
        shape="corners"
        scale={1}
        rotation={0}
        offsetX={0}
        offsetY={0}
        speed={running ? 1 : 0}
        maxPixelCount={1_200_000}
      />
    </div>
  );
}

export default GrainGradientBackground;