'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useFirestore, useDoc, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { doc, collection, orderBy, query, limit, getDocs, where } from 'firebase/firestore';
import { ArrowLeft, Mail, MessageSquare, Loader2, Activity, Send, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';

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
  clickedLink?: string; // tıklanan URL (email.clicked)
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

// Otomatik gönderim hız profilleri. perTick = her tetikte gönderilen adet (endpoint üst sınırı 25),
// intervalSec = tetikler arası saniye. Modül seviyesinde sabit → effect dependency sorunu yok.
const SEND_PRESETS = [
  { key: 'safe', label: 'Güvenli', perTick: 1, intervalSec: 30 },
  { key: 'fast', label: 'Hızlı', perTick: 5, intervalSec: 15 },
  { key: 'turbo', label: 'En hızlı', perTick: 25, intervalSec: 30 },
] as const;

// q alıcı, p profil → tahmini bitiş dakikası.
function etaMin(q: number, p: { perTick: number; intervalSec: number }): number {
  if (q <= 0) return 0;
  return Math.max(1, Math.ceil((Math.ceil(q / p.perTick) * p.intervalSec) / 60));
}

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
  const { user } = useUser();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

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

  const handleSendDraft = async (count?: number) => {
    if (!user || sending) return;
    setSending(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/super-admin/messaging/campaigns/${params.id}/send-draft`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(count ? { count } : {}),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Gönderim başarısız',
          description: json?.message ?? 'Bir hata oluştu, tekrar deneyin.',
        });
        return;
      }
      const sent = json?.sent ?? 0;
      const remaining = json?.remaining ?? 0;
      // Otomatik drip (count=1) sırasında her dakika toast atma — canlı sayaç zaten güncelleniyor.
      if (count !== 1) {
        toast({ title: 'Gönderildi', description: `${sent} gönderildi, ${remaining} kaldı` });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Gönderim başarısız', description: 'Bir hata oluştu, tekrar deneyin.' });
    } finally {
      setSending(false);
    }
  };

  // Otomatik (drip) gönderim: tek tık başlat → seçilen profilde parti parti gönderir.
  // Her çağrı sunucuda ≤25 mail + throttle (timeout/engelleme yok). Sekme açık kaldıkça çalışır.
  const [autoOn, setAutoOn] = useState(false);
  const [presetIdx, setPresetIdx] = useState(2); // 'bir an önce' → varsayılan En hızlı
  const preset = SEND_PRESETS[presetIdx];
  const queuedNow = data?.stats?.queued ?? 0;
  // Interval daima en güncel handleSendDraft'ı çağırsın diye ref (yoksa stale closure).
  const sendRef = useRef(handleSendDraft);
  sendRef.current = handleSendDraft;

  useEffect(() => {
    if (!autoOn) return;
    const p = SEND_PRESETS[presetIdx];
    const tick = () => {
      void sendRef.current(p.perTick);
    };
    tick(); // başlar başlamaz ilk parti
    const t = setInterval(tick, p.intervalSec * 1000);
    return () => clearInterval(t);
  }, [autoOn, presetIdx]);

  // Kuyruk bitince otomatiği durdur.
  useEffect(() => {
    if (autoOn && queuedNow === 0) setAutoOn(false);
  }, [autoOn, queuedNow]);

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

      {(() => {
        const queued = data.stats?.queued ?? 0;
        const status = data.status ?? 'draft';
        const sendable = (status === 'draft' || status === 'sending') && queued > 0;
        const isDone = (status === 'draft' || status === 'sending') && queued === 0;
        if (!sendable && !isDone) return null;
        const batch = Math.min(25, queued);
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gönderim</CardTitle>
            </CardHeader>
            <CardContent>
              {isDone ? (
                <p className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Tamamlandı ✓
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Otomatik (drip) — önerilen: tek tık başlat, seçilen aralıkta her seferinde 1, engellemeye takılmaz */}
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      {autoOn ? (
                        <Button variant="destructive" onClick={() => setAutoOn(false)} className="gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" /> Durdur
                        </Button>
                      ) : (
                        <Button onClick={() => setAutoOn(true)} disabled={!user} className="gap-2">
                          <Send className="h-4 w-4" /> Otomatik gönder
                        </Button>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {autoOn ? 'gönderiliyor' : 'kalan'} {queued.toLocaleString('tr-TR')} · {preset.label} · ~
                        {etaMin(queued, preset)} dk
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="text-muted-foreground mr-1">hız:</span>
                      {SEND_PRESETS.map((p, i) => (
                        <button
                          key={p.key}
                          type="button"
                          disabled={autoOn}
                          onClick={() => setPresetIdx(i)}
                          className={cn(
                            'px-2 py-1 rounded border transition-colors disabled:opacity-50',
                            presetIdx === i
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'text-muted-foreground hover:bg-muted',
                          )}
                        >
                          {p.label} (~{etaMin(queued, p)} dk)
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Tek tık başlat — seçtiğin hızda <b>otomatik</b> gönderir, engellemelere takılmaz.{' '}
                      <b>Bu sekme açık kalmalı.</b>
                    </p>
                  </div>

                  {/* Manuel hızlı parti — anında {batch} tane */}
                  <div className="flex flex-wrap items-center gap-3">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" disabled={sending || !user || autoOn} className="gap-2">
                          {sending ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> gönderiliyor...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" /> {batch} tanesini şimdi gönder
                            </>
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Gönderimi onayla</AlertDialogTitle>
                          <AlertDialogDescription>
                            {batch} kuruluşa e-posta gönderilecek, emin misiniz?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleSendDraft()}>Evet, gönder</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <span className="text-sm text-muted-foreground">elle: {batch} tane / tık</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

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
                    {isEmail && <th className="px-2 py-2 font-medium">Tıkladı</th>}
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
                        {isEmail && (
                          <td className="px-2 py-1.5">
                            {r.clickedLink ? (
                              <a
                                href={r.clickedLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={r.clickedLink}
                                className="block max-w-[170px] truncate text-primary underline"
                              >
                                {r.clickedLink.replace(/^https?:\/\//, '')}
                              </a>
                            ) : r.clickedAt ? (
                              <span className="whitespace-nowrap text-muted-foreground">{fmt(r.clickedAt)}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
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
                  <strong>İletildi / Okundu / Tıkladı</strong> sütunları Resend webhook&apos;u (<code>/api/messaging/webhook/resend</code>) +
                  açılma/tıklama takibi açık olduğunda dolar; <strong>Tıkladı</strong> alıcının tıkladığı bağlantıyı gösterir.
                  <strong>Kayıt oldu</strong>: alıcının e-postası bir hangel hesabıyla eşleşirse o hesabın kayıt tarihidir.
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
