'use client';

import { useEffect, useRef } from 'react';
import { cn, usePrefersReducedMotion } from '@/lib/utils';
import { fpsGovernor } from '@/lib/fps-governor';

type MembraneBackgroundProps = {
    /** Columnas de la malla en escritorio (móvil usa ~40%). Default 50. */
    cols?: number;
    /** Radio de deformación del cursor (px). Default 100. */
    hoverRadius?: number;
    /** Fuerza de empuje del cursor (solo profundidad Z). Default 8. */
    hoverForce?: number;
    className?: string;
};

type Theme = 'dark' | 'light';

// Paleta en canales RGB para rgba(): línea de malla, borde (frío), centro
// (cálido teñido al lila del portafolio, en vez del marfil del spec) y
// vértice activo (brillante).
type Palette = {
    lineColor: string;
    edge: string;
    center: string;
    active: string;
};

function buildPalette(theme: Theme): Palette {
    return theme === 'dark'
        ? {
              // Espejo del spec: líneas casi invisibles sobre lienzo oscuro.
              lineColor: 'rgba(255, 255, 255, 0.018)',
              edge: '96, 96, 106',
              // Lila del portafolio, tenue: SIEMPRE por debajo del blanco del
              // texto del sitio (#ececf2) para no competir con la lectura.
              center: '188, 148, 216',
              active: '220, 208, 232',
          }
        : {
              // Modo claro (invención propia, mismo giro que ASMRBackground):
              // carbón + acento índigo sobre lienzo claro.
              lineColor: 'rgba(30, 30, 40, 0.05)',
              edge: '64, 64, 72',
              center: '99, 102, 241',
              active: '40, 30, 70',
          };
}

// Física del spec Membrane.
const SPRING = 0.025;
const DAMPING = 0.93;
const SPREAD = 0.18;

type Vertex = {
    x: number;
    y: number;
    restX: number;
    restY: number;
    vx: number;
    vy: number;
    offsetZ: number;
    velZ: number;
    displacement: number;
    col: number;
    row: number;
};

/**
 * Fondo "Membrane" (malla interactiva sobre Canvas 2D).
 *
 * Adaptaciones respecto al spec original (motionin.design):
 * - Es un FONDO de sitio, no una sección hero: canvas fijo a -z-50 con
 *   pointer-events-none, escuchando mousemove en window. El contenido demo
 *   (badge, título, botones, avatares) no se replica; solo el mesh.
 * - Sin GSAP: el fade-in del canvas es una CSS transition de opacity.
 * - Theme-aware como ASMRBackground: paleta en un ref actualizada por
 *   MutationObserver sobre .dark en <html>; el bucle la lee cada frame sin
 *   reconstruir la malla ni reasignar listeners.
 * - Sin el dimming elíptico del spec: era para legibilidad del contenido
 *   centrado del hero demo; como fondo global no hay zona fija que proteger.
 * - Guards del portafolio: prefers-reduced-motion → frame estático, pausa con
 *   pestaña oculta, cap ~30fps, mousemove batcheado por frame, resize por rAF.
 * - Densidad escalada: en móvil la malla es ~40% del grid de escritorio.
 */
export function MembraneBackground({
    cols = 50,
    hoverRadius = 100,
    hoverForce = 8,
    className,
}: MembraneBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reduceMotion = usePrefersReducedMotion();
    const paletteRef = useRef<Palette>(buildPalette('dark'));

    // Sigue el tema del portafolio (patrón de ASMRBackground): solo actualiza
    // paletteRef.current; el bucle lee el ref cada frame.
    useEffect(() => {
        const root = document.documentElement;
        const read = () =>
            (paletteRef.current = buildPalette(
                root.classList.contains('dark') ? 'dark' : 'light',
            ));
        read();
        const observer = new MutationObserver(read);
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let animationFrameId = 0;
        let colsN = 0;
        let rowsN = 0;
        let verts: Vertex[] = [];
        let grid: Vertex[][] = [];
        const mouse = { x: -9999, y: -9999 };
        // Último evento de puntero pendiente de aplicar (batcheo por frame).
        let pendingMouse: { x: number; y: number } | null = null;

        const HOVER_RADIUS = hoverRadius;
        const HOVER_FORCE = hoverForce;

        const init = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            // DPR cap moderado: nitidez de puntos sin multiplicar el raster.
            const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            const isMobile = width < 768;
            colsN = isMobile ? Math.max(8, Math.round(cols * 0.4)) : cols;
            // Filas derivadas del aspect ratio para celdas ~cuadradas.
            rowsN = Math.max(2, Math.round((colsN * height) / width));
            grid = [];
            verts = [];
            for (let row = 0; row < rowsN; row++) {
                const rowArr: Vertex[] = [];
                for (let col = 0; col < colsN; col++) {
                    const v: Vertex = {
                        x: 0,
                        y: 0,
                        restX: (col / (colsN - 1)) * width,
                        restY: (row / (rowsN - 1)) * height,
                        vx: 0,
                        vy: 0,
                        offsetZ: 0,
                        velZ: 0,
                        displacement: 0,
                        col,
                        row,
                    };
                    v.x = v.restX;
                    v.y = v.restY;
                    rowArr.push(v);
                    verts.push(v);
                }
                grid.push(rowArr);
            }
            // Fade-in del canvas (2s, en el espíritu del spec sin GSAP).
            canvas.style.opacity = '1';
        };

        let lastTs = 0;
        const render = (ts: number) => {
            animationFrameId = requestAnimationFrame(render);
            // Alimenta el governor con el cadence REAL del compositor: en CADA
            // tick de rAF, aunque este tick salte el dibujo por el cap, para que
            // el EMA no se retroalimente con los frames que saltamos nosotros.
            fpsGovernor.markFrame(ts);
            // Pausa real cuando la pestaña no es visible (ahorro de CPU).
            if (document.hidden) return;
            // Cap VARIABLE (antes: fijo `ts - lastTs < 32`): techo de diseño
            // 30fps — la física es por-frame como el spec y 60fps duplicaría el
            // coste de main-thread sin ganancia visual; el governor puede bajarlo
            // a 24 si el main thread va cargado.
            const minInterval = 1000 / fpsGovernor.getCap(30) - 1;
            if (ts - lastTs < minInterval) return;
            lastTs = ts;

            // Aplica el último evento de puntero pendiente (batcheo por frame).
            if (pendingMouse) {
                mouse.x = pendingMouse.x;
                mouse.y = pendingMouse.y;
                pendingMouse = null;
            }

            ctx.clearRect(0, 0, width, height);

            // --- Física: breathing + cursor + spring + damping (spec) ---
            for (const v of verts) {
                // Breathing (opción C): onda viajera diagonal (la brisa recorre
                // la pantalla) + segundo seno desfasado por vértice que rompe
                // el ritmo metronómico y da micro-vida individual.
                const breathe =
                    Math.sin(ts * 0.0006 + (v.col + v.row) * 0.12) * 2 +
                    Math.sin(
                        ts * 0.0011 + v.col * 0.31 + v.row * 0.17,
                    ) * 1.2;
                v.velZ += (breathe - v.offsetZ) * 0.002;

                // Cursor: solo profundidad Z (opción C) — el vértice no se
                // desplaza en XY; solo gana brillo/tamaño bajo el cursor.
                const dx = v.restX - mouse.x;
                const dy = v.restY - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
                if (dist < HOVER_RADIUS) {
                    v.velZ += HOVER_FORCE * 0.4;
                }

                // Spring de retorno + damping.
                v.vx += (v.restX - v.x) * SPRING;
                v.vy += (v.restY - v.y) * SPRING;
                v.velZ -= v.offsetZ * SPRING * 1.5;
                v.vx *= DAMPING;
                v.vy *= DAMPING;
                v.velZ *= DAMPING;
                v.x += v.vx;
                v.y += v.vy;
                v.offsetZ += v.velZ;

                // Desplazamiento total (para color/alpha/size activos).
                v.displacement =
                    Math.abs(v.x - v.restX) +
                    Math.abs(v.y - v.restY) +
                    Math.abs(v.offsetZ);
            }

            // --- Propagación de ondas a los 4 vecinos (spec) ---
            // Copia previa de offsetZ para impulsos simultáneos (no en cascada).
            if (verts.length > 0) {
                const prevZ = new Float32Array(verts.length);
                for (let i = 0; i < verts.length; i++) prevZ[i] = verts[i].offsetZ;
                for (let row = 0; row < rowsN; row++) {
                    for (let col = 0; col < colsN; col++) {
                        const v = grid[row][col];
                        const z = prevZ[row * colsN + col];
                        let push = 0;
                        if (row > 0)
                            push += (prevZ[(row - 1) * colsN + col] - z) * SPREAD;
                        if (row < rowsN - 1)
                            push += (prevZ[(row + 1) * colsN + col] - z) * SPREAD;
                        if (col > 0)
                            push += (prevZ[row * colsN + col - 1] - z) * SPREAD;
                        if (col < colsN - 1)
                            push += (prevZ[row * colsN + col + 1] - z) * SPREAD;
                        v.velZ += push;
                    }
                }
            }

            // --- Dibujo: líneas H/V (spec) ---
            const pal = paletteRef.current;
            ctx.strokeStyle = pal.lineColor;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            for (let row = 0; row < rowsN; row++) {
                for (let col = 0; col < colsN; col++) {
                    const v = grid[row][col];
                    const sx = v.x;
                    const sy = v.y - v.offsetZ * 0.3;
                    if (col < colsN - 1) {
                        const n = grid[row][col + 1];
                        ctx.moveTo(sx, sy);
                        ctx.lineTo(n.x, n.y - n.offsetZ * 0.3);
                    }
                    if (row < rowsN - 1) {
                        const n = grid[row + 1][col];
                        ctx.moveTo(sx, sy);
                        ctx.lineTo(n.x, n.y - n.offsetZ * 0.3);
                    }
                }
            }
            ctx.stroke();

            // --- Dibujo: vértices con color por centerFactor (spec) ---
            const cx = width / 2;
            const cy = height / 2;
            const maxDist = Math.sqrt(cx * cx + cy * cy);

            const [er, eg, eb] = pal.edge.split(',').map(Number);
            const [cr, cg, cb] = pal.center.split(',').map(Number);
            const [ar, ag, ab] = pal.active.split(',').map(Number);

            for (const v of verts) {
                const distFromCenter = Math.sqrt(
                    (v.restX - cx) * (v.restX - cx) +
                        (v.restY - cy) * (v.restY - cy),
                );
                const centerFactor = Math.pow(
                    1 - Math.min(1, (distFromCenter / maxDist) * 1.4),
                    1.5,
                );

                let r = er + (cr - er) * centerFactor;
                let g = eg + (cg - eg) * centerFactor;
                let b = eb + (cb - eb) * centerFactor;
                let size = 1 + centerFactor;
                // Alphas rebajados (opción C): presencia tenue, sin invadir.
                let alpha = 0.035 + centerFactor * 0.13;

                if (v.displacement > 0.3) {
                    alpha = Math.max(
                        alpha,
                        Math.min(0.5, v.displacement * 0.06),
                    );
                    size += v.displacement * 0.05;
                }
                if (v.displacement > 3) {
                    const k = Math.min(1, (v.displacement - 3) / 8);
                    r += (ar - r) * k;
                    g += (ag - g) * k;
                    b += (ab - b) * k;
                }

                const sx = v.x;
                const sy = v.y - v.offsetZ * 0.3;
                ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(sx, sy, size, 0, Math.PI * 2);
                ctx.fill();

                // Glow solo en vértices muy activos y muy tenue (opción C):
                // antes era displacement > 1.5 || centerFactor > 0.4.
                if (v.displacement > 3) {
                    ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha * 0.06})`;
                    ctx.beginPath();
                    ctx.arc(sx, sy, size + 6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        };

        const renderStatic = () => {
            // Frame único sin bucle (movimiento reducido): malla en reposo.
            ctx.clearRect(0, 0, width, height);
            const pal = paletteRef.current;
            ctx.strokeStyle = pal.lineColor;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            for (let row = 0; row < rowsN; row++) {
                for (let col = 0; col < colsN; col++) {
                    const v = grid[row][col];
                    if (col < colsN - 1) {
                        ctx.moveTo(v.restX, v.restY);
                        ctx.lineTo(
                            grid[row][col + 1].restX,
                            grid[row][col + 1].restY,
                        );
                    }
                    if (row < rowsN - 1) {
                        ctx.moveTo(v.restX, v.restY);
                        ctx.lineTo(
                            grid[row + 1][col].restX,
                            grid[row + 1][col].restY,
                        );
                    }
                }
            }
            ctx.stroke();
            const cx = width / 2;
            const cy = height / 2;
            const maxDist = Math.sqrt(cx * cx + cy * cy);
            const [er, eg, eb] = pal.edge.split(',').map(Number);
            const [cr, cg, cb] = pal.center.split(',').map(Number);
            for (const v of verts) {
                const distFromCenter = Math.sqrt(
                    (v.restX - cx) * (v.restX - cx) +
                        (v.restY - cy) * (v.restY - cy),
                );
                const centerFactor = Math.pow(
                    1 - Math.min(1, (distFromCenter / maxDist) * 1.4),
                    1.5,
                );
                const r = er + (cr - er) * centerFactor;
                const g = eg + (cg - eg) * centerFactor;
                const b = eb + (cb - eb) * centerFactor;
                const size = 1 + centerFactor;
                const alpha = 0.035 + centerFactor * 0.13;
                ctx.fillStyle = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
                ctx.beginPath();
                ctx.arc(v.restX, v.restY, size, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            pendingMouse = { x: e.clientX, y: e.clientY };
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches[0]) {
                pendingMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        };
        const handleMouseOut = () => {
            mouse.x = -9999;
            mouse.y = -9999;
            pendingMouse = null;
        };

        let resizeRaf = 0;
        const onResize = () => {
            cancelAnimationFrame(resizeRaf);
            resizeRaf = requestAnimationFrame(() => init());
        };

        let cleanupBoot: (() => void) | null = null;

        const boot = () => {
            init();

            if (reduceMotion) {
                renderStatic();
            } else {
                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('touchmove', handleTouchMove, {
                    passive: true,
                });
                window.addEventListener('mouseout', handleMouseOut);
                requestAnimationFrame(render);
            }

            window.addEventListener('resize', onResize);

            return () => {
                window.removeEventListener('resize', onResize);
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('touchmove', handleTouchMove);
                window.removeEventListener('mouseout', handleMouseOut);
                cancelAnimationFrame(animationFrameId);
                cancelAnimationFrame(resizeRaf);
            };
        };

        // Fix B del plan flujo-web-integral: la malla (construcción del grid +
        // bucle rAF continuo) NO arranca hasta que el overlay se retiró
        // (.app-ready). Así no compite por el main thread con la hidratación
        // del Hero en la misma ventana `idle` ni fuerza re-composición bajo el
        // backdrop-filter del loader. El canvas sigue en opacity 0 hasta que
        // `init()` lo enciende, así que el arranque tardío no se ve.
        let cancelGate: () => void;
        const root = document.documentElement;
        if (root.classList.contains('app-ready')) {
            cleanupBoot = boot();
            cancelGate = () => {};
        } else {
            const gate = new MutationObserver(() => {
                if (!root.classList.contains('app-ready')) return;
                gate.disconnect();
                cleanupBoot = boot();
            });
            gate.observe(root, { attributes: true, attributeFilter: ['class'] });
            cancelGate = () => gate.disconnect();
        }

        return () => {
            cancelGate();
            cleanupBoot?.();
        };
    }, [reduceMotion, cols, hoverRadius, hoverForce]);

    return (
        <div className={cn('fixed inset-0 -z-50 pointer-events-none', className)}>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 block h-full w-full opacity-0 transition-opacity duration-[2000ms] ease-out"
            />
        </div>
    );
}

export default MembraneBackground;