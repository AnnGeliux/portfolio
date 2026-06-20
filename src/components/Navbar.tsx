import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { BadgeCheck, Folder, Home, Mail, User } from "lucide-react";
import { ExpandableTabs, type Tab } from "./ui/expandable-tabs";
import { ThemeToggle } from "./ui/theme-toggle";

const TABS: Tab[] = [
  { title: "Inicio", icon: Home, href: "#hero" },
  { title: "Sobre mí", icon: User, href: "#about" },
  { title: "Proyectos", icon: Folder, href: "#projects" },
  { title: "Certificaciones", icon: BadgeCheck, href: "#certs" },
  { title: "Contacto", icon: Mail, href: "#contact" },
];

/**
 * Navbar fija con navegación a las secciones principales + toggle de tema.
 * Reutiliza `.glass-card` para heredar el liquid glass (SVG distortion) y la
 * regla `z-index:-1` que mantiene el texto nítido. El offset de la navbar fija
 * al hacer scroll se resuelve con `scroll-mt-20` en cada sección (index.astro),
 * por lo que `scrollIntoView({ block: "start" })` aterriza sin tapar el título.
 */
export default function Navbar() {
  const reduceMotion = useReducedMotion();
  const navRef = useRef<HTMLElement>(null);

  const scrollToSection = (href: string | undefined) => {
    if (!href) return;
    const el = document.querySelector(href);
    if (!el) return;
    el.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  };

  return (
    <nav
      ref={navRef}
      aria-label="Navegación principal"
      className="fixed top-4 inset-x-0 z-50 mx-auto flex w-fit max-w-[calc(100vw-1.5rem)] items-center gap-1 rounded-2xl glass-card px-2 py-1.5"
    >
      <ExpandableTabs
        tabs={TABS}
        onSelect={(tab) => scrollToSection(tab.href)}
        className="bg-transparent p-0 rounded-none"
      />
      <div className="mx-0.5 h-6 w-px shrink-0 bg-(--color-border)" aria-hidden="true" />
      <ThemeToggle />
    </nav>
  );
}