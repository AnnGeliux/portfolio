import { GooeyText } from './ui/gooey-text-morphing';
import { ContactIcon, type SocialKind } from './ui/social-icons';

interface ContactLink {
  kind: SocialKind;
  label: string;
  href: string;
}

interface HeroProps {
  /** Nombre destacado con shader de metal líquido (ej. "Angel Francisco"). */
  firstName: string;
  /** Apellidos como subtítulo discreto (ej. "Palestina Blancas"). */
  lastName?: string;
  specialty: string;
  /** Palabras que morfean ("gooey") en el lugar del tagline. */
  morphTexts?: string[];
  /** Texto del badge de status (indicador "en vivo" bajo el nombre). */
  status?: string;
  /** Botones de contacto que se muestran bajo el texto morfológico. */
  contacts?: ContactLink[];
}

/*
 * Animación de entrada: antes con framer-motion (variantes `container`/`item`
 * con staggerChildren), ahora CSS puro. La sección lleva `.hero-enter` y cada
 * hijo directo hace fade-in + translateY(24px)→0 con stagger por nth-child
 * (ver @keyframes hero-enter en global.css). Al ser CSS, arranca en el primer
 * paint sin esperar a la hidratación idle de la isla React.
 */
export default function Hero({
  firstName,
  lastName,
  specialty,
  morphTexts,
  status = 'Actualmente aprendiendo',
  contacts = [],
}: HeroProps) {
  return (
    <section className="hero-enter relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 py-28 text-center sm:py-36">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full glass-pill px-4 py-1.5 text-sm font-medium text-(--hero-fg)">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-accent) opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-accent)" />
        </span>
        <span>{status}</span>
      </div>

      <div className="flex flex-col items-center">
        <h1 className="hero-name font-display text-5xl font-bold tracking-tight sm:text-7xl">
          {firstName}
        </h1>

        {lastName && (
          <span className="mt-2 text-sm font-medium uppercase tracking-[0.25em] text-(--hero-fg-muted) sm:text-base">
            {lastName}
          </span>
        )}
      </div>

      <p className="mt-6 text-xl font-medium text-(--hero-fg-soft) sm:text-2xl">
        {specialty}
      </p>

      {morphTexts && morphTexts.length > 0 && (
        <div className="mt-8 flex w-full justify-center">
          <GooeyText
            texts={morphTexts}
            morphTime={2.5}
            cooldownTime={0.5}
            className="h-16 md:h-20 w-full max-w-3xl"
            textClassName="font-display tracking-tight"
          />
        </div>
      )}

      {contacts.length > 0 && (
        <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {contacts.map((c) => {
            const external = c.kind === 'github' || c.kind === 'linkedin';
            return (
              <li key={c.kind}>
                <a
                  href={c.href}
                  {...(external
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className="inline-flex items-center gap-2 rounded-full glass-pill px-4 py-2 text-sm font-medium text-(--hero-fg-soft) transition hover:-translate-y-0.5 hover:border-(--color-accent) hover:text-(--color-accent)"
                >
                  <ContactIcon kind={c.kind} className="h-4 w-4" />
                  {c.label}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}