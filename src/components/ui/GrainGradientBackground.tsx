import { useEffect, useRef, useState } from 'react';
import { GrainGradient } from '@paper-design/shaders-react';

/**
 * Fondo del hero con el shader "grain-gradient" de @paper-design/shaders-react.
 *
 * Config: colors #7300ff/#eba8ff/#00bfff/#2b00ff sobre colorBack, softness 0.5,
 * intensity 0.5, noise 0.25, shape "corners", speed 1.
 *
 * Theme-aware: colorBack sigue el tema del portafolio (#000 en oscuro, #fff en
 * claro), leyendo la clase .dark de <html> con un MutationObserver (la conmuta el
 * script anti-FOUC de Layout.astro + el theme-toggle). El fallback CSS es también
 * theme-aware (clase .hero-shader-fallback en global.css, keyed por .dark) para
 * que el color base coincida desde el primer paint, antes de que el shader mont
 * —sin flash de hidratación (mismo patrón que .ambient-bg).
 *
 * NOTA: históricamente el hero era siempre oscuro y se rechazó una variante clara
 * del shader. Esto se reactivó a petición explícita (2026-06-20): ahora el fondo
 * del shader pasa a blanco en modo claro. El texto del hero es blanco y las
 * glass-pills están estiladas para hero oscuro, así que conviene revisar
 * contraste/scrim al activar modo claro (ver index.astro + global.css #hero).
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
 */

const COLORS = ['#7300ff', '#eba8ff', '#00bfff', '#2b00ff'];

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

  // Tema del portafolio (.dark en <html>): decide el colorBack del shader.
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Decisión de si usamos el shader WebGL o el fallback CSS. Tras el mount,
  // para que el render del servidor y el primer render del cliente coincidan
  // (ambos usan el fallback) y evitar mismatch de hidratación. El shader corre
  // en cualquier tamaño de pantalla (parity móvil+desktop); solo cae al fallback
  // con prefers-reduced-motion.
  const useShader = mounted && !prefersReducedMotion();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sigue el tema (.dark en <html>) para conmutar colorBack en caliente.
  useEffect(() => {
    const root = document.documentElement;
    const read = () =>
      setTheme(root.classList.contains('dark') ? 'dark' : 'light');
    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
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

  // Fallback CSS (SSR, pre-mount, o reduced-motion). Theme-aware vía la clase
  // .hero-shader-fallback (global.css, keyed por .dark) → sin flash de tema.
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
      <GrainGradient
        width="100%"
        height="100%"
        fit="cover"
        colors={COLORS}
        colorBack={theme === 'dark' ? '#000000' : '#ffffff'}
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