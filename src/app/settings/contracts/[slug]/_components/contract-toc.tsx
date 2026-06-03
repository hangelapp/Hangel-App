'use client';

/**
 * ContractTOC — H2/H3 başlıklarını sözleşme HTML'inden çıkarıp
 * sticky sidebar (desktop) veya dropdown (mobile) olarak sunar.
 *
 * Why ayrı component:
 *   - DOM mutasyonu yapan useEffect içeriği detail sayfasını kalabalıklaştırıyordu.
 *   - Public viewer (`/contracts/[type]`) ile re-use için tek bir client component.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface ContractTOCProps {
  /** Sanitize edilmiş HTML — H2 / H3 başlıkları parse edilecek. */
  html: string;
  /** İçerik DOM'una id ataması yapılacak ref (article container). */
  articleRef: React.RefObject<HTMLElement | null>;
  /** Mobile dropdown label. */
  label?: string;
}

/** id slug — diakritik temizlikli, ASCII güvenli. */
function slugify(text: string, fallback: string): string {
  const base = text
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || fallback;
}

export function ContractTOC({ html, articleRef, label = 'İçindekiler' }: ContractTOCProps) {
  // Headings'i HTML string'ten parse et — DOM hazır olmasını beklemeden TOC çıkar.
  const items = useMemo<TocItem[]>(() => {
    if (typeof window === 'undefined') return [];
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    const headings = Array.from(wrap.querySelectorAll('h2, h3, h4'));
    const seen = new Set<string>();
    return headings.map((h, idx) => {
      const text = (h.textContent || '').trim();
      let id = slugify(text, `section-${idx}`);
      while (seen.has(id)) id = `${id}-${idx}`;
      seen.add(id);
      const level = Number(h.tagName.substring(1));
      return { id, text, level };
    });
  }, [html]);

  // Article render olduktan sonra heading element'lerine id ata.
  useEffect(() => {
    const root = articleRef.current;
    if (!root) return;
    const headings = root.querySelectorAll('h2, h3, h4');
    items.forEach((it, idx) => {
      const el = headings[idx] as HTMLElement | undefined;
      if (el && !el.id) el.id = it.id;
    });
  }, [items, articleRef]);

  const [active, setActive] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const root = articleRef.current;
    if (!root || items.length === 0) return;
    observerRef.current?.disconnect();
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
    );
    items.forEach(it => {
      const el = root.querySelector(`#${CSS.escape(it.id)}`);
      if (el) observer.observe(el);
    });
    observerRef.current = observer;
    return () => observer.disconnect();
  }, [items, articleRef]);

  const [mobileOpen, setMobileOpen] = useState(false);

  if (items.length === 0) return null;

  const handleJump = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  };

  return (
    <>
      {/* Desktop sticky sidebar */}
      <aside className="hidden lg:block print:hidden">
        <div className="sticky top-20 glass-thin rounded-2xl p-4 max-h-[calc(100dvh-6rem)] overflow-auto glass-scroll">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <List className="h-3.5 w-3.5" /> {label}
          </div>
          <nav className="space-y-1">
            {items.map(it => (
              <button
                key={it.id}
                type="button"
                onClick={() => handleJump(it.id)}
                className={cn(
                  'block w-full text-left text-sm leading-snug py-1.5 px-2 rounded-md transition-colors',
                  it.level === 3 && 'pl-5 text-xs',
                  it.level === 4 && 'pl-8 text-xs text-muted-foreground',
                  active === it.id
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                )}
              >
                {it.text}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Mobile dropdown */}
      <div className="lg:hidden print:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(o => !o)}
          aria-expanded={mobileOpen}
          className="w-full glass-thin rounded-2xl px-4 py-3 flex items-center justify-between text-sm font-medium"
        >
          <span className="flex items-center gap-2">
            <List className="h-4 w-4" /> {label}
            <span className="text-muted-foreground font-normal">({items.length})</span>
          </span>
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', mobileOpen && 'rotate-180')}
          />
        </button>
        {mobileOpen && (
          <div className="mt-2 glass-thin rounded-2xl p-3 max-h-[60dvh] overflow-auto glass-scroll">
            <nav className="space-y-0.5">
              {items.map(it => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => handleJump(it.id)}
                  className={cn(
                    'block w-full text-left text-sm py-2 px-2 rounded-md',
                    it.level === 3 && 'pl-5 text-xs',
                    it.level === 4 && 'pl-8 text-xs text-muted-foreground',
                    active === it.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'hover:bg-accent/60'
                  )}
                >
                  {it.text}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>
    </>
  );
}
