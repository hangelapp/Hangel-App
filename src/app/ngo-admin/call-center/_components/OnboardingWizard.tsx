'use client';

/**
 * OnboardingWizard — 4 adımda STK çağrı merkezi başvurusu.
 *
 * Adımlar:
 *   1) Paket seç   (santralPackages koleksiyonu, demo amaçlı fallback liste)
 *   2) Belgeler    (placeholder; gerçek upload Storage bağlanınca eklenecek)
 *   3) Caller ID   (santralNumberPool / status:'available' havuzdan seçim)
 *   4) DPA onayı   (KVKK Veri İşleyen Sözleşmesi markdown + zorunlu checkbox)
 *
 * Submit → POST /api/ngo-admin/call-center/onboard
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, FileText, Phone, Package, ShieldCheck } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { messagingFetch } from '@/lib/messaging/client';
import { cn } from '@/lib/utils';

const NUMBER_POOL = 'santralNumberPool';
const PACKAGES = 'santralPackages';

// Hangel'in desteklediği kurum tipleri — her birinin kütük/tescil numarası farklı
// kaynaktan gelir; doğru placeholder + açıklama vermek için tip-spesifik meta.
type CompanyType = 'Dernek' | 'Vakıf' | 'Federasyon' | 'SporKulübü' | 'ÖğrenciKulübü' | 'Sendika' | 'Oda' | 'Kooperatif' | 'Diğer';
const COMPANY_TYPES: Array<{ value: CompanyType; label: string; numberHint: string; numberPlaceholder: string }> = [
  { value: 'Dernek',         label: 'Dernek',                       numberHint: 'T.C. Dernekler Dairesi kütük numarası (8 hane, format XX-XXX-XXX). Dernek tüzüğünün üst köşesinde veya DERBİS kaydında yer alır.', numberPlaceholder: '06-154-120' },
  { value: 'Vakıf',          label: 'Vakıf',                        numberHint: 'T.C. Vakıflar Genel Müdürlüğü kütük numarası. Vakıf senedinin onay sayfasında veya VGM Vakbis kaydında bulunur.',                    numberPlaceholder: 'V-1234' },
  { value: 'Federasyon',     label: 'Federasyon / Konfederasyon',   numberHint: 'SHGM (Spor Hizmetleri Genel Müdürlüğü) tescil numarası veya Sivil Toplumla İlişkiler GM kayıt no.',                                  numberPlaceholder: 'SHGM-2024-XXXX' },
  { value: 'SporKulübü',     label: 'Spor Kulübü',                  numberHint: 'GSB SPORBİS tescil numarası (7405 sayılı Kanun sonrası). Spor il müdürlüğünden alınan tescil belgesi üzerinde.',                       numberPlaceholder: '06-1234' },
  { value: 'ÖğrenciKulübü',  label: 'Üniversite Öğrenci Kulübü',   numberHint: 'Üniversitenin SKS Daire Başkanlığı tarafından verilen kulüp kayıt numarası.',                                                          numberPlaceholder: 'SKS-2024-12' },
  { value: 'Sendika',        label: 'Sendika',                      numberHint: 'Çalışma ve Sosyal Güvenlik Bakanlığı sendika tescil no.',                                                                            numberPlaceholder: 'ÇSGB-XXXX' },
  { value: 'Oda',            label: 'Oda / Borsa',                  numberHint: 'TOBB veya ilgili meslek odası kayıt numarası.',                                                                                       numberPlaceholder: 'TOBB-XXXX' },
  { value: 'Kooperatif',     label: 'Kooperatif',                   numberHint: 'Ticaret Sicil Müdürlüğü kooperatif sicil numarası.',                                                                                  numberPlaceholder: 'TSM-XXXX' },
  { value: 'Diğer',          label: 'Diğer',                        numberHint: 'Maliye / Gelir İdaresi vergi numarası (10 hane).',                                                                                    numberPlaceholder: '1234567890' },
];

interface PackageRow {
  id: string;
  name?: string;
  monthlyPriceTRY?: number;
  monthlyMinutesQuota?: number;
  features?: string[];
  active?: boolean;
}

interface NumberPoolRow {
  id: string;
  number?: string;
  providerId?: string;
  status?: 'available' | 'reserved' | 'assigned' | 'retired';
}

interface OnboardingWizardProps {
  ngoId: string;
}

const STEPS = [
  { key: 'package', label: 'Paket', icon: Package },
  { key: 'documents', label: 'Belgeler', icon: FileText },
  { key: 'caller-id', label: 'Numara', icon: Phone },
  { key: 'dpa', label: 'KVKK Onayı', icon: ShieldCheck },
] as const;

// Fallback paket listesi — santralPackages koleksiyonu boşken kullanıcıya
// yine de seçim sunabilmek için. Gerçek paketler ileride Firestore'dan gelir.
const FALLBACK_PACKAGES: PackageRow[] = [
  { id: 'starter', name: 'Başlangıç', monthlyPriceTRY: 499, monthlyMinutesQuota: 500, features: ['1 hat', 'Çağrı kaydı', 'Aylık rapor'], active: true },
  { id: 'pro', name: 'Profesyonel', monthlyPriceTRY: 1299, monthlyMinutesQuota: 2000, features: ['2 hat', 'Çağrı kaydı', 'IVR menüsü', 'Aylık rapor'], active: true },
  { id: 'enterprise', name: 'Kurumsal', monthlyPriceTRY: 2999, monthlyMinutesQuota: 6000, features: ['2 hat', 'Çağrı kaydı', 'IVR + Anket', 'CRM entegrasyonu'], active: true },
];

const DPA_MARKDOWN = `
**KVKK — Veri İşleyen Sözleşmesi (DPA)**

Bu sözleşme, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında
**STK (Veri Sorumlusu)** ile **hangel (Veri İşleyen)** arasındaki rolleri
ve sorumlulukları düzenler.

1. **Roller.** STK, çağrı merkezi üzerinden iletişim kurduğu kişisel verilerin
   Veri Sorumlusu'dur. hangel, yalnızca STK'nın talimatları doğrultusunda
   veriyi işleyen taraf (Veri İşleyen) konumundadır.

2. **Amaç ve kapsam.** Veri yalnızca STK'nın gönüllü, bağışçı ve faydalanıcı
   iletişimi amacıyla işlenir; başka amaçla kullanılmaz, üçüncü taraflara
   satılmaz.

3. **Çağrı kayıtları.** Görüşme kayıtları **yalnızca STK tarafından**
   dinlenebilir. hangel süper-yöneticileri kayıt dosyalarına erişmez; sadece
   meta-veri (süre, taraflar, durum) görür.

4. **Saklama.** Çağrı kayıtları 6 ay sonra otomatik silinir. STK manuel
   silme talebinde bulunabilir.

5. **Güvenlik.** Tüm trafik TLS üzerinden iletilir, kayıtlar Firebase Storage
   üzerinde özel ACL ile korunur. Erişim audit log'a alınır.

6. **Veri sahibi hakları.** Bilgi alma, silme, düzeltme ve itiraz hakları
   doğrudan STK'ya yöneltilir. hangel ilgili taleplerde STK'ya teknik destek
   sağlar.

7. **Aydınlatma metni.** STK, aradığı kişiye görüşmenin kayıt altına
   alındığını duyurmakla yükümlüdür.

8. **Tedarikçiler.** PBX (santral) sağlayıcısı taşeron veri işleyen olarak
   STK tarafından kabul edilmiş sayılır.

Bu sözleşmeyi onaylayarak yukarıdaki şartları kabul ettiğinizi beyan edersiniz.
`;

export function OnboardingWizard({ ngoId }: OnboardingWizardProps) {
  const { toast } = useToast();
  const db = useFirestore();

  const [stepIdx, setStepIdx] = useState(0);
  const [packageId, setPackageId] = useState<string>('');
  const [documentLabels, setDocumentLabels] = useState<string>('');
  const [selectedNumberId, setSelectedNumberId] = useState<string>('');
  const [dpaAccepted, setDpaAccepted] = useState(false);
  const [companyType, setCompanyType] = useState<CompanyType>('Dernek');
  const [companyTaxId, setCompanyTaxId] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ formId: string } | null>(null);

  // Paket listesi — koleksiyon henüz boş olabilir; fallback ile birleştirilir.
  const pkgQuery = useMemoFirebase(
    () => query(collection(db, PACKAGES), where('active', '==', true), limit(20)),
    [db],
  );
  const { data: dbPackages } = useCollection<PackageRow>(pkgQuery);
  const packages = useMemo<PackageRow[]>(
    () => (dbPackages && dbPackages.length > 0 ? dbPackages : FALLBACK_PACKAGES),
    [dbPackages],
  );

  // Numara havuzu — yalnızca 'available' kayıtlar.
  const numbersQuery = useMemoFirebase(
    () => query(collection(db, NUMBER_POOL), where('status', '==', 'available'), limit(50)),
    [db],
  );
  const { data: availableNumbers, isLoading: numbersLoading } = useCollection<NumberPoolRow>(numbersQuery);

  function next() {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  }
  function back() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  function canAdvance(): boolean {
    if (stepIdx === 0) return !!packageId;
    if (stepIdx === 1) return true; // belgeler şu an opsiyonel placeholder
    if (stepIdx === 2) return !!selectedNumberId;
    if (stepIdx === 3) return dpaAccepted;
    return false;
  }

  async function handleSubmit() {
    if (!dpaAccepted) {
      toast({ variant: 'destructive', title: 'KVKK onayı gerekli', description: 'Devam etmek için DPA sözleşmesini onaylayın.' });
      return;
    }
    setSubmitting(true);
    try {
      const documentsRefs = documentLabels
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const result = await messagingFetch<{ ok: boolean; ngoCallCenterId: string; formId: string; message: string }>(
        '/api/ngo-admin/call-center/onboard',
        {
          method: 'POST',
          body: JSON.stringify({
            packageId,
            documentsRefs,
            requestedCallerIdNumber: selectedNumberId,
            dpaAccepted,
            companyType,
            formData: {
              companyTaxId: companyTaxId || null,
              contactPerson: contactPerson || null,
            },
          }),
        },
      );
      setSuccess({ formId: result.formId });
      toast({ title: 'Başvurunuz alındı', description: result.message });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Başvuru gönderilemedi', description: msg });
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card className="border-emerald-300 bg-emerald-50/40">
        <CardHeader className="flex flex-row items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <CardTitle className="text-base">Başvurunuz alındı</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Başvurunuz inceleniyor. Aktivasyon tamamlandığında bu sayfa çağrı paneline dönüşecek.</p>
          <p className="text-xs text-muted-foreground">Form numarası: {success.formId}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Başvuru Adımları</CardTitle>
        <div className="flex flex-wrap gap-2 pt-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Badge
                key={s.key}
                variant={i === stepIdx ? 'default' : 'outline'}
                className={cn('flex items-center gap-1', i < stepIdx && 'bg-emerald-100 text-emerald-700 border-emerald-200')}
              >
                <Icon className="h-3 w-3" /> {i + 1}. {s.label}
              </Badge>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adım 1 — Paket */}
        {stepIdx === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              STK'nızın aylık çağrı hacmine uygun paketi seçin. Faturalama sağlayıcı firma üzerinden yapılır.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {packages.map((p) => {
                const selected = packageId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPackageId(p.id)}
                    className={cn(
                      'rounded-lg border-2 p-4 text-left transition hover:shadow-sm',
                      selected ? 'border-emerald-500 bg-emerald-50/30' : 'border-muted',
                    )}
                  >
                    <div className="font-semibold">{p.name ?? p.id}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Aylık {p.monthlyMinutesQuota ?? '—'} dk
                    </div>
                    <div className="text-lg font-bold mt-2">
                      {p.monthlyPriceTRY != null ? `${p.monthlyPriceTRY.toLocaleString('tr-TR')} ₺` : '—'}
                      <span className="text-xs font-normal text-muted-foreground"> /ay</span>
                    </div>
                    {Array.isArray(p.features) && p.features.length > 0 && (
                      <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                        {p.features.map((f) => (
                          <li key={f}>• {f}</li>
                        ))}
                      </ul>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Adım 2 — Belgeler placeholder */}
        {stepIdx === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Sağlayıcı firma tüzük, faaliyet belgesi ve vergi levhası talep edebilir. Bu sürümde belge
              yüklemesi placeholder'dır — dosya isimlerini virgülle ayırarak girebilirsiniz.
            </p>
            <div className="space-y-2">
              <Label htmlFor="companyType">Kurum Tipi</Label>
              <select
                id="companyType"
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value as CompanyType)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                {COMPANY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">
                {companyType === 'Diğer' ? 'Vergi Numarası' : 'Kütük / Tescil Numarası'}
              </Label>
              <Input
                id="taxId"
                value={companyTaxId}
                onChange={(e) => setCompanyTaxId(e.target.value)}
                placeholder={COMPANY_TYPES.find((t) => t.value === companyType)?.numberPlaceholder || ''}
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {COMPANY_TYPES.find((t) => t.value === companyType)?.numberHint}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact">İletişim Sorumlusu (Ad Soyad)</Label>
              <Input
                id="contact"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="STK kayıtlı kullanıcılarından arama (yakında)"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                🚧 Yakında: STK'nın mevcut kullanıcıları arasından telefonla arama yaparak
                yetkilendirme. Şu an manuel ad-soyad gir.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="docs">Belgeler</Label>
              <Input
                id="docs"
                value={documentLabels}
                onChange={(e) => setDocumentLabels(e.target.value)}
                placeholder="Örn: tüzük.pdf, faaliyet-belgesi.pdf, vergi-levhası.pdf"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                🚧 Yakında: STK'nın daha önce yüklediği belgeler otomatik gözükür.
                Son 6 ay içinde yüklenen belgeler için yeniden yükleme gerekmeyecek.
                Şu an manuel dosya etiketi (virgülle ayır).
              </p>
            </div>
          </div>
        )}

        {/* Adım 3 — Caller ID havuzdan seçim */}
        {stepIdx === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aramalarda görünecek numarayı havuzdan seçin. Numara onaylandıktan sonra STK'nıza tahsis edilir.
            </p>
            {numbersLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Numaralar yükleniyor...
              </div>
            ) : !availableNumbers || availableNumbers.length === 0 ? (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
                Şu anda havuzda boş numara yok. Lütfen daha sonra tekrar deneyin veya hangel ekibi ile iletişime geçin.
              </p>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {availableNumbers.map((n) => {
                  const selected = selectedNumberId === n.id;
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setSelectedNumberId(n.id)}
                      className={cn(
                        'rounded-md border p-3 text-left text-sm transition hover:shadow-sm',
                        selected ? 'border-emerald-500 bg-emerald-50/30' : 'border-muted',
                      )}
                    >
                      <div className="font-mono text-base">{n.number ?? n.id}</div>
                      {n.providerId && (
                        <div className="text-xs text-muted-foreground">Sağlayıcı: {n.providerId}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Adım 4 — DPA */}
        {stepIdx === 3 && (
          <div className="space-y-3">
            <div className="max-h-80 overflow-y-auto rounded-md border bg-muted/30 p-4 text-sm whitespace-pre-wrap leading-relaxed">
              {DPA_MARKDOWN.trim()}
            </div>
            <label className="flex items-start gap-3 cursor-pointer text-sm">
              <Checkbox
                checked={dpaAccepted}
                onCheckedChange={(v) => setDpaAccepted(v === true)}
                aria-label="KVKK Veri İşleyen Sözleşmesi onayı"
              />
              <span>
                Yukarıdaki KVKK Veri İşleyen Sözleşmesi'ni okudum, anladım ve kabul ediyorum.
                STK olarak Veri Sorumlusu sıfatımı, hangel'in Veri İşleyen sıfatını kabul ediyorum.
              </span>
            </label>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={back} disabled={stepIdx === 0 || submitting}>
            Geri
          </Button>
          {stepIdx < STEPS.length - 1 ? (
            <Button onClick={next} disabled={!canAdvance() || submitting}>
              Devam
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!canAdvance() || submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Başvuruyu Gönder
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
