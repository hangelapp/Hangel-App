'use client';

/**
 * Süper-admin kullanıcı düzenleme/görüntüleme için kurum çoklu-seçim.
 *
 * Bir koleksiyondan (ngos / brands / clubs) kurumları yükler; seçili olanları chip
 * olarak gösterir, arama ile yenisini ekletir, chip x ile çıkartır. readOnly modda
 * yalnız isimleri listeler (görüntüle dialog'u için).
 */

import { useMemo, useState } from 'react';
import { collection } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Search } from 'lucide-react';

type EntityDoc = { id: string; name?: string; avatarUrl?: string; logoUrl?: string };

export function EntityMultiSelect({
  collectionName,
  label,
  value,
  onChange,
  readOnly,
  emptyText = 'Kayıt yok',
}: {
  collectionName: string;
  label: string;
  value: string[];
  onChange?: (ids: string[]) => void;
  readOnly?: boolean;
  emptyText?: string;
}) {
  const db = useFirestore();
  const [search, setSearch] = useState('');

  const q = useMemoFirebase(
    () => (db ? collection(db, collectionName) : null),
    [db, collectionName],
  );
  const { data: entities, isLoading } = useCollection<EntityDoc>(q);

  const byId = useMemo(() => {
    const m = new Map<string, EntityDoc>();
    (entities || []).forEach((e) => m.set(e.id, e));
    return m;
  }, [entities]);

  const selected = value || [];

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return (entities || [])
      .filter((e) => !selected.includes(e.id) && (e.name || '').toLowerCase().includes(term))
      .slice(0, 8);
  }, [search, entities, selected]);

  const nameOf = (id: string) => byId.get(id)?.name || id;
  const avatarOf = (id: string) => byId.get(id)?.avatarUrl || byId.get(id)?.logoUrl;

  const add = (id: string) => { if (onChange && !selected.includes(id)) onChange([...selected, id]); setSearch(''); };
  const remove = (id: string) => { if (onChange) onChange(selected.filter((x) => x !== id)); };

  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold">{label} {selected.length > 0 && <span className="text-muted-foreground">({selected.length})</span>}</Label>

      {selected.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">{emptyText}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((id) => (
            <Badge key={id} variant="secondary" className="gap-1.5 pl-1 pr-2 py-1 font-medium">
              <Avatar className="h-4 w-4">
                {avatarOf(id) ? <AvatarImage src={avatarOf(id)} /> : null}
                <AvatarFallback className="text-[8px]">{(nameOf(id) || '?').charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="max-w-[160px] break-words">{nameOf(id)}</span>
              {!readOnly && (
                <button type="button" onClick={() => remove(id)} className="ml-0.5 text-muted-foreground hover:text-destructive" aria-label="Kaldır">
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {!readOnly && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isLoading ? 'Yükleniyor…' : 'Ara ve ekle…'}
            className="h-9 pl-8 rounded-xl text-sm"
            disabled={isLoading}
          />
          {matches.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border bg-popover shadow-lg max-h-56 overflow-y-auto">
              {matches.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => add(e.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted"
                >
                  <Avatar className="h-6 w-6">
                    {(e.avatarUrl || e.logoUrl) ? <AvatarImage src={e.avatarUrl || e.logoUrl} /> : null}
                    <AvatarFallback className="text-[9px]">{(e.name || '?').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="break-words">{e.name || e.id}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
