import { useEffect, useRef, useState } from 'react';
import { GrainGradient } from '@paper-design/shaders-react';
import { useTheme } from '@/stores/theme';

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
  const [intersecting, setIntersecting] = useState(true);
  const [visible, setVisible] = useState(
    () => (typeof document !== 'undefined' ? !document.hidden : true),
  );
  const running = intersecting && visible;
  const theme = useTheme();
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