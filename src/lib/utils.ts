import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind de forma segura: soporta strings, arrays y
 * objetos condicionales (vía clsx) y resuelve conflictos de utilidades
 * manteniendo la última declaración (vía tailwind-merge).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}