#!/usr/bin/env node
/* scripts/new-post.mjs
   Wizard CLI para crear un post del blog. Cero dependencias.

   Uso:
     node scripts/new-post.mjs                  → te pide el título
     node scripts/new-post.mjs "Mi título"      → usa el título como argumento

   Qué hace:
     1. Slugifica el título (kebab-case, sin acentos)
     2. Pregunta idioma (es/en) y tags
     3. Crea data/posts/<slug>.json con esqueleto (date=hoy, title, body vacío)
     4. Actualiza data/posts/posts.json agregando el slug al índice
     5. Ofrece abrir el archivo en tu editor ($EDITOR, code, o notepad)

   Para deshacer: node scripts/remove-post.mjs <slug>

   Soporta input por archivo: node scripts/new-post.mjs "Título" < input.txt
   (En ese modo, las preguntas se responden secuencialmente con líneas del archivo.) */

import { readFile, writeFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const POSTS_DIR = join(ROOT, 'data', 'posts');
const INDEX_PATH = join(POSTS_DIR, 'posts.json');

/* --- Helpers ---------------------------------------------------------- */

function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar diacríticos
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 60);
}

function todayISO() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

async function fileExists(path) {
    try { await access(path); return true; }
    catch { return false; }
}

/* Prompter que lee líneas de stdin una a una.
   Si stdin es TTY: pregunta interactivamente.
   Si stdin es pipe/file: lee la siguiente línea disponible; si EOF, devuelve default. */
function makePrompter(out = stdout) {
    const rl = createInterface({ input: stdin, terminal: false, crlfDelay: Infinity });
    let closed = false;
    let pending = null;
    const queue = [];
    const drainers = [];

    rl.on('line', (line) => {
        if (drainers.length > 0) {
            drainers.shift()(line);
        } else {
            queue.push(line);
        }
    });

    rl.on('close', () => { closed = true; });

    function nextLineBlocking() {
        if (queue.length > 0) return Promise.resolve(queue.shift());
        if (closed) return Promise.resolve(null);
        return new Promise((resolve) => drainers.push(resolve));
    }

    async function ask(question, defaultValue = '') {
        const suffix = defaultValue ? ` [${defaultValue}]` : '';
        out.write(`${question}${suffix}: `);
        const line = await nextLineBlocking();
        const value = (line ?? '').trim() || defaultValue;
        out.write(`  → ${value}\n`);
        return value;
    }

    function close() { rl.close(); }
    return { ask, close };
}

function openInEditor(path) {
    const editor = process.env.EDITOR || process.env.VISUAL;
    const candidates = editor
        ? [editor]
        : ['code', 'cursor', 'subl', 'notepad++', 'notepad'];

    for (const cmd of candidates) {
        try {
            const child = spawn(cmd, [path], { detached: true, stdio: 'ignore' });
            child.on('error', () => {});
            child.unref();
            return cmd;
        } catch (e) {}
    }
    return null;
}

/* --- Main ------------------------------------------------------------- */

async function main() {
    let title = process.argv.slice(2).join(' ').trim();
    const { ask, close } = makePrompter();

    try {
        if (!title) title = await ask('Título del post');
        if (!title) {
            console.error('✗ Título vacío. Abortando.');
            process.exit(1);
        }

        const defaultSlug = slugify(title);
        let slug = await ask('Slug (sin extensión)', defaultSlug);
        slug = slugify(slug);
        if (!slug) {
            console.error('✗ Slug inválido. Abortando.');
            process.exit(1);
        }

        const postPath = join(POSTS_DIR, `${slug}.json`);
        if (await fileExists(postPath)) {
            console.error(`✗ Ya existe: ${postPath}`);
            console.error('  Usa otro slug o ejecuta: node scripts/remove-post.mjs ' + slug);
            process.exit(1);
        }

        const lang = await ask('Idioma inicial (es/en)', 'es');
        if (!['es', 'en'].includes(lang)) {
            console.error('✗ Idioma debe ser "es" o "en". Abortando.');
            process.exit(1);
        }

        const tagsRaw = await ask('Tags (separados por coma)', '');
        const tags = tagsRaw
            ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
            : [];

        const excerpt = await ask('Excerpt (1-2 frases, opcional)', '');

        const date = todayISO();
        const postContent = {
            slug,
            date,
            title: { [lang]: title, ...(lang === 'es' ? { en: '' } : { es: '' }) },
            tags,
            body: '## Intro\n\nEmpieza a escribir aquí. Markdown se renderiza con `marked.js`.\n\n## Sección 1\n\nTexto...\n\n```js\nconst code = "se renderiza con highlighting";\n```\n',
        };
        if (excerpt) {
            postContent.excerpt = { [lang]: excerpt, ...(lang === 'es' ? { en: '' } : { es: '' }) };
        }
        await writeFile(postPath, JSON.stringify(postContent, null, 2) + '\n', 'utf8');
        console.log(`✓ Creado: data/posts/${slug}.json`);

        const indexRaw = await readFile(INDEX_PATH, 'utf8');
        const index = JSON.parse(indexRaw);
        const newEntry = {
            slug,
            date,
            title: { [lang]: title, ...(lang === 'es' ? { en: '' } : { es: '' }) },
            tags,
        };
        if (excerpt) {
            newEntry.excerpt = { [lang]: excerpt, ...(lang === 'es' ? { en: '' } : { es: '' }) };
        }
        index.unshift(newEntry);
        await writeFile(INDEX_PATH, JSON.stringify(index, null, 2) + '\n', 'utf8');
        console.log(`✓ Actualizado: data/posts/posts.json (total: ${index.length} posts)`);

        const openIt = await ask('¿Abrir en tu editor? (s/n)', 's');
        if (openIt.toLowerCase().startsWith('s')) {
            const editor = openInEditor(postPath);
            if (editor) console.log(`✓ Abierto con: ${editor}`);
            else console.log(`⚠ No encontré editor. Abre manualmente: ${postPath}`);
        }

        console.log('\n— Listo. Pasos siguientes —');
        console.log('  1. Edita el body en Markdown.');
        console.log('  2. Si quieres, rellena el idioma que dejaste en blanco.');
        console.log('  3. git add data/posts/ && git commit -m "post: ' + slug + '"');
    } finally {
        close();
    }
}

main().catch((err) => {
    console.error('✗ Error:', err.message);
    process.exit(1);
});
