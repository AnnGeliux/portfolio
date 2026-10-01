"use client";

import * as React from "react";
import { cn, usePrefersReducedMotion } from "@/lib/utils";
import { markAppReadyAfterPaint } from "@/lib/app-ready";

interface GooeyTextProps {
  texts: string[];
  morphTime?: number;
  cooldownTime?: number;
  className?: string;
  textClassName?: string;
}

/**
 * Texto que morfea ("gooey") entre las palabras de `texts` usando un filtro
 * SVG de umbral (feColorMatrix). Pensado para destacarse sin competir con un
 * titular: el tamaño/peso/color se controlan vía `textClassName` y el bloque
 * necesita una altura en `className` (los spans son absolutos).
 */
export function GooeyText({
  texts,
  morphTime = 1,
  cooldownTime = 0.25,
  className,
  textClassName
}: GooeyTextProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const text1Ref = React.useRef<HTMLSpanElement>(null);
  const text2Ref = React.useRef<HTMLSpanElement>(null);
  const reduceMotion = usePrefersReducedMotion();

  // Con movimiento reducido: mostrar solo el primer texto de forma estática, sin rAF.
  // Además es la señal de retirada del overlay de arranque (fix B): el span del
  // gooey es el elemento LCP, así que el loader solo se va cuando hay texto real.
  React.useEffect(() => {
    if (!reduceMotion || texts.length === 0) return;
    if (text1Ref.current) {
      text1Ref.current.textContent = texts[0];
      text1Ref.current.style.opacity = "100%";
      text1Ref.current.style.filter = "";
      markAppReadyAfterPaint("gooey-reduced");
    }
  }, [reduceMotion, texts]);

  React.useEffect(() => {
    if (reduceMotion) return;
    if (texts.length === 0) return;

    // Pintado inmediato del primer texto (fix B, 2026-09-30). Antes los spans se
    // rellenaban recién al agotarse el primer cooldown (~0.5s después de
    // hidratar), así que el elemento LCP pasaba ese rato VACÍO y el overlay no
    // tenía contenido real al que sincronizarse. `text2` es el span visible
    // durante el cooldown, así que ahí va texts[0]; text1 queda en texts[last]
    // (invisible) para que al agotarse el cooldown el morph arranque con
    // text1 = texts[0], sin salto. Los estilos inline replican el estado de
    // doCooldown(): sin ellos, ambos spans saldrían a opacity 1 durante el
    // primer frame (doble texto superpuesto).
    if (text1Ref.current && text2Ref.current) {
      text1Ref.current.textContent = texts[(texts.length - 1) % texts.length];
      text1Ref.current.style.opacity = "0%";
      text1Ref.current.style.filter = "";
      text2Ref.current.textContent = texts[0];
      text2Ref.current.style.opacity = "100%";
      text2Ref.current.style.filter = "";
      markAppReadyAfterPaint("gooey");
    }

    if (texts.length < 2) return;

    let rafId = 0;
    let running = true;
    // ¿El contenedor está en el viewport? Lo lleva el IntersectionObserver; lo
    // consulta onVisibility para reanudar al volver a la pestaña sin esperar a
    // un nuevo evento de intersección.
    let intersecting = true;
    let textIndex = texts.length - 1;
    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;

    const setMorph = (fraction: number) => {
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
        text2Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;

        fraction = 1 - fraction;
        text1Ref.current.style.filter = `blur(${Math.min(8 / fraction - 8, 100)}px)`;
        text1Ref.current.style.opacity = `${Math.pow(fraction, 0.4) * 100}%`;
      }
    };

    const doCooldown = () => {
      morph = 0;
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = "";
        text2Ref.current.style.opacity = "100%";
        text1Ref.current.style.filter = "";
        text1Ref.current.style.opacity = "0%";
      }
    };

    const doMorph = () => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;

      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }

      setMorph(fraction);
    };

    function animate() {
      if (!running) return;
      rafId = requestAnimationFrame(animate);
      const newTime = new Date();
      const shouldIncrementIndex = cooldown > 0;
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;

      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          textIndex = (textIndex + 1) % texts.length;
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = texts[textIndex % texts.length];
            text2Ref.current.textContent = texts[(textIndex + 1) % texts.length];
          }
        }
        doMorph();
      } else {
        doCooldown();
      }
    }

    // Pausar el morph cuando el componente sale del viewport (ahorro de CPU).
    // Al volver a ser visible se reanuda desde donde quedó; sin cambio visual.
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        if (entry.isIntersecting && !running) {
          running = true;
          time = new Date(); // evita un salto de dt enorme tras la pausa
          animate();
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      },
      { threshold: 0 },
    );
    if (containerRef.current) intersectionObserver.observe(containerRef.current);

    // Pausar también cuando la pestaña pasa a segundo plano (mismo ahorro que
    // ASMRBackground y el shader del Hero). Al volver, reanuda solo si sigue
    // en viewport (intersecting), sin depender de un nuevo evento de IO.
    const onVisibility = () => {
      if (document.hidden) {
        if (running) {
          running = false;
          cancelAnimationFrame(rafId);
          rafId = 0;
        }
      } else if (intersecting && !running) {
        running = true;
        time = new Date();
        animate();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    animate();

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [texts, morphTime, cooldownTime, reduceMotion]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140"
            />
          </filter>
        </defs>
      </svg>

      <div
        className="flex items-center justify-center"
        style={{ filter: "url(#threshold)" }}
      >
        <span
          ref={text1Ref}
          className={cn(
            "absolute inline-block select-none text-center text-4xl md:text-5xl font-medium text-(--color-fg)",
            textClassName
          )}
        />
        <span
          ref={text2Ref}
          className={cn(
            "absolute inline-block select-none text-center text-4xl md:text-5xl font-medium text-(--color-fg)",
            textClassName
          )}
        />
      </div>
    </div>
  );
}