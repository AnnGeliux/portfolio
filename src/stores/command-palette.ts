import { useSyncExternalStore } from 'react';
import { atom } from 'nanostores';

/**
 * Átomo compartido entre Navbar (botón ⌘K) y CommandPalette (modal Cmd+K).
 */
export const $commandPaletteOpen = atom<boolean>(false);

export function openCommandPalette(): void {
  $commandPaletteOpen.set(true);
}

export function closeCommandPalette(): void {
  $commandPaletteOpen.set(false);
}

export function toggleCommandPalette(): void {
  $commandPaletteOpen.set(!$commandPaletteOpen.get());
}

export function useCommandPaletteOpen(): boolean {
  return useSyncExternalStore(
    (onStoreChange) => $commandPaletteOpen.listen(onStoreChange),
    () => $commandPaletteOpen.get(),
    () => false,
  );
}
