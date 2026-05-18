'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, ArrowRight, Check, Send, Loader2, Mail, MessageSquare, MessageCircle, AlertTriangle, RefreshCw, Users,
} from 'lucide-react';
import { messagingFetch } from '@/lib/messaging/client';
import { segmentInfo } from '@/lib/messaging/sms-segments';
import { cn } from '@/lib/utils';

type Channel = 'sms' | 'email' | 'whatsapp';
type UseCase = 'transactional' | 'marketing' | 'emergency';
type Step = 1 | 2 | 3;

interface DryRun {
  summary: { afterDedupe: number; afterConsent: number; invalidAddress: number };
}

function NgoNewCampaignPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const initialChannel = (searchParams.get('channel') as Channel) ?? 'sms';

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<Channel>(initialChannel);
  const [useCase, setUseCase] = useState<UseCase>('transactional');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [senderId, setSenderId] = useState('');
  const [waTemplateName, setWaTemplateName] = useState('');
  const [waLanguage, setWaLanguage] = useState('tr');

  const [dryRun, setDryRun] = useState<DryRun | null>(null);
  const [dryRunning, setDryRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doubleConfirm, setDoubleConfirm] = useState('');

  const sms = useMemo(() => (channel === 'sms' ? segmentInfo(body) : null), [body, channel]);

  const runDry = async () => {
    setDryRunning(true);
    try {
      const result = await messagingFetch<DryRun>('/api/ngo-admin/messaging/resolve-recipients', {
        method: 'POST',
        body: JSON.stringify({ channel, useCase }),
      });
      setDryRun(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setDryRunning(false);
    }
  };

  useEffect(() => {
    if (step === 1) runDry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, useCase]);

  const recipientCount = dryRun?.summary.afterConsent ?? 0;
  const needsDoubleConfirm = recipientCount >= 1000;

  const handleSubmit = async () => {
    if (needsDoubleConfirm && Number(doubleConfirm) !== recipientCount) {
      toast({ variant: 'destructive', title: 'Onay', description: `Alıcı sayısını (${recipientCount}) elle gir.` });
      return;
    }
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
            spec: { channel, useCase },
            whatsapp: channel === 'whatsapp' ? {
              templateName: waTemplateName,
              templateLanguage: waLanguage,
              conversationCategory: useCase === 'marketing' ? 'marketing' : 'utility',
              wabaPhoneNumberId: process.env.NEXT_PUBLIC_WABA_PHONE_ID ?? '',
            } : undefined,
            doubleConfirmCount: needsDoubleConfirm ? recipientCount : undefined,
          }),
        }
      );
      toast({ title: 'Gönderildi', description: result.status });
      router.push(`/ngo-admin/messaging/campaigns/${result.campaignId}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-6">
      <Link href="/ngo-admin/messaging" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Toplu Mesajlar
      </Link>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(['Kime', 'Ne', 'Onayla'] as const).map((title, i) => {
          const n = (i + 1) as Step;
          return (
            <div
              key={title}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded text-sm whitespace-nowrap',
                step === n ? 'bg-primary text-primary-foreground' : step > n ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'
              )}
            >
              {step > n ? <Check className="h-3.5 w-3.5" /> : <span className="font-bold">{n}.</span>}
              {title}
            </div>
          );
        })}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kanal & Amaç</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Kanal</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                {(['sms', 'email', 'whatsapp'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
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
                      'p-3 rounded border-2 text-left',
                      useCase === u ? 'border-primary bg-primary/5' : 'border-muted'
                    )}
                  >
                    <span className="text-sm font-medium">{u}</span>
                  </button>
                ))}
              </div>
            </div>
            {useCase === 'marketing' && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded text-xs">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <span>Sadece pazarlama izni olan kullanıcılara gider.</span>
              </div>
            )}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs">Tahmini alıcı (kendi NGO'na özel)</Label>
                <Button variant="ghost" size="sm" onClick={runDry} disabled={dryRunning}>
                  {dryRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-muted/40">
                  <p className="text-xl font-bold">{dryRun?.summary.afterDedupe ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Tekil</p>
                </div>
                <div className="p-2 rounded bg-muted/40">
                  <p className="text-xl font-bold">{dryRun?.summary.invalidAddress ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Geçersiz</p>
                </div>
                <div className="p-2 rounded bg-primary/10">
                  <p className="text-xl font-bold text-primary">
                    <Users className="h-4 w-4 inline mr-1" />{recipientCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Final</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">İçerik</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Kampanya adı (dahili)</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ör. Mayıs Bağışçı Teşekkür" />
            </div>
            {channel === 'sms' && (
              <div>
                <Label>SMS Gönderici (Sender ID)</Label>
                <Input value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="ONAYLI BAŞLIK" maxLength={11} />
              </div>
            )}
            {channel === 'email' && (
              <>
                <div>
                  <Label>Gönderen adı</Label>
                  <Input value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="STK Adı" />
                </div>
                <div>
                  <Label>Konu</Label>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Merhaba {ad}!" />
                </div>
              </>
            )}
            {channel === 'whatsapp' && (
              <>
                <div>
                  <Label>Template adı (Meta-onaylı)</Label>
                  <Input value={waTemplateName} onChange={(e) => setWaTemplateName(e.target.value)} placeholder="ör. hosgeldin_uyari" />
                </div>
                <div>
                  <Label>Dil kodu</Label>
                  <Input value={waLanguage} onChange={(e) => setWaLanguage(e.target.value)} placeholder="tr / en_US" />
                </div>
                <div className="text-xs text-muted-foreground p-2 bg-emerald-50 border border-emerald-200 rounded">
                  WhatsApp template body Meta'da onaylı içerikten gelir. Aşağı yazılan body değişken/açıklama amaçlıdır.
                </div>
                <div>
                  <Label>WhatsApp sender ID (WABA phone number ID)</Label>
                  <Input value={senderId} onChange={(e) => setSenderId(e.target.value)} placeholder="123..." />
                </div>
              </>
            )}
            <div>
              <Label>Mesaj gövdesi</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} placeholder="Merhaba {ad}, ..." />
            </div>
            {sms && (
              <div className="flex items-center gap-2 text-xs">
                <Badge variant={sms.encoding === 'GSM7' ? 'secondary' : 'outline'}>{sms.encoding}</Badge>
                <span className="text-muted-foreground">{sms.chars} karakter · {sms.segments} segment</span>
                {sms.encoding === 'UCS2' && <span className="text-amber-700">⚠ Türkçe karakter</span>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Onayla & Gönder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded bg-muted/40 text-center">
                <p className="text-2xl font-bold">{recipientCount.toLocaleString('tr-TR')}</p>
                <p className="text-xs text-muted-foreground">Alıcı</p>
              </div>
              <div className="p-3 rounded bg-violet-50 text-center">
                <p className="text-2xl font-bold text-violet-800">{channel.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">{useCase}</p>
              </div>
            </div>
            <div className="p-3 bg-muted/30 rounded text-sm">
              <p className="font-semibold mb-1">{name}</p>
              {channel === 'email' && subject && <p className="text-xs text-muted-foreground mb-1">Konu: {subject}</p>}
              <pre className="text-sm whitespace-pre-wrap font-sans">{body.slice(0, 300)}{body.length > 300 ? '…' : ''}</pre>
            </div>
            <p className="text-xs text-muted-foreground">
              Maliyet kampanya oluşturulurken hesaplanıp cüzdanından rezerve edilecek.
            </p>
            {needsDoubleConfirm && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded space-y-2">
                <div className="text-xs text-rose-900">
                  Büyük gönderim. Devam için <strong>{recipientCount}</strong> sayısını yaz:
                </div>
                <Input value={doubleConfirm} onChange={(e) => setDoubleConfirm(e.target.value)} className="bg-white" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1) as Step)} disabled={step === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Geri
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => (s + 1) as Step)} disabled={step === 1 && recipientCount === 0}>
            İleri <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting || !name.trim() || !body.trim()}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Gönder
          </Button>
        )}
      </div>
    </div>
  );
}

export default function NgoNewCampaignPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <NgoNewCampaignPageContent />
    </Suspense>
  );
}
