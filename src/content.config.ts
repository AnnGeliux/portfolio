import { defineCollection } from 'astro:content';
import { z } from 'astro:schema';
import { glob } from 'astro/loaders';

// Colección de proyectos del portafolio.
// Cada archivo .md/.mdx en src/content/projects define un proyecto.
const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    // Resumen corto para meta description de la página detalle (opcional; si
    // se omite, se usa `description`). Mejor para SEO que reusar el del card.
    summary: z.string().optional(),
    // Lista de tecnologías/herramientas usadas (chips en la UI + article:tag).
    technologies: z.array(z.string()).default([]),
    // Categoría/tema (agrupación opcional para hubs y keywords).
    category: z.string().optional(),
    // Temas cubiertos (para ItemList/keywords en la página detalle).
    topics: z.array(z.string()).default([]),
    // Ruta del archivo de portada dentro de /public (ej: /projects/foo.png).
    coverImage: z.string(),
    // Fecha usada para ordenar (YYYY-MM-DD).
    pubDate: z.coerce.date(),
    // Marcar proyectos destacados para mostrar primero.
    featured: z.boolean().default(false),
    githubUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
  }),
});

// Colección de certificaciones / credenciales.
const certifications = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/certifications' }),
  schema: z.object({
    name: z.string(),
    institution: z.string(),
    // Resumen corto para meta description (opcional).
    summary: z.string().optional(),
    // Temas/competencias cubiertas (EducationalOccupationalCredential).
    topics: z.array(z.string()).default([]),
    // Especialización a la que pertenece (agrupa cursos en el hub).
    specialization: z.string().optional(),
    // ID de la credencial (estructurado, opcional).
    credentialId: z.string().optional(),
    // Fecha de emisión (YYYY-MM-DD).
    issueDate: z.coerce.date(),
    // Ruta del logo dentro de /public.
    logo: z.string(),
    credentialUrl: z.string().url().optional(),
  }),
});

export const collections = { projects, certifications };