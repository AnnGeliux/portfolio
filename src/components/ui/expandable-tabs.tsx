"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface Tab {
  title: string;
  icon: LucideIcon;
  /** Selector CSS (p. ej. "#about") al que se navega al seleccionar el tab. */
  href?: string;
  type?: never;
}

interface Separator {
  type: "separator";
  title?: never;
  icon?: never;
  href?: never;
}

type TabItem = Tab | Separator;

interface ExpandableTabsProps {
  tabs: TabItem[];
  className?: string;
  /** Callback al seleccionar un tab (recibe el Tab, no los separators). */
  onSelect?: (tab: Tab) => void;
}

export function ExpandableTabs({ tabs, className, onSelect }: ExpandableTabsProps) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const outsideClickRef = React.useRef<HTMLDivElement>(null);
  const internalNavRef = React.useRef(false);

  // Reemplaza useOnClickOutside (usehooks-ts) por un listener inline: mismo
  // comportamiento (cerrar al pulsar fuera del contenedor) sin arrastrar la
  // dependencia. pointerdown unifica mouse + touch.
  // También limpia la selección si ocurre una navegación externa (Cmd+K, enlaces)
  // o al aterrizar en una ruta interior donde los anchors de la home no aplican.
  React.useEffect(() => {
    const el = outsideClickRef.current;
    if (!el) return;
    const onPointer = (e: PointerEvent) => {
      if (!el.contains(e.target as Node)) setSelected(null);
    };
    const onBeforePrep = () => {
      if (!internalNavRef.current) {
        setSelected(null);
      }
      internalNavRef.current = false;
    };
    const onPageLoad = () => {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const normPath = window.location.pathname.replace(/\/$/, "");
      if (normPath !== base) {
        setSelected(null);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("astro:before-preparation", onBeforePrep);
    document.addEventListener("astro:page-load", onPageLoad);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("astro:before-preparation", onBeforePrep);
      document.removeEventListener("astro:page-load", onPageLoad);
    };
  }, []);

  const handleSelect = (index: number) => {
    internalNavRef.current = true;
    setSelected(index);
    const tab = tabs[index];
    if (tab && tab.type !== "separator") onSelect?.(tab);
  };

  const Separator = () => (
    <div className="mx-1 h-[24px] w-[1.2px] bg-(--color-border)" aria-hidden="true" />
  );

  return (
    <div
      ref={outsideClickRef}
      className={cn(
        "flex flex-wrap items-center gap-1 rounded-2xl p-1",
        // Menú móvil (decisión A de Angel, Task 3 del plan): en <640px los
        // chips hacen scroll horizontal con snap en vez de envolver en 2
        // filas. Patrón nativo, cero JS. Scrollbar oculto (look de chip-rail).
        "max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:snap-x max-sm:snap-proximity",
        "max-sm:[scrollbar-width:none] max-sm:*:[::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        const isSelected = selected === index;
        const base = import.meta.env.BASE_URL.replace(/\/$/, "");
        const resolvedHref = tab.href
          ? tab.href.startsWith("#")
            ? `${base}/${tab.href}`
            : tab.href
          : "#";
        return (
          <a
            key={tab.title}
            href={resolvedHref}
            onClick={(e) => {
              // No navegación nativa directa: Navbar decide si hace scrollIntoView
              // (en la home) o navega con ClientRouter hacia la home desde páginas
              // interiores. El href resuelto queda en el DOM para crawlers y nueva pestaña.
              e.preventDefault();
              handleSelect(index);
            }}
            aria-current={isSelected ? "page" : undefined}
            aria-label={tab.title}
            className={cn(
              "relative flex items-center rounded-xl py-2 text-sm font-medium transition-all duration-300 ease-out motion-reduce:transition-none max-sm:snap-start",
              isSelected
                ? "gap-2 px-4 bg-(--color-surface) text-(--color-accent)"
                : "gap-0 px-2 text-(--color-muted) hover:bg-(--color-surface) hover:text-(--color-fg)",
            )}
          >
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            {/* Texto accesible siempre presente (sr-only) para que el botón tenga
                un nombre discernible incluso cuando no está seleccionado y solo
                muestra el icono. Satisface la auditoría de árbol de accesibilidad
                para agentes IA, además de axe-core/Lighthouse. */}
            <span className="sr-only">{tab.title}</span>
            {/*
              Etiqueta visible: se expande/contrae con grid-template-columns
              0fr→1fr (reemplazo CSS de AnimatePresence + motion width:auto,
              que no es animable directamente). El contenido interno queda
              recortado por overflow:hidden cuando la columna es 0fr. Con
              movimiento reducido la transición es instantánea.
            */}
            <span
              aria-hidden="true"
              className="grid overflow-hidden whitespace-nowrap transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none"
              style={{ gridTemplateColumns: isSelected ? "1fr" : "0fr" }}
            >
              <span
                className="overflow-hidden opacity-0 transition-opacity duration-300 ease-out motion-reduce:transition-none"
                style={{ opacity: isSelected ? 1 : 0 }}
              >
                {tab.title}
              </span>
            </span>
          </a>
        );
      })}
    </div>
  );
}

export default ExpandableTabs;