'use client';

/**
 * /ngo-admin/call-center/queue
 *
 * STK arama sırası. GET /api/ngo-admin/call-center/queue tüketir,
 * 30 saniyede bir yeniler. Her item için "Sıradakini Ara" CTA
 * /ngo-admin/call-center/call/{contactId} sayfasına yönlendirir.
 *
 * KVKK: yalnızca planlama metadata gösterir; recording / transcript yok.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Clock,
  UserPlus,
  RotateCcw,
  Target,
  Loader2,
  MessageCircle,
} from 'lucide-react';
import { messagingFetch } from '@/lib/messaging/client';
import { useToast } from '@/hooks/use-toast';

type QueueType = 'callback' | 'new' | 'retry';
type QueuePriority = 'high' | 'normal' | 'low';

interface QueueItem {
  type: QueueType;
  priority: QueuePriority;
  contactId: string;
  contactName: string;
  phone: string;
  attempts: number;
  lastDisposition?: string;
  scheduledAt?: string;
  reason?: string;
  callbackId?: string;
  whatsAppResponse?: 'yes' | 'no' | null;
  whatsAppPending?: boolean;
}

interface QueueStats {
  callbacksDue: number;
  newContacts: number;
  retries: number;
  total: number;
  whatsAppResponders?: number;
  whatsAppPending?: number;
}

interface QueueResponse {
  queue: QueueItem[];
  stats: QueueStats;
}

const REFRESH_MS = 30_000;

const TYPE_META: Record<QueueType, { label: string; icon: React.ReactNode; ring: string }> = {
  callback: {
    label: 'Callback',
    icon: <Clock className="h-5 w-5 text-rose-600" />,
    ring: 'ring-rose-200',
  },
  new: {
    label: 'Yeni Kişi',
    icon: <UserPlus className="h-5 w-5 text-blue-600" />,
    ring: 'ring-blue-200',
  },
  retry: {
    label: 'Tekrar',
    icon: <RotateCcw className="h-5 w-5 text-amber-600" />,
    ring: 'ring-amber-200',
  },
};

const PRIORITY_BADGE: Record<QueuePriority, string> = {
  high: 'bg-rose-100 text-rose-800 border-rose-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-amber-100 text-amber-800 border-amber-200',
};

const PRIORITY_LABEL: Record<QueuePriority, string> = {
  high: 'Yüksek',
  normal: 'Normal',
  low: 'Düşük',
};

const DISPOSITION_LABEL: Record<string, string> = {
  'no-answer': 'Cevap yok',
  busy: 'Meşgul',
};

function formatScheduled(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function CallCenterQueuePage() {
  const { toast } = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [stats, setStats] = useState<QueueStats>({
    callbacksDue: 0,
    newContacts: 0,
    retries: 0,
    total: 0,
    whatsAppResponders: 0,
    whatsAppPending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadQueue = useCallback(
    async (background: boolean) => {
      if (background) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await messagingFetch<QueueResponse>('/api/ngo-admin/call-center/queue');
        setQueue(data.queue ?? []);
        setStats(
          data.stats ?? {
            callbacksDue: 0,
            newContacts: 0,
            retries: 0,
            total: 0,
            whatsAppResponders: 0,
            whatsAppPending: 0,
          },
        );
        setErrorMessage(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Sıra yüklenemedi.';
        setErrorMessage(msg);
        if (!background) {
          toast({
            title: 'Sıra yüklenemedi',
            description: msg,
            variant: 'destructive',
          });
        }
      } finally {
        if (background) setRefreshing(false);
        else setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadQueue(false);
    const id = setInterval(() => {
      void loadQueue(true);
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadQueue]);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-4">
      <Link
        href="/ngo-admin/call-center"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Çağrı Merkezi
      </Link>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
            <Target className="h-6 w-6 text-blue-600" /> Arama Sırası
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Önceliklendirilmiş kişi listesi. Sıra her 30 saniyede bir yenilenir.
          </p>
        </div>
        {refreshing && (
          <span className="inline-flex items-center text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Yenileniyor
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <KpiCard label="Bekleyen Callback" value={stats.callbacksDue} tone="rose" />
        <KpiCard label="Yeni Kişi" value={stats.newContacts} tone="blue" />
        <KpiCard label="Tekrar Aranacak" value={stats.retries} tone="amber" />
        <KpiCard
          label="WA Cevap Bekliyor"
          value={stats.whatsAppPending ?? 0}
          tone="emerald"
        />
        <KpiCard label="Toplam" value={stats.total} tone="slate" />
      </div>

      {errorMessage && !loading && (
        <Card className="border-rose-300 bg-rose-50/40">
          <CardContent className="py-4 text-sm text-rose-800">
            {errorMessage}
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : queue.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-2">
            <Target className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Sırada kişi yok. Liste yükle veya yeni callback planla.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {queue.map((item) => (
            <QueueItemCard
              key={`${item.type}-${item.contactId}-${item.callbackId ?? 'x'}`}
              item={item}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
  tone: 'rose' | 'blue' | 'amber' | 'slate' | 'emerald';
}

const KPI_TONE: Record<KpiCardProps['tone'], string> = {
  rose: 'border-rose-200 bg-rose-50/40 text-rose-900',
  blue: 'border-blue-200 bg-blue-50/40 text-blue-900',
  amber: 'border-amber-200 bg-amber-50/40 text-amber-900',
  slate: 'border-slate-200 bg-slate-50/40 text-slate-900',
  emerald: 'border-emerald-200 bg-emerald-50/40 text-emerald-900',
};

function KpiCard({ label, value, tone }: KpiCardProps) {
  return (
    <Card className={KPI_TONE[tone]}>
      <CardHeader className="p-3 pb-1">
        <CardTitle className="text-xs font-medium opacity-80">{label}</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <div className="text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

interface QueueItemCardProps {
  item: QueueItem;
}

function QueueItemCard({ item }: QueueItemCardProps) {
  const meta = TYPE_META[item.type];
  return (
    <Card className={`ring-1 ${meta.ring}`}>
      <CardContent className="p-4 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 min-w-[140px]">
          {meta.icon}
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {meta.label}
            </span>
            <Badge variant="outline" className={`mt-1 w-fit ${PRIORITY_BADGE[item.priority]}`}>
              {PRIORITY_LABEL[item.priority]}
            </Badge>
          </div>
        </div>

        <div className="flex-1 min-w-[200px] space-y-1">
          <div className="font-medium text-sm flex items-center gap-2 flex-wrap">
            <span>{item.contactName || 'İsimsiz'}</span>
            {item.whatsAppResponse === 'yes' && (
              <Badge
                variant="outline"
                className="bg-emerald-100 text-emerald-800 border-emerald-200"
              >
                <MessageCircle className="h-3 w-3 mr-1" /> WA Cevap Verdi
              </Badge>
            )}
            {item.whatsAppPending && (
              <Badge
                variant="outline"
                className="bg-amber-50 text-amber-800 border-amber-200"
              >
                <MessageCircle className="h-3 w-3 mr-1" /> WA Cevap Bekliyor
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">{item.phone}</div>
          {item.type === 'callback' && (
            <div className="text-xs text-rose-700 space-x-2">
              <span>Planlandı: {formatScheduled(item.scheduledAt)}</span>
              {item.reason && <span className="opacity-80">— {item.reason}</span>}
            </div>
          )}
          {item.type === 'retry' && item.lastDisposition && (
            <div className="text-xs text-amber-700">
              Önceki sonuç: {DISPOSITION_LABEL[item.lastDisposition] ?? item.lastDisposition}
              {item.attempts > 0 && (
                <span className="ml-1 opacity-70">({item.attempts}. deneme)</span>
              )}
            </div>
          )}
        </div>

        <Link href={`/ngo-admin/call-center/call/${item.contactId}`}>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Target className="h-4 w-4 mr-1" /> Sıradakini Ara
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
