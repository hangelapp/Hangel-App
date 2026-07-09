'use client';

/**
 * /super-admin/settings/payment-providers
 *
 * Ödeme sağlayıcı yönetimi — N-Kolay (mevcut), İyzico, Stripe, PayTR.
 * Bu sayfa şu an stub; tam UI geliştirme bekleyen başlık.
 */
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CreditCard, Clock } from 'lucide-react';

const PROVIDERS = [
  {
    // 2026-07-09: 'live' etiketi yanıltıcıydı — kod hazır ama prod'da NKOLAY_*
    // credential'ları yok, PAYMENT_DRIVER default 'mock' (ödeme simüle edilir).
    name: 'N-Kolay',
    status: 'ready' as const,
    description: 'Entegrasyon kodu hazır (webhook + 3D Secure) — N-Kolay üyelik anahtarları girilince canlıya alınır. Şu an ödemeler simülasyon modunda.',
    integrationPath: 'src/lib/payment/nkolay/',
  },
  {
    name: 'İyzico',
    status: 'planned' as const,
    description: 'Türkiye pazarı için alternatif. Marketplace API, taksitlendirme, abonelik desteği.',
  },
  {
    name: 'Stripe',
    status: 'planned' as const,
    description: 'Uluslararası bağışçı için. USD/EUR + Apple Pay/Google Pay.',
  },
  {
    name: 'PayTR',
    status: 'planned' as const,
    description: 'KOBİ-friendly alternatif, düşük komisyon, sanal POS.',
  },
];

export default function PaymentProvidersPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 p-4 md:p-6">
      <Link href="/super-admin/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4 mr-1" /> Panel Ayarları
      </Link>

      <div>
        <h1 className="text-3xl font-black tracking-tighter">Ödeme Sağlayıcı Yönetimi</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Aktif sağlayıcılar arası geçiş, komisyon oranları, A/B test, fallback sırası.
        </p>
      </div>

      <div className="space-y-3">
        {PROVIDERS.map((p) => (
          <Card key={p.name}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-600/10 flex items-center justify-center shrink-0">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                </div>
              </div>
              {p.status === 'ready' ? (
                <Badge className="bg-amber-500 hover:bg-amber-500 shrink-0">
                  <Clock className="h-3 w-3 mr-1" /> Anahtar bekliyor
                </Badge>
              ) : (
                <Badge variant="outline" className="shrink-0">
                  <Clock className="h-3 w-3 mr-1" /> Planlı
                </Badge>
              )}
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 text-xs text-amber-900 space-y-2">
          <p className="font-bold">🚧 Yapım aşamasında</p>
          <p>
            Bu sayfa şu an sadece envanter. Tam fonksiyonellik için sırada:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Sağlayıcı API key UI rotasyonu (şu an Secret Manager üzerinden)</li>
            <li>Komisyon hesap motoru (her sağlayıcı için %)</li>
            <li>Otomatik fallback (X başarısızsa Y kullan)</li>
            <li>A/B test (kullanıcıların %X'i sağlayıcı Z)</li>
            <li>Mutabakat raporu (günlük volume + komisyon)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
