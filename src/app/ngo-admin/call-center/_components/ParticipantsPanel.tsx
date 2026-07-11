'use client';

/**
 * ParticipantsPanel — santralin "Etkinlik Katılımcıları" / "Gönüllü
 * Katılımcıları" sekmesi.
 *
 * Katılımcılar, RSVP + gönüllü başvurularından santralContacts'a senkronlanır
 * (/api/ngo-admin/participants/sync) ve buradan listelenir
 * (/api/ngo-admin/participants). Her katılımcı zaten bir santral kişisi
 * olduğundan "Ara" → mevcut /call-center/call/[contactId] sayfasına gider:
 * tek-tuş arama, kalıcı not, arama sonucu (disposition), WhatsApp — hepsi hazır.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Phone, RefreshCw, Search, Loader2, Users, AlertCircle, ChevronRight, Calendar, HeartHandshake, MessageSquare,
} from 'lucide-react';

type Source = 'event' | 'volunteer';

interface ParticipantRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  attempts: number;
  lastDisposition: string | null;
  sources: { label: string; refId: string; when: string }[];
}

// Santral disposition kodları → kısa etiket + renk (call/[contactId] ile aynı kodlar).
const DISPOSITION: Record<string, { label: string; cls: string }> = {
  answered: { label: 'Görüşüldü', cls: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' },
  'no-answer': { label: 'Ulaşılamadı', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  busy: { label: 'Meşgul', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  rejected: { label: 'Reddetti', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  voicemail: { label: 'Sesli mesaj', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  'wrong-number': { label: 'Yanlış numara', cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
  'callback-requested': { label: 'Geri aranacak', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300' },
};

export function ParticipantsPanel({ source }: { source: Source }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [rows, setRows] = useState<ParticipantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (query = '') => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const url = `/api/ngo-admin/participants?source=${source}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
      const res = await fetch(url, { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Liste yüklenemedi.');
      setRows(data.participants || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Beklenmeyen hata.');
    } finally {
      setLoading(false);
    }
  }, [user, source]);

  useEffect(() => { void load(); }, [load]);

  const handleSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/participants/sync', {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Senkronizasyon başarısız.');
      toast({
        title: 'Katılımcılar güncellendi',
        description: `${data.synced} kişi (${data.created} yeni, ${data.matched} mevcut)${data.skippedNoPhone > 0 ? ` · telefonsuz ${data.skippedNoPhone} kişi atlandı` : ''}.`,
      });
      await load(q);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Senkron başarısız', description: e instanceof Error ? e.message : 'Hata.' });
    } finally {
      setSyncing(false);
    }
  };

  const SourceIcon = source === 'event' ? Calendar : HeartHandshake;
  const title = source === 'event' ? 'Etkinlik Katılımcıları' : 'Gönüllü Katılımcıları';

  return (
    <div className="space-y-4">
      {/* Üst şerit: başlık + senkron + arama */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <SourceIcon className="h-4 w-4 text-primary" />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-sm leading-tight">{title}</h2>
            <p className="text-xs text-muted-foreground">{rows.length} kişi listeleniyor</p>
          </div>
        </div>
        <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm" className="rounded-xl min-h-[44px] shrink-0">
          {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Katılımcıları Güncelle
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void load(q); }}
          placeholder="Ad, telefon veya e-posta ara"
          className="pl-9 rounded-xl min-h-[44px]"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground space-y-2 px-6">
          <Users className="h-10 w-10 mx-auto opacity-30" />
          <p className="font-medium">Henüz katılımcı yok</p>
          <p className="text-xs">
            {source === 'event'
              ? 'Etkinliklerine katılan kişileri görmek için "Katılımcıları Güncelle"ye bas.'
              : 'Kuruluşuna gönüllü başvurusu yapan kişileri görmek için "Katılımcıları Güncelle"ye bas.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((p) => {
            const disp = p.lastDisposition ? DISPOSITION[p.lastDisposition] : null;
            return (
              <Card key={p.id} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm leading-tight break-words">{p.name}</p>
                        {disp && <Badge className={`rounded-full text-[11px] font-semibold ${disp.cls}`}>{disp.label}</Badge>}
                        {p.attempts > 0 && !disp && (
                          <Badge variant="outline" className="rounded-full text-[11px]">{p.attempts} deneme</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 tabular-nums">{p.phone}{p.email ? ` · ${p.email}` : ''}</p>
                      {p.sources.length > 0 && (
                        <p className="text-xs text-muted-foreground/80 mt-1 break-words">
                          {p.sources.map((s) => s.label).filter(Boolean).slice(0, 3).join(' · ')}
                          {p.sources.length > 3 ? ` +${p.sources.length - 3}` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Tek tuş: mevcut çağrı sayfası — arama + not + sonuç + WhatsApp hazır */}
                      <Button asChild size="sm" className="rounded-xl min-h-[44px]">
                        <Link href={`/ngo-admin/call-center/call/${p.id}`}>
                          <Phone className="h-4 w-4 sm:mr-1.5" />
                          <span className="hidden sm:inline">Ara</span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                  {/* Alt aksiyon satırı: detay/not için de aynı sayfa (sağ panelde not alanı var) */}
                  <div className="mt-3 flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="rounded-xl flex-1 min-h-[44px]">
                      <Link href={`/ngo-admin/call-center/call/${p.id}`}>
                        <MessageSquare className="h-4 w-4 mr-1.5" />
                        <span className="text-xs font-semibold">Not & Detay</span>
                        <ChevronRight className="h-3.5 w-3.5 ml-auto opacity-60" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
