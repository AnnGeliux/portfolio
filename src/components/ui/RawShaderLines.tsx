import { useEffect, useRef, useState } from 'react';

/**
 * Recreación del viejo "shader lines" (commit 071c18d^, shader-lines.tsx con
 * three.js) en WebGL crudo — cero dependencias. Mismo fragment shader GLSL,
 * mismo look de líneas/túnel RGB, pero sin three.js (eran 122 KB gz).
 *
 * Diferencias a propósito vs el original:
 *  - Corre en cualquier tamaño de pantalla (el original se apagaba <640px).
 *  - Pausa al salir del viewport / ocultar la pestaña (rAF, no speed prop).
 *  - Fondo transparente sobre .hero-shader-fallback (theme-aware por CSS).
 */
const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
  #define TWO_PI 6.2831853072
  #define PI 3.14159265359
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  varying vec2 vUv;

  float random (in float x) { return fract(sin(x)*1e4); }
  float random (vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233)))*43758.5453123);
  }

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

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function RawShaderLines() {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!mounted || !el || prefersReducedMotion()) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block';
    el.appendChild(canvas);

    const gl = canvas.getContext('webgl', {
      antialias: true,
      alpha: false,
    }) as WebGLRenderingContext | null;
    if (!gl) return; // sin WebGL: se queda el fallback CSS

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s) ?? 'shader compile error');
        return null;
      }
      return s;
    };
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // Quad fullscreen: 2 triángulos
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'resolution');
    const uTime = gl.getUniformLocation(prog, 'time');

    const resize = () => {
      // Cap de píxeles como maxPixelCount del GrainGradient: escala por CSS.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = el.clientWidth * dpr;
      let h = el.clientHeight * dpr;
      const MAX = 1_200_000;
      const px = w * h;
      if (px > MAX) {
        const k = Math.sqrt(MAX / px);
        w *= k;
        h *= k;
      }
      canvas.width = Math.max(1, Math.round(w));
      canvas.height = Math.max(1, Math.round(h));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    // Pausar fuera del viewport / pestaña oculta (mismo patrón que
    // GrainGradientBackground): el rAF simplemente no se pide.
    let inView = true;
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        if (inView && !document.hidden && raf === null) tick(performance.now());
      },
      { threshold: 0 },
    );
    io.observe(el);
    const onVis = () => {
      if (!document.hidden && inView && raf === null) tick(performance.now());
    };
    document.addEventListener('visibilitychange', onVis);

    let raf: number | null = null;
    const t0 = performance.now();
    const tick = (_now: number) => {
      raf = requestAnimationFrame(tick);
      gl.uniform1f(uTime, (performance.now() - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    tick(performance.now());

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      canvas.remove();
    };
  }, [mounted]);

  return (
    <div
      ref={ref}
      aria-hidden
      className="hero-shader-fallback absolute inset-0 h-full w-full"
    />
  );
}

export default RawShaderLines;