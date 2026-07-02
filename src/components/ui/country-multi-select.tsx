'use client';

// hangel — Çoktan seçmeli ülke süzgeci (shadcn Popover + Checkbox tabanlı).
// Sözleşme/politika listelerinde kullanılır. Hafif (cmdk bağımlılığı yok).

import * as React from 'react';
import { Check, ChevronsUpDown, X, Globe } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type CountryOption = {
  code: string;
  name: string;
  flag: string;
};

// Sabit liste — TR-EU-US ağırlıklı + GLOBAL fallback. UI'da hangel lowercase.
export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: 'GLOBAL', name: 'Global / Tümü', flag: '🌐' },
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷' },
  { code: 'EU', name: 'AB Geneli', flag: '🇪🇺' },
  { code: 'DE', name: 'Almanya', flag: '🇩🇪' },
  { code: 'FR', name: 'Fransa', flag: '🇫🇷' },
  { code: 'ES', name: 'İspanya', flag: '🇪🇸' },
  { code: 'IT', name: 'İtalya', flag: '🇮🇹' },
  { code: 'UK', name: 'Birleşik Krallık', flag: '🇬🇧' },
  { code: 'US', name: 'ABD (CCPA)', flag: '🇺🇸' },
  { code: 'CA', name: 'Kanada', flag: '🇨🇦' },
  { code: 'AU', name: 'Avustralya', flag: '🇦🇺' },
  { code: 'JP', name: 'Japonya', flag: '🇯🇵' },
  { code: 'BR', name: 'Brezilya', flag: '🇧🇷' },
  { code: 'CH', name: 'İsviçre', flag: '🇨🇭' },
  { code: 'SG', name: 'Singapur', flag: '🇸🇬' },
  { code: 'AE', name: 'BAE', flag: '🇦🇪' },
  { code: 'SA', name: 'Suudi Arabistan', flag: '🇸🇦' },
];

const COUNTRY_BY_CODE: Record<string, CountryOption> = Object.fromEntries(
  COUNTRY_OPTIONS.map((c) => [c.code, c])
);

export function getCountryOption(code: string): CountryOption | undefined {
  return COUNTRY_BY_CODE[code.toUpperCase()];
}

// Slug heuristic: tr-*, eu-*, us-*, uk-*, de-*, fr-* prefix'ten ülke çıkar.
// Yoksa ABD / KVKK / GDPR / IRS gibi anahtar kelimelerden de tahmin et.
export function inferCountriesFromText(text: string): string[] {
  const set = new Set<string>();
  const lower = text.toLowerCase();

  // Slug prefix kontrolü (tr-, eu-, us-, uk-, de-, fr-, es-, it-, ca-, au-, jp-, br-)
  const prefixMatch = lower.match(/^([a-z]{2})-/);
  if (prefixMatch) {
    const code = prefixMatch[1].toUpperCase();
    if (COUNTRY_BY_CODE[code]) set.add(code);
  }

  // Anahtar kelime tahminleri
  if (/\b(kvkk|türk|turk|tbk|tük|tüketici|6098|6502)\b/.test(lower)) set.add('TR');
  if (/\b(gdpr|ab|avrupa|eu)\b/.test(lower)) set.add('EU');
  if (/\b(ccpa|cpra|coppa|irs|abd|amerika|us|usa)\b/.test(lower)) set.add('US');
  if (/\b(uk|birleşik krallık|birlesik krallik)\b/.test(lower)) set.add('UK');
  if (/\b(lgpd|brezilya|brasil)\b/.test(lower)) set.add('BR');
  if (/\b(fadp|isviçre|isvicre|switzerland)\b/.test(lower)) set.add('CH');
  if (/\b(pdpa|singapur|singapore)\b/.test(lower)) set.add('SG');
  if (/\b(bae|uae|emirates|emirati|dubai|abu dhabi)\b/.test(lower)) set.add('AE');
  if (/\b(suudi|saudi|ksa|pdpl)\b/.test(lower)) set.add('SA');

  // Hiçbir ülke yoksa GLOBAL kabul et — filtrede "GLOBAL seçili" senaryosunda görünür.
  if (set.size === 0) set.add('GLOBAL');
  return Array.from(set);
}

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
};

export function CountryMultiSelect({
  value,
  onChange,
  placeholder = 'Ülke seç...',
  className,
  triggerClassName,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const toggle = (code: string) => {
    onChange(value.includes(code) ? value.filter((c) => c !== code) : [...value, code]);
  };

  const selectAll = () => onChange(COUNTRY_OPTIONS.map((c) => c.code));
  const clearAll = () => onChange([]);

  const count = value.length;
  const summary =
    count === 0
      ? placeholder
      : count === 1
      ? `${getCountryOption(value[0])?.flag ?? ''} ${getCountryOption(value[0])?.name ?? value[0]}`
      : `${count} ülke seçili`;

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Ülke süzgeci"
            className={cn('h-10 justify-between gap-2 min-w-[180px]', triggerClassName)}
          >
            <span className="flex items-center gap-2 truncate">
              <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate text-sm">{summary}</span>
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] max-w-[calc(100vw-1rem)] p-0" align="start">
          <div className="p-2 border-b">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ülke ara..."
              className="h-9"
            />
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 text-xs border-b">
            <button
              type="button"
              onClick={selectAll}
              className="text-primary hover:underline px-1"
            >
              Tümünü seç
            </button>
            <span className="text-muted-foreground">{count}/{COUNTRY_OPTIONS.length}</span>
            <button
              type="button"
              onClick={clearAll}
              className="text-destructive hover:underline px-1"
            >
              Temizle
            </button>
          </div>
          <ScrollArea className="h-[240px]">
            <ul className="py-1">
              {filtered.map((c) => {
                const selected = value.includes(c.code);
                return (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => toggle(c.code)}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left',
                        selected && 'bg-accent/50'
                      )}
                    >
                      <span
                        className={cn(
                          'h-4 w-4 rounded border flex items-center justify-center shrink-0',
                          selected ? 'bg-primary border-primary' : 'border-input'
                        )}
                      >
                        {selected && <Check className="h-3 w-3 text-primary-foreground" />}
                      </span>
                      <span className="text-base leading-none">{c.flag}</span>
                      <span className="flex-1 truncate">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{c.code}</span>
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Sonuç yok
                </li>
              )}
            </ul>
          </ScrollArea>
        </PopoverContent>
      </Popover>
      {count > 0 && (
        <Badge variant="secondary" className="h-6 px-2 gap-1 text-[10px]">
          {count}
          <button
            type="button"
            onClick={clearAll}
            aria-label="Tüm ülke seçimini temizle"
            className="hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      )}
    </div>
  );
}
