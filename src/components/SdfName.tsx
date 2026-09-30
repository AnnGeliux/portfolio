import { useEffect, useRef, useState } from 'react';
import SdfLensBlur from '@crazygl/hero-sdf-lens-blur';

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
 * El fallback es el h1 tipográfico original, así el nombre nunca desaparece
 * ni para SEO (el h1 vive en el HTML server-side del Hero.tsx padre).
 */
export default function SdfName({ text }: SdfNameProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const probeRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setSupported(false);
      return;
    }
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    setSupported(Boolean(gl));
    canvas.remove?.();
  }, []);

  if (supported === false) {
    return (
      <h1 className="hero-name font-display text-5xl font-bold tracking-tight sm:text-7xl">
        {text}
      </h1>
    );
  }

  if (supported === null) {
    // Antes del probe: pinta el h1 estático (misma forma que el fallback).
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
        glowColor="#ffffff"
        glowIntensity={0.84}
        textColor="#ffffff"
        transparent
      />
    </div>
  );
}