'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, Settings as SettingsIcon, Info, MessageSquare, Mail, Shield } from 'lucide-react';

const ENV_VARS = [
  {
    section: 'Genel',
    icon: SettingsIcon,
    keys: [
      { key: 'MESSAGING_WORKER_KEY', desc: 'Cloud Scheduler ve internal worker route auth için shared secret' },
      { key: 'MESSAGING_WEBHOOK_SECRET', desc: 'Provider webhook URL\'inde query/header ile gelen ortak sır' },
      { key: 'NEXT_PUBLIC_APP_URL', desc: 'Unsubscribe linki için base URL (örn. https://hangel.org)' },
      { key: 'DEFAULT_FROM_EMAIL', desc: 'E-postalarda varsayılan gönderen adresi' },
      { key: 'DEFAULT_FROM_NAME', desc: 'E-postalarda varsayılan gönderen adı' },
      { key: 'SMS_COST_TRY_PER_SEGMENT', desc: 'SMS segment maliyeti (TRY, default 0.30)' },
      { key: 'EMAIL_COST_TRY_PER_MESSAGE', desc: 'E-posta birim maliyet (TRY, default 0.02)' },
      { key: 'SMS_OPTOUT_KEYWORD', desc: 'Marketing SMS sonundaki "IPTAL <X>" anahtar kelimesi (default 4444)' },
    ],
  },
  {
    section: 'SMS Provider',
    icon: MessageSquare,
    keys: [
      { key: 'SMS_DRIVER', desc: '`mock` | `netgsm` | `iletimerkezi` | `pasifik`' },
      { key: 'NETGSM_USERNAME', desc: 'Netgsm hesap kullanıcı adı' },
      { key: 'NETGSM_PASSWORD', desc: 'Netgsm hesap şifresi' },
      { key: 'NETGSM_HEADER', desc: 'Onaylı alphanumeric başlık (sender ID)' },
      { key: 'NETGSM_IYS_FILTER', desc: 'İYS marketing filtresi (opsiyonel)' },
      { key: 'NETGSM_APP_KEY', desc: 'Netgsm app key (opsiyonel)' },
      { key: 'RATE_NETGSM_PER_SEC', desc: 'Saniyede max gönderim (default 5)' },
      { key: 'RATE_NETGSM_PER_MIN', desc: 'Dakikada max gönderim (default 60)' },
      { key: 'PASIFIK_USERNAME', desc: 'Pasifik Telekom hesap kullanıcı adı (panel.pasifiktelekom.com.tr)' },
      { key: 'PASIFIK_PASSWORD', desc: 'Pasifik Telekom hesap şifresi' },
      { key: 'PASIFIK_FROM', desc: 'Onaylı sender ID (3-11 alphanumeric, örn. HANGEL)' },
      { key: 'PASIFIK_DEFAULT_ALPHABET', desc: 'Türkçe için varsayılan: TurkishSingleShift' },
    ],
  },
  {
    section: 'E-Posta Provider',
    icon: Mail,
    keys: [
      { key: 'EMAIL_DRIVER', desc: '`mock` | `resend` | `smtp`' },
      { key: 'RESEND_API_KEY', desc: 'Resend API anahtarı (re_...)' },
      { key: 'RATE_RESEND_PER_SEC', desc: 'Saniyede max gönderim (default 5)' },
      { key: 'RATE_RESEND_PER_MIN', desc: 'Dakikada max gönderim (default 60)' },
    ],
  },
  {
    section: 'İYS',
    icon: Shield,
    keys: [
      { key: 'IYS_MODE', desc: '`local` (CSV export/import) veya `api` (REST)' },
      { key: 'IYS_BRAND_CODE', desc: 'İYS marka kodu' },
      { key: 'IYS_USERNAME', desc: 'İYS hesap kullanıcı adı' },
      { key: 'IYS_PASSWORD', desc: 'İYS hesap şifresi' },
    ],
  },
];

export default function ProvidersPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
      <Link
        href="/super-admin/messaging"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Toplu SMS & E-Posta
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Provider Ayarları</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sağlayıcı yapılandırmaları Firebase App Hosting ortam değişkenleri (apphosting.yaml veya secrets) üzerinden yönetilir.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Güvenlik</AlertTitle>
        <AlertDescription className="text-xs">
          API anahtarları ve şifreler bu UI'da gösterilmez. Değer güncellemek için App Hosting konsolundan
          ortam değişkenlerini düzenleyin ve uygulamayı yeniden deploy edin.
        </AlertDescription>
      </Alert>

      {ENV_VARS.map((section) => {
        const Icon = section.icon;
        return (
          <Card key={section.section}>
            <CardHeader className="flex flex-row items-center gap-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base">{section.section}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {section.keys.map((k) => (
                  <li key={k.key} className="flex items-start gap-3 py-1.5 border-b last:border-b-0">
                    <Badge variant="outline" className="font-mono text-xs whitespace-nowrap">{k.key}</Badge>
                    <span className="text-xs text-muted-foreground">{k.desc}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        );
      })}

      <Card className="bg-muted/30 border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Webhook URL'leri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="text-muted-foreground">Provider panelinde aşağıdaki URL'leri yapılandırın:</p>
          <ul className="space-y-1">
            <li>
              <strong>Resend:</strong>{' '}
              <code className="text-xs bg-background px-1 py-0.5 rounded">
                {`{APP_URL}/api/messaging/webhook/resend?key={MESSAGING_WEBHOOK_SECRET}`}
              </code>
            </li>
            <li>
              <strong>Netgsm:</strong>{' '}
              <code className="text-xs bg-background px-1 py-0.5 rounded">
                {`{APP_URL}/api/messaging/webhook/netgsm?key={MESSAGING_WEBHOOK_SECRET}`}
              </code>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
