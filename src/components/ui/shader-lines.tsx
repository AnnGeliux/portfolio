"use client";

import { useEffect, useRef } from "react";
// Named imports: equivalent to `import * as THREE` pero deja claro qué partes
// de three.js usa este shader. (three no tree-shakea: su entry es el bundle
// plano build/three.module.js, así que el tamaño del chunk no cambia; la
// optimización real es el lazy-load vía client:visible + los guards de
// reduced-motion/pantalla chica, que evitan cargar WebGL en móviles.)
import {
  Camera,
  Mesh,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from "three";

/**
 * Fondo de shader WebGL ("shader lines") que cubre el contenedor padre.
 *
 * Refactor del componente original (que cargaba three.js r89 desde un CDN):
 * - Usa el paquete npm `three` (sin dependencia externa en runtime).
 * - API moderna (PlaneGeometry en lugar de PlaneBufferGeometry).
 * - Cleanup completo de geometría/material/renderer y observadores.
 * - No inicia WebGL con `prefers-reduced-motion` ni en pantallas chicas.
 * - Pausa el bucle de animación cuando el contenedor sale del viewport.
 */
export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<{
    renderer: WebGLRenderer | null;
    scene: Scene | null;
    camera: Camera | null;
    material: ShaderMaterial | null;
    geometry: PlaneGeometry | null;
    uniforms: {
      time: { value: number };
      resolution: { value: Vector2 };
    } | null;
    raf: number | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    material: null,
    geometry: null,
    uniforms: null,
    raf: null,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isSmallScreen = window.innerWidth < 640;

    // Accesibilidad / rendimiento: dejar el scrim de respaldo del Hero.
    if (prefersReduced || isSmallScreen) return;

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // sin soporte WebGL: el Hero mantiene su fondo de respaldo
    }

    const camera = new Camera();
    camera.position.z = 1;

    const scene = new Scene();

    const geometry = new PlaneGeometry(2, 2);

    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new Vector2() },
    };

    const vertexShader = /* glsl */ `
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = /* glsl */ `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      float random (in float x) { return fract(sin(x)*1e4); }
      float random (vec2 st) {
          return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123);
      }
      varying vec2 vUv;

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        vec2 fMosaicScal = vec2(4.0, 2.0);
        vec2 vScreenSize = vec2(256.0, 256.0);
        uv.x = floor(uv.x * vScreenSize.x / fMosaicScal.x) / (vScreenSize.x / fMosaicScal.x);
        uv.y = floor(uv.y * vScreenSize.y / fMosaicScal.y) / (vScreenSize.y / fMosaicScal.y);
        float t = time*0.06 + random(uv.x)*0.4;
        float lineWidth = 0.0008;
        vec3 color = vec3(0.0);
        for(int j = 0; j < 3; j++){
          for(int i = 0; i < 5; i++){
            color[j] += lineWidth*float(i*i) / abs(fract(t - 0.01*float(j) + float(i)*0.01)*1.0 - length(uv));
          }
        }
        gl_FragColor = vec4(color[2], color[1], color[0], 1.0);
      }
    `;

    const material = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });

    const mesh = new Mesh(geometry, material);
    scene.add(mesh);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const setSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width));
      const h = Math.max(1, Math.floor(rect.height));
      renderer.setSize(w, h);
      uniforms.resolution.value.set(
        renderer.domElement.width,
        renderer.domElement.height,
      );
    };
    setSize();

    const resizeObserver = new ResizeObserver(setSize);
    resizeObserver.observe(container);

    stateRef.current = {
      renderer,
      scene,
      camera,
      material,
      geometry,
      uniforms,
      raf: null,
    };

    let running = true;
    let intersecting = true;
    const animate = () => {
      if (!running) return;
      stateRef.current.raf = requestAnimationFrame(animate);
      uniforms.time.value += 0.05;
      renderer.render(scene, camera);
    };

    const stop = () => {
      running = false;
      if (stateRef.current.raf) {
        cancelAnimationFrame(stateRef.current.raf);
        stateRef.current.raf = null;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      animate();
    };

    // Pausar la animación cuando el Hero sale del viewport (ahorro de GPU).
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        intersecting = entry.isIntersecting;
        if (intersecting && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(container);

    // Pausar el rAF cuando la pestaña no es visible (ahorro de GPU en segundo plano).
    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else if (intersecting) start();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    animate();

    return () => {
      running = false;
      if (stateRef.current.raf) cancelAnimationFrame(stateRef.current.raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      stateRef.current = {
        renderer: null,
        scene: null,
        camera: null,
        material: null,
        geometry: null,
        uniforms: null,
        raf: null,
      };
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}