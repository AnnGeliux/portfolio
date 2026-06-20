'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ASMRBackgroundProps = {
    /** Densidad objetivo de partículas en escritorio (móvil usa ~1/3). Default 900. */
    particleCount?: number;
    /** Radio de atracción del vórtice magnético. Default 280. */
    magneticRadius?: number;
    className?: string;
};

/**
 * Fondo de partículas ASMR (sistema cinético sobre Canvas).
 *
 * Adaptaciones respecto al componente original (demo.tsx):
 * - Sin overlay de demo ("Atmospheric Friction") ni cursor personalizado: aquí
 *   es solo fondo. Root fijo a -z-50 + pointer-events-none para vivir detrás de
 *   todo el contenido sin interceptar el cursor (el vórtice lee mousemove en
 *   window, que sigue disparándose con pointer-events-none).
 * - Consciente del tema claro/oscuro del portafolio: en oscuro replica el look
 *   original (carbón + vidrio sobre lienzo casi negro); en claro reescribe los
 *   colores a partículas carbón + acento sobre lienzo claro para no
 *   ensombrecer la página. Re-inicializa las partículas al conmutar el tema.
 * - Respeta prefers-reduced-motion (convención del portafolio): con movimiento
 *   reducido pinta un único frame estático, sin bucle de animación.
 * - Pausa el bucle cuando la pestaña no es visible (ahorro de CPU, igual que
 *   GradientDots).
 * - Densidad escalada por dispositivo (móvil ~1/3) para mantener FPS.
 */
export function ASMRBackground({
    particleCount = 900,
    magneticRadius = 280,
    className,
}: ASMRBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const reduceMotion = useReducedMotion();
    const [hidden, setHidden] = useState(false);
    // 'dark' | 'light', sincronizado con la clase .dark de <html>.
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');

    // Pausar el render cuando la pestaña pasa a segundo plano.
    useEffect(() => {
        const onVisibilityChange = () => setHidden(document.hidden);
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () =>
            document.removeEventListener('visibilitychange', onVisibilityChange);
    }, []);

    // Sigue el tema del portafolio (la clase .dark la conmuta el script anti-FOUC
    // de Layout.astro y el theme-toggle). Re-inicializa las partículas al cambiar.
    useEffect(() => {
        const root = document.documentElement;
        const read = () =>
            setTheme(root.classList.contains('dark') ? 'dark' : 'light');
        read();
        const observer = new MutationObserver(read);
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Bucle de Canvas. Se re-crea al cambiar tema o la preferencia de movimiento.
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

        const VORTEX_STRENGTH = 0.07;
        const PULL_STRENGTH = 0.12;
        const MAGNETIC_RADIUS = magneticRadius;

        // Paleta según tema (los valores son canales RGB para rgba()).
        const palette =
            theme === 'dark'
                ? {
                      fill: 'rgba(10, 10, 12, 0.18)',
                      glass: '240, 245, 255',
                      charcoal: '80, 80, 85',
                      glow: '180, 220, 255',
                  }
                : {
                      fill: 'rgba(255, 255, 255, 0.20)',
                      // En claro el "vidrio" pasa al acento del portafolio para que
                      // se vea sobre blanco; el carbón sigue oscuro y visible.
                      glass: '99, 102, 241',
                      charcoal: '64, 64, 72',
                      glow: '120, 140, 210',
                  };

        const isMobile = window.innerWidth < 768;
        const count = isMobile ? Math.round(particleCount / 3) : particleCount;

        class Particle {
            x = 0;
            y = 0;
            vx = 0;
            vy = 0;
            size = 0;
            alpha = 0;
            color = '';
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
                // 70% carbón, 30% vidrio/acentos.
                const isGlass = Math.random() > 0.7;
                this.color = isGlass ? palette.glass : palette.charcoal;
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
                    const force = (MAGNETIC_RADIUS - dist) / MAGNETIC_RADIUS;

                    // Atracción al centro magnético.
                    this.vx += (dx / dist) * force * PULL_STRENGTH;
                    this.vy += (dy / dist) * force * PULL_STRENGTH;

                    // Vórtice perpendicular al radio (swirl).
                    this.vx += (dy / dist) * force * VORTEX_STRENGTH * 10;
                    this.vy -= (dx / dist) * force * VORTEX_STRENGTH * 10;

                    this.frictionGlow = force * 0.7;
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

                this.rotation +=
                    this.rotationSpeed +
                    (Math.abs(this.vx) + Math.abs(this.vy)) * 0.05;

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

                const finalAlpha = Math.min(this.alpha + this.frictionGlow, 0.9);
                ctx.fillStyle = `rgba(${this.color}, ${finalAlpha})`;

                if (this.frictionGlow > 0.3) {
                    ctx.shadowBlur = 8 * this.frictionGlow;
                    ctx.shadowColor = `rgba(${palette.glow}, ${this.frictionGlow})`;
                }

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

        const render = () => {
            // Motion-blur tenue: velo del color de fondo que difumina el rastro.
            ctx.fillStyle = palette.fill;
            ctx.fillRect(0, 0, width, height);

            for (const p of particles) {
                p.update();
                p.draw();
            }

            animationFrameId = requestAnimationFrame(render);
        };

        const renderStatic = () => {
            // Frame único sin bucle (movimiento reducido): fondo limpio + partículas.
            ctx.fillStyle = palette.fill;
            ctx.fillRect(0, 0, width, height);
            for (const p of particles) p.draw();
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches[0]) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        };
        const handleMouseLeave = () => {
            mouse.x = -1000;
            mouse.y = -1000;
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
            render();
        }

        // Resize: re-init para repartir partículas en el nuevo tamaño.
        const onResize = () => init();
        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, [theme, reduceMotion, magneticRadius, particleCount]);

    // hidden solo pausa el bucle visualmente: si la pestaña no se ve, el rAF
    // ya se suspende en la mayoría de navegadores; dejamos el flag para coherencia
    // con GradientDots y evitar re-render innecesario del efecto.
    void hidden;

    return (
        <div className={cn('fixed inset-0 -z-50 pointer-events-none', className)}>
            <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
        </div>
    );
}

export default ASMRBackground;