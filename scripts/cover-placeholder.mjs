#!/usr/bin/env node
/* scripts/cover-placeholder.mjs
   Genera un PNG 800x500 con un título y un tag dominante.
   Usa ImageMagick (magick). Si no está disponible, aborta con error claro.

   Uso:
     node scripts/cover-placeholder.mjs <output-path> "<title>" [tag-color-hex]

   Ejemplo:
     node scripts/cover-placeholder.mjs ./assets/project-covers/mi-app.png "Mi App" #a78bfa */

import { spawn } from 'node:child_process';
import { access, constants } from 'node:fs/promises';
import { dirname } from 'node:path';

const [, , outPath, title, colorArg] = process.argv;

if (!outPath || !title) {
    console.error('Uso: node scripts/cover-placeholder.mjs <out.png> "<title>" [#hexcolor]');
    process.exit(1);
}

const color = colorArg || '#a78bfa';
const { exec } = spawn;

function run(cmd, args) {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { stdio: 'inherit' });
        child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`)));
        child.on('error', reject);
    });
}

async function magickExists() {
    try {
        const { execSync } = await import('node:child_process');
        execSync('magick --version', { stdio: 'ignore' });
        return true;
    } catch { return false; }
}

const titleSafe = title.replace(/"/g, '\\"').slice(0, 60);

(async () => {
    if (!(await magickExists())) {
        console.error('✗ ImageMagick no está instalado o no está en PATH.');
        console.error('  Instálalo desde https://imagemagick.org o usa:');
        console.error('  winget install ImageMagick.ImageMagick');
        process.exit(1);
    }

    // Construir los argumentos
    const args = [
        '-size', '800x500', `xc:${color}`,
        '-fill', 'rgba(0,0,0,0.55)',
        '-draw', 'rectangle 0,180 800,320',
        '-fill', 'white',
        '-font', 'Arial-Bold',
        '-pointsize', '32',
        '-gravity', 'center',
        '-annotate', '+0+0', titleSafe,
        '-fill', 'rgba(255,255,255,0.7)',
        '-font', 'Arial',
        '-pointsize', '16',
        '-gravity', 'south',
        '-annotate', '+0+30', 'Cover placeholder',
        outPath,
    ];

    try {
        await run('magick', args);
        console.log(`✓ Cover creado: ${outPath}`);
    } catch (err) {
        console.error('✗ Error generando cover:', err.message);
        process.exit(1);
    }
})();
