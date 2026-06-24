'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, orderBy, query, limit, getDocs, where } from 'firebase/firestore';
import { ArrowLeft, Mail, MessageSquare, Loader2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { COLLECTIONS } from '@/firebase/collections';

interface CampaignDoc {
  name?: string;
  channel?: 'sms' | 'email';
  useCase?: string;
  status?: string;
  subject?: string | null;
  body?: string;
  senderId?: string;
  fromEmail?: string | null;
  fromName?: string | null;
  createdAt?: { toDate?: () => Date };
  startedAt?: { toDate?: () => Date };
  completedAt?: { toDate?: () => Date };
  schedule?: { mode?: string; scheduledAt?: { toDate?: () => Date } | null };
  recipients?: {
    afterConsentFilter?: number;
    sourceSummary?: Record<string, number>;
  };
  stats?: { queued?: number; sent?: number; delivered?: number; opened?: number; clicked?: number; failed?: number; bounced?: number };
  cost?: { encoding?: string; smsSegments?: number; estimatedCost?: number; currency?: string };
}

type TS = { toDate?: () => Date };

interface RecipientDoc {
  id: string;
  channelAddress?: string;
  userId?: string | null;
  status?: string;
  sentAt?: TS;
  // Webhook (messaging/webhook/[driver]) bu zaman damgalarını alıcıya yazar.
  deliveredAt?: TS;
  openedAt?: TS;
  clickedAt?: TS;
  lastError?: string | null;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  scheduled: 'bg-amber-200 text-amber-800',
  enqueuing: 'bg-blue-200 text-blue-800',
  sending: 'bg-violet-200 text-violet-800',
  completed: 'bg-emerald-200 text-emerald-800',
  failed: 'bg-rose-200 text-rose-800',
  cancelled: 'bg-gray-300 text-gray-700',
};

function fmt(d?: TS) {
  if (!d?.toDate) return null;
  try {
    return d.toDate().toLocaleString('tr-TR');
  } catch {
    return null;
  }
}

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const db = useFirestore();

  const campRef = useMemoFirebase(() => doc(db, COLLECTIONS.campaigns, params.id), [db, params.id]);
  const { data, isLoading } = useDoc<CampaignDoc>(campRef);

  const recipientsQuery = useMemoFirebase(
    () => query(collection(db, COLLECTIONS.campaigns, params.id, 'recipients'), orderBy('createdAt', 'desc'), limit(50)),
    [db, params.id]
  );
  const { data: recipients } = useCollection<RecipientDoc>(recipientsQuery);

  // "Kayıt oldu saat" — alıcının e-postası bir hangel kullanıcısına denk geliyorsa
  // o kullanıcının kayıt (createdAt) tarihi. E-postaları 30'arlı parçalayıp `in`
  // sorgusuyla toplu çekeriz (50 alıcı için en çok 2 sorgu). Rules engellerse sessiz.
  const [regMap, setRegMap] = useState<Record<string, TS>>({});
  useEffect(() => {
    if (!db || !recipients || recipients.length === 0) return;
    const emails = Array.from(
      new Set(
        recipients
          .map((r) => (r.channelAddress || '').trim().toLowerCase())
          .filter((a) => a.includes('@')),
      ),
    );
    if (emails.length === 0) return;
    let cancelled = false;
    (async () => {
      const map: Record<string, TS> = {};
      for (let i = 0; i < emails.length; i += 30) {
        const chunk = emails.slice(i, i + 30);
        try {
          const snap = await getDocs(query(collection(db, COLLECTIONS.users), where('email', 'in', chunk)));
          snap.forEach((d) => {
            const u = d.data() as { email?: string; createdAt?: TS };
            const em = (u.email || '').trim().toLowerCase();
            if (em && u.createdAt) map[em] = u.createdAt;
          });
        } catch {
          /* rules/izin — sessiz; o satır "—" kalır */
        }
      }
      if (!cancelled) setRegMap(map);
    })();
    return () => {
      cancelled = true;
    };
  }, [db, recipients]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <Link href="/super-admin/messaging/campaigns" className="text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 inline mr-1" /> Kampanyalar
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">Kampanya bulunamadı.</p>
      </div>
    );
  }

  const total = data.recipients?.afterConsentFilter ?? data.stats?.queued ?? 0;
  const isEmail = data.channel === 'email';

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/super-admin/messaging/campaigns" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Kampanyalar
        </Link>
        <Badge className={cn('text-sm', STATUS_BADGE[data.status ?? 'draft'])}>{data.status}</Badge>
      </div>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">{data.name ?? params.id}</h1>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          {isEmail ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          <span>{data.channel}</span>
          <span>·</span>
          <span>{data.useCase}</span>
          {data.schedule?.scheduledAt && (
            <>
              <span>·</span>
              <span>Zamanlandı: {fmt(data.schedule.scheduledAt)}</span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <StatCard label="Alıcı" value={total} />
        <StatCard label="Gönderildi" value={data.stats?.sent ?? 0} accent="emerald" />
        <StatCard label="İletildi" value={data.stats?.delivered ?? 0} accent="emerald" />
        {isEmail && <StatCard label="Açıldı" value={data.stats?.opened ?? 0} accent="violet" />}
        {isEmail && <StatCard label="Tıklandı" value={data.stats?.clicked ?? 0} accent="violet" />}
        <StatCard label="Başarısız" value={data.stats?.failed ?? 0} accent="rose" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Detaylar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Oluşturulma" value={fmt(data.createdAt) ?? '—'} />
            <Row label="Başlangıç" value={fmt(data.startedAt) ?? '—'} />
            <Row label="Bitiş" value={fmt(data.completedAt) ?? '—'} />
            <Row label="Gönderici" value={data.senderId ?? '—'} />
            {isEmail && <Row label="From" value={`${data.fromName ?? ''} <${data.fromEmail ?? ''}>`} />}
            {data.cost?.encoding && (
              <Row
                label="SMS maliyet"
                value={`${data.cost.smsSegments ?? 0} segment · ~${(data.cost.estimatedCost ?? 0).toFixed(2)} ${data.cost.currency}`}
              />
            )}
            {data.cost?.estimatedCost !== undefined && isEmail && (
              <Row label="Email maliyet" value={`~${data.cost.estimatedCost.toFixed(2)} ${data.cost.currency ?? 'TRY'}`} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">İçerik</CardTitle>
          </CardHeader>
          <CardContent>
            {data.subject && <p className="text-sm font-semibold mb-2">Konu: {data.subject}</p>}
            {isEmail ? (
              <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.body ?? '') }} />
            ) : (
              <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/30 p-2 rounded">{data.body}</pre>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <Activity className="h-5 w-5 text-violet-500" />
          <CardTitle className="text-base">Alıcılar (son 50) — saat saat</CardTitle>
        </CardHeader>
        <CardContent>
          {!recipients || recipients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz alıcı yok.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-2 font-medium">Adres</th>
                    <th className="px-2 py-2 font-medium">Gönderildi</th>
                    <th className="px-2 py-2 font-medium">İletildi</th>
                    {isEmail && <th className="px-2 py-2 font-medium">Okundu</th>}
                    <th className="px-2 py-2 font-medium">Kayıt oldu</th>
                    <th className="py-2 pl-2 font-medium">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((r) => {
                    const em = (r.channelAddress || '').trim().toLowerCase();
                    const reg = regMap[em];
                    return (
                      <tr key={r.id} className="border-b last:border-0">
                        <td className="max-w-[180px] truncate py-1.5 pr-2 font-mono">{r.channelAddress}</td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">{fmt(r.sentAt) ?? '—'}</td>
                        <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">{fmt(r.deliveredAt) ?? '—'}</td>
                        {isEmail && (
                          <td className="whitespace-nowrap px-2 py-1.5 text-muted-foreground">{fmt(r.openedAt) ?? '—'}</td>
                        )}
                        <td className="whitespace-nowrap px-2 py-1.5">
                          {reg ? <span className="font-medium text-emerald-700">{fmt(reg)}</span> : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="py-1.5 pl-2">
                          <Badge variant="outline" className="text-xs">{r.status ?? 'pending'}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {isEmail && (
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  <strong>İletildi / Okundu</strong> sütunları Resend webhook&apos;u (<code>/api/messaging/webhook/resend</code>) + Resend
                  panelinde açılma takibi açık olduğunda dolar. <strong>Kayıt oldu</strong>: alıcının e-postası bir hangel hesabıyla
                  eşleşirse o hesabın kayıt tarihidir.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: 'emerald' | 'rose' | 'violet' }) {
  const cls =
    accent === 'emerald' ? 'text-emerald-700' : accent === 'rose' ? 'text-rose-700' : accent === 'violet' ? 'text-violet-700' : '';
  return (
    <div className="p-3 rounded border bg-card">
      <p className={cn('text-2xl font-bold', cls)}>{value.toLocaleString('tr-TR')}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium truncate">{value}</span>
    </div>
  );
}
