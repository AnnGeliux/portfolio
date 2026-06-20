'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type GradientDotsProps = React.ComponentProps<typeof motion.div> & {
    /** Dot size (default: 8) */
    dotSize?: number;
    /** Spacing between dots (default: 10) */
    spacing?: number;
    /** Animation duration (default: 30) */
    duration?: number;
    /** Color cycle duration (default: 6) */
    colorCycleDuration?: number;
    /** Background color (default: 'var(--color-bg)') */
    backgroundColor?: string;
};

/**
 * Fondo de puntos con gradiente animado (hue-rotate + desplazamiento).
 *
 * Adaptaciones respecto al original:
 * - backgroundColor por defecto usa el token del portafolio (--color-bg);
 *   el original usaba var(--background), que no existe en este proyecto.
 * - Respeta prefers-reduced-motion: con movimiento reducido se renderiza
 *   estático (sin animación de posición ni hue-rotate), igual que el resto
 *   del portafolio.
 * - Pensado para render fijo detrás de la página (pasar className con
 *   `fixed!` para sobrescribir el `absolute` interno, + `-z-50` +
 *   `pointer-events-none`).
 */
export function GradientDots({
    dotSize = 8,
    spacing = 10,
    duration = 30,
    colorCycleDuration = 6,
    backgroundColor = 'var(--color-bg)',
    className,
    ...props
}: GradientDotsProps) {
    const hexSpacing = spacing * 1.732; // Hexagonal spacing calculation
    const reduceMotion = useReducedMotion();
    const [hidden, setHidden] = useState(false);

    // Pausar las animaciones cuando la pestaña no es visible (ahorro de CPU en segundo plano).
    useEffect(() => {
        const onVisibilityChange = () => setHidden(document.hidden);
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }, []);

    const paused = reduceMotion || hidden;

    return (
        <motion.div
            className={cn('absolute inset-0', className)}
            style={{
                backgroundColor,
                backgroundImage: `
          radial-gradient(circle at 50% 50%, transparent 1.5px, ${backgroundColor} 0 ${dotSize}px, transparent ${dotSize}px),
          radial-gradient(circle at 50% 50%, transparent 1.5px, ${backgroundColor} 0 ${dotSize}px, transparent ${dotSize}px),
          radial-gradient(circle at 50% 50%, #f00, transparent 60%),
          radial-gradient(circle at 50% 50%, #ff0, transparent 60%),
          radial-gradient(circle at 50% 50%, #0f0, transparent 60%),
          radial-gradient(ellipse at 50% 50%, #00f, transparent 60%)
        `,
                backgroundSize: `
          ${spacing}px ${hexSpacing}px,
          ${spacing}px ${hexSpacing}px,
          200% 200%,
          200% 200%,
          200% 200%,
          200% ${hexSpacing}px
        `,
                backgroundPosition: `
          0px 0px, ${spacing / 2}px ${hexSpacing / 2}px,
          0% 0%,
          0% 0%,
          0% 0px
        `,
            }}
            animate={
                paused
                    ? undefined
                    : {
                          backgroundPosition: [
                              `0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 800% 400%, 1000% -400%, -1200% -600%, 400% ${hexSpacing}px`,
                              `0px 0px, ${spacing / 2}px ${hexSpacing / 2}px, 0% 0%, 0% 0%, 0% 0%, 0% 0%`,
                          ],
                          filter: ['hue-rotate(0deg)', 'hue-rotate(360deg)'],
                      }
            }
            transition={
                paused
                    ? undefined
                    : {
                          backgroundPosition: {
                              duration: duration,
                              ease: 'linear',
                              repeat: Number.POSITIVE_INFINITY,
                          },
                          filter: {
                              duration: colorCycleDuration,
                              ease: 'linear',
                              repeat: Number.POSITIVE_INFINITY,
                          },
                      }
            }
            {...props}
        />
    );
}