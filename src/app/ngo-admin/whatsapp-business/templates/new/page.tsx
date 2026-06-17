'use client';

/**
 * /ngo-admin/whatsapp-business/templates/new
 *
 * Yeni WABA mesaj şablonu oluşturma:
 *   - GET  /api/ngo-admin/whatsapp-business/numbers       → numara dropdown
 *   - POST /api/ngo-admin/whatsapp-business/templates     → draft + Meta submit
 *
 * Form düzeni:
 *   - Numara seç, Ad (slug regex), Kategori (utility/marketing/authentication),
 *     Dil (tr/en), Başlık (opsiyonel 60 char), Gövde (zorunlu, {{n}} değişken
 *     pattern detect), Altbilgi (60 char), Butonlar (max 3: quick_reply/url/
 *     phone_number).
 *   - Önizleme tab: WhatsApp baloncuğu mockup (yeşil arkaplan).
 *   - "Onaya Gönder" → POST /templates → liste sayfasına dön.
 */

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useToast } from '@/hooks/use-toast';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface NumberRow {
  id: string;
  phoneNumber: string;
  displayName: string;
  status: string;
}

type Category = 'utility' | 'marketing' | 'authentication';
type Language = 'tr' | 'en';
type ButtonType = 'quick_reply' | 'url' | 'phone_number';

interface ButtonRow {
  type: ButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
  payload?: string;
}

interface ApiError {
  errorCode?: string;
  message?: string;
}

interface TemplateSample {
  name: string;
  category: Category;
  body: string;
  examples: string[];
}

const NAME_REGEX = /^[a-z][a-z0-9_]{2,511}$/;
const VARIABLE_REGEX = /\{\{(\d+)\}\}/g;
const MAX_BUTTONS = 3;
const HEADER_MAX = 60;
const FOOTER_MAX = 60;
const BODY_MAX = 1024;

const SAMPLES: TemplateSample[] = [
  {
    name: 'etkinlik_daveti',
    category: 'utility',
    body: 'Merhaba {{1}}, {{2}} tarihinde {{3}} adresinde gerçekleşecek etkinliğimize davetlisin. Katılır mısın?',
    examples: ['Ayşe', '15 Haziran', 'Kadıköy Halk Merkezi'],
  },
  {
    name: 'bagis_tesekkur',
    category: 'utility',
    body: 'Merhaba {{1}}, hangel üzerinden yaptığın {{2}} TL bağış için teşekkür ederiz. Faydası büyük olacak.',
    examples: ['Mehmet', '250'],
  },
  {
    name: 'gonullu_cagrisi',
    category: 'marketing',
    body: 'Merhaba {{1}}, {{2}} ilinde {{3}} alanında gönüllü ihtiyacımız var. İlgilenir misin?',
    examples: ['Zeynep', 'İstanbul', 'çocuk eğitim'],
  },
];

function detectVariables(body: string): number[] {
  const found = new Set<number>();
  const matches = body.matchAll(VARIABLE_REGEX);
  for (const m of matches) {
    const n = Number.parseInt(m[1] ?? '', 10);
    if (Number.isFinite(n) && n >= 1) found.add(n);
  }
  return Array.from(found).sort((a, b) => a - b);
}

function renderPreviewBody(body: string, examples: string[]): string {
  return body.replace(/\{\{(\d+)\}\}/g, (_, raw) => {
    const idx = Number.parseInt(String(raw), 10) - 1;
    const ex = examples[idx];
    return ex && ex.trim() ? ex : `[${Number(raw)}]`;
  });
}

export default function NewWhatsAppTemplatePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [numbers, setNumbers] = useState<NumberRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [wabaPhoneNumberId, setWabaPhoneNumberId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('utility');
  const [language, setLanguage] = useState<Language>('tr');
  const [headerText, setHeaderText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [buttons, setButtons] = useState<ButtonRow[]>([]);
  const [examples, setExamples] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/ngo-admin/whatsapp-business/numbers', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const payload = (await res.json().catch(() => null)) as
          | { numbers?: NumberRow[] }
          | ApiError
          | null;
        if (!res.ok || !payload || !('numbers' in payload) || !Array.isArray(payload.numbers)) {
          const err = payload as ApiError | null;
          throw new Error(err?.message || 'Numaralar yüklenemedi.');
        }
        if (cancelled) return;
        const active = payload.numbers.filter((n) => n.status === 'active');
        setNumbers(active);
        if (active.length > 0 && !wabaPhoneNumberId) {
          setWabaPhoneNumberId(active[0].id);
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Beklenmeyen hata.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // wabaPhoneNumberId intentionally not in deps to avoid re-fetch after picking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const detectedVars = useMemo(() => detectVariables(bodyText), [bodyText]);

  // Detected variables sayısı arttıkça examples'ı eşit boyuta tut.
  useEffect(() => {
    setExamples((prev) => {
      const next = detectedVars.map((_, i) => prev[i] ?? '');
      return next;
    });
  }, [detectedVars]);

  const nameError = useMemo(() => {
    if (!name) return null;
    if (!NAME_REGEX.test(name)) {
      return 'Küçük harfle başlamalı, sadece a-z, 0-9, _ içermeli (3-512 karakter).';
    }
    return null;
  }, [name]);

  const examplesError = useMemo(() => {
    if (detectedVars.length === 0) return null;
    const missing = examples.findIndex((v) => !v.trim());
    if (missing !== -1) {
      return `Değişken ${missing + 1} için örnek değer zorunlu (Meta onayı gerektirir).`;
    }
    return null;
  }, [detectedVars, examples]);

  const buttonsError = useMemo(() => {
    for (let i = 0; i < buttons.length; i += 1) {
      const b = buttons[i];
      if (!b.text.trim()) return `Buton ${i + 1} metni zorunlu.`;
      if (b.type === 'url' && !b.url?.trim()) return `Buton ${i + 1} için URL zorunlu.`;
      if (b.type === 'phone_number' && !b.phoneNumber?.trim()) {
        return `Buton ${i + 1} için telefon zorunlu.`;
      }
    }
    return null;
  }, [buttons]);

  const canSubmit =
    !!wabaPhoneNumberId &&
    !!name &&
    !nameError &&
    !!bodyText.trim() &&
    !examplesError &&
    !buttonsError &&
    !isSubmitting;

  const applySample = (s: TemplateSample) => {
    setName(s.name);
    setCategory(s.category);
    setBodyText(s.body);
    setExamples(s.examples);
    setHeaderText('');
    setFooterText('');
    setButtons([]);
  };

  const addButton = () => {
    if (buttons.length >= MAX_BUTTONS) return;
    setButtons((prev) => [...prev, { type: 'quick_reply', text: '' }]);
  };

  const removeButton = (idx: number) => {
    setButtons((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateButton = (idx: number, patch: Partial<ButtonRow>) => {
    setButtons((prev) =>
      prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    );
  };

  const updateExample = (idx: number, value: string) => {
    setExamples((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!canSubmit) {
      const reason = nameError || examplesError || buttonsError || 'Form eksik.';
      toast({
        title: 'Form eksik',
        description: reason,
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const payload = {
        wabaPhoneNumberId,
        name,
        category,
        language,
        bodyText: bodyText.trim(),
        headerText: headerText.trim() || undefined,
        footerText: footerText.trim() || undefined,
        buttons: buttons.map((b) => {
          const out: Record<string, string> = { type: b.type, text: b.text.trim() };
          if (b.type === 'url' && b.url) out.url = b.url.trim();
          if (b.type === 'phone_number' && b.phoneNumber) {
            out.phoneNumber = b.phoneNumber.trim();
          }
          if (b.type === 'quick_reply' && b.payload) out.payload = b.payload.trim();
          return out;
        }),
        variables: examples.map((v) => v.trim()),
      };
      const res = await fetch('/api/ngo-admin/whatsapp-business/templates', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as
        | { id?: string; status?: string }
        | ApiError
        | null;
      if (!res.ok || !json || !('id' in json)) {
        const err = json as ApiError | null;
        throw new Error(err?.message || 'Şablon oluşturulamadı.');
      }
      toast({
        title: 'Şablon Meta onayına gönderildi',
        description: `"${name}" beklemede. Onay genelde 24 saat içinde gelir.`,
      });
      router.push('/ngo-admin/whatsapp-business/templates');
    } catch (e) {
      toast({
        title: 'Gönderim başarısız',
        description: e instanceof Error ? e.message : 'Beklenmeyen hata.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Oturum gerekli</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Şablon oluşturmak için oturum açın.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
      <div className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/ngo-admin">Yönetim Paneli</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/ngo-admin/whatsapp-business">WhatsApp Business</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/ngo-admin/whatsapp-business/templates">Şablonlar</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Yeni</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Link
          href="/ngo-admin/whatsapp-business/templates"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Şablonlar
        </Link>

        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">
            Yeni Mesaj Şablonu
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Form Meta&apos;ya gönderilecek. Onay genellikle 24 saat içinde gelir.
          </p>
        </div>
      </div>

      {loadError && (
        <Card className="border-rose-300 bg-rose-50/40">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertCircle className="h-5 w-5 text-rose-600" />
            <CardTitle className="text-base">Numara listesi alınamadı</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{loadError}</p>
          </CardContent>
        </Card>
      )}

      {numbers !== null && numbers.length === 0 && !loadError && (
        <Card className="border-amber-300 bg-amber-50/40">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-base">Aktif WABA numaranız yok</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              Şablon oluşturmak için önce bir WhatsApp Business numarası bağlayın.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/ngo-admin/whatsapp-business">Numara Bağla</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="edit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="edit">Düzenle</TabsTrigger>
          <TabsTrigger value="preview">Önizle</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600" /> Hızlı Başlangıç
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SAMPLES.map((s) => (
                  <Button
                    key={s.name}
                    variant="outline"
                    size="sm"
                    type="button"
                    onClick={() => applySample(s)}
                  >
                    {s.name === 'etkinlik_daveti' && 'Etkinlik daveti'}
                    {s.name === 'bagis_tesekkur' && 'Bağış teşekkür'}
                    {s.name === 'gonullu_cagrisi' && 'Gönüllü çağrısı'}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Türkçe örneklerden birini seçin, kendi metniniz ile özelleştirin.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>WABA Numarası</Label>
                <Select
                  value={wabaPhoneNumberId}
                  onValueChange={setWabaPhoneNumberId}
                  disabled={!numbers || numbers.length === 0 || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Numara seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {(numbers ?? []).map((n) => (
                      <SelectItem key={n.id} value={n.id}>
                        {n.displayName} ({n.phoneNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-name">Ad (slug)</Label>
                <Input
                  id="tpl-name"
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase())}
                  placeholder="ornek_sablon_adi"
                  maxLength={512}
                  disabled={isSubmitting}
                  className="font-mono"
                />
                {nameError ? (
                  <p className="text-xs text-rose-600">{nameError}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Küçük harf, rakam, alt çizgi. Meta katalog kimliği olacak.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Kategori</Label>
                <RadioGroup
                  value={category}
                  onValueChange={(v) => setCategory(v as Category)}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  <label
                    htmlFor="cat-utility"
                    className="flex items-start gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/40"
                  >
                    <RadioGroupItem value="utility" id="cat-utility" className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Hizmet</p>
                      <p className="text-xs text-muted-foreground">
                        Bildirim, hatırlatma, makbuz.
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="cat-marketing"
                    className="flex items-start gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/40"
                  >
                    <RadioGroupItem value="marketing" id="cat-marketing" className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Pazarlama</p>
                      <p className="text-xs text-muted-foreground">
                        Kampanya, davet, çağrı.
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="cat-auth"
                    className="flex items-start gap-2 rounded-lg border p-3 cursor-pointer hover:bg-muted/40"
                  >
                    <RadioGroupItem value="authentication" id="cat-auth" className="mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Doğrulama</p>
                      <p className="text-xs text-muted-foreground">
                        OTP, tek kullanımlık kod.
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div className="space-y-1.5">
                <Label>Dil</Label>
                <Select
                  value={language}
                  onValueChange={(v) => setLanguage(v as Language)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">Türkçe (tr)</SelectItem>
                    <SelectItem value="en">İngilizce (en)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">İçerik</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="tpl-header">Başlık (opsiyonel)</Label>
                <Input
                  id="tpl-header"
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  maxLength={HEADER_MAX}
                  placeholder="Örn. hangel Bilgilendirme"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  {headerText.length}/{HEADER_MAX}
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-body">Gövde</Label>
                <Textarea
                  id="tpl-body"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  maxLength={BODY_MAX}
                  rows={6}
                  placeholder="Merhaba {{1}}, ... şeklinde değişken kullanabilirsiniz."
                  disabled={isSubmitting}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    Değişken kullanımı:{' '}
                    <span className="font-mono">{`{{1}}, {{2}}, ...`}</span>
                  </span>
                  <span>{bodyText.length}/{BODY_MAX}</span>
                </div>
              </div>

              {detectedVars.length > 0 && (
                <div className="space-y-2 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3">
                  <p className="text-sm font-medium">
                    Algılanan değişkenler ({detectedVars.length})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Meta onayı için her değişken için örnek değer zorunlu.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {detectedVars.map((v, i) => (
                      <div key={v} className="space-y-1">
                        <Label
                          htmlFor={`ex-${v}`}
                          className="text-xs flex items-center gap-1.5"
                        >
                          <Badge variant="outline" className="font-mono">
                            {`{{${v}}}`}
                          </Badge>
                          örnek değer
                        </Label>
                        <Input
                          id={`ex-${v}`}
                          value={examples[i] ?? ''}
                          onChange={(e) => updateExample(i, e.target.value)}
                          placeholder={`Örn. ${v === 1 ? 'Ayşe' : v === 2 ? '15 Haziran' : 'Kadıköy'}`}
                          disabled={isSubmitting}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="tpl-footer">Altbilgi (opsiyonel)</Label>
                <Input
                  id="tpl-footer"
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  maxLength={FOOTER_MAX}
                  placeholder="Örn. Çıkmak için STOP yazın"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  {footerText.length}/{FOOTER_MAX}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">
                Butonlar ({buttons.length}/{MAX_BUTTONS})
              </CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addButton}
                disabled={buttons.length >= MAX_BUTTONS || isSubmitting}
              >
                <Plus className="h-4 w-4 mr-1" /> Buton Ekle
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {buttons.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Henüz buton eklenmedi. En fazla 3 buton.
                </p>
              ) : (
                buttons.map((b, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border p-3 space-y-2 bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Tip</Label>
                        <Select
                          value={b.type}
                          onValueChange={(v) => updateButton(idx, { type: v as ButtonType, url: undefined, phoneNumber: undefined, payload: undefined })}
                          disabled={isSubmitting}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quick_reply">Hızlı Yanıt</SelectItem>
                            <SelectItem value="url">URL</SelectItem>
                            <SelectItem value="phone_number">Telefon</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeButton(idx)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 self-end"
                        aria-label="Butonu sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Metin</Label>
                      <Input
                        value={b.text}
                        onChange={(e) => updateButton(idx, { text: e.target.value })}
                        placeholder="Örn. Katılıyorum"
                        maxLength={25}
                        disabled={isSubmitting}
                      />
                    </div>

                    {b.type === 'url' && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">URL</Label>
                        <Input
                          value={b.url ?? ''}
                          onChange={(e) => updateButton(idx, { url: e.target.value })}
                          placeholder="https://hangel.org/..."
                          type="url"
                          disabled={isSubmitting}
                        />
                      </div>
                    )}

                    {b.type === 'phone_number' && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Telefon (E.164)</Label>
                        <Input
                          value={b.phoneNumber ?? ''}
                          onChange={(e) => updateButton(idx, { phoneNumber: e.target.value })}
                          placeholder="+905551112233"
                          disabled={isSubmitting}
                        />
                      </div>
                    )}

                    {b.type === 'quick_reply' && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">Payload (opsiyonel)</Label>
                        <Input
                          value={b.payload ?? ''}
                          onChange={(e) => updateButton(idx, { payload: e.target.value })}
                          placeholder="event_yes"
                          disabled={isSubmitting}
                        />
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">WhatsApp Önizlemesi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className="w-full max-w-sm rounded-2xl bg-[#e5ddd5] p-4">
                  <div className="rounded-2xl bg-[#dcf8c6] border border-emerald-200 px-4 py-3 shadow-sm space-y-1.5">
                    {headerText && (
                      <p className="font-semibold text-sm text-emerald-950">
                        {headerText}
                      </p>
                    )}
                    {bodyText.trim() ? (
                      <p className="text-sm text-emerald-950 whitespace-pre-wrap">
                        {renderPreviewBody(bodyText, examples)}
                      </p>
                    ) : (
                      <p className="text-sm text-emerald-900/50 italic">
                        Mesaj gövdesi burada görünecek...
                      </p>
                    )}
                    {footerText && (
                      <p className="text-xs text-emerald-800/70 pt-1">
                        {footerText}
                      </p>
                    )}
                    <p className="text-[10px] text-emerald-800/60 text-right pt-1">
                      şimdi
                    </p>
                  </div>
                  {buttons.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {buttons.map((b, i) => (
                        <div
                          key={i}
                          className="text-center text-sm text-emerald-700 py-2 bg-white rounded-lg border border-emerald-200 shadow-sm"
                        >
                          {b.text.trim() || `Buton ${i + 1}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="outline" asChild>
          <Link href="/ngo-admin/whatsapp-business/templates">Vazgeç</Link>
        </Button>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-1" /> Gönderiliyor
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-1" /> Onaya Gönder
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
