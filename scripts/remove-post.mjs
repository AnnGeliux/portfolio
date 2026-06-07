#!/usr/bin/env node
/* scripts/remove-post.mjs
   Elimina un post del blog (archivo individual + entrada del índice).

   Uso:
     node scripts/remove-post.mjs <slug>
     echo "s" | node scripts/remove-post.mjs <slug>   (confirma sin prompt)

   Pide confirmación antes de borrar. */

import { readFile, writeFile, unlink, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const POSTS_DIR = join(ROOT, 'data', 'posts');
const INDEX_PATH = join(POSTS_DIR, 'posts.json');

async function fileExists(path) {
    try { await access(path); return true; }
    catch { return false; }
}

function makePrompter(out = stdout) {
    const rl = createInterface({ input: stdin, terminal: false, crlfDelay: Infinity });
    const queue = [];
    const drainers = [];
    let closed = false;
    rl.on('line', (line) => {
        if (drainers.length > 0) drainers.shift()(line);
        else queue.push(line);
    });
    rl.on('close', () => { closed = true; });
    async function nextLine() {
        if (queue.length > 0) return queue.shift();
        if (closed) return null;
        return new Promise((resolve) => drainers.push(resolve));
    }
    async function ask(question, defaultValue = '') {
        const suffix = defaultValue ? ` [${defaultValue}]` : '';
        out.write(`${question}${suffix}: `);
        const line = await nextLine();
        const value = (line ?? '').trim() || defaultValue;
        out.write(`  → ${value}\n`);
        return value;
    }
    return { ask, close: () => rl.close() };
}

async function main() {
    const slug = process.argv[2];
    if (!slug) {
        console.error('✗ Falta el slug. Uso: node scripts/remove-post.mjs <slug>');
        process.exit(1);
    }

    const postPath = join(POSTS_DIR, `${slug}.json`);
    const indexExists = await fileExists(INDEX_PATH);
    const postExists = await fileExists(postPath);

    if (!postExists && !indexExists) {
        console.error(`✗ No existe: ${slug}`);
        process.exit(1);
    }

    let index = [];
    let inIndex = false;
    if (indexExists) {
        index = JSON.parse(await readFile(INDEX_PATH, 'utf8'));
        inIndex = index.some((p) => p.slug === slug);
    }

    if (!postExists && !inIndex) {
        console.error(`✗ El slug "${slug}" no existe en posts.json ni como archivo.`);
        process.exit(1);
    }

    console.log(`Post a eliminar: ${slug}`);
    console.log(`  - Archivo:     ${postExists ? postPath : '(no existe)'}`);
    console.log(`  - En índice:   ${inIndex ? 'sí' : 'no'}`);

    const { ask, close } = makePrompter();
    try {
        const confirm = await ask('¿Confirmas la eliminación? (s/n)', 'n');
        if (!confirm.toLowerCase().startsWith('s')) {
            console.log('Cancelado.');
            return;
        }

        if (postExists) {
            await unlink(postPath);
            console.log(`✓ Eliminado: ${postPath}`);
        }

        if (inIndex) {
            const filtered = index.filter((p) => p.slug !== slug);
            await writeFile(INDEX_PATH, JSON.stringify(filtered, null, 2) + '\n', 'utf8');
            console.log(`✓ Índice actualizado: ${index.length} → ${filtered.length} posts`);
        }

        console.log('\n— Listo. Recuerda hacer commit —');
    } finally {
        close();
    }
}

main().catch((err) => {
    console.error('✗ Error:', err.message);
    process.exit(1);
});
