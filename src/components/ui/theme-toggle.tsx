import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleTheme, useTheme } from "@/stores/theme";

/**
 * Toggle de tema claro/oscuro conectado al átomo persistente `$theme`
 * (`src/stores/theme.ts`).
 *
 * El tema inicial se aplica en `Layout.astro` con un script `is:inline` antes
 * del primer paint (sin FOUC). Al conmutar aquí, `$theme` actualiza
 * `localStorage("portfolio-theme")`, la clase `.dark` en `<html>` y notifica
 * atómicamente a todas las islas suscritas (Membrane, NeuroNoise, SdfName, etc.).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const isDark = theme === "dark";

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleTheme();
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Cambiar tema entre claro y oscuro"
      onClick={() => toggleTheme()}
      onKeyDown={handleKey}
      className={cn(
        "glass-pill relative flex h-9 w-16 shrink-0 cursor-pointer items-center rounded-full px-1 transition-colors",
        className,
      )}
    >
      <span
        style={{ transform: isDark ? "translateX(0)" : "translateX(28px)" }}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-surface) text-(--color-fg) shadow transition-transform duration-300 ease-out motion-reduce:transition-none"
      >
        {isDark ? (
          <Moon className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <Sun className="h-4 w-4" strokeWidth={1.75} />
        )}
      </span>
    </button>
  );
}

export default ThemeToggle;