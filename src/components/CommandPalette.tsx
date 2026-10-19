import { useEffect, useMemo, useRef, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import {
  Award,
  BookOpen,
  Check,
  Compass,
  Copy,
  ExternalLink,
  FolderGit2,
  Moon,
  Search,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { usePrefersReducedMotion } from '@/lib/utils';
import {
  closeCommandPalette,
  toggleCommandPalette,
  useCommandPaletteOpen,
} from '@/stores/command-palette';
import { toggleTheme, useTheme } from '@/stores/theme';

export type CommandCategory =
  | 'Proyectos'
  | 'Certificaciones'
  | 'Blog'
  | 'Navegación'
  | 'Acciones';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: CommandCategory;
  href?: string;
  external?: boolean;
  action?: 'toggle-theme' | 'copy-email';
  payload?: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  items: CommandItem[];
  baseUrl?: string;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export default function CommandPalette({
  items,
  baseUrl = '',
}: CommandPaletteProps) {
  const isOpen = useCommandPaletteOpen();
  const theme = useTheme();
  const reduceMotion = usePrefersReducedMotion();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allItems = useMemo<CommandItem[]>(() => {
    const themeAction: CommandItem = {
      id: 'action-toggle-theme',
      title:
        theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro',
      subtitle: `Tema actual: ${theme === 'dark' ? 'Oscuro' : 'Claro'}`,
      category: 'Acciones',
      action: 'toggle-theme',
      keywords: ['tema', 'theme', 'dark', 'light', 'oscuro', 'claro', 'modo'],
    };
    return [...items, themeAction];
  }, [items, theme]);

  const filteredItems = useMemo(() => {
    const q = normalizeText(query);
    if (!q) return allItems;
    const tokens = q.split(/\s+/).filter(Boolean);
    return allItems.filter((item) => {
      const haystack = normalizeText(
        [
          item.title,
          item.subtitle ?? '',
          item.category,
          ...(item.keywords ?? []),
        ].join(' '),
      );
      return tokens.every((token) => haystack.includes(token));
    });
  }, [allItems, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen]);

  // Atajo global Cmd+K / Ctrl+K + Escape.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        toggleCommandPalette();
        return;
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeCommandPalette();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // Enfoque automático y bloqueo de scroll al abrir.
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      return;
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => {
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(raf);
    };
  }, [isOpen]);

  // Cierra la paleta si ocurre una transición de página externa.
  useEffect(() => {
    const onPageLoad = () => closeCommandPalette();
    document.addEventListener('astro:before-preparation', onPageLoad);
    return () =>
      document.removeEventListener('astro:before-preparation', onPageLoad);
  }, []);

  const executeItem = (item: CommandItem | undefined) => {
    if (!item) return;

    if (item.action === 'toggle-theme') {
      toggleTheme();
      closeCommandPalette();
      return;
    }

    if (item.action === 'copy-email' && item.payload) {
      navigator.clipboard?.writeText(item.payload).catch(() => {});
      setCopiedId(item.id);
      setTimeout(() => {
        setCopiedId(null);
        closeCommandPalette();
      }, 650);
      return;
    }

    if (!item.href) return;

    if (item.external) {
      closeCommandPalette();
      window.open(item.href, '_blank', 'noopener,noreferrer');
      return;
    }

    closeCommandPalette();

    const hashIndex = item.href.indexOf('#');
    if (hashIndex !== -1) {
      const hash = item.href.slice(hashIndex);
      const pathPart = item.href.slice(0, hashIndex) || `${baseUrl}/`;
      const normCurrent =
        window.location.pathname.replace(/\/$/, '') || '/';
      const normTarget = pathPart.replace(/\/$/, '') || '/';

      if (normCurrent === normTarget) {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({
            behavior: reduceMotion ? 'auto' : 'smooth',
            block: 'start',
          });
          return;
        }
      }
    }

    navigate(item.href).catch(() => {
      window.location.assign(item.href!);
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const total = filteredItems.length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (total === 0) return;
      const next = (activeIndex + 1) % total;
      setActiveIndex(next);
      scrollActiveIntoView(next);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (total === 0) return;
      const next = (activeIndex - 1 + total) % total;
      setActiveIndex(next);
      scrollActiveIntoView(next);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeItem(filteredItems[activeIndex]);
    }
  };

  const scrollActiveIntoView = (index: number) => {
    const container = listRef.current;
    if (!container) return;
    const option = container.querySelector<HTMLElement>(
      `[data-cmd-index="${index}"]`,
    );
    option?.scrollIntoView({ block: 'nearest' });
  };

  const renderIcon = (item: CommandItem) => {
    if (item.action === 'toggle-theme') {
      return theme === 'dark' ? (
        <Sun className="h-4 w-4 text-(--color-accent)" />
      ) : (
        <Moon className="h-4 w-4 text-(--color-accent)" />
      );
    }
    if (item.action === 'copy-email') {
      return copiedId === item.id ? (
        <Check className="h-4 w-4 text-emerald-500" />
      ) : (
        <Copy className="h-4 w-4 text-(--color-accent)" />
      );
    }
    switch (item.category) {
      case 'Proyectos':
        return <FolderGit2 className="h-4 w-4 text-(--color-accent)" />;
      case 'Certificaciones':
        return <Award className="h-4 w-4 text-(--color-accent)" />;
      case 'Blog':
        return <BookOpen className="h-4 w-4 text-(--color-accent)" />;
      case 'Navegación':
        return <Compass className="h-4 w-4 text-(--color-accent)" />;
      default:
        return <Sparkles className="h-4 w-4 text-(--color-accent)" />;
    }
  };

  if (!isOpen) return null;

  // Agrupamos conservando el índice plano para navegación por teclado.
  const categories: CommandCategory[] = [
    'Proyectos',
    'Certificaciones',
    'Blog',
    'Navegación',
    'Acciones',
  ];

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-20 sm:pt-28"
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos y buscador"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity"
        onClick={() => closeCommandPalette()}
        aria-hidden="true"
      />

      {/* Panel principal */}
      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-bg)/95 shadow-2xl backdrop-blur-xl">
        {/* Barra de búsqueda */}
        <div className="flex items-center gap-3 border-b border-(--color-border) px-4 py-3.5">
          <Search
            className="h-4 w-4 shrink-0 text-(--color-accent)"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-palette-list"
            aria-activedescendant={
              filteredItems[activeIndex]
                ? `cmd-item-${filteredItems[activeIndex].id}`
                : undefined
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Buscar proyectos, certificaciones, artículos o acciones..."
            className="w-full bg-transparent text-sm text-(--color-fg) placeholder:text-(--color-muted) focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              aria-label="Limpiar búsqueda"
              className="rounded-md p-1 text-(--color-muted) hover:bg-(--color-surface) hover:text-(--color-fg)"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => closeCommandPalette()}
            aria-label="Cerrar paleta de comandos"
            className="rounded-md border border-(--color-border) bg-(--color-surface) px-1.5 py-0.5 text-[11px] font-medium text-(--color-muted) hover:text-(--color-fg)"
          >
            ESC
          </button>
        </div>

        {/* Lista de resultados */}
        <div
          id="command-palette-list"
          ref={listRef}
          role="listbox"
          className="max-h-[60dvh] overflow-y-auto p-2"
        >
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center text-sm text-(--color-muted)">
              No se encontraron resultados para «{query}».
            </div>
          ) : (
            categories.map((cat) => {
              const catItems = filteredItems.filter((i) => i.category === cat);
              if (catItems.length === 0) return null;

              return (
                <div key={cat} className="mb-2 last:mb-0">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-(--color-muted)">
                    {cat}
                  </div>
                  <div className="space-y-0.5">
                    {catItems.map((item) => {
                      runningIndex += 1;
                      const itemIndex = runningIndex;
                      const isActive = itemIndex === activeIndex;
                      return (
                        <button
                          key={item.id}
                          id={`cmd-item-${item.id}`}
                          type="button"
                          role="option"
                          aria-selected={isActive}
                          data-cmd-index={itemIndex}
                          onMouseEnter={() => setActiveIndex(itemIndex)}
                          onClick={() => executeItem(item)}
                          className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? 'bg-(--color-surface) text-(--color-fg) ring-1 ring-(--color-accent)/35'
                              : 'text-(--color-muted) hover:bg-(--color-surface)/60 hover:text-(--color-fg)'
                          }`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-(--color-border) bg-(--color-bg)">
                            {renderIcon(item)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-(--color-fg)">
                              {copiedId === item.id
                                ? '¡Correo copiado al portapapeles!'
                                : item.title}
                            </span>
                            {item.subtitle && (
                              <span className="block truncate text-xs text-(--color-muted)">
                                {item.subtitle}
                              </span>
                            )}
                          </span>
                          {item.external && (
                            <ExternalLink
                              className="h-3.5 w-3.5 shrink-0 text-(--color-muted)"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer de atajos */}
        <div className="flex items-center justify-between border-t border-(--color-border) bg-(--color-surface)/60 px-4 py-2 text-[11px] text-(--color-muted)">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-(--color-border) bg-(--color-bg) px-1 py-0.5 font-sans">
                ↑↓
              </kbd>{' '}
              navegar
            </span>
            <span>
              <kbd className="rounded border border-(--color-border) bg-(--color-bg) px-1 py-0.5 font-sans">
                ↵
              </kbd>{' '}
              abrir
            </span>
            <span>
              <kbd className="rounded border border-(--color-border) bg-(--color-bg) px-1 py-0.5 font-sans">
                esc
              </kbd>{' '}
              cerrar
            </span>
          </div>
          <span className="tabular-nums">
            {filteredItems.length}{' '}
            {filteredItems.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
      </div>
    </div>
  );
}
