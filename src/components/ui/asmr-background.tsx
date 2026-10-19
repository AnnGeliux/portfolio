'use client';

import { useEffect, useRef } from 'react';
import { cn, usePrefersReducedMotion } from '@/lib/utils';
import { $theme, type Theme } from '@/stores/theme';

type ASMRBackgroundProps = {
    /** Densidad objetivo de partículas en escritorio (móvil usa ~1/3). Default 450. */
    particleCount?: number;
    /** Radio de atracción del vórtice magnético (zona donde giran). Default 280. */
    magneticRadius?: number;
    /** Fuerza de atracción al cursor ("gravedad"). Default 0.12. */
    pullStrength?: number;
    /** Velocidad tangencial CONSTANTE del remolino (px/frame). Default 2.5. */
    swirlSpeed?: number;
    className?: string;
};

// Paleta de Canvas (los canales glass/charcoal/glow son RGB para rgba()).
type Palette = {
    fill: string;
    glass: string;
    charcoal: string;
    glow: string;
};

function buildPalette(theme: Theme): Palette {
    return theme === 'dark'
        ? {
              fill: 'rgba(10, 10, 12, 0.18)',
              glass: '240, 245, 255',
              charcoal: '80, 80, 85',
              glow: '180, 220, 255',
          }
        : {
              fill: 'rgba(255, 255, 255, 0.20)',
              glass: '99, 102, 241',
              charcoal: '64, 64, 72',
              glow: '120, 140, 210',
          };
}

export function ASMRBackground({
    particleCount = 450,
    magneticRadius = 280,
    pullStrength = 0.12,
    swirlSpeed = 2.5,
    className,
}: ASMRBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reduceMotion = usePrefersReducedMotion();
    const paletteRef = useRef<Palette>(buildPalette($theme.get()));

    useEffect(() => {
        return $theme.subscribe((theme) => {
            paletteRef.current = buildPalette(theme);
        });
    }, []);

    // Bucle de Canvas. Se re-crea al cambiar la preferencia de movimiento o los
    // parámetros físicos, PERO NO al cambiar el tema (va por paletteRef).
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let animationFrameId = 0;
        let particles: Particle[] = [];
        const mouse = { x: -1000, y: -1000 };
        // Último evento de puntero pendiente de aplicar (batcheo por frame).
        let pendingMouse: { x: number; y: number } | null = null;

        const PULL_STRENGTH = pullStrength;
        const MAGNETIC_RADIUS = magneticRadius;
        // Radio de órbita: las partículas se equilibran en un ANILLO a esta
        // distancia del cursor en vez de colapsar al punto. Por debajo se las
        // repelle hacia afuera; por encima (hasta MAGNETIC_RADIUS) se atraen.
        // Sin esto, la atracción puramente radial acumula todo en un blob pegado
        // al cursor sin importar cuán grande sea MAGNETIC_RADIUS.
        const ORBIT_RADIUS = Math.round(MAGNETIC_RADIUS * 0.55);
        const PUSH_STRENGTH = PULL_STRENGTH * 3; // repulsión más fuerte que la atracción
        // Remolino de velocidad CONSTANTE: la componente tangencial se mezcla
        // hacia un objetivo fijo (no un impulso que acumula), así no acelera al
        // acercarse al cursor. SWIRL_RESPONSE controla cuánto tarda en alcanzar
        // esa velocidad (suaviza la entrada/salida del radio).
        const SWIRL_SPEED = swirlSpeed;
        const SWIRL_RESPONSE = 0.08;

        const isMobile = window.innerWidth < 768;
        const count = isMobile ? Math.round(particleCount / 3) : particleCount;

        class Particle {
            x = 0;
            y = 0;
            vx = 0;
            vy = 0;
            size = 0;
            alpha = 0;
            isGlass = false;
            rotation = 0;
            rotationSpeed = 0;
            frictionGlow = 0;

            constructor() {
                this.reset(true);
            }

            reset(initial = false) {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 1.5 + 0.5;
                this.vx = (Math.random() - 0.5) * 0.2;
                this.vy = (Math.random() - 0.5) * 0.2;
                // 70% carbón, 30% vidrio/acentos. El color real se resuelve en
                // draw() leyendo paletteRef (así cambia con el tema sin re-alloc).
                this.isGlass = Math.random() > 0.7;
                this.alpha = Math.random() * 0.4 + 0.1;
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.05;
                this.frictionGlow = 0;
                // En re-spawn por pantalla, no conservar la posición inicial.
                if (!initial) {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                }
            }

            update() {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;

                if (dist < MAGNETIC_RADIUS) {
                    // Radial (hacia el centro): gravedad/atracción.
                    const rx = dx / dist;
                    const ry = dy / dist;

                    // Atracción suave hacia el radio de órbita (no al centro):
                    // por debajo de ORBIT_RADIUS repelimos hacia afuera, por
                    // encima atraemos hacia adentro. La magnitud crece con la
                    // distancia al anillo, así las partículas se asientan ahí.
                    const distFromOrbit = dist - ORBIT_RADIUS;
                    const radialForce =
                        -Math.sign(distFromOrbit) *
                        Math.min(Math.abs(distFromOrbit) / ORBIT_RADIUS, 1) *
                        PULL_STRENGTH;
                    this.vx -= rx * radialForce; // -: hacia fuera si distFromOrbit<0
                    this.vy -= ry * radialForce;

                    // Repulsión extra cerca del núcleo: evita que partículas que
                    // llegan muy al centro se queden pegadas al cursor.
                    if (dist < ORBIT_RADIUS) {
                        const coreForce =
                            ((ORBIT_RADIUS - dist) / ORBIT_RADIUS) * PUSH_STRENGTH;
                        this.vx -= rx * coreForce;
                        this.vy -= ry * coreForce;
                    }

                    // Proximidad al cursor (0 en el borde del radio, 1 en el centro):
                    // solo para ponderar el remolino y el glow, no la atracción.
                    const proximity = (MAGNETIC_RADIUS - dist) / MAGNETIC_RADIUS;

                    // Tangencial (remolino): velocidad objetivo CONSTANTE, no un
                    // impulso que se acumula. Mezclamos la componente tangencial
                    // hacia SWIRL_SPEED ponderado por `proximity` (entrada/salida
                    // suave del radio) → el remolino gira siempre a la misma velocidad,
                    // sin acelerarse cuando una partícula se acerca al cursor.
                    const tx = -dy / dist; // perpendicular (sentido horario)
                    const ty = dx / dist;
                    const vt = this.vx * tx + this.vy * ty;
                    const blend = proximity * SWIRL_RESPONSE;
                    const newVt = vt + (SWIRL_SPEED - vt) * blend;
                    this.vx += tx * (newVt - vt);
                    this.vy += ty * (newVt - vt);

                    this.frictionGlow = proximity * 0.7;
                } else {
                    this.frictionGlow *= 0.92;
                }

                this.x += this.vx;
                this.y += this.vy;

                // Fricción / amortiguación.
                this.vx *= 0.95;
                this.vy *= 0.95;

                // Jitter de fondo (sensación estática congelada).
                this.vx += (Math.random() - 0.5) * 0.04;
                this.vy += (Math.random() - 0.5) * 0.04;

                // Rotación CONSTANTE por partícula: solo su rotationSpeed (fija),
                // sin escalar con la velocidad — así las esquirlas no giran más
                // rápido cuando el vórtice las acelera.
                this.rotation += this.rotationSpeed;

                // Wrap de pantalla.
                if (this.x < -20) this.x = width + 20;
                if (this.x > width + 20) this.x = -20;
                if (this.y < -20) this.y = height + 20;
                if (this.y > height + 20) this.y = -20;
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);

                const pal = paletteRef.current;
                const color = this.isGlass ? pal.glass : pal.charcoal;
                const finalAlpha = Math.min(this.alpha + this.frictionGlow, 0.9);
                ctx.fillStyle = `rgba(${color}, ${finalAlpha})`;

                // Sin shadowBlur: es una de las ops Canvas 2D más caras (re-raster
                // del shadow por draw, 100+ por frame). El rastro por alpha del
                // motion-blur sigue dando la sensación de glow.

                // Geometría de esquirla afilada.
                ctx.beginPath();
                ctx.moveTo(0, -this.size * 2.5);
                ctx.lineTo(this.size, 0);
                ctx.lineTo(0, this.size * 2.5);
                ctx.lineTo(-this.size, 0);
                ctx.closePath();
                ctx.fill();

                ctx.restore();
            }
        }

        const init = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            particles = [];
            for (let i = 0; i < count; i++) particles.push(new Particle());
        };

        let lastTs = 0;
        const render = (ts: number) => {
            animationFrameId = requestAnimationFrame(render);
            // Pausa real cuando la pestaña no es visible (ahorro de CPU).
            if (document.hidden) return;
            // Cap a ~30fps: el efecto es lento, visualmente idéntico, y mitada
            // el tiempo de main-thread.
            if (ts - lastTs < 32) return;
            lastTs = ts;

            // Aplica el último evento de puntero pendiente (batcheo por frame
            // en vez de escribir en cada mousemove).
            if (pendingMouse) {
                mouse.x = pendingMouse.x;
                mouse.y = pendingMouse.y;
                pendingMouse = null;
            }

            // Motion-blur tenue: velo del color de fondo que difumina el rastro.
            ctx.fillStyle = paletteRef.current.fill;
            ctx.fillRect(0, 0, width, height);

            for (const p of particles) {
                p.update();
                p.draw();
            }
        };

        const renderStatic = () => {
            // Frame único sin bucle (movimiento reducido): fondo limpio + partículas.
            ctx.fillStyle = paletteRef.current.fill;
            ctx.fillRect(0, 0, width, height);
            for (const p of particles) p.draw();
        };

        const handleMouseMove = (e: MouseEvent) => {
            pendingMouse = { x: e.clientX, y: e.clientY };
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches[0]) {
                pendingMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
        };
        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
            pendingMouse = null;
        };

        init();

        if (reduceMotion) {
            renderStatic();
        } else {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('touchmove', handleTouchMove, {
                passive: true,
            });
            window.addEventListener('mouseout', handleMouseLeave);
            requestAnimationFrame(render);
        }

        // Resize: debouncea por rAF para no re-allocar el array en cada evento.
        let resizeRaf = 0;
        const onResize = () => {
            cancelAnimationFrame(resizeRaf);
            resizeRaf = requestAnimationFrame(() => init());
        };
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
            cancelAnimationFrame(resizeRaf);
        };
    }, [reduceMotion, magneticRadius, pullStrength, swirlSpeed, particleCount]);

    return (
        <div className={cn('fixed inset-0 -z-50 pointer-events-none', className)}>
            <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
        </div>
    );
}

export default ASMRBackground;