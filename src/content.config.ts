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
    // Lista de tecnologías/herramientas usadas (chips en la UI).
    technologies: z.array(z.string()).default([]),
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
    // Fecha de emisión (YYYY-MM-DD).
    issueDate: z.coerce.date(),
    // Ruta del logo dentro de /public.
    logo: z.string(),
    credentialUrl: z.string().url().optional(),
  }),
});

export const collections = { projects, certifications };