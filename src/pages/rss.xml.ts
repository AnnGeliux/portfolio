import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getCollection } from 'astro:content';
import { profile } from '../data/profile';

// Feed RSS del portafolio: une proyectos + certificaciones, ordenados por
// fecha. Superficie de descubrimiento extra (lectores de feeds, agregadores).
// El `site` que se pasa al feed lleva el base de GitHub Pages para que las URLs
// de los items y el self-link del canal sean absolutas y correctas; los `link`
// de los items son relativos (sin barra inicial) para que se resuelvan contra
// ese base en vez de contra la raíz del dominio.
export async function GET(context: APIContext) {
  const rawBase = import.meta.env.BASE_URL;
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  const siteBase = new URL(base, context.site).toString();

  const projects = await getCollection('projects');
  const certifications = await getCollection('certifications');

  const items = [
    ...projects.map((p) => ({
      title: p.data.title,
      description: p.data.summary ?? p.data.description,
      pubDate: p.data.pubDate,
      link: `proyectos/${p.id}/`,
      categories: p.data.technologies,
    })),
    ...certifications.map((c) => ({
      title: c.data.name,
      description: c.data.summary ?? `${c.data.name} — ${c.data.institution}`,
      pubDate: c.data.issueDate,
      link: `certificaciones/${c.id}/`,
      categories: c.data.topics,
    })),
  ].sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());

  return rss({
    title: `${profile.siteName} — Portafolio`,
    description: profile.blurbEs,
    site: siteBase,
    items,
    customData: `<language>es</language>`,
  });
}