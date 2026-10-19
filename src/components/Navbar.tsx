import { useEffect, useRef } from "react";
import { navigate } from "astro:transitions/client";
import { Folder, Home, Mail, Search, User } from "lucide-react";
import { ExpandableTabs, type Tab } from "./ui/expandable-tabs";
import { ThemeToggle } from "./ui/theme-toggle";
import { usePrefersReducedMotion } from "@/lib/utils";
import { openCommandPalette } from "@/stores/command-palette";

const TABS: Tab[] = [
  { title: "Inicio", icon: Home, href: "#hero" },
  { title: "Proyectos", icon: Folder, href: "#projects" },
  { title: "Sobre mí", icon: User, href: "#about" },
  { title: "Contacto", icon: Mail, href: "#contact" },
];

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

/**
 * Navbar fija con navegación a las secciones principales, buscador `Cmd+K` y
 * toggle de tema.
 *
 * - En la home (`/`), los tabs hacen `scrollIntoView` suave hacia la sección.
 * - Desde páginas interiores (`/proyectos/*`, `/certificaciones/*`, `/blog/*`,
 *   `/sobre-mi/`), donde las secciones `#hero`/`#projects`/`#about`/`#contact`
 *   no existen en el DOM actual, redirige a la home con `<ClientRouter />` y
 *   aterriza en el ancla solicitada al completar `astro:page-load`.
 */
export default function Navbar() {
  const reduceMotion = usePrefersReducedMotion();
  const navRef = useRef<HTMLElement>(null);
  const pendingHashRef = useRef<string | null>(null);

  useEffect(() => {
    const onPageLoad = () => {
      const targetHash = pendingHashRef.current || window.location.hash;
      if (!targetHash) return;
      pendingHashRef.current = null;
      if (targetHash === "#hero") {
        window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
        return;
      }
      const el = document.querySelector(targetHash);
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "start",
          });
        });
      }
    };
    document.addEventListener("astro:page-load", onPageLoad);
    return () => document.removeEventListener("astro:page-load", onPageLoad);
  }, [reduceMotion]);

  const scrollToSection = (href: string | undefined) => {
    if (!href) return;
    const hash = href.startsWith("#") ? href : `#${href.split("#")[1] ?? ""}`;
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
      return;
    }

    // Página interior: navega a la home y aterriza en la sección.
    pendingHashRef.current = hash;
    const targetUrl = hash === "#hero" ? `${base}/` : `${base}/${hash}`;
    navigate(targetUrl).catch(() => {
      window.location.assign(targetUrl);
    });
  };

  return (
    <nav
      ref={navRef}
      aria-label="Navegación principal"
      style={{ viewTransitionName: "site-navbar" }}
      className="fixed top-4 inset-x-0 z-50 mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] items-center gap-1 rounded-2xl glass-card px-2 py-1.5 max-sm:w-[calc(100vw-1.5rem)]"
    >
      <ExpandableTabs
        tabs={TABS}
        onSelect={(tab) => scrollToSection(tab.href)}
        className="bg-transparent p-0 rounded-none"
      />
      <div className="mx-0.5 h-6 w-px shrink-0 bg-(--color-border)" aria-hidden="true" />
      <button
        type="button"
        onClick={() => openCommandPalette()}
        aria-label="Abrir buscador y paleta de comandos (Ctrl+K)"
        title="Buscar (Ctrl+K / ⌘K)"
        className="glass-pill inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-(--color-muted) transition hover:text-(--color-fg)"
      >
        <Search className="h-3.5 w-3.5 text-(--color-accent)" aria-hidden="true" />
        <kbd className="hidden font-sans text-[11px] tracking-tight sm:inline">⌘K</kbd>
      </button>
      <ThemeToggle />
    </nav>
  );
}