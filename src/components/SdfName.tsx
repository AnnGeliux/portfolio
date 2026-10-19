import { useEffect, useState } from 'react';
import SdfLensBlur from '@crazygl/hero-sdf-lens-blur';
import { hasWebGL2 } from '@/lib/utils';
import { useTheme } from '@/stores/theme';

interface SdfNameProps {
  /** Palabra corta en MAYÚSCULAS que se rasteriza al SDF (el nombre del autor). */
  text: string;
}

/**
 * Wrapper del hero SDF Lens Blur (@crazygl/hero-sdf-lens-blur) para el nombre
 * del autor. Añade los guards que el componente original no trae:
 *  - Probe de WebGL2 antes de montar (si falta → fallback al h1 de siempre).
 *  - prefers-reduced-motion → fallback (el efecto es esencialmente movimiento).
 *  - `transparent` para componer sobre el shader de fondo del hero del sitio.
 *  - Reactividad al tema (`useTheme()` sobre nanostores): en oscuro pinta en
 *    blanco luminoso (`#ffffff`), y en claro cambia a tinta oscura (`#0b0b14`)
 *    con halo bokeh índigo (`#6366f1`) para mantener contraste sobre el hero claro.
 */
export default function SdfName({ text }: SdfNameProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const theme = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setSupported(false);
      return;
    }
    setSupported(hasWebGL2());
  }, []);


  if (supported === false || supported === null) {
    return (
      <h1 className="hero-name font-display text-5xl font-bold tracking-tight sm:text-7xl">
        {text}
      </h1>
    );
  }

  return (
    <div
      className="hero-sdf-name w-full"
      style={{ minHeight: '5rem' }}
      aria-hidden="true"
    >
      <SdfLensBlur
        text={text}
        fontFamily="'Space Grotesk Variable', 'Space Grotesk', sans-serif"
        fontWeight={600}
        fontSize={0.09}
        letterSpacing={0.03}
        lensStrength={0.05}
        lensRadius={0.24}
        chromatic={0.84}
        backgroundColor={isDark ? '#000000' : '#1e1b4b'}
        glowColor={isDark ? '#ffffff' : '#6366f1'}
        glowIntensity={isDark ? 0.84 : 0.32}
        textColor={isDark ? '#ffffff' : '#0b0b14'}
        transparent
      />
    </div>
  );
}