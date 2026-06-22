import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useEffect, useState } from 'react';

/**
 * Combina clases de Tailwind de forma segura: soporta strings, arrays y
 * objetos condicionales (vía clsx) y resuelve conflictos de utilidades
 * manteniendo la última declaración (vía tailwind-merge).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Reemplaza `useReducedMotion` de framer-motion sin arrastrar toda la runtime
 * de motion. Lee `prefers-reduced-motion: reduce` vía matchMedia y se mantiene
 * reactivo a cambios del usuario.
 *
 * SSR-safe: el inicializador perezoso de `useState` protege el acceso a
 * `window`; en servidor devuelve `false`. Como el valor solo gates
 * efectos/animación (nunca la estructura del JSX), el default `false` no causa
 * mismatch de hidratación.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduce;
}