import { useState } from 'react';
import {
  ColorPanels,
  DotGrid,
  DotOrbit,
  Dithering,
  GodRays,
  GrainGradient,
  MeshGradient,
  Metaballs,
  NeuroNoise,
  PerlinNoise,
  PulsingBorder,
  SimplexNoise,
  SmokeRing,
  Spiral,
  StaticRadialGradient,
  Swirl,
  Voronoi,
  Warp,
  Waves,
} from '@paper-design/shaders-react';

/**
 * Galería de shaders candidatos para el hero del portafolio.
 * Solo uso /playground (noindex, fuera del sitemap): herramienta de decisión.
 *
 * Cada tarjeta: shader corriendo en vivo con la paleta del sitio
 * (#7300ff/#eba8ff/#00bfff/#2b00ff) o variantes cercanas, maxPixelCount
 * conservador, y badge con el nombre + nota de coste.
 */

const PALETTE = ['#7300ff', '#eba8ff', '#00bfff', '#2b00ff'];
// Variante "site dark": paleta sobre negro
const BACK_DARK = '#000000';
const BACK_LIGHT = '#ffffff';

type Mode = 'dark' | 'light';

interface Entry {
  id: string;
  name: string;
  note: string;
  // cost: cheap | mid | heavy (subjetivo por iteraciones de noise por pixel)
  cost: 'cheap' | 'mid' | 'heavy';
  render: (mode: Mode) => React.ReactNode;
}

const entries: Entry[] = [
  {
    id: 'grain-gradient',
    name: 'GrainGradient (actual)',
    note: 'blobs suaves + grain — el que corre hoy en el hero',
    cost: 'cheap',
    render: (m) => (
      <GrainGradient
        width="100%" height="100%" fit="cover"
        colors={PALETTE} colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
        softness={0.5} intensity={0.5} noise={0.25} shape="corners"
        speed={1} maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'mesh-gradient',
    name: 'MeshGradient',
    note: 'manchas de color fluidas con distorsión orgánica',
    cost: 'mid',
    render: (m) => (
      <MeshGradient
        width="100%" height="100%" fit="cover"
        colors={m === 'dark' ? PALETTE : ['#7300ff', '#eba8ff', '#00bfff']}
        distortion={0.5} swirl={0.5} speed={0.5}
        maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'metaballs',
    name: 'Metaballs',
    note: 'orbes que se funden al tocar — fondo preset vibes',
    cost: 'mid',
    render: (m) => (
      <Metaballs
        width="100%" height="100%" fit="cover"
        colors={PALETTE} colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
        count={6} speed={1} maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'smoke-ring',
    name: 'SmokeRing',
    note: 'anillo de humo radial con noise — atmósfera',
    cost: 'mid',
    render: (m) => (
      <SmokeRing
        width="100%" height="100%" fit="cover"
        colors={PALETTE} colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
        speed={0.6} maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'neuro-noise',
    name: 'NeuroNoise',
    note: 'web de líneas fluidas — orgánico-futurista',
    cost: 'heavy',
    render: (m) => (
      <NeuroNoise
        width="100%" height="100%" fit="cover"
        colorFront="#eba8ff" colorMid="#7300ff"
        colorBack={m === 'dark' ? '#050010' : '#ffffff'}
        speed={0.5} maxPixelCount={500_000}
      />
    ),
  },
  {
    id: 'god-rays',
    name: 'GodRays',
    note: 'rayos de luz volumétrica desde el centro',
    cost: 'mid',
    render: (m) => (
      <GodRays
        width="100%" height="100%" fit="cover"
        colors={PALETTE} colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
        speed={0.5} maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'spiral',
    name: 'Spiral',
    note: 'espiral de trazos — geométrico, tipo shader-lines viejo',
    cost: 'cheap',
    render: (m) => (
      <Spiral
        width="100%" height="100%" fit="cover"
        colorFront="#7300ff" colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
        speed={0.6} maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'voronoi',
    name: 'Voronoi',
    note: 'celdas con glow — techy',
    cost: 'mid',
    render: () => (
      <Voronoi
        width="100%" height="100%" fit="cover"
        colors={['#0a0018', '#2b00ff', '#7300ff', '#eba8ff']}
        speed={0.5} maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'warp',
    name: 'Warp',
    note: 'paleta distorsionada en bandas — psicodélico suave',
    cost: 'heavy',
    render: () => (
      <Warp
        width="100%" height="100%" fit="cover"
        colors={PALETTE} speed={0.4} maxPixelCount={500_000}
      />
    ),
  },
  {
    id: 'swirl',
    name: 'Swirl',
    note: 'bandas retorcidas desde el centro',
    cost: 'mid',
    render: (m) => (
      <Swirl
        width="100%" height="100%" fit="cover"
        colors={PALETTE} colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
        speed={0.5} maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'dot-orbit',
    name: 'DotOrbit',
    note: 'puntos orbitando en colores de la paleta',
    cost: 'cheap',
    render: (m) => (
      <DotOrbit
        width="100%" height="100%" fit="cover"
        colors={PALETTE} colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
        speed={1} maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'dithering',
    name: 'Dithering',
    note: 'dither retro 1-bit (shape/size tuneables)',
    cost: 'cheap',
    render: (m) => (
      <Dithering
        width="100%" height="100%" fit="cover"
        colorFront={m === 'dark' ? '#eba8ff' : '#2b00ff'}
        colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
        size={3} speed={0.5} maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'simplex-noise',
    name: 'SimplexNoise',
    note: 'manchas tipo lava lamp por simplex',
    cost: 'mid',
    render: () => (
      <SimplexNoise
        width="100%" height="100%" fit="cover"
        colors={PALETTE} speed={0.4} maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'perlin-noise',
    name: 'PerlinNoise',
    note: 'flujos perlin — textura orgánica',
    cost: 'mid',
    render: (m) => (
      <PerlinNoise
        width="100%" height="100%" fit="cover"
        colorFront="#7300ff"
        colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
        speed={0.4} maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'color-panels',
    name: 'ColorPanels',
    note: 'paneles de color que se cruzan — editorial',
    cost: 'cheap',
    render: (m) => (
      <ColorPanels
        width="100%" height="100%" fit="cover"
        colors={PALETTE} colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
        speed={0.5} maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'pulsing-border',
    name: 'PulsingBorder',
    note: 'aurora boreal en banda (más para bordes que fondo)',
    cost: 'cheap',
    render: (m) => (
      <PulsingBorder
        width="100%" height="100%" fit="cover"
        colors={PALETTE} colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
        speed={0.6} maxPixelCount={600_000}
      />
    ),
  },
  {
    id: 'static-radial',
    name: 'StaticRadialGradient',
    note: 'gradiente radial estático — el más barato (0 animación)',
    cost: 'cheap',
    render: (m) => (
      <StaticRadialGradient
        width="100%" height="100%" fit="cover"
        colors={PALETTE} colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
      />
    ),
  },
  {
    id: 'dot-grid',
    name: 'DotGrid',
    note: 'grid de puntos — sutil, muy barato',
    cost: 'cheap',
    render: (m) => (
      <DotGrid
        width="100%" height="100%" fit="cover"
        colorFill={m === 'dark' ? '#7300ff' : '#2b00ff'}
        colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
      />
    ),
  },
  {
    id: 'waves',
    name: 'Waves',
    note: 'líneas de onda — sutil y elegante',
    cost: 'cheap',
    render: (m) => (
      <Waves
        width="100%" height="100%" fit="cover"
        colorFront={m === 'dark' ? '#eba8ff' : '#2b00ff'}
        colorBack={m === 'dark' ? BACK_DARK : BACK_LIGHT}
      />
    ),
  },
];

function ShaderCard({ entry, mode }: { entry: Entry; mode: Mode }) {
  return (
    <figure
      className="group relative overflow-hidden rounded-xl border"
      style={{ borderColor: 'var(--color-border, #ffffff22)' }}
    >
      <div
        className="relative block aspect-[16/9] w-full"
        style={{ backgroundColor: mode === 'dark' ? '#000' : '#fff' }}
      >
        {entry.render(mode)}
      </div>
      <figcaption
        className="flex flex-wrap items-baseline justify-between gap-2 p-3"
        style={{
          backgroundColor: mode === 'dark' ? '#0a0a12' : '#fafafa',
          color: mode === 'dark' ? '#eee' : '#222',
        }}
      >
        <span>
          <strong>{entry.name}</strong>
          <span
            style={{ opacity: 0.7 }}
          >
            {' '}— {entry.note}
          </span>
        </span>
        <span
          className="rounded px-1.5 py-0.5 text-xs"
          style={{
            backgroundColor:
              entry.cost === 'cheap'
                ? '#1a7f37'
                : entry.cost === 'mid'
                  ? '#9a6700'
                  : '#cf222e',
            color: '#fff',
          }}
        >
          {entry.cost}
        </span>
      </figcaption>
    </figure>
  );
}

export function ShaderGallery() {
  const [mode, setMode] = useState<Mode>('dark');
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
          className="rounded-lg border px-4 py-2"
          style={{
            borderColor: mode === 'dark' ? '#fff5' : '#0003',
            color: mode === 'dark' ? '#eee' : '#111',
          }}
        >
          Tema: {mode === 'dark' ? '🌙 oscuro' : '☀️ claro'}
        </button>
        <p style={{ color: mode === 'dark' ? '#aaa' : '#666' }}>
          Paleta del sitio: #7300ff · #eba8ff · #00bfff · #2b00ff
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <ShaderCard key={entry.id} entry={entry} mode={mode} />
        ))}
      </div>
    </div>
  );
}

export default ShaderGallery;