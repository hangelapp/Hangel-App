'use client';

/**
 * CommunicationHub — "İletişim Merkezi" sekmesi: WhatsApp'tan çağrıya uçtan uca akış.
 *
 * STK'yı 6 fazlık rehberli yolculukta gezdirir:
 *   1) Numara doğrula (SMS-OTP, inline — contact-otp endpoint)
 *   2) WhatsApp Business bağla (→ /ngo-admin/dm sihirbazı)
 *   3) Kişi listesi yükle (→ call-center/lists)
 *   4) Şablon + hedef + gönder (→ call-center/lists blast)
 *   5) "Evet" cevapları → çağrı sırası (→ Çağrı Merkezi sekmesi)
 *   6) Operatör tek tıkla arar + not (→ Çağrı Merkezi sekmesi)
 *
 * Mevcut parçaları birbirine bağlar; WhatsApp backend'i tamamlanınca 2-5 uçtan uca işler.
 */

import { useState, type ComponentType, type ReactNode } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ShieldCheck, MessageCircle, Upload, Send, PhoneIncoming, Headphones,
  CheckCircle2, Loader2, KeyRound, Phone, ChevronRight,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// 10 hazır WhatsApp mesaj şablonu — STK seçer, {{ad}} yer tutucusunu ve metni düzenleyebilir.
const WA_TEMPLATES: Array<{ id: string; title: string; body: string }> = [
  { id: 'event-invite', title: 'Etkinlik Daveti', body: 'Merhaba {{ad}}, [etkinlik adı] etkinliğimize [tarih] [saat]\'te sizi bekliyoruz. Katılmak ister misiniz?' },
  { id: 'donation-thanks', title: 'Bağış Teşekkürü', body: 'Sevgili {{ad}}, yaptığınız bağış için teşekkür ederiz 🧡 Desteğinizle [proje] hayata geçiyor.' },
  { id: 'volunteer-call', title: 'Gönüllü Çağrısı', body: 'Merhaba {{ad}}, [şehir] bölgesinde gönüllülerimize ihtiyacımız var. Katkıda bulunmak ister misiniz?' },
  { id: 'donation-call', title: 'Bağış Çağrısı', body: 'Merhaba {{ad}}, [kampanya] kampanyamıza desteğinizi bekliyoruz. Küçük bir katkı büyük fark üretir.' },
  { id: 'survey', title: 'Anket / Geri Bildirim', body: 'Merhaba {{ad}}, kısa anketimize katılarak görüşlerinizi paylaşır mısınız? Yalnızca 2 dakika sürer.' },
  { id: 'training', title: 'Eğitim Duyurusu', body: 'Merhaba {{ad}}, [konu] hakkında ücretsiz eğitimimiz [tarih] tarihinde. Kayıt için bu mesajı yanıtlayın.' },
  { id: 'campaign', title: 'Kampanya Duyurusu', body: 'Merhaba {{ad}}, yeni [kampanya] kampanyamız başladı! Detaylar ve katılım için bize ulaşın.' },
  { id: 'membership', title: 'Üyelik Yenileme', body: 'Merhaba {{ad}}, üyeliğinizin yenilenme zamanı geldi. Desteğinizi sürdürmek ister misiniz?' },
  { id: 'urgent-aid', title: 'Acil Yardım Çağrısı', body: 'Merhaba {{ad}}, [bölge] için acil yardım kampanyamız başladı. Desteğiniz hayat kurtarır 🧡' },
  { id: 'info', title: 'Bilgilendirme', body: 'Merhaba {{ad}}, [konu] hakkında sizi bilgilendirmek isteriz. Sorularınız için bu mesajı yanıtlayabilirsiniz.' },
];

export function CommunicationHub({
  ccDoc,
  onGoToCallCenter,
}: {
  ccDoc: { callerIdNumber?: string };
  onGoToCallCenter: () => void;
}) {
  const { user } = useUser();
  const { withEntityHeaders } = useActiveEntity();
  const { toast } = useToast();

  // Faz 1 — numara doğrulama (contact-otp endpoint'i; WhatsApp/SMS/ekran)
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [err, setErr] = useState('');
  const [masked, setMasked] = useState('');

  // Faz 4 — şablon seçimi + düzenleme
  const [tplId, setTplId] = useState<string>('');
  const [tplBody, setTplBody] = useState<string>('');

  async function sendOtp() {
    if (!user || !phone.trim()) return;
    setSending(true); setErr('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/call-center/contact-otp/send', withEntityHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: phone.trim() }),
      }));
      const data = await res.json();
      if (!res.ok || !data.ok) { setErr(data.message || 'Kod gönderilemedi.'); return; }
      setOtpSent(true);
      setMasked(data.masked || '');
      if (data.devCode) setOtpCode(String(data.devCode));
      const chan = data.channel === 'whatsapp' ? 'WhatsApp' : data.channel === 'sms' ? 'SMS' : '';
      toast({ title: 'Doğrulama kodu gönderildi', description: data.devCode ? `Test modu — kod: ${data.devCode}` : `${data.masked} numarasına ${chan} ile gönderildi.` });
    } catch { setErr('Kod gönderilemedi, tekrar deneyin.'); }
    finally { setSending(false); }
  }
  async function verifyOtp() {
    if (!user || otpCode.trim().length !== 6) return;
    setVerifying(true); setErr('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/ngo-admin/call-center/contact-otp/verify', withEntityHeaders({
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: phone.trim(), code: otpCode.trim() }),
      }));
      const data = await res.json();
      if (!res.ok || !data.verified) { setErr(data.message || 'Kod hatalı.'); return; }
      setVerified(true);
      toast({ title: 'Numara doğrulandı 🧡' });
    } catch { setErr('Doğrulama başarısız.'); }
    finally { setVerifying(false); }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-gradient-to-br from-emerald-50/60 to-transparent p-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-emerald-600" /> İletişim Merkezi — WhatsApp'tan Çağrıya
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gönüllülerinize WhatsApp'tan ulaşın, &quot;Evet&quot; diyenler otomatik çağrı sırasına düşsün, operatör tek tıkla arasın — hepsi tek akış.
        </p>
      </div>

      {/* FAZ 1 — Numara doğrula (inline, çalışır) */}
      <StepCard n={1} icon={ShieldCheck} title="Numaranı doğrula" done={verified}>
        {verified ? (
          <p className="text-sm text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> {phone} doğrulandı.
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Kampanyalarda kullanılacak numaranı SMS/WhatsApp kodu ile doğrula.</p>
            {!otpSent ? (
              <div className="flex gap-2">
                <div className="relative flex-1 max-w-xs">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05XX XXX XX XX" className="pl-9" />
                </div>
                <Button onClick={sendOtp} disabled={sending || !phone.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Phone className="h-4 w-4 mr-1.5" />} Kod gönder
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="relative flex-1 max-w-[180px]">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6 haneli kod" inputMode="numeric" className="pl-9 font-mono tracking-widest" />
                </div>
                <Button onClick={verifyOtp} disabled={verifying || otpCode.trim().length !== 6}>
                  {verifying ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null} Doğrula
                </Button>
                <Button variant="ghost" size="sm" onClick={sendOtp} disabled={sending}>Tekrar gönder</Button>
              </div>
            )}
            {masked && otpSent && !verified && <p className="text-[11px] text-muted-foreground">{masked} numarasına gönderildi.</p>}
            {err && <p className="text-xs text-rose-700">{err}</p>}
          </div>
        )}
      </StepCard>

      {/* FAZ 2 — WhatsApp Business bağla */}
      <StepCard n={2} icon={MessageCircle} title="WhatsApp Business hesabını bağla">
        <p className="text-sm text-muted-foreground">
          Meta Business hesabı oluştur → numaranı WABA'ya bağla → görünen ad (örn. &quot;Yeşilay&quot;) onayı. Rehberli sihirbaz:
        </p>
        <Link href="/ngo-admin/dm" className="inline-flex">
          <Button variant="outline" size="sm" className="mt-2">
            WhatsApp Business kurulum sihirbazı <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </StepCard>

      {/* FAZ 3 — Liste yükle */}
      <StepCard n={3} icon={Upload} title="Kişi listesini yükle (CSV/Excel)">
        <p className="text-sm text-muted-foreground">
          Gönüllü/bağışçı listeni yükle (örn. 3.000 gönüllü). İl, ilçe, etiket bilgileriyle hedeflenebilir.
        </p>
        <Link href="/ngo-admin/call-center/lists" className="inline-flex">
          <Button variant="outline" size="sm" className="mt-2">
            Arama Listelerim — Yeni Liste Yükle <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </StepCard>

      {/* FAZ 4 — Şablon seç + düzenle + gönder */}
      <StepCard n={4} icon={Send} title="Şablon seç, düzenle, gönder">
        <p className="text-sm text-muted-foreground">
          Hazır şablonlardan birini seç, metni dilediğin gibi düzenle. <span className="font-mono">{'{{ad}}'}</span> kişinin adıyla otomatik değişir.
        </p>

        {/* 10 şablon */}
        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
          {WA_TEMPLATES.map((t) => {
            const active = tplId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { setTplId(t.id); setTplBody(t.body); }}
                className={cn(
                  'rounded-md border px-2.5 py-2 text-left text-xs transition hover:bg-muted/40',
                  active ? 'border-emerald-500 bg-emerald-50/50 font-semibold' : 'border-border',
                )}
              >
                {active && <CheckCircle2 className="inline h-3 w-3 mr-1 text-emerald-600" />}
                {t.title}
              </button>
            );
          })}
        </div>

        {/* Seçilen şablonu düzenle + önizleme */}
        {tplId && (
          <div className="mt-3 space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Mesaj metni (düzenlenebilir)</label>
            <Textarea
              value={tplBody}
              onChange={(e) => setTplBody(e.target.value)}
              rows={4}
              className="text-sm"
              maxLength={1024}
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{tplBody.length}/1024 karakter</span>
              <button type="button" onClick={() => { const t = WA_TEMPLATES.find((x) => x.id === tplId); if (t) setTplBody(t.body); }} className="hover:underline">
                Şablona sıfırla
              </button>
            </div>
            <div className="rounded-md bg-emerald-50/40 border border-emerald-200 p-2.5 text-xs">
              <span className="font-semibold">Önizleme: </span>
              <span className="text-muted-foreground italic">
                📱 {tplBody.replace(/\{\{\s*ad\s*\}\}/gi, 'Ali')}
              </span>
            </div>
          </div>
        )}

        <Link href="/ngo-admin/call-center/lists" className="inline-flex">
          <Button variant="outline" size="sm" className="mt-3" disabled={!tplBody.trim()}>
            Listeye git ve bu mesajı gönder <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
        {!tplId && <p className="text-[11px] text-muted-foreground mt-1.5">Önce bir şablon seç.</p>}
      </StepCard>

      {/* FAZ 5 — Cevaplar → çağrı sırası */}
      <StepCard n={5} icon={PhoneIncoming} title="&quot;Evet&quot; cevapları otomatik çağrı sırasına düşer">
        <p className="text-sm text-muted-foreground">
          &quot;Evet&quot; yanıtı veren kişiler (örn. 200 kişi) otomatik olarak çağrı kuyruğuna eklenir — kimseyi elle aktarmana gerek yok.
        </p>
        <Button variant="outline" size="sm" className="mt-2" onClick={onGoToCallCenter}>
          Çağrı Merkezi → Kuyruğu gör <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </StepCard>

      {/* FAZ 6 — Operatör arar + not */}
      <StepCard n={6} icon={Headphones} title="Operatör tek tıkla arar, not + sonuç tek panelde">
        <p className="text-sm text-muted-foreground">
          Kuyruktaki kişiyi operatör tarayıcıdan arar; karşı tarafta STK'nın numarası (Caller ID{ccDoc.callerIdNumber ? `: ${ccDoc.callerIdNumber}` : ''}) görünür. Görüşme, not ve sonuç (disposition) aynı ekranda kaydedilir.
        </p>
        <Button variant="outline" size="sm" className="mt-2" onClick={onGoToCallCenter}>
          Çağrı Merkezi → Aramaya başla <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </StepCard>

      <p className="text-[11px] text-muted-foreground">
        Not: WhatsApp Business bağlantısı (Faz 2) tamamlandığında Faz 3-5 uçtan uca otomatik işler. Numara doğrulama, listeler ve çağrı paneli şu an aktif.
      </p>
    </div>
  );
}

// Numaralı adım kartı.
function StepCard({
  n, icon: Icon, title, done, children,
}: {
  n: number; icon: ComponentType<{ className?: string }>; title: string; done?: boolean; children: ReactNode;
}) {
  return (
    <Card className={cn(done && 'border-emerald-300 bg-emerald-50/30')}>
      <CardContent className="flex gap-3 pt-5">
        <div className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold',
          done ? 'bg-emerald-600 text-white' : 'bg-muted text-foreground',
        )}>
          {done ? <CheckCircle2 className="h-5 w-5" /> : n}
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-emerald-600" />
            <h3 className="font-semibold text-sm">{title}</h3>
            {done && <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[9px]">Tamam</Badge>}
          </div>
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
