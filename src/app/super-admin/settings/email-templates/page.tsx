'use client';

/**
 * /super-admin/settings/email-templates
 *
 * Resend ile gönderilen e-postaların görsel editörü.
 *
 * Bu sayfa şu an stub; gerçek WYSIWYG editör (MJML/react-email/Lexical) sonraki sprint.
 */
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Edit3 } from 'lucide-react';

const TEMPLATES = [
  { key: 'welcome', name: 'Hoş Geldin', description: 'Yeni kullanıcı kayıt sonrası', usedIn: 'auth/signup', live: true },
  { key: 'verify-email', name: 'E-posta Doğrulama', description: '6 haneli kod', usedIn: 'auth/verify', live: true },
  { key: 'password-reset', name: 'Şifre Sıfırlama', description: 'Sıfırlama linki', usedIn: 'auth/reset', live: true },
  { key: 'ngo-invitation', name: 'STK Daveti', description: 'STK admin tarafından kullanıcı daveti', usedIn: 'ngo-admin/invite', live: true },
  { key: 'donation-receipt', name: 'Bağış Makbuzu', description: 'Bağış sonrası tax-deductible receipt', usedIn: 'payment/success', live: true },
  { key: 'volunteer-applied', name: 'Gönüllü Başvuru', description: 'STK\'ya başvuru bildirimi', usedIn: 'volunteering/apply', live: true },
  { key: 'volunteer-accepted', name: 'Gönüllü Kabul', description: 'Başvuru onaylandı', usedIn: 'volunteering/accept', live: true },
  { key: 'kvkk-update', name: 'KVKK Güncelleme', description: 'Politika değişikliği bildirimi', usedIn: 'settings/contracts', live: false },
  { key: 'event-reminder', name: 'Etkinlik Hatırlatma', description: 'Etkinlik öncesi 24h hatırlatma', usedIn: 'events/cron', live: false },
  { key: 'blood-emergency', name: 'Acil Kan İhtiyacı', description: 'Eşleşen kan grubuna bildirim', usedIn: 'emergency/blood', live: true },
  { key: 'monthly-impact', name: 'Aylık Etki Raporu', description: 'Kullanıcının aylık özet hikayesi', usedIn: 'cron/monthly', live: false },
  { key: 'outreach-bulk', name: 'Toplu Tanıtım Maili', description: 'Outreach panelinden toplu gönderim', usedIn: 'outreach/send', live: true },
] as const;

export default function EmailTemplatesPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 p-4 md:p-6">
      <Link href="/super-admin/settings" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4 mr-1" /> Panel Ayarları
      </Link>

      <div>
        <h1 className="text-3xl font-black tracking-tighter">E-posta Şablonları</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Resend üzerinden gönderilen tüm e-postaların görsel düzenleyici. {TEMPLATES.length} şablon.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {TEMPLATES.map((t) => (
          <Card key={t.key} className="cursor-not-allowed opacity-60">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-9 w-9 rounded-lg bg-pink-500/10 flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-pink-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm truncate">{t.name}</CardTitle>
                    <p className="text-[10px] text-muted-foreground truncate">{t.usedIn}</p>
                  </div>
                </div>
                {t.live ? (
                  <Badge variant="outline" className="text-[9px] shrink-0">Canlı</Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] shrink-0 text-amber-700 border-amber-300">Taslak</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-2">{t.description}</p>
              <button disabled className="text-xs text-primary hover:underline inline-flex items-center">
                <Edit3 className="h-3 w-3 mr-1" /> Düzenle
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 text-xs text-amber-900 space-y-2">
          <p className="font-bold">🚧 WYSIWYG editör sırada</p>
          <p>
            UI iskeleti hazır. Tam editör için sırada:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>MJML veya <code>react-email</code> ile template render (responsive HTML)</li>
            <li>Lexical/TipTap WYSIWYG editör — değişkenler için drag-drop ({"{{userName}}"} vb.)</li>
            <li>Önizleme: desktop + mobile + dark mode</li>
            <li>Resend Test API ile canlı preview gönder</li>
            <li>Versiyon kontrolü + rollback</li>
            <li>i18n: tr + en + ar şablon variantları</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
