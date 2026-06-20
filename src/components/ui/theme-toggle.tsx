import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "portfolio-theme";

/**
 * Toggle de tema claro/oscuro.
 *
 * El tema real se aplica en `Layout.astro` con un script `is:inline` que corre
 * antes del primer paint (sin FOUC) y conmuta la clase `.dark` en `<html>`.
 * Este componente solo refleja y muta ese estado: lee la clase del `<html>` al
 * montarse y, al pulsar, la invierte + persiste en `localStorage`.
 *
 * Reutiliza `.glass-pill` para heredar el liquid glass (SVG distortion) y la
 * regla `z-index:-1` que mantiene el texto nítido.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  // Estado inicial desde el DOM: el script anti-FOUC ya puso la clase correcta
  // antes del primer paint, así que el inicializador perezoso la lee sin flicker
  // del icono (antes arrancaba en `true` y se corregía recién en el effect).
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  // Sincronización defensiva por si la clase cambiara desde fuera del toggle.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      /* localStorage puede estar bloqueado; el toggle visual sigue funcionando. */
    }
    setIsDark(next);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Cambiar tema entre claro y oscuro"
      onClick={toggle}
      onKeyDown={handleKey}
      className={cn(
        "glass-pill relative flex h-9 w-16 shrink-0 cursor-pointer items-center rounded-full px-1 transition-colors",
        className,
      )}
    >
      <motion.span
        animate={{ x: isDark ? 0 : 28 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 500, damping: 30 }
        }
        className="flex h-7 w-7 items-center justify-center rounded-full bg-(--color-surface) text-(--color-fg) shadow"
      >
        {isDark ? (
          <Moon className="h-4 w-4" strokeWidth={1.75} />
        ) : (
          <Sun className="h-4 w-4" strokeWidth={1.75} />
        )}
      </motion.span>
    </button>
  );
}

export default ThemeToggle;