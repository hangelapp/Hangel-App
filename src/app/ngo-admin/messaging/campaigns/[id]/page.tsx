'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { ArrowLeft, Mail, MessageSquare, MessageCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLLECTIONS } from '@/firebase/collections';

interface CampaignDoc {
  name?: string;
  channel?: 'sms' | 'email' | 'whatsapp';
  useCase?: string;
  status?: string;
  subject?: string | null;
  body?: string;
  senderId?: string;
  ngoId?: string;
  createdAt?: { toDate?: () => Date };
  schedule?: { scheduledAt?: { toDate?: () => Date } | null };
  recipients?: { afterConsentFilter?: number };
  stats?: { queued?: number; sent?: number; delivered?: number; failed?: number; bounced?: number };
  cost?: { total?: number; currency?: string };
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  scheduled: 'bg-amber-200 text-amber-800',
  sending: 'bg-violet-200 text-violet-800',
  completed: 'bg-emerald-200 text-emerald-800',
  failed: 'bg-rose-200 text-rose-800',
};

// eslint-disable-next-line unused-imports/no-unused-vars
function fmt(d?: { toDate?: () => Date }) {
  if (!d?.toDate) return null;
  try { return d.toDate().toLocaleString('tr-TR'); } catch { return null; }
}

export default function NgoCampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const db = useFirestore();
  const ref = useMemoFirebase(() => doc(db, COLLECTIONS.campaigns, params.id), [db, params.id]);
  const { data, isLoading } = useDoc<CampaignDoc>(ref);

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
        <p className="text-sm text-muted-foreground">Kampanya bulunamadı.</p>
      </div>
    );
  }

  const total = data.recipients?.afterConsentFilter ?? data.stats?.queued ?? 0;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-4">
      <Link href="/ngo-admin/messaging/campaigns" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Kampanyalar
      </Link>

      <div>
        <h1 className="text-2xl font-bold font-headline">{data.name}</h1>
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          {data.channel === 'email' ? <Mail className="h-4 w-4" /> : data.channel === 'whatsapp' ? <MessageCircle className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          <span>{data.channel}</span><span>·</span><span>{data.useCase}</span>
          <Badge className={cn('text-xs ml-2', STATUS_BADGE[data.status ?? 'draft'])}>{data.status}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Alıcı" value={total} />
        <Stat label="Gönderildi" value={data.stats?.sent ?? 0} accent="emerald" />
        <Stat label="Teslim" value={data.stats?.delivered ?? 0} accent="emerald" />
        <Stat label="Başarısız" value={data.stats?.failed ?? 0} accent="rose" />
      </div>

      {data.cost?.total !== undefined && (
        <Card>
          <CardContent className="py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Maliyet</span>
            <span className="font-bold">{data.cost.total.toFixed(2)} {data.cost.currency}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">İçerik</CardTitle>
        </CardHeader>
        <CardContent>
          {data.subject && <p className="text-sm font-semibold mb-2">{data.subject}</p>}
          <pre className="text-sm whitespace-pre-wrap font-sans bg-muted/30 p-2 rounded">{data.body}</pre>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: 'emerald' | 'rose' }) {
  const cls = accent === 'emerald' ? 'text-emerald-700' : accent === 'rose' ? 'text-rose-700' : '';
  return (
    <div className="p-3 rounded border bg-card text-center">
      <p className={cn('text-xl font-bold', cls)}>{value.toLocaleString('tr-TR')}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
