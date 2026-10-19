import { useSyncExternalStore } from 'react';
import { persistentAtom } from '@nanostores/persistent';

export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'portfolio-theme';

function resolveInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    /* localStorage bloqueado o no disponible */
  }
  if (typeof document !== 'undefined') {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Átomo persistente único para el tema claro/oscuro del portafolio.
 * Sincroniza `localStorage("portfolio-theme")`, pestañas abiertas y la clase
 * `.dark` en `<html>` desde un único punto centralizado, eliminando los
 * MutationObserver duplicados en cada isla visual (Membrane, NeuroNoise,
 * GrainGradient, ASMR, SdfName, ThemeToggle, CommandPalette).
 */
export const $theme = persistentAtom<Theme>(
  THEME_STORAGE_KEY,
  resolveInitialTheme(),
);

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  const root = document.documentElement;

  // Asegura que el átomo arranque alineado con la clase fijada por el script anti-FOUC.
  const domTheme: Theme = root.classList.contains('dark') ? 'dark' : 'light';
  if ($theme.get() !== domTheme) {
    $theme.set(domTheme);
  }

  // Propaga cualquier cambio del store a <html class="dark">.
  $theme.subscribe((theme) => {
    const isDark = theme === 'dark';
    if (root.classList.contains('dark') !== isDark) {
      root.classList.toggle('dark', isDark);
    }
  });
}

/** Fija explícitamente el tema ('dark' | 'light'). */
export function setTheme(next: Theme): void {
  $theme.set(next);
}

/** Invierte el tema actual entre 'dark' y 'light'. */
export function toggleTheme(): Theme {
  const next: Theme = $theme.get() === 'dark' ? 'light' : 'dark';
  $theme.set(next);
  return next;
}

/** Hook React para suscribirse al átomo `$theme` sin MutationObserver local. */
export function useTheme(): Theme {
  return useSyncExternalStore(
    (onStoreChange) => $theme.listen(onStoreChange),
    () => $theme.get(),
    () => 'dark',
  );
}
