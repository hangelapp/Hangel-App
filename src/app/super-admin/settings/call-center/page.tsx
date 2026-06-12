'use client';

/**
 * /super-admin/settings/call-center
 *
 * Sanal santral / Call Center entegrasyon yönetimi.
 *
 * Plan: outreach kayıtlarındaki telefon numaralarına panel içinden tek tıkla
 * arama. Konuşma kayıtları + transkripsiyon Firestore'a yazılır. KVKK uyarısı
 * + saklama süresi kontrolü ile.
 *
 * Bu sayfa şu an stub; sağlayıcı + WebRTC SDK entegrasyonu sırada.
 */
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Phone, PhoneCall, FileAudio, Languages, Shield, Clock } from 'lucide-react';

const PROVIDERS = [
  {
    name: 'NetGSM Sesli',
    region: '🇹🇷 Türkiye',
    pricing: 'Dakikası ~0.10-0.15 ₺ (sözleşmeye göre)',
    pros: ['Mevcut NetGSM SMS partner — tek fatura', 'BTK lisanslı', 'Türkçe destek', 'Bulut santral + IVR'],
    cons: ['API dokümantasyon İngilizce eksik', 'WebRTC SDK opsiyonel'],
    suitable: 'Pragmatik MVP — mevcut anlaşmaya ekleme',
  },
  {
    name: 'Türk Telekom Bulut Santral',
    region: '🇹🇷 Türkiye',
    pricing: 'Kurumsal paket bazlı',
    pros: ['BTK lisanslı', 'Geniş kurumsal destek', 'IVR + agent gruplandırma'],
    cons: ['REST API sınırlı, daha çok desktop softphone'],
    suitable: 'Klasik call center kurulumu',
  },
  {
    name: 'Aircall',
    region: '🌍 Yabancı (Paris merkez)',
    pricing: '$30/agent/ay + dakika',
    pros: ['Mükemmel call center UX', 'Power dialer + IVR', 'CRM entegrasyonları', 'Webhook + REST API gelişmiş'],
    cons: ['Türkiye hattı yok, yurtdışı çıkış maliyeti', 'KVKK için ek inceleme'],
    suitable: 'Multi-tenant SaaS call center',
  },
  {
    name: 'Twilio Voice + Programmable Voice',
    region: '🌍 ABD',
    pricing: 'Dakikası ~$0.013 + numara $1/ay',
    pros: ['En gelişmiş Voice API', 'WebRTC SDK out-of-box', 'Türkiye numarası alınabilir', 'Recording + Transcription dahili'],
    cons: ['Maliyetli (USD)', 'KVKK için aktarım inceleme'],
    suitable: 'Hızlı dev + esnek mimari',
  },
  {
    name: 'Plivo',
    region: '🌍 ABD',
    pricing: 'Twilio\'ya göre ~%30 ucuz',
    pros: ['Twilio benzeri API', 'TR numara desteği', 'WebRTC SDK'],
    cons: ['Topluluk daha küçük'],
    suitable: 'Twilio alternatifi, bütçe odaklı',
  },
  {
    name: 'Vodi (sip.com / SIP.US)',
    region: '🇹🇷 Türkiye',
    pricing: 'Aylık paket',
    pros: ['SIP trunk, mevcut santral PBX ile uyumlu', 'BTK lisanslı'],
    cons: ['Modern API yok, SIP/SDP teknik bilgi gerekir'],
    suitable: 'Mevcut PBX entegrasyonu',
  },
];

const FLOW_STEPS = [
  { icon: Phone, label: 'Tıkla', desc: 'Outreach listesinde kayıtta 📞 ikonuna tıkla' },
  { icon: PhoneCall, label: 'Çağrı Başlasın', desc: 'WebRTC ile tarayıcıdan veya yönlendirme ile telefonundan arama başlar' },
  { icon: FileAudio, label: 'Kayıt', desc: 'Konuşma otomatik kaydedilir (santral → Storage)' },
  { icon: Languages, label: 'Transkripsiyon', desc: 'Whisper / Google Speech ile metne çevrilir' },
  { icon: Shield, label: 'KVKK', desc: 'Karşı tarafa "kayıt alınıyor" bilgisi + saklama süresi politika' },
];

export default function CallCenterPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 p-4 md:p-6">
      <Link href="/super-admin/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4 mr-1" /> Panel Ayarları
      </Link>

      <div>
        <h1 className="text-3xl font-black tracking-tighter">Sanal Santral & Call Center</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Outreach kayıtlarındaki telefon numaralarına panel içinden tek tıkla arama,
          konuşma kaydı + transkripsiyon, KVKK uyumlu arşivleme.
        </p>
      </div>

      {/* Akış */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-base">Önerilen akış</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {FLOW_STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex sm:flex-col items-start sm:items-center gap-2 sm:gap-2 sm:text-center">
                  <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 ring-1 ring-black/5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 sm:flex-initial">
                    <p className="text-xs font-bold">{s.label}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Sağlayıcılar */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">Sağlayıcı seçenekleri</h2>
        <div className="space-y-3">
          {PROVIDERS.map((p) => (
            <Card key={p.name}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3 flex-1 min-w-[200px]">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <PhoneCall className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.region} · {p.pricing}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]"><Clock className="h-3 w-3 mr-1" /> Karar bekliyor</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">Artılar</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-5">
                    {p.pros.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-1">Eksiler</p>
                  <ul className="text-xs text-muted-foreground space-y-0.5 list-disc pl-5">
                    {p.cons.map((x) => <li key={x}>{x}</li>)}
                  </ul>
                </div>
                <div className="text-[11px] bg-muted/40 rounded p-2 mt-2">
                  <strong>Uygun:</strong> {p.suitable}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Mimari önerisi */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Mimari (yapım sırası)</CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-2">
          <ol className="list-decimal pl-5 space-y-1.5">
            <li>
              <strong>Sağlayıcı seç</strong> + sözleşme + 1 numara satın al (Türkiye için NetGSM Sesli, hız için Twilio).
            </li>
            <li>
              <strong>Adapter katmanı</strong>: <code>src/lib/santral/</code> + her sağlayıcı için <code>{`{ originateCall, listRecordings, getTranscript }`}</code> interface.
            </li>
            <li>
              <strong>Outreach hub'a 📞 ikon</strong>: telefon numarasının yanına click-to-call butonu (zaten yer tutucu var, aktif et).
            </li>
            <li>
              <strong>Çağrı modal</strong>: arama başlayınca konuşma süresi sayacı + "kayıt alınıyor" KVKK uyarısı + not yazma alanı.
            </li>
            <li>
              <strong>WebRTC</strong> (sağlayıcı SDK varsa) veya <strong>callback dial</strong> (santral senin telefonunu arar, sonra karşıyı bağlar).
            </li>
            <li>
              <strong>Webhook endpoint</strong>: <code>/api/integrations/santral/webhook</code> çağrı event'lerini alır (cevap, sonlandı, kayıt hazır).
            </li>
            <li>
              <strong>Firestore</strong>: <code>callSessions/{`{id}`}</code> doc — agentUid, contactId, başlangıç/bitiş, süre, sonuç, kayıt URL'i, notlar.
            </li>
            <li>
              <strong>Recording</strong>: santral kaydı → bizim Storage'a kopya + signed URL.
            </li>
            <li>
              <strong>Transkripsiyon</strong> (opsiyonel): Whisper API veya Google Speech-to-Text ile Türkçe çeviri. Görüşmede ne konuşulduğu aranabilir hale gelir.
            </li>
            <li>
              <strong>KVKK</strong>: aydınlatma metni + saklama süresi (6-12 ay) + silme mekanizması + agent'a "kayıt alınıyor" anonsu zorunluluğu.
            </li>
            <li>
              <strong>Dashboard</strong>: günlük çağrı sayısı, ortalama süre, sonuç dağılımı (cevap/sesli mesaj/cevapsız), agent performans.
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Pricing/maliyet projeksiyonu */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 text-xs space-y-2">
          <p className="font-bold text-blue-900">📊 Hızlı maliyet projeksiyonu (aylık)</p>
          <ul className="list-disc pl-5 text-blue-900 space-y-1">
            <li><strong>NetGSM Sesli</strong>: 500 dakika × 0.12 ₺ = ~60 ₺/ay + numara 50 ₺ = <strong>~110 ₺</strong></li>
            <li><strong>Twilio</strong>: 500 dk × $0.013 = $6.5 + numara $1 + Recording $0.0025/dk = ~<strong>$8 (~280 ₺)</strong></li>
            <li><strong>Aircall</strong>: 1 agent × $30 = $30 + dk = ~<strong>$40 (~1400 ₺)</strong></li>
            <li><strong>Whisper transkripsiyon</strong> (opsiyonel): 500 dk × $0.006 = $3 (~100 ₺)</li>
          </ul>
          <p className="text-blue-900 mt-2"><strong>Önerim</strong>: NetGSM Sesli ile başla (en ucuz + mevcut anlaşmaya ekleme). Volume büyüyünce Twilio'ya geçiş kolay.</p>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 text-xs text-amber-900 space-y-2">
          <p className="font-bold">🚧 Yapım sırasında</p>
          <p>UI iskeleti hazır. Gerçek entegrasyon için süper-admin önce sağlayıcı seçimi yapacak (yukarıdaki seçeneklerden), sonra bir sprint:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1">
            <li>Sağlayıcı SDK + adapter katmanı (~1-2 gün)</li>
            <li>Outreach hub click-to-call + modal (~1 gün)</li>
            <li>Webhook + Firestore callSessions (~1 gün)</li>
            <li>Recording → Storage + transcript (~1 gün)</li>
            <li>KVKK aydınlatma + agent anonsu (~yarım gün)</li>
            <li>Dashboard + analytics (~1 gün)</li>
          </ul>
          <p>Toplam: <strong>~1 haftalık sprint</strong>.</p>
        </CardContent>
      </Card>

      <Card className="border-rose-300 bg-rose-50/40">
        <CardContent className="p-4 text-xs text-rose-900 space-y-2">
          <p className="font-bold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> KVKK / 6698 zorunlu</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Görüşme öncesi karşı tarafa otomatik anons: <em>"Hizmet kalitesi amacıyla görüşmeniz kaydedilmektedir. Devam etmek için 1'e basın."</em></li>
            <li>Hangel privacy policy'ye çağrı kaydı saklama maddesi eklenir (varsayılan 6 ay, bilgi edinme talebi ile silme).</li>
            <li>Kayıtlar Storage'da encrypted-at-rest (Google KMS default).</li>
            <li>Kayıt erişimi sadece süper-admin + audit log (kim ne zaman dinledi).</li>
            <li>Agent (call center temsilcisi) ekrana ID gözükür, telefon numarası maskeli (last 4 digits)._</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
