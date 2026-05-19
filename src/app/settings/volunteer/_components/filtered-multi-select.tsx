'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Search, X } from 'lucide-react';
import type { CategorizedOption } from './types';

// Searchable multi-select with optional categories.
export const FilteredMultiSelect = ({
  title,
  options,
  categorized,
  selected,
  onSelectedChange,
}: {
  title: string;
  options?: string[];
  categorized?: CategorizedOption[];
  selected: string[];
  onSelectedChange: (v: string[]) => void;
}) => {
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const allItems = useMemo(
    () => categorized ? categorized.flatMap(c => c.items) : (options ?? []),
    [options, categorized],
  );

  const toggle = (item: string) => {
    onSelectedChange(selected.includes(item) ? selected.filter(x => x !== item) : [...selected, item]);
  };

  const renderItems = (items: string[]) => {
    const q = filter.toLowerCase();
    const filtered = q ? items.filter(i => i.toLowerCase().includes(q)) : items;
    if (filtered.length === 0) return null;
    return filtered.map(item => (
      <label key={item} className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer rounded-sm text-sm">
        <Checkbox checked={selected.includes(item)} onCheckedChange={() => toggle(item)} />
        <span>{item}</span>
      </label>
    ));
  };

  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between text-left font-normal h-auto min-h-10">
            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selected.map(item => (
                  <Badge key={item} variant="secondary" className="font-normal">{item}</Badge>
                ))}
              </div>
            ) : <span className="text-muted-foreground">{title} seçin...</span>}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
            <input
              className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Ara..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            {filter && <X className="h-4 w-4 shrink-0 opacity-50 cursor-pointer" onClick={() => setFilter('')} />}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {categorized ? (
              categorized.map(cat => {
                const rows = renderItems(cat.items);
                if (!rows) return null;
                return (
                  <div key={cat.category}>
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{cat.category}</p>
                    {rows}
                  </div>
                );
              })
            ) : renderItems(allItems)}
          </div>
          {selected.length > 0 && (
            <div className="border-t p-2">
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => onSelectedChange([])}>
                Seçimi Temizle ({selected.length})
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};
