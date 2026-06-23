'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronDown, Search, X } from 'lucide-react';

// Searchable single-select with optional "Diğer" (Other) free-text fallback.
export const FilteredSingleSelect = ({
  title,
  options,
  value,
  onValueChange,
  withOther = false,
  otherValue = '',
  onOtherChange,
}: {
  title: string;
  options: string[];
  value: string;
  onValueChange: (v: string) => void;
  withOther?: boolean;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
}) => {
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const isOther = value === 'Diğer';

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return q ? options.filter(o => o.toLowerCase().includes(q)) : options;
  }, [filter, options]);

  const select = (item: string) => {
    onValueChange(item);
    setOpen(false);
    setFilter('');
  };

  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between text-left font-normal h-10">
            <span className={`min-w-0 truncate ${value ? '' : 'text-muted-foreground'}`}>{value || `${title} seçin...`}</span>
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
            {filtered.map(item => (
              <button
                key={item}
                type="button"
                className={`w-full text-left px-3 py-1.5 text-sm rounded-sm hover:bg-muted break-words ${value === item ? 'bg-muted font-medium' : ''}`}
                onClick={() => select(item)}
              >
                {item}
              </button>
            ))}
            {withOther && (
              <button
                type="button"
                className={`w-full text-left px-3 py-1.5 text-sm rounded-sm hover:bg-muted ${isOther ? 'bg-muted font-medium' : ''}`}
                onClick={() => select('Diğer')}
              >
                Diğer
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {isOther && withOther && (
        <Input
          placeholder="Mesleğinizi yazın..."
          value={otherValue}
          onChange={e => onOtherChange?.(e.target.value)}
          className="mt-1"
        />
      )}
    </div>
  );
};
