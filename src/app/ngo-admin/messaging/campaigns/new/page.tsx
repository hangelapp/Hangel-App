'use client';

/**
 * NGO admin kampanya oluşturma sayfası.
 *
 * Tek-form composer:
 *  - Kanal radio (sms/email/whatsapp)
 *  - Segment dropdown (ngoRecipientSegments, kendi ngoId'sine filtrelenmiş)
 *  - Konu (yalnız email)
 *  - Gövde + karakter sayacı + SMS segment göstergesi
 *  - Opsiyonel `scheduledAt`
 *  - Cüzdan bakiyesi + tahmini maliyet (client-side; sunucu yetkili tekrar hesaplar)
 *  - Yetersiz bakiye → submit disable
 *  - Başarılı POST → list'e yönlendir + toast
 *
 * Auth gate: `/api/ngo-admin/messaging/me` 401/403/missing ngo → `/market`.
 */

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import {
  ArrowLeft, Send, Loader2, Mail, MessageSquare, MessageCircle, AlertTriangle,
  Users, Wallet, Clock,
} from 'lucide-react';
import { messagingFetch } from '@/lib/messaging/client';
import { segmentInfo } from '@/lib/messaging/sms-segments';
import { COLLECTIONS } from '@/firebase/collections';
import { cn } from '@/lib/utils';

type Channel = 'sms' | 'email' | 'whatsapp';
type UseCase = 'transactional' | 'marketing' | 'emergency';

interface DryRunSummary {
  afterDedupe: number;
  afterConsent: number;
  invalidAddress: number;
}

interface MeResponse {
  ngoId: string;
  wallet: {
    balance: number;
    reserved: number;
    freeQuotaUsed?: Record<string, number>;
    currency: string;
  };
  freeQuota?: { sms: number; email: number; whatsapp: number };
}

interface SegmentRow {
  id: string;
  name?: string;
  channel?: string;
  estimatedSize?: number;
  ngoId?: string;
}

// Client-side mirror of `computeCampaignCost` (DEFAULT_PRICING). Server is authoritative.
const PRICING = {
  sms: { perUnit: 0.40 },
  email: { perUnit: 0.02 },
  whatsapp: { perUnit: 0.80 },
  whatsappMultiplier: {
    marketing: 5,
    utility: 2,
    authentication: 2,
    service: 0,
  } as const,
  freeQuota: { sms: 100, email: 500, whatsapp: 50 },
  kdv: 0.20,
};

function estimateCost(opts: {
  channel: Channel;
  recipientCount: number;
  body: string;
  whatsappCategory?: 'marketing' | 'utility' | 'authentication' | 'service';
  freeQuotaUsed: number;
}): { subtotal: number; kdv: number; total: number; units: number } {
  if (opts.recipientCount === 0) return { subtotal: 0, kdv: 0, total: 0, units: 0 };
  let unitsPerRecipient = 1;
  if (opts.channel === 'sms') {
    unitsPerRecipient = segmentInfo(opts.body || '').segments || 1;
  } else if (opts.channel === 'whatsapp') {
    unitsPerRecipient = PRICING.whatsappMultiplier[opts.whatsappCategory ?? 'utility'];
  }
  const totalUnits = opts.recipientCount * unitsPerRecipient;
  const freeRemaining = Math.max(0, PRICING.freeQuota[opts.channel] - opts.freeQuotaUsed);
  const billableUnits = Math.max(0, totalUnits - Math.min(totalUnits, freeRemaining));
  const subtotal = +(billableUnits * PRICING[opts.channel].perUnit).toFixed(2);
  const kdv = +(subtotal * PRICING.kdv).toFixed(2);
  const total = +(subtotal + kdv).toFixed(2);
  return { subtotal, kdv, total, units: totalUnits };
}

function NgoNewCampaignPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const db = useFirestore();

  const initialChannel = (searchParams.get('channel') as Channel) ?? 'sms';

  const [me, setMe] = useState<MeResponse | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  const [name, setName] = useState('');
  const [channel, setChannel] = useState<Channel>(initialChannel);
  const [useCase, setUseCase] = useState<UseCase>('transactional');
  const [segmentId, setSegmentId] = useState<string>('__all');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [senderId, setSenderId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [waTemplateName, setWaTemplateName] = useState('');
  const [waLanguage, setWaLanguage] = useState('tr');

  const [dryRun, setDryRun] = useState<DryRunSummary | null>(null);
  const [dryRunning, setDryRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doubleConfirm, setDoubleConfirm] = useState('');

  // Auth + wallet load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await messagingFetch<MeResponse>('/api/ngo-admin/messaging/me');
        if (cancelled) return;
        if (!data.ngoId) {
          router.replace('/market');
          return;
        }
        setMe(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        // Auth fail → bounce to market per acceptance criteria
        if (/401|403|yetk|Oturum/i.test(message)) {
          router.replace('/market');
          return;
        }
        toast({ variant: 'destructive', title: 'Cüzdan yüklenemedi', description: message });
      } finally {
        if (!cancelled) setMeLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router, toast]);

  // Segments (NGO-scoped)
  const segmentsQuery = useMemoFirebase(
    () =>
      me?.ngoId
        ? query(
            collection(db, COLLECTIONS.ngoRecipientSegments),
            where('ngoId', '==', me.ngoId),
            orderBy('updatedAt', 'desc')
          )
        : null,
    [db, me?.ngoId]
  );
  const { data: segments } = useCollection<SegmentRow>(segmentsQuery);

  const filteredSegments = useMemo(
    () =>
      (segments ?? []).filter(
        (s) => !s.channel || s.channel === channel || s.channel === 'both'
      ),
    [segments, channel]
  );

  // Dry-run on recipient-shaping inputs
  useEffect(() => {
    if (!me?.ngoId) return;
    const handle = setTimeout(async () => {
      setDryRunning(true);
      try {
        const result = await messagingFetch<{ summary: DryRunSummary }>(
          '/api/ngo-admin/messaging/resolve-recipients',
          {
            method: 'POST',
            body: JSON.stringify({
              channel,
              useCase,
              segmentIds: segmentId !== '__all' ? [segmentId] : undefined,
            }),
          }
        );
        setDryRun(result.summary);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast({ variant: 'destructive', title: 'Tahmin hatası', description: message });
        setDryRun(null);
      } finally {
        setDryRunning(false);
      }
    }, 600);
    return () => clearTimeout(handle);
  }, [me?.ngoId, channel, useCase, segmentId, toast]);

  const recipientCount = dryRun?.afterConsent ?? 0;
  const sms = useMemo(() => (channel === 'sms' ? segmentInfo(body) : null), [body, channel]);

  const freeQuotaUsed = me?.wallet.freeQuotaUsed?.[channel] ?? 0;
  const cost = useMemo(
    () =>
      estimateCost({
        channel,
        recipientCount,
        body,
        whatsappCategory: channel === 'whatsapp' ? (useCase === 'marketing' ? 'marketing' : 'utility') : undefined,
        freeQuotaUsed,
      }),
    [channel, recipientCount, body, useCase, freeQuotaUsed]
  );

  const availableBalance = me ? me.wallet.balance - me.wallet.reserved : 0;
  const insufficient = !!me && cost.total > availableBalance;
  const needsDoubleConfirm = recipientCount >= 1000;
  const charLimit = channel === 'sms' ? 459 : channel === 'email' ? 50_000 : 1024;

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    if (!me?.ngoId) return false;
    if (!name.trim() || !body.trim()) return false;
    if (channel === 'email' && !subject.trim()) return false;
    if (channel === 'sms' && !senderId.trim()) return false;
    if (channel === 'whatsapp' && (!waTemplateName.trim() || !senderId.trim())) return false;
    if (recipientCount === 0) return false;
    if (insufficient) return false;
    if (needsDoubleConfirm && Number(doubleConfirm) !== recipientCount) return false;
    return true;
  }, [submitting, me?.ngoId, name, body, subject, channel, senderId, waTemplateName, recipientCount, insufficient, needsDoubleConfirm, doubleConfirm]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const result = await messagingFetch<{ campaignId: string; status: string }>(
        '/api/ngo-admin/messaging/campaigns',
        {
          method: 'POST',
          body: JSON.stringify({
            name: name.trim(),
            channel,
            useCase,
            subject: channel === 'email' ? subject : undefined,
            body,
            senderId,
            spec: {
              channel,
              useCase,
              segmentIds: segmentId !== '__all' ? [segmentId] : undefined,
            },
            scheduledAt: scheduledAt || null,
            whatsapp: channel === 'whatsapp' ? {
              templateName: waTemplateName,
              templateLanguage: waLanguage,
              conversationCategory: useCase === 'marketing' ? 'marketing' : 'utility',
              wabaPhoneNumberId: senderId,
            } : undefined,
            doubleConfirmCount: needsDoubleConfirm ? recipientCount : undefined,
          }),
        }
      );
      toast({
        title: scheduledAt ? 'Kampanya zamanlandı' : 'Kampanya gönderiliyor',
        description: result.status,
      });
      router.push('/ngo-admin/messaging/campaigns');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  if (meLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!me) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-6">
      <Link href="/ngo-admin/messaging/campaigns" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Kampanyalar
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Yeni Kampanya</h1>
        <p className="text-sm text-muted-foreground mt-1">SMS / E-posta / WhatsApp toplu mesaj oluştur.</p>
      </div>

      {/* Wallet snapshot */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-600" />
            <CardTitle className="text-sm">Cüzdan</CardTitle>
          </div>
          <Link href="/ngo-admin/messaging/wallet/topup" className="text-xs text-primary underline">
            Kontör yükle
          </Link>
        </CardHeader>
        <CardContent className="pt-0 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Bakiye</div>
            <div className="font-mono font-semibold">{me.wallet.balance.toLocaleString('tr-TR')} {me.wallet.currency}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Rezerve</div>
            <div className="font-mono">{me.wallet.reserved.toLocaleString('tr-TR')} {me.wallet.currency}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Kullanılabilir</div>
            <div className={cn('font-mono font-semibold', insufficient ? 'text-rose-700' : 'text-emerald-700')}>
              {availableBalance.toLocaleString('tr-TR')} {me.wallet.currency}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kanal & Hedef Kitle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Kanal</Label>
            <div className="grid grid-cols-3 gap-2 mt-1" role="radiogroup" aria-label="Kanal">
              {(['sms', 'email', 'whatsapp'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={channel === c}
                  onClick={() => setChannel(c)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded border-2 text-left',
                    channel === c ? 'border-primary bg-primary/5' : 'border-muted'
                  )}
                >
                  {c === 'sms' ? <MessageSquare className="h-5 w-5" /> : c === 'email' ? <Mail className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
                  <span className="text-sm font-medium uppercase">{c}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Amaç</Label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {(['transactional', 'marketing', 'emergency'] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUseCase(u)}
                  className={cn(
                    'p-3 rounded border-2 text-left text-sm font-medium',
                    useCase === u ? 'border-primary bg-primary/5' : 'border-muted'
                  )}
                >
                  {u === 'transactional' ? 'İşlemsel' : u === 'marketing' ? 'Pazarlama' : 'Acil'}
                </button>
              ))}
            </div>
            {useCase === 'marketing' && (
              <div className="flex items-start gap-2 mt-2 p-3 bg-amber-50 border border-amber-200 rounded text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <span>Pazarlama izni olmayan kullanıcılar otomatik elenir.</span>
              </div>
            )}
          </div>

          <div>
            <Label>Segment</Label>
            <Select value={segmentId} onValueChange={setSegmentId}>
              <SelectTrigger>
                <SelectValue placeholder="Tüm NGO üyeleri" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all">Tüm NGO üyeleri</SelectItem>
                {filteredSegments.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name ?? s.id}{typeof s.estimatedSize === 'number' ? ` (~${s.estimatedSize})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {filteredSegments.length === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Bu kanala uygun kayıtlı segment yok — varsayılan: NGO'nun tüm üyelerine gönderilir.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded bg-muted/40">
              <div className="text-xl font-bold">{(dryRun?.afterDedupe ?? 0).toLocaleString('tr-TR')}</div>
              <div className="text-xs text-muted-foreground">Tekil</div>
            </div>
            <div className="p-3 rounded bg-muted/40">
              <div className="text-xl font-bold">{(dryRun?.invalidAddress ?? 0).toLocaleString('tr-TR')}</div>
              <div className="text-xs text-muted-foreground">Geçersiz</div>
            </div>
            <div className="p-3 rounded bg-primary/10">
              <div className="text-xl font-bold text-primary inline-flex items-center gap-1">
                {dryRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                {recipientCount.toLocaleString('tr-TR')}
              </div>
              <div className="text-xs text-muted-foreground">İzinli alıcı</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">İçerik</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="campaign-name">Kampanya adı (dahili)</Label>
            <Input
              id="campaign-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ör. Mayıs Bağışçı Teşekkür"
            />
          </div>

          {channel === 'sms' && (
            <div>
              <Label htmlFor="sender-id">SMS Gönderici (Sender ID)</Label>
              <Input
                id="sender-id"
                value={senderId}
                onChange={(e) => setSenderId(e.target.value)}
                placeholder="ONAYLI BAŞLIK"
                maxLength={11}
              />
            </div>
          )}
          {channel === 'email' && (
            <>
              <div>
                <Label htmlFor="from-name">Gönderen adı</Label>
                <Input id="from-name" value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="STK Adı" />
              </div>
              <div>
                <Label htmlFor="subject">Konu</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Merhaba {ad}!" />
              </div>
            </>
          )}
          {channel === 'whatsapp' && (
            <>
              <div>
                <Label htmlFor="wa-template">Template adı (Meta-onaylı)</Label>
                <Input id="wa-template" value={waTemplateName} onChange={(e) => setWaTemplateName(e.target.value)} placeholder="ör. hosgeldin_uyari" />
              </div>
              <div>
                <Label htmlFor="wa-lang">Dil kodu</Label>
                <Input id="wa-lang" value={waLanguage} onChange={(e) => setWaLanguage(e.target.value)} placeholder="tr / en_US" />
              </div>
              <div>
                <Label htmlFor="waba-phone">WABA phone number ID</Label>
                <Input id="waba-phone" value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="123..." />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="body">Mesaj gövdesi</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              maxLength={charLimit}
              placeholder="Merhaba {ad}, ..."
            />
            <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
              <span>{body.length} / {charLimit} karakter</span>
              {sms && (
                <span className="inline-flex items-center gap-1">
                  <Badge variant={sms.encoding === 'GSM7' ? 'secondary' : 'outline'} className="text-[10px] py-0">
                    {sms.encoding}
                  </Badge>
                  {sms.segments} segment
                </span>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="scheduled-at" className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Zamanlama (opsiyonel)
            </Label>
            <Input
              id="scheduled-at"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Boş bırakırsan hemen gönderilir (Europe/Istanbul).
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cost preview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tahmini Maliyet</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div className="p-3 rounded bg-muted/40">
            <div className="text-lg font-bold">{cost.units.toLocaleString('tr-TR')}</div>
            <div className="text-xs text-muted-foreground">Birim</div>
          </div>
          <div className="p-3 rounded bg-muted/40">
            <div className="text-lg font-bold">{cost.subtotal.toLocaleString('tr-TR')} ₺</div>
            <div className="text-xs text-muted-foreground">Ara toplam</div>
          </div>
          <div className="p-3 rounded bg-muted/40">
            <div className="text-lg font-bold">{cost.kdv.toLocaleString('tr-TR')} ₺</div>
            <div className="text-xs text-muted-foreground">KDV</div>
          </div>
          <div className={cn('p-3 rounded', insufficient ? 'bg-rose-50' : 'bg-emerald-50')}>
            <div className={cn('text-lg font-bold', insufficient ? 'text-rose-700' : 'text-emerald-700')}>
              {cost.total.toLocaleString('tr-TR')} ₺
            </div>
            <div className="text-xs text-muted-foreground">Toplam (KDV dahil)</div>
          </div>
        </CardContent>
      </Card>

      {insufficient && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-900">
          <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5" />
          <div>
            Yetersiz bakiye. Devam etmek için <Link href="/ngo-admin/messaging/wallet/topup" className="underline font-semibold">kontör yükle</Link>.
          </div>
        </div>
      )}

      {needsDoubleConfirm && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded space-y-2">
          <div className="text-xs text-rose-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 mt-0.5" />
            <span>Büyük gönderim. Devam için <strong>{recipientCount}</strong> sayısını yaz:</span>
          </div>
          <Input
            value={doubleConfirm}
            onChange={(e) => setDoubleConfirm(e.target.value)}
            placeholder={String(recipientCount)}
            className="bg-white"
          />
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <Link href="/ngo-admin/messaging/campaigns">
          <Button variant="outline">İptal</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          {scheduledAt ? 'Zamanla' : 'Gönder'}
        </Button>
      </div>
    </div>
  );
}

export default function NgoNewCampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <NgoNewCampaignPageContent />
    </Suspense>
  );
}
