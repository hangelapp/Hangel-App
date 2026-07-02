'use client';

/**
 * /super-admin/outreach/send — Outreach hub'da seçilen kontaklara
 * toplu email / SMS gönderme formu.
 *
 * Query params:
 *   - source: 'registryVakiflar' | 'registryDernekler' | 'outreachContacts'
 *   - channel: 'email' | 'sms'
 *   - ids: comma-separated doc id'leri
 *
 * Akış:
 *   1) Form: subject (email), body, from/sender
 *   2) Dry-run preview — kaç kontağa email/telefon var, kaç tanesine gidecek
 *   3) Gönder → /api/super-admin/outreach/send POST
 *   4) Sonuç: kaç başarılı, kaç başarısız + audit log linki
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { ArrowLeft, Mail, MessageSquare, MessageCircle, Send, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

const VARIABLES_HELP = '{{name}} — kuruluş adı için kullanılabilir.';

export default function OutreachSendPage() {
  const sp = useSearchParams();
  const { toast } = useToast();
  const { user } = useUser();

  const source = (sp.get('source') || 'registryVakiflar') as
    'registryVakiflar' | 'registryDernekler' | 'outreachContacts';
  const channel = (sp.get('channel') || 'email') as 'email' | 'sms' | 'whatsapp';
  const channelLabel = channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'SMS';
  const idsParam = sp.get('ids') || '';
  const ids = useMemo(() => idsParam.split(',').filter(Boolean), [idsParam]);

  const [subject, setSubject] = useState('hangel — toplumsal etki platformumuzla tanışmak ister misiniz?');
  const [body, setBody] = useState(
    channel === 'email'
      ? `Merhaba {{name}} ekibi,\n\nhangel.org Türkiye'nin en büyük üniversite öğrencisi ve sosyal etki platformudur. Gönüllüler her alışverişlerinde kazanılan komisyonu seçtikleri STK'lara bağışlıyor.\n\nKuruluşunuzla tanışmak ve hangel ekosistemine davet etmek istiyoruz. Görüşmek için merhaba@hangel.org adresinden bize ulaşabilirsiniz.\n\nİyi günler dileriz,\nhangel ekibi\nhttps://hangel.org`
      : `hangel — Türkiye'nin sosyal etki platformu. Detay: hangel.org/about`,
  );
  const [fromEmail, setFromEmail] = useState('merhaba@hangel.org');
  const [fromName, setFromName] = useState('hangel');
  const [senderId, setSenderId] = useState('HANGEL');
  const [sending, setSending] = useState(false);
  // Email → kuyruğa alma ({mode:'queued', queued, skipped, campaignId}).
  // SMS/WhatsApp → doğrudan gönderim ({sent, failed, skipped, errors}).
  const [result, setResult] = useState<
    | { mode: 'queued'; queued: number; skipped: number; campaignId: string | null }
    | { sent: number; failed: number; skipped: number; errors?: string[] }
    | null
  >(null);

  async function handleSend() {
    if (ids.length === 0) {
      toast({ title: 'Kontak seçilmedi', variant: 'destructive' });
      return;
    }
    if (channel === 'email' && !subject.trim()) {
      toast({ title: 'Email için konu gerekli', variant: 'destructive' });
      return;
    }
    if (!body.trim()) {
      toast({ title: 'Mesaj boş olamaz', variant: 'destructive' });
      return;
    }

    const confirmed = window.confirm(
      `${ids.length} kontağa ${channelLabel} gönderilecek. Emin misin?`,
    );
    if (!confirmed) return;

    if (!user) {
      toast({ title: 'Oturum gerekli', description: 'Lütfen tekrar giriş yapın.', variant: 'destructive' });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/super-admin/outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          source, channel, ids, subject, body, fromEmail, fromName, senderId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Gönderim başarısız');
      setResult(data);
      if (data?.mode === 'queued') {
        toast({ title: 'Kuyruğa alındı', description: `${data.queued} kişi Workspace kuyruğunda` });
      } else {
        toast({ title: 'Gönderim tamamlandı', description: `${data.sent} başarılı, ${data.failed} başarısız` });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Hata';
      toast({ title: 'Gönderim hatası', description: msg, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon">
          <Link href="/super-admin/outreach"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-headline">
            Toplu {channelLabel} Gönder
          </h1>
          <p className="text-muted-foreground text-sm">
            <Badge variant="outline" className="mr-2">{ids.length} kontak</Badge>
            <Badge variant="outline">Kaynak: {source === 'registryVakiflar' ? 'Vakıflar' : source === 'registryDernekler' ? 'Dernekler' : 'Manuel'}</Badge>
          </p>
        </div>
      </div>

      {result && ('mode' in result ? (
        <Card className="border-emerald-300 bg-emerald-50">
          <CardContent className="p-4 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-bold">Kuyruğa alındı</p>
              <p>
                ✅ {result.queued} kişi kuyruğa alındı — Workspace&apos;ten dakikada 1 mail gönderilecek.
                {result.skipped > 0 ? ` ${result.skipped} atlandı (e-posta yok).` : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className={result.failed > 0 ? 'border-amber-300 bg-amber-50' : 'border-emerald-300 bg-emerald-50'}>
          <CardContent className="p-4 flex items-start gap-3">
            {result.failed > 0
              ? <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              : <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5" />}
            <div className="text-sm space-y-1">
              <p className="font-bold">Gönderim sonucu</p>
              <p>✅ {result.sent} gönderildi · ⏭ {result.skipped} atlandı (kanal bilgisi yok) · ❌ {result.failed} başarısız</p>
              {result.errors && result.errors.length > 0 && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs underline">İlk {result.errors.length} hata</summary>
                  <ul className="mt-2 list-disc list-inside text-[11px] text-muted-foreground">
                    {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                  </ul>
                </details>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {channel === 'email' ? <Mail className="h-5 w-5 text-primary" /> : channel === 'whatsapp' ? <MessageCircle className="h-5 w-5 text-primary" /> : <MessageSquare className="h-5 w-5 text-primary" />}
            Mesaj İçeriği
          </CardTitle>
          <CardDescription className="flex items-center gap-1 text-xs">
            <Sparkles className="h-3 w-3" /> {VARIABLES_HELP}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {channel === 'email' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="subject">Konu *</Label>
                <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Gönderen Email</Label>
                  <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} type="email" />
                </div>
                <div className="space-y-1.5">
                  <Label>Gönderen Adı</Label>
                  <Input value={fromName} onChange={(e) => setFromName(e.target.value)} />
                </div>
              </div>
            </>
          )}
          {channel === 'sms' && (
            <div className="space-y-1.5">
              <Label>Sender ID</Label>
              <Input value={senderId} onChange={(e) => setSenderId(e.target.value)} maxLength={11} />
              <p className="text-[10px] text-muted-foreground">11 karakteri geçemez. İYS kayıtlı olmalı.</p>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="body">{channel === 'email' ? 'Mesaj (plain text + {{name}})' : 'SMS Metni'}</Label>
            <Textarea id="body" value={body} onChange={(e) => setBody(e.target.value)} rows={channel === 'email' ? 12 : 4} />
            {channel === 'sms' && (
              <p className="text-[10px] text-muted-foreground">{body.length} karakter (160 karakter = 1 SMS).</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-3 text-xs">
          <p>
            <strong>✓ KVKK uyumu otomatik:</strong> Bu maille toplu tanıtım gönderiliyor —
            Ticari Elektronik İleti Yönetmeliği uyarınca. Her mailin altına otomatik olarak{' '}
            <strong>"İletişim listesinden çıkmak için 'ÇIKAR' yazarak yanıtlayın"</strong> footer'ı
            eklenir, Reply-To gönderen adresine ayarlanır. Bu maile "ÇIKAR" yazıp yanıtlayan kayıtları
            outreach panelinden manuel olarak listeden çıkarabilirsin (Detay → Listeden Çıkar).
            Şu anki provider: <code>process.env.EMAIL_DRIVER</code> (mock değilse gerçekten gönderilir).
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button asChild variant="outline"><Link href="/super-admin/outreach">Vazgeç</Link></Button>
        <Button onClick={handleSend} disabled={sending || ids.length === 0}>
          {sending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
          {ids.length} Kontağa {channel === 'email' ? 'Email' : 'SMS'} Gönder
        </Button>
      </div>
    </div>
  );
}
