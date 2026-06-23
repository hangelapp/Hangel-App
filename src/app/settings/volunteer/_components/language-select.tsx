'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Search, X } from 'lucide-react';
import { LANGUAGES, LANGUAGE_LEVELS } from '@/lib/volunteer-data';

// Multi-select languages with per-language proficiency level picker.
export const LanguageSelect = ({
  selected,
  onSelectedChange,
  levels,
  onLevelChange,
}: {
  selected: string[];
  onSelectedChange: (v: string[]) => void;
  levels: Record<string, string>;
  onLevelChange: (lang: string, level: string) => void;
}) => {
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return q ? LANGUAGES.filter(l => l.toLowerCase().includes(q)) : LANGUAGES;
  }, [filter]);

  const toggle = (lang: string) => {
    onSelectedChange(selected.includes(lang) ? selected.filter(x => x !== lang) : [...selected, lang]);
  };

  return (
    <div className="space-y-2">
      <Label>Yabancı Diller</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between text-left font-normal h-auto min-h-10">
            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selected.map(lang => (
                  <Badge key={lang} variant="secondary" className="font-normal">{lang}</Badge>
                ))}
              </div>
            ) : <span className="text-muted-foreground">Dil seçin...</span>}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
            <input
              className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Dil ara..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            {filter && <X className="h-4 w-4 shrink-0 opacity-50 cursor-pointer" onClick={() => setFilter('')} />}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.map(lang => (
              <label key={lang} className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer rounded-sm text-sm">
                <Checkbox checked={selected.includes(lang)} onCheckedChange={() => toggle(lang)} className="shrink-0" />
                <span className="min-w-0 break-words">{lang}</span>
              </label>
            ))}
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

      {selected.length > 0 && (
        <div className="space-y-2 pt-1">
          {selected.map(lang => (
            <div key={lang} className="flex items-center gap-2">
              <span className="text-sm flex-1 min-w-0 truncate">{lang}</span>
              <Select value={levels[lang] || ''} onValueChange={v => onLevelChange(lang, v)}>
                <SelectTrigger className="w-36 h-8 text-sm shrink-0">
                  <SelectValue placeholder="Seviye..." />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_LEVELS.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
