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

  // Reemplaza useOnClickOutside (usehooks-ts) por un listener inline: mismo
  // comportamiento (cerrar al pulsar fuera del contenedor) sin arrastrar la
  // dependencia. pointerdown unifica mouse + touch.
  React.useEffect(() => {
    const el = outsideClickRef.current;
    if (!el) return;
    const onPointer = (e: PointerEvent) => {
      if (!el.contains(e.target as Node)) setSelected(null);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  const handleSelect = (index: number) => {
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
        className,
      )}
    >
      {tabs.map((tab, index) => {
        if (tab.type === "separator") {
          return <Separator key={`separator-${index}`} />;
        }

        const Icon = tab.icon;
        const isSelected = selected === index;
        return (
          <a
            key={tab.title}
            href={tab.href ?? "#"}
            onClick={(e) => {
              // No navegación nativa: el scroll lo maneja Navbar (scrollIntoView
              // + scroll-mt-20), sin contaminar el historial con hashes. El href
              // queda en el DOM para crawlers y para abrir-en-nueva-pestaña.
              e.preventDefault();
              handleSelect(index);
            }}
            aria-current={isSelected ? "page" : undefined}
            aria-label={tab.title}
            className={cn(
              "relative flex items-center rounded-xl py-2 text-sm font-medium transition-all duration-300 ease-out motion-reduce:transition-none",
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