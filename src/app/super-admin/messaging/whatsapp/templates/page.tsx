'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, RefreshCw, Search, Loader2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { messagingFetch } from '@/lib/messaging/client';

interface WaTemplate {
  id: string;
  name?: string;
  language?: string;
  category?: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  metaStatus?: 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED';
  body?: string;
  syncedAt?: { toDate?: () => Date };
}

const STATUS_BADGE: Record<string, string> = {
  APPROVED: 'bg-emerald-100 text-emerald-800',
  PENDING: 'bg-amber-100 text-amber-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  PAUSED: 'bg-gray-200 text-gray-700',
  DISABLED: 'bg-gray-300 text-gray-700',
};

const CATEGORY_BADGE: Record<string, string> = {
  MARKETING: 'bg-fuchsia-100 text-fuchsia-800',
  UTILITY: 'bg-sky-100 text-sky-800',
  AUTHENTICATION: 'bg-violet-100 text-violet-800',
};

export default function WhatsAppTemplatesPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [syncing, setSyncing] = useState(false);

  const q = useMemoFirebase(
    () => query(collection(db, 'whatsappTemplates'), orderBy('syncedAt', 'desc')),
    [db]
  );
  const { data, isLoading } = useCollection<WaTemplate>(q);

  const filtered = useMemo(() => {
    if (!data) return [];
    const s = search.trim().toLowerCase();
    if (!s) return data;
    return data.filter(
      (t) =>
        (t.name ?? '').toLowerCase().includes(s) ||
        (t.body ?? '').toLowerCase().includes(s)
    );
  }, [data, search]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await messagingFetch<{ upserted: number; total: number }>(
        '/api/admin/messaging/whatsapp/templates/sync',
        { method: 'POST', body: '{}' }
      );
      toast({ title: 'Senkron tamam', description: `${result.upserted}/${result.total} şablon` });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
      <Link href="/super-admin/messaging" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Toplu SMS & E-Posta
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">WhatsApp Şablonları</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Meta Cloud API'den senkronlanan onaylı template'ler. NGO'lar sadece <strong>APPROVED</strong> olanları kullanabilir.
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing}>
          {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Meta'dan Senkronla
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Şablon ara…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Henüz template yok. "Meta'dan Senkronla" ile çek.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((t) => (
                <li key={t.id} className="py-3">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{t.name}</span>
                        <Badge variant="outline" className="text-xs">{t.language}</Badge>
                        {t.category && (
                          <Badge className={cn('text-xs', CATEGORY_BADGE[t.category])}>{t.category}</Badge>
                        )}
                        {t.metaStatus && (
                          <Badge className={cn('text-xs', STATUS_BADGE[t.metaStatus])}>{t.metaStatus}</Badge>
                        )}
                      </div>
                      {t.body && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3 whitespace-pre-wrap">
                          {t.body}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
