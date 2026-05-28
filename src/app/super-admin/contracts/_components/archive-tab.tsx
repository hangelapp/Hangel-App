'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Search, Archive, FileText, ExternalLink, Building2, ShoppingBag, GraduationCap } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { cn } from '@/lib/utils';

interface ArchiveDoc {
  id: string;
  entityId?: string;
  entityName?: string;
  entityType?: 'ngo' | 'brand' | 'club';
  docType?: string;   // tüzük, faaliyet belgesi, izin belgesi
  fileUrl?: string;
  year?: string;
  uploadedBy?: string;
  uploadedAt?: unknown;
}

const ENTITY_META: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  ngo: { label: 'STK', icon: Building2, cls: 'text-orange-600' },
  brand: { label: 'Marka', icon: ShoppingBag, cls: 'text-green-600' },
  club: { label: 'Kulüp', icon: GraduationCap, cls: 'text-blue-600' },
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

export function ArchiveTab() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const archiveQuery = useMemoFirebase(() => collection(db, COLLECTIONS.documentArchive), [db]);
  const { data: docs, isLoading } = useCollection<ArchiveDoc>(archiveQuery);

  // Kuruma göre grupla
  const grouped = useMemo(() => {
    let list = docs || [];
    if (yearFilter !== 'all') list = list.filter(d => d.year === yearFilter);
    if (typeFilter !== 'all') list = list.filter(d => d.entityType === typeFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(d => (d.entityName || '').toLowerCase().includes(q) || (d.docType || '').toLowerCase().includes(q));
    }
    const byEntity = new Map<string, { name: string; type?: string; docs: ArchiveDoc[] }>();
    list.forEach(d => {
      const key = d.entityId || d.entityName || d.id;
      if (!byEntity.has(key)) byEntity.set(key, { name: d.entityName || 'Bilinmeyen Kurum', type: d.entityType, docs: [] });
      byEntity.get(key)!.docs.push(d);
    });
    return Array.from(byEntity.values());
  }, [docs, searchTerm, yearFilter, typeFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Archive className="h-5 w-5 text-primary" /> Evrak Arşivi (Kurum Bazlı)</CardTitle>
        <div className="flex items-center gap-3 flex-wrap pt-2">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Kurum adı / evrak türü ara..." className="pl-10 h-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kurumlar</SelectItem>
              <SelectItem value="ngo">STK</SelectItem>
              <SelectItem value="brand">Marka</SelectItem>
              <SelectItem value="club">Kulüp</SelectItem>
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-32 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Yıllar</SelectItem>
              {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Archive className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Henüz evrak yüklenmemiş.</p>
            <p className="text-xs mt-1">STK / marka / kulüp panellerinden tüzük, faaliyet belgesi vb. yüklendiğinde burada kurum kurum listelenir.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((entity, i) => {
              const meta = entity.type ? ENTITY_META[entity.type] : null;
              const Icon = meta?.icon || Building2;
              // Yıla göre grupla
              const byYear = new Map<string, ArchiveDoc[]>();
              entity.docs.forEach(d => {
                const y = d.year || 'Tarihsiz';
                if (!byYear.has(y)) byYear.set(y, []);
                byYear.get(y)!.push(d);
              });
              return (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 p-3 bg-muted/40 border-b">
                    <Icon className={cn('h-5 w-5', meta?.cls || 'text-muted-foreground')} />
                    <span className="font-bold text-sm">{entity.name}</span>
                    {meta && <Badge variant="outline" className="text-[9px]">{meta.label}</Badge>}
                    <Badge variant="secondary" className="text-[9px] ml-auto">{entity.docs.length} evrak</Badge>
                  </div>
                  <div className="p-2 space-y-2">
                    {Array.from(byYear.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([year, yearDocs]) => (
                      <div key={year}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1">{year}</p>
                        <div className="space-y-1">
                          {yearDocs.map(d => (
                            <div key={d.id} className="flex items-center gap-2 p-2 rounded hover:bg-accent/40">
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-sm flex-1 truncate">{d.docType || 'Evrak'}</span>
                              {d.fileUrl && (
                                <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
                                  Aç <ExternalLink className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
