/**
 * Identidad canónica del autor — FUENTE ÚNICA DE VERDAD.
 *
 * Visibilidad SEO: Google resuelve entidades (no keywords). El apellido
 * "Palestina" colisiona con el toponimo geopolítico (Palestina → Palestina el
 * país + ~48 localidades). Para que "Angel Palestina" resuelva a la PERSONA y
 * no al toponimo, rodeamos el nombre de un VECTOR DE CONTEXTO disambiguador
 * (rol + stack + ciudad + universidad) que debe repetirse idéntico en el H1,
 * <title>, meta description, JSON-LD y todos los perfiles externos.
 *
 * Si cambias algo aquí, replica la cadena `taglineEs` textualmente en GitHub,
 * LinkedIn, npm/dev.to y cada byline. La consistencia NAP (name-affiliation-
 * position) entre perfiles es la señal dominante para personal-name queries.
 *
 * Migración a dominio propio (anngeliux.dev): cambiar `astro.config` `site` y
 * `base: '/'` + crear `public/CNAME`. Estos valores no dependen de la URL.
 */

export interface Education {
  institution: string;
  degree: string;
  location: string;
  period: string;
}

export interface Profile {
  fullName: string;        // nombre legal completo (JSON-LD Person.name)
  givenName: string;       // "Angel Francisco"
  familyName: string;      // "Palestina Blancas"
  shortName: string;       // marca corta (footer, title) — "Angel Palestina"
  /** Variantes que Google debe ligar a la MISMA entidad, no fragmentar. */
  alternateNames: string[];
  email: string;
  phone: string;
  github: string;
  githubHandle: string;
  linkedin: string;
  /** Nombre visible del sitio (og:site_name, WebSite.name). */
  siteName: string;
  role: string;            // jobTitle disambiguador
  city: string;            // homeLocation / address
  cityShort: string;       // abreviación para títulos (≤60 chars)
  country: string;          // ISO 3166-1 alpha-2
  /** Frase canónica disambiguadora: rol + stack + ciudad. Repetir textual. */
  taglineEs: string;
  /** Frase canónica larga para description / disambiguatingDescription. */
  blurbEs: string;
  education: Education;
}

export const profile: Profile = {
  fullName: 'Angel Francisco Palestina Blancas',
  givenName: 'Angel Francisco',
  familyName: 'Palestina Blancas',
  shortName: 'Angel Palestina',
  alternateNames: ['Ann', 'Angel Palestina', 'Anngeliux', 'AnnGeliux', 'Angel Francisco Palestina', 'Angel Palestina Blancas'],
  email: 'aangel.palestina@gmail.com',
  phone: '5638588959',
  github: 'https://github.com/AnnGeliux',
  githubHandle: 'AnnGeliux',
  linkedin:
    'https://www.linkedin.com/in/angel-francisco-palestina-blancas-2773b7318/',
  siteName: 'Angel Palestina',
  role: 'Desarrollador Full-Stack & Deep Learning',
  city: 'Ciudad de México',
  cityShort: 'CDMX',
  country: 'MX',
  taglineEs: 'Desarrollador Full-Stack & Deep Learning · CDMX',
  blurbEs:
    'Desarrollador full-stack & Deep Learning en Ciudad de México. ' +
    'Portafolio de Angel Francisco Palestina Blancas, estudiante de ' +
    'Ingeniería en Sistemas especializado en Inteligencia Artificial.',
  education: {
    institution: 'Universidad Tecnológica de México',
    degree:
      'Ingeniería en Sistemas Computacionales · B.S. en Ciencias de la Computación',
    location: 'Ciudad de México, México',
    period: 'Septiembre 2024 — Septiembre 2028 (Expected)',
  },
};

/** @id estable de la entidad Persona (Entity Home = la home). */
export const personSlug = '#person';
/** @id estable del sitio (WebSite). */
export const websiteSlug = '#website';
/** @id estable de la página (WebPage) — se resuelve contra el canonical. */
export const webPageSlug = '#webpage';