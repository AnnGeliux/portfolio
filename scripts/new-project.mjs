#!/usr/bin/env node
/* scripts/new-project.mjs
   Wizard CLI para crear un proyecto. Cero dependencias.

   Uso:
     node scripts/new-project.mjs
     (responder las preguntas, una por línea)

   Qué hace:
     1. Pregunta título (es/en), categoría, tags, repoUrl, liveUrl, description (es/en)
     2. Genera id (slug) automáticamente
     3. Selecciona un icono SVG en base a los tags (lookup table)
     4. Crea entrada en data/projects.json
     5. Crea entradas en data/projects.i18n.json y data/projects.i18n.en.json
     6. Ofrece generar un cover placeholder con cover-placeholder.mjs
     7. Ofrece abrir los archivos en el editor */

import { readFile, writeFile, access, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');
const COVERS_DIR = join(ROOT, 'assets', 'project-covers');

/* --- Lookup tables --------------------------------------------------- */

const CATEGORIES = ['deep-learning', 'fullstack', 'automation', 'other'];

const TAG_TO_ICON = {
    python:    'M12 2c-1 0-2 .1-2.9.3C7.1 2.8 5 4.8 5 7v10c0 2.2 2.1 4.2 4.1 4.7.9.2 1.9.3 2.9.3s2-.1 2.9-.3C16.9 21.2 19 19.2 19 17V7c0-2.2-2.1-4.2-4.1-4.7C14 2.1 13 2 12 2zm-1 14H7v-2h4v2zm0-4H7v-2h4v2zm0-4H7V6h4v2zm6 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V6h4v2z',
    django:    'M4 4h16v3H4V4zm0 5h16v3H4V9zm0 5h10v3H4v-3zm0 5h10v3H4v-3z',
    javascript:'M3 3h18v18H3V3zm3 14h2v-3H6V8h2v6h2v-6h2v8H6v-2zm10-7c-1 0-2 .5-2 1.5S15 13 16 13s2 .5 2 1.5-1 1.5-2 1.5v2c2 0 4-1.5 4-3.5S18 11 16 11s-2-.5-2-1.5S15 8 16 8V6c-2 0-4 1.5-4 3.5S14 13 16 13',
    html:      'M3 3l1.5 17L12 22l7.5-2L20 3H3zm14 4H7l.2 2H17l-.5 5-4.5 1.5L7 14l-.2-3h2l.1 1L12 13l3-1 .1-2H6.8L6.4 6H17z',
    css:       'M3 3l1.5 17L12 22l7.5-2L20 3H3zm12 4H7l.2 2H17l-.5 5-4.5 1.5L7 14l-.2-3h2l.1 1L12 13l3-1 .1-2H6.8L6.4 6H15z',
    react:     'M12 2c1 0 2 4 3 6s3 3 3 4-2 2-3 4-2 6-3 6-2-4-3-6-3-3-3-4 2-2 3-4 2-6 3-6z',
    api:       'M4 6h16v3H4V6zm0 5h16v3H4v-3zm0 5h10v3H4v-3z',
    database:  'M4 4c0-1.1 3.6-2 8-2s8 .9 8 2v3c0 1.1-3.6 2-8 2s-8-.9-8-2V4zm0 6c0 1.1 3.6 2 8 2s8-.9 8-2v3c0 1.1-3.6 2-8 2s-8-.9-8-2v-3zm0 6c0 1.1 3.6 2 8 2s8-.9 8-2v3c0 1.1-3.6 2-8 2s-8-.9-8-2v-3z',
    ai:        'M12 2l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1 2-4z',
    ml:        'M3 12h3l2-7 4 14 2-7h7',
    n8n:       'M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z',
    default:   'M4 4h16v16H4V4zm2 2v12h12V6H6zm2 2h8v2H8V8zm0 4h8v2H8v-2z',
};

const TAG_COLORS = {
    python: '#3776ab',
    django: '#0c4b33',
    javascript: '#f7df1e',
    html: '#e34c26',
    css: '#264de4',
    react: '#61dafb',
    api: '#6b7280',
    database: '#336791',
    ai: '#a78bfa',
    ml: '#a78bfa',
    n8n: '#ea4b71',
    default: '#a78bfa',
};

const ICON_ATTRS = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"';

function pickIcon(tags) {
    for (const tag of tags) {
        const k = tag.toLowerCase();
        for (const key of Object.keys(TAG_TO_ICON)) {
            if (k.includes(key) && key !== 'default') {
                return `<svg ${ICON_ATTRS}><path d="${TAG_TO_ICON[key]}"></path></svg>`;
            }
        }
    }
    return `<svg ${ICON_ATTRS}><path d="${TAG_TO_ICON.default}"></path></svg>`;
}

function pickColor(tags) {
    for (const tag of tags) {
        const k = tag.toLowerCase();
        for (const key of Object.keys(TAG_COLORS)) {
            if (k.includes(key) && key !== 'default') return TAG_COLORS[key];
        }
    }
    return TAG_COLORS.default;
}

function slugify(text) {
    return text.toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50);
}

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

function openInEditor(path) {
    const editor = process.env.EDITOR || process.env.VISUAL;
    const candidates = editor ? [editor] : ['code', 'cursor', 'subl', 'notepad++', 'notepad'];
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

async function generateCover(outPath, title, color) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', [
            join(__dirname, 'cover-placeholder.mjs'),
            outPath, title, color,
        ], { stdio: 'inherit' });
        child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`exit ${code}`)));
        child.on('error', reject);
    });
}

/* --- Main ------------------------------------------------------------- */

async function main() {
    const { ask, close } = makePrompter();
    try {
        console.log('=== Nuevo proyecto ===\n');

        const titleEs = await ask('Título (ES)');
        if (!titleEs) { console.error('✗ Título requerido. Abortando.'); process.exit(1); }

        const titleEn = await ask('Título (EN)', titleEs);
        const descEs = await ask('Descripción corta (ES)', '');
        const descEn = await ask('Descripción corta (EN)', descEs);

        console.log(`\nCategorías disponibles: ${CATEGORIES.join(', ')}`);
        const category = await ask('Categoría', 'fullstack');
        if (!CATEGORIES.includes(category)) {
            console.error(`✗ Categoría inválida. Opciones: ${CATEGORIES.join(', ')}`);
            process.exit(1);
        }

        const tagsRaw = await ask('Tags (separados por coma)', '');
        const tags = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];

        const repoUrl = await ask('URL del repo (opcional)', '');
        const liveUrl = await ask('URL de demo (opcional)', '');

        const role = await ask('Rol (Full-stack, Automation, etc.)', 'Full-stack developer');
        const yearStr = await ask('Año', String(new Date().getFullYear()));
        const year = parseInt(yearStr, 10) || new Date().getFullYear();
        const duration = await ask('Duración (ej. "3 meses", "En curso")', 'En curso');

        const id = slugify(titleEs);
        console.log(`\n→ ID generado: ${id}`);

        const projectsPath = join(DATA_DIR, 'projects.json');
        const projectsRaw = await readFile(projectsPath, 'utf8');
        const projects = JSON.parse(projectsRaw);

        if (projects.some((p) => p.id === id)) {
            console.error(`✗ Ya existe un proyecto con id "${id}".`);
            process.exit(1);
        }

        const iconSvg = pickIcon(tags);
        const color = pickColor(tags);

        // 1. projects.json
        const newProject = {
            id,
            category,
            tags,
            iconSvg,
            cover: `./assets/project-covers/${id}.png`,
            ...(repoUrl && { repoUrl }),
            ...(liveUrl && { liveUrl }),
            stars: 0,
            commits: 0,
        };
        projects.unshift(newProject);
        await writeFile(projectsPath, JSON.stringify(projects, null, 2) + '\n', 'utf8');
        console.log(`✓ projects.json actualizado (${projects.length} proyectos)`);

        // 2. projects.i18n.json (ES)
        const i18nEsPath = join(DATA_DIR, 'projects.i18n.json');
        const i18nEs = JSON.parse(await readFile(i18nEsPath, 'utf8'));
        i18nEs[id] = {
            title: titleEs,
            description: descEs,
            details: {
                role,
                year,
                duration,
                techStack: tags.map((name) => ({ name, version: '' })),
                challenges: ['Describe el reto técnico más interesante que enfrentaste.'],
                learned: ['¿Qué aprendiste? ¿Qué harías diferente la próxima vez?'],
            },
        };
        await writeFile(i18nEsPath, JSON.stringify(i18nEs, null, 2) + '\n', 'utf8');
        console.log(`✓ projects.i18n.json actualizado`);

        // 3. projects.i18n.en.json (EN)
        const i18nEnPath = join(DATA_DIR, 'projects.i18n.en.json');
        const i18nEn = JSON.parse(await readFile(i18nEnPath, 'utf8'));
        i18nEn[id] = {
            title: titleEn,
            description: descEn,
            details: {
                role,
                year,
                duration,
                techStack: tags.map((name) => ({ name, version: '' })),
                challenges: ['Describe the most interesting technical challenge you faced.'],
                learned: ['What did you learn? What would you do differently next time?'],
            },
        };
        await writeFile(i18nEnPath, JSON.stringify(i18nEn, null, 2) + '\n', 'utf8');
        console.log(`✓ projects.i18n.en.json actualizado`);

        // 4. Cover
        const wantCover = await ask('\n¿Generar cover placeholder? (s/n)', 's');
        if (wantCover.toLowerCase().startsWith('s')) {
            const coverPath = join(COVERS_DIR, `${id}.png`);
            try {
                if (!(await fileExists(COVERS_DIR))) {
                    await mkdir(COVERS_DIR, { recursive: true });
                }
                await generateCover(coverPath, titleEs, color);
                console.log(`✓ Cover creado: ${coverPath}`);
            } catch (err) {
                console.warn(`⚠ No se pudo generar cover: ${err.message}`);
            }
        }

        // 5. Abrir i18n
        const openIt = await ask('¿Abrir projects.i18n.json en tu editor? (s/n)', 's');
        if (openIt.toLowerCase().startsWith('s')) {
            const editor = openInEditor(i18nEsPath);
            if (editor) console.log(`✓ Abierto con: ${editor}`);
            else console.log(`⚠ No encontré editor. Abre: ${i18nEsPath}`);
        }

        console.log('\n— Listo. Pasos siguientes —');
        console.log('  1. Rellena los placeholders de challenges[] y learned[]');
        console.log('  2. Si tienes un cover real, reemplaza ./assets/project-covers/' + id + '.png');
        console.log('  3. git add data/ assets/ && git commit -m "project: ' + id + '"');

    } finally {
        close();
    }
}

main().catch((err) => {
    console.error('✗ Error:', err.message);
    process.exit(1);
});
