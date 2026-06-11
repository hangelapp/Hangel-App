'use client';

/**
 * /super-admin/settings/messaging-providers
 *
 * SMS + E-Posta hizmet sağlayıcı yönetimi. NetGSM (SMS) + Resend (mail)
 * mevcut + yeni sağlayıcı eklenebilir (form ile). Sözleşme yapıldığında
 * kullanıcı buraya API key/sender adı/şablon girer.
 *
 * Bu sayfa şu an stub; gerçek credential storage backend gelene kadar
 * UI iskelet.
 */
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MessageSquare, Mail, CheckCircle2, Clock, Plus } from 'lucide-react';

const PROVIDERS = [
  {
    name: 'NetGSM',
    channel: 'SMS' as const,
    status: 'live' as const,
    description: 'Mevcut entegrasyon. OTP + kampanya SMS\'leri.',
    fields: ['Kullanıcı Kodu', 'Şifre', 'Gönderen Adı (Sender ID)', 'Şablon ID listesi'],
  },
  {
    name: 'Resend',
    channel: 'Email' as const,
    status: 'live' as const,
    description: 'Mevcut entegrasyon. Davet + bildirim + outreach kampanyaları.',
    fields: ['API Key', 'Doğrulanmış domain (hangel.org)', 'Default from adresi'],
  },
  {
    name: 'Türk Telekom (Verimor)',
    channel: 'SMS' as const,
    status: 'planned' as const,
    description: 'Alternatif SMS sağlayıcısı, kurumsal sözleşme.',
    fields: ['Kullanıcı', 'Şifre', 'Sender ID', 'API endpoint'],
  },
  {
    name: 'Vodafone Toplu SMS',
    channel: 'SMS' as const,
    status: 'planned' as const,
    description: 'Alternatif (büyük volume için).',
    fields: ['Müşteri Kodu', 'Kullanıcı', 'Şifre', 'Sender ID'],
  },
  {
    name: 'Postmark',
    channel: 'Email' as const,
    status: 'planned' as const,
    description: 'Transactional email yedek sağlayıcı.',
    fields: ['Server Token', 'Domain', 'From adresi'],
  },
  {
    name: 'SendGrid',
    channel: 'Email' as const,
    status: 'planned' as const,
    description: 'Yüksek volume kampanya alternatifi.',
    fields: ['API Key', 'Domain', 'From adresi'],
  },
];

export default function MessagingProvidersPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 p-4 md:p-6">
      <Link href="/super-admin/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4 mr-1" /> Panel Ayarları
      </Link>

      <div>
        <h1 className="text-3xl font-black tracking-tighter">SMS / E-Posta Sağlayıcıları</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Mevcut sağlayıcıların API key + sender adı + şablon yönetimi. Yeni anlaşma yapıldığında buradan eklenir.
        </p>
      </div>

      {/* Hızlı kart: anlaşma yapıldıysa ne girilecek */}
      <Card className="border-amber-300 bg-amber-50/60">
        <CardContent className="p-4 text-sm space-y-2">
          <p className="font-bold text-amber-900">📝 Yeni anlaşma yaptığında buraya gireceklerin</p>
          <ul className="list-disc pl-5 text-xs text-amber-900 space-y-1">
            <li><strong>SMS</strong> için: Kullanıcı kodu, şifre, gönderen adı (sender ID, ör. "hangel"), onaylı şablon ID listesi, API endpoint</li>
            <li><strong>Email</strong> için: API key, doğrulanmış domain, default from adresi, SPF/DKIM/DMARC kayıtlarının canlı olduğunun doğrulaması</li>
            <li>Test gönderimi: kendi cihazına 1 SMS + 1 email — uçtan uca çalışıyor mu?</li>
            <li>Quota: günlük/aylık limit, paket alındıysa toplam kredi</li>
          </ul>
        </CardContent>
      </Card>

      {/* SMS sağlayıcıları */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
          <MessageSquare className="h-4 w-4 inline mr-1.5 -mt-0.5" /> SMS Sağlayıcıları
        </h2>
        <div className="space-y-3">
          {PROVIDERS.filter((p) => p.channel === 'SMS').map((p) => (
            <ProviderCard key={p.name} provider={p} />
          ))}
        </div>
      </div>

      {/* Email sağlayıcıları */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-3">
          <Mail className="h-4 w-4 inline mr-1.5 -mt-0.5" /> E-Posta Sağlayıcıları
        </h2>
        <div className="space-y-3">
          {PROVIDERS.filter((p) => p.channel === 'Email').map((p) => (
            <ProviderCard key={p.name} provider={p} />
          ))}
        </div>
      </div>

      <Button variant="outline" disabled className="w-full">
        <Plus className="h-4 w-4 mr-1" /> Yeni Sağlayıcı Ekle (yakında)
      </Button>

      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 text-xs text-blue-900 space-y-2">
          <p className="font-bold">🚧 Credential storage geliştirme aşamasında</p>
          <p>UI hazır; gerçek API key/credential saklama için sırada:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Google Secret Manager entegrasyonu (key'ler asla Firestore'da plaintext değil)</li>
            <li>Credential rotation UI</li>
            <li>Sağlayıcı health check (her 5dk test ping)</li>
            <li>Otomatik fallback (NetGSM down ise Verimor'a geç)</li>
            <li>Per-channel quota dashboard (günlük/aylık tüketim)</li>
            <li>Şablon onay süreci UI (SMS şablonları kuruma kayıtlı)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function ProviderCard({ provider }: { provider: typeof PROVIDERS[number] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`h-10 w-10 rounded-lg ${provider.channel === 'SMS' ? 'bg-violet-500/10' : 'bg-pink-500/10'} flex items-center justify-center shrink-0`}>
              {provider.channel === 'SMS'
                ? <MessageSquare className="h-5 w-5 text-violet-500" />
                : <Mail className="h-5 w-5 text-pink-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">{provider.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{provider.description}</p>
            </div>
          </div>
          {provider.status === 'live'
            ? <Badge className="bg-green-600 hover:bg-green-600 shrink-0"><CheckCircle2 className="h-3 w-3 mr-1" /> Canlı</Badge>
            : <Badge variant="outline" className="shrink-0"><Clock className="h-3 w-3 mr-1" /> Planlı</Badge>}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Sağlayıcı parametreleri (anlaşma sonrası gireceklerin)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {provider.fields.map((f) => (
            <div key={f} className="space-y-1">
              <Label className="text-[11px]">{f}</Label>
              <Input disabled placeholder="••••" className="h-8 text-xs" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
