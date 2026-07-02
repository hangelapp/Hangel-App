'use client';

/**
 * /ngo-admin/whatsapp-business/numbers/new
 *
 * 3 adımlı WABA numara bağlama sihirbazı.
 *   1) Meta Business Manager kurulum rehberi (statik) — WABA + Phone Number + System User Token
 *   2) Bilgileri gir formu (telefon E.164, WABA ID, Phone Number ID, Access Token, App Secret, Display Name)
 *   3) Başarı + webhook URL/verify token kurulum talimatı
 *
 * Adım 2 → POST /api/ngo-admin/whatsapp-business/numbers (Meta'dan numara doğrular, Firestore'a yazar)
 * shadcn/ui pattern (Card + Badge step header). Türkçe metinler.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  ExternalLink,
  Phone,
  KeyRound,
  ShieldCheck,
  ListChecks,
  Link2,
  Copy,
  CheckCircle2,
  AlertCircle,
  PlugZap,
  MessageCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { cn } from '@/lib/utils';

const HANGEL_ORANGE = '#f34723';
const WEBHOOK_URL = 'https://hangel.org/api/integrations/whatsapp/webhook';
const WEBHOOK_VERIFY_TOKEN = 'hangel-waba-verify-2026';

const STEPS = [
  { key: 'guide', label: 'Meta Kurulumu', icon: ListChecks },
  { key: 'form', label: 'Bilgileri Gir', icon: KeyRound },
  { key: 'webhook', label: 'Webhook', icon: PlugZap },
] as const;

const META_GUIDE_STEPS = [
  {
    title: 'Meta Business Manager hesabınızı açın',
    body: (
      <>
        <a
          href="https://business.facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline inline-flex items-center gap-1"
        >
          business.facebook.com <ExternalLink className="h-3 w-3" />
        </a>{' '}
        adresinden iş hesabınızı oluşturun veya mevcut hesabınıza giriş yapın.
      </>
    ),
  },
  {
    title: 'WhatsApp Business Hesabı (WABA) oluşturun',
    body: (
      <>
        Sol menüden <strong>WhatsApp Hesapları</strong> → <strong>Yeni WhatsApp Business
        Hesabı</strong> ile WABA oluşturup işletme doğrulamasını tamamlayın.
      </>
    ),
  },
  {
    title: 'Telefon numarasını ekleyin',
    body: (
      <>
        WABA içinde <strong>Phone Numbers</strong> → <strong>Add Phone</strong> ile numaranızı
        ekleyin ve SMS veya sesli arama ile doğrulayın.
      </>
    ),
  },
  {
    title: 'System User + Access Token oluşturun',
    body: (
      <>
        Business Settings → <strong>System Users</strong> → yeni kullanıcı oluşturun. Ardından{' '}
        <strong>Generate New Token</strong> ile <em>Permanent</em> bir token üretin. Kapsamlar
        (scope): <code>whatsapp_business_messaging</code> ve{' '}
        <code>whatsapp_business_management</code>.
      </>
    ),
  },
  {
    title: 'Gerekli kimlikleri kopyalayın',
    body: (
      <>
        Bir sonraki adımda gireceğiniz bilgiler: <strong>WABA ID</strong>,{' '}
        <strong>Phone Number ID</strong>, <strong>Access Token</strong>,{' '}
        <strong>App Secret</strong> (webhook imza doğrulaması için) ve Meta'da onaylanan{' '}
        <strong>Display Name</strong>.
      </>
    ),
  },
];

interface FormState {
  phoneNumber: string;
  wabaAccountId: string;
  wabaPhoneNumberId: string;
  accessToken: string;
  appSecret: string;
  displayName: string;
}

function isE164(value: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(value.trim());
}

export default function NewWabaNumberPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, isUserLoading } = useUser();
  const { id: ngoId, isLoading: entityLoading } = useActiveEntity();

  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [copied, setCopied] = useState<'url' | 'token' | null>(null);
  const [form, setForm] = useState<FormState>({
    phoneNumber: '',
    wabaAccountId: '',
    wabaPhoneNumberId: '',
    accessToken: '',
    appSecret: '',
    displayName: '',
  });

  const phoneValid = isE164(form.phoneNumber);
  const formValid = useMemo(
    () =>
      phoneValid &&
      form.wabaAccountId.trim().length > 0 &&
      form.wabaPhoneNumberId.trim().length > 0 &&
      form.accessToken.trim().length > 0 &&
      form.displayName.trim().length > 0,
    [form, phoneValid],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function copyToClipboard(text: string, kind: 'url' | 'token') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      toast({ variant: 'destructive', title: 'Kopyalanamadı', description: 'Lütfen elle kopyalayın.' });
    }
  }

  async function handleConnect() {
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Oturum bulunamadı' });
      return;
    }
    if (!formValid) return;
    setSubmitting(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/ngo-admin/whatsapp-business/numbers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          phoneNumber: form.phoneNumber.trim(),
          wabaAccountId: form.wabaAccountId.trim(),
          wabaPhoneNumberId: form.wabaPhoneNumberId.trim(),
          accessToken: form.accessToken.trim(),
          appSecret: form.appSecret.trim(),
          displayName: form.displayName.trim(),
        }),
      });
      const data = await res.json().catch(() => null) as
        | { id?: string; verified?: boolean; message?: string }
        | null;
      if (!res.ok) {
        toast({
          variant: 'destructive',
          title: 'Numara bağlanamadı',
          description: data?.message || 'Beklenmeyen bir hata oluştu.',
        });
        return;
      }
      setCreatedId(data?.id ?? null);
      toast({ title: 'Numara bağlandı', description: form.phoneNumber.trim() });
      setStepIdx(2);
    } finally {
      setSubmitting(false);
    }
  }

  if (isUserLoading || entityLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authUser || !ngoId) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <p className="text-sm text-muted-foreground">
          Numara bağlamak için bir STK yöneticisi olarak oturum açmalısınız.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-4">
      <Link
        href="/ngo-admin/whatsapp-business/numbers"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> WABA Numaraları
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
          <MessageCircle className="h-6 w-6" style={{ color: HANGEL_ORANGE }} />
          yeni whatsapp business numarası bağla
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Meta Business Manager üzerinden açtığınız WABA numarasını hangel paneline bağlayın.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bağlama Adımları</CardTitle>
          <div className="flex flex-wrap gap-2 pt-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = i === stepIdx;
              const done = i < stepIdx;
              return (
                <Badge
                  key={s.key}
                  variant="outline"
                  className={cn(
                    'flex items-center gap-1 border',
                    done && 'bg-emerald-100 text-emerald-700 border-emerald-200',
                  )}
                  style={
                    active
                      ? { backgroundColor: HANGEL_ORANGE, color: '#fff', borderColor: HANGEL_ORANGE }
                      : undefined
                  }
                >
                  <Icon className="h-3 w-3" /> {i + 1}. {s.label}
                </Badge>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Adım 1 — Meta Business Manager rehberi */}
          {stepIdx === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                WhatsApp İş hesabınızı bağlamak için önce Meta Business Manager'da bir{' '}
                <strong>WABA</strong> + <strong>Phone Number</strong> oluşturup{' '}
                <strong>System User Access Token</strong> üretmeniz gerekir. Aşağıdaki adımları
                takip edin.
              </p>
              <ol className="space-y-2">
                {META_GUIDE_STEPS.map((step, i) => (
                  <li key={i} className="flex gap-3 p-3 rounded-xl border">
                    <span
                      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: HANGEL_ORANGE }}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 text-sm">
                      <p className="font-semibold">{step.title}</p>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-300 bg-amber-50/60 text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  <strong>Access Token</strong> ve <strong>App Secret</strong> hassas bilgilerdir.
                  Hangel onları yalnızca STK'nızın gönderimleri ve webhook doğrulaması için kullanır.
                  Token'ı kimseyle paylaşmayın; sorun olursa Meta'dan iptal edip yenisini üretebilirsiniz.
                </span>
              </div>
            </div>
          )}

          {/* Adım 2 — Bilgileri gir */}
          {stepIdx === 1 && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Telefon Numarası (E.164)</Label>
                <Input
                  id="phoneNumber"
                  value={form.phoneNumber}
                  onChange={(e) => update('phoneNumber', e.target.value)}
                  placeholder="+905551112233"
                  autoComplete="off"
                  inputMode="tel"
                />
                {form.phoneNumber.trim() && !phoneValid && (
                  <p className="text-[11px] text-destructive flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3" /> Numara <strong>+90</strong> ile başlamalı ve
                    sadece rakam içermelidir.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Görünür İsim (Display Name)</Label>
                <Input
                  id="displayName"
                  value={form.displayName}
                  onChange={(e) => update('displayName', e.target.value)}
                  placeholder="Yeşilay"
                  autoComplete="off"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Meta'da onaylı görünen isminizi birebir yazın (alıcı bu ismi görür).
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wabaAccountId">WABA ID</Label>
                <Input
                  id="wabaAccountId"
                  value={form.wabaAccountId}
                  onChange={(e) => update('wabaAccountId', e.target.value)}
                  placeholder="1234567890123456"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wabaPhoneNumberId">Phone Number ID</Label>
                <Input
                  id="wabaPhoneNumberId"
                  value={form.wabaPhoneNumberId}
                  onChange={(e) => update('wabaPhoneNumberId', e.target.value)}
                  placeholder="0987654321098765"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accessToken">Access Token</Label>
                <Input
                  id="accessToken"
                  type="password"
                  value={form.accessToken}
                  onChange={(e) => update('accessToken', e.target.value)}
                  placeholder="EAAG..."
                  autoComplete="off"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Meta System User'ın <em>Permanent</em> token'ı. Scope:{' '}
                  <code>whatsapp_business_messaging</code> +{' '}
                  <code>whatsapp_business_management</code>.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="appSecret">App Secret (webhook için)</Label>
                <Input
                  id="appSecret"
                  type="password"
                  value={form.appSecret}
                  onChange={(e) => update('appSecret', e.target.value)}
                  placeholder="Meta Uygulama Gizli Anahtarı"
                  autoComplete="off"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Meta App Dashboard → Settings → Basic → <strong>App Secret</strong>.
                  Webhook imzasının doğrulanması (X-Hub-Signature-256) için gerekir.
                </p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl border border-amber-300 bg-amber-50/60 text-xs text-amber-800">
                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Hangel, girdiğiniz bilgileri yalnızca sizin STK'nızın WhatsApp gönderimi için
                  kullanır. Verileriniz başka kurumlarla paylaşılmaz.
                </span>
              </div>
            </div>
          )}

          {/* Adım 3 — Başarı + webhook talimatı */}
          {stepIdx === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-emerald-300 bg-emerald-50/60 text-emerald-800">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Numaranız bağlandı.</p>
                  <p className="text-xs">
                    {form.phoneNumber.trim() || '—'} artık hangel panelinde aktif.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Link2 className="h-4 w-4" /> Webhook URL'sini Meta'da Tanımlayın
                </p>
                <p className="text-sm text-muted-foreground">
                  Gelen mesajların ve şablon onay/red durum güncellemelerinin paneline akabilmesi
                  için Meta Business Manager → WABA → <strong>Webhooks</strong> bölümünden aşağıdaki
                  ayarları kaydedin.
                </p>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-muted-foreground">Callback URL</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5"
                      onClick={() => copyToClipboard(WEBHOOK_URL, 'url')}
                    >
                      {copied === 'url' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied === 'url' ? 'Kopyalandı' : 'Kopyala'}
                    </Button>
                  </div>
                  <p className="font-mono text-sm break-all">{WEBHOOK_URL}</p>
                </div>
                <div className="rounded-xl border p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs text-muted-foreground">Verify Token</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5"
                      onClick={() => copyToClipboard(WEBHOOK_VERIFY_TOKEN, 'token')}
                    >
                      {copied === 'token' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {copied === 'token' ? 'Kopyalandı' : 'Kopyala'}
                    </Button>
                  </div>
                  <p className="font-mono text-sm break-all">{WEBHOOK_VERIFY_TOKEN}</p>
                </div>
                <div className="rounded-xl border p-3 space-y-2 text-sm">
                  <Label className="text-xs text-muted-foreground">Abone Olunacak Olaylar</Label>
                  <ul className="list-disc ml-5 space-y-0.5">
                    <li>
                      <code>messages</code> — gelen mesajlar + outbound status'lar
                    </li>
                    <li>
                      <code>message_template_status_update</code> — şablon onay / red /
                      durdurma bildirimleri
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  onClick={() => router.push('/ngo-admin/whatsapp-business/numbers')}
                  className="gap-2 text-white"
                  style={{ backgroundColor: HANGEL_ORANGE }}
                >
                  <Phone className="h-4 w-4" /> Numara Listesine Dön
                </Button>
                {createdId && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push(`/ngo-admin/whatsapp-business/numbers/${createdId}`)
                    }
                  >
                    Numara Ayrıntıları
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Navigasyon */}
          {stepIdx === 0 && (
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setStepIdx(1)}
                className="text-white"
                style={{ backgroundColor: HANGEL_ORANGE }}
              >
                Hazırım, Sonraki Adım
              </Button>
            </div>
          )}

          {stepIdx === 1 && (
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => setStepIdx(0)}
                disabled={submitting}
              >
                Geri
              </Button>
              <Button
                onClick={handleConnect}
                disabled={!formValid || submitting}
                className="text-white"
                style={{ backgroundColor: HANGEL_ORANGE }}
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlugZap className="mr-2 h-4 w-4" />
                )}
                Bağla
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
