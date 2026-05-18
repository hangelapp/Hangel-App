'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, orderBy, query, limit } from 'firebase/firestore';
import { ArrowLeft, Mail, MessageSquare, Loader2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize-html';

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
  stats?: { queued?: number; sent?: number; delivered?: number; failed?: number; bounced?: number };
  cost?: { encoding?: string; smsSegments?: number; estimatedCost?: number; currency?: string };
}

interface RecipientDoc {
  id: string;
  channelAddress?: string;
  userId?: string | null;
  status?: string;
  sentAt?: { toDate?: () => Date };
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

function fmt(d?: { toDate?: () => Date }) {
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

  const campRef = useMemoFirebase(() => doc(db, 'campaigns', params.id), [db, params.id]);
  const { data, isLoading } = useDoc<CampaignDoc>(campRef);

  const recipientsQuery = useMemoFirebase(
    () => query(collection(db, 'campaigns', params.id, 'recipients'), orderBy('createdAt', 'desc'), limit(50)),
    [db, params.id]
  );
  const { data: recipients } = useCollection<RecipientDoc>(recipientsQuery);

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
          {data.channel === 'email' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Alıcı" value={total} />
        <StatCard label="Kuyrukta" value={data.stats?.queued ?? 0} />
        <StatCard label="Gönderildi" value={data.stats?.sent ?? 0} accent="emerald" />
        <StatCard label="Teslim" value={data.stats?.delivered ?? 0} accent="emerald" />
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
            {data.channel === 'email' && <Row label="From" value={`${data.fromName ?? ''} <${data.fromEmail ?? ''}>`} />}
            {data.cost?.encoding && (
              <Row
                label="SMS maliyet"
                value={`${data.cost.smsSegments ?? 0} segment · ~${(data.cost.estimatedCost ?? 0).toFixed(2)} ${data.cost.currency}`}
              />
            )}
            {data.cost?.estimatedCost !== undefined && data.channel === 'email' && (
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
            {data.channel === 'email' ? (
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
          <CardTitle className="text-base">Alıcılar (son 50)</CardTitle>
        </CardHeader>
        <CardContent>
          {!recipients || recipients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz alıcı yok.</p>
          ) : (
            <ul className="divide-y text-sm">
              {recipients.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-1.5">
                  <span className="font-mono text-xs truncate flex-1">{r.channelAddress}</span>
                  <span className="text-xs text-muted-foreground mx-2">{fmt(r.sentAt) ?? '—'}</span>
                  <Badge variant="outline" className="text-xs">{r.status ?? 'pending'}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: 'emerald' | 'rose' }) {
  const cls = accent === 'emerald' ? 'text-emerald-700' : accent === 'rose' ? 'text-rose-700' : '';
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
