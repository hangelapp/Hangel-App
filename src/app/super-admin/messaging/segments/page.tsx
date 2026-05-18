'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { Plus, Filter, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SegmentRow {
  id: string;
  name?: string;
  description?: string;
  channel?: 'sms' | 'email' | 'both';
  useCase?: string;
  estimatedSize?: number;
  filters?: Record<string, unknown>;
}

const useCaseBadge: Record<string, string> = {
  transactional: 'bg-sky-100 text-sky-800',
  marketing: 'bg-amber-100 text-amber-800',
  emergency: 'bg-rose-100 text-rose-800',
};

export default function SegmentsListPage() {
  const db = useFirestore();
  const q = useMemoFirebase(
    () => query(collection(db, 'recipientSegments'), orderBy('updatedAt', 'desc')),
    [db]
  );
  const { data, isLoading } = useCollection<SegmentRow>(q);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    if (!s) return data;
    return data.filter(
      (t) =>
        (t.name ?? '').toLowerCase().includes(s) ||
        (t.description ?? '').toLowerCase().includes(s)
    );
  }, [data, search]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Segmentler</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Filtre tabanlı kayıtlı alıcı kitleleri. Send anında dinamik olarak değerlendirilir.
          </p>
        </div>
        <Link href="/super-admin/messaging/segments/new/edit" className="self-start md:self-auto">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Yeni Segment
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Segment ara…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Filter className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Henüz segment yok.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/super-admin/messaging/segments/${t.id}/edit`}
                    className="flex items-start gap-3 py-3 px-2 -mx-2 rounded hover:bg-muted/40"
                  >
                    <Filter className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{t.name ?? t.id}</span>
                        {t.useCase && (
                          <Badge className={cn('text-xs', useCaseBadge[t.useCase])}>
                            {t.useCase}
                          </Badge>
                        )}
                        {typeof t.estimatedSize === 'number' && (
                          <Badge variant="outline" className="text-xs">
                            ~{t.estimatedSize.toLocaleString('tr-TR')} kişi
                          </Badge>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
