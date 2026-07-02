'use client';

import React, { useMemo, useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Aramalı tekli dropdown (çoktan seçmeli pick-list) — uzun listeler (üniversite,
 * il/ilçe/mahalle) için. Açılan listenin en başında arama barı vardır.
 * triggerClassName ile farklı formların Select görünümüne uydurulabilir.
 */
export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = 'Seçin',
  searchPlaceholder = 'Ara...',
  disabled = false,
  triggerClassName = 'h-12 rounded-xl bg-card border-none px-4 font-medium shadow-sm',
}: {
  options: readonly string[];
  value: string;
  onValueChange: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    const q = filter.trim().toLocaleLowerCase('tr');
    return q ? options.filter(o => o.toLocaleLowerCase('tr').includes(q)) : options;
  }, [filter, options]);

  const select = (item: string) => {
    onValueChange(item);
    setOpen(false);
    setFilter('');
  };

  return (
    <Popover open={open} onOpenChange={o => { if (disabled) return; setOpen(o); if (!o) setFilter(''); }}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'flex w-full items-center justify-between text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed',
            triggerClassName,
            !value && 'text-muted-foreground',
          )}
        >
          <span className="truncate text-left">{value || placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
          <input
            autoFocus
            className="flex h-10 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            placeholder={searchPlaceholder}
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
          {filter && (
            <X className="h-4 w-4 shrink-0 opacity-50 cursor-pointer" onClick={() => setFilter('')} />
          )}
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Sonuç bulunamadı</p>
          ) : (
            filtered.map(item => (
              <button
                key={item}
                type="button"
                className={cn(
                  'w-full truncate text-left px-3 py-2 text-sm rounded-lg hover:bg-muted',
                  value === item && 'bg-muted font-medium',
                )}
                onClick={() => select(item)}
              >
                {item}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
