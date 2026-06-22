"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useOnClickOutside } from "usehooks-ts";
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

const buttonVariants = {
  initial: { gap: 0, paddingLeft: ".5rem", paddingRight: ".5rem" },
  animate: (isSelected: boolean) => ({
    gap: isSelected ? ".5rem" : 0,
    paddingLeft: isSelected ? "1rem" : ".5rem",
    paddingRight: isSelected ? "1rem" : ".5rem",
  }),
};

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: { width: "auto", opacity: 1 },
  exit: { width: 0, opacity: 0 },
};

export function ExpandableTabs({ tabs, className, onSelect }: ExpandableTabsProps) {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = React.useState<number | null>(null);
  const outsideClickRef = React.useRef<HTMLDivElement>(null);

  useOnClickOutside(
    outsideClickRef as React.RefObject<HTMLElement>,
    () => setSelected(null),
  );

  const transition = reduceMotion
    ? { duration: 0 }
    : { delay: 0.1, type: "spring", bounce: 0, duration: 0.6 } as const;

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
          <motion.button
            key={tab.title}
            type="button"
            variants={buttonVariants}
            initial={false}
            animate="animate"
            custom={isSelected}
            onClick={() => handleSelect(index)}
            transition={transition}
            aria-current={isSelected ? "true" : undefined}
            aria-label={tab.title}
            className={cn(
              "relative flex items-center rounded-xl px-2 py-2 text-sm font-medium transition-colors duration-300",
              isSelected
                ? "bg-(--color-surface) text-(--color-accent)"
                : "text-(--color-muted) hover:bg-(--color-surface) hover:text-(--color-fg)",
            )}
          >
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            {/* Texto accesible siempre presente (sr-only) para que el botón tenga
                un nombre discernible incluso cuando no está seleccionado y solo
                muestra el icono. Satisface la auditoría de árbol de accesibilidad
                para agentes IA, además de axe-core/Lighthouse. */}
            <span className="sr-only">{tab.title}</span>
            <AnimatePresence initial={false}>
              {isSelected && (
                <motion.span
                  variants={spanVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={transition}
                  className="overflow-hidden whitespace-nowrap"
                  aria-hidden="true"
                >
                  {tab.title}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}

export default ExpandableTabs;