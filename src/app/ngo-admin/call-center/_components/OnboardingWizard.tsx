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

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, FileText, Phone, Package, ShieldCheck, AlertCircle, ExternalLink, RefreshCw, Search, Gavel, FileSignature, AtSign, KeyRound, Lock } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { celebrate } from '@/lib/celebrate';
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
  ngoName?: string;
  /** STK profilindeki kayıtlı kurum tipi — onboarding'de KİLİTLİ gösterilir. */
  ngoType?: 'Dernek' | 'Vakıf' | 'Spor Kulübü' | 'Özel İzinli';
  /** STK profilindeki kütük/tescil no — onboarding'e otomatik gelir. */
  ngoKutukNo?: string;
}

// STK profilindeki `type` alanını wizard'ın CompanyType birliğine eşler.
function mapNgoType(t: OnboardingWizardProps['ngoType']): CompanyType {
  switch (t) {
    case 'Dernek': return 'Dernek';
    case 'Vakıf': return 'Vakıf';
    case 'Spor Kulübü': return 'SporKulübü';
    case 'Özel İzinli': return 'Diğer';
    default: return 'Dernek';
  }
}

// KEP adresi format kontrolü — KEP alan adları .kep.tr ile biter (hs01.kep.tr, hs03.kep.tr, ...).
const KEP_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.kep\.tr$/;

const STEPS = [
  { key: 'package', label: 'Paket', icon: Package },
  { key: 'documents', label: 'Belgeler & Onaylar', icon: FileText },
  { key: 'caller-id', label: 'Numara', icon: Phone },
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

const SERVICE_PROTOCOL_MARKDOWN = `
**Çağrı Merkezi Hizmet Protokolü**

hangel, STK'lara çağrı merkezi (sanal santral) için **3. parti yazılım hizmeti**
sağlar. hangel bir operatör veya dakika satıcısı **değildir**.

1. **Hat sahipliği.** STK, aramada kullanılacak telefon hattını/numarasını kendi
   adına lisanslı bir operatörden temin eder. hangel yalnızca tarayıcı üzerinden
   bu hatta bağlanan yazılım arayüzünü sunar.

2. **Kullanım.** Hizmet yalnızca STK'nın yasal faaliyetleri (gönüllü, bağışçı,
   faydalanıcı iletişimi) için kullanılır. İzinsiz pazarlama, spam ve İYS'ye
   aykırı arama yasaktır; sorumluluk STK'ya aittir.

3. **Kayıt ve gizlilik.** Görüşme kayıtlarına yalnızca STK erişir. hangel
   süper-yöneticileri yalnızca meta-veri (süre, durum) görür.

4. **Erişilebilirlik.** Hizmet "olduğu gibi" sunulur; operatör/altyapı kaynaklı
   kesintilerden hangel sorumlu tutulamaz. Planlı bakımlar önceden duyurulur.

5. **Fesih.** STK hizmeti dilediği an durdurabilir; hat STK'nın kendi
   operatöründe kalır.

Bu protokolü onaylayarak hangel'in 3. parti yazılım sağlayıcı rolünü kabul edersiniz.
`;

export function OnboardingWizard({ ngoId, ngoName, ngoType, ngoKutukNo }: OnboardingWizardProps) {
  const { toast } = useToast();
  const db = useFirestore();

  // Kurum tipi STK profilinden gelir ve KİLİTLİDİR (değiştirilemez).
  const lockedCompanyType = mapNgoType(ngoType);
  // Kütük/tescil no biliniyorsa otomatik gelir; bilinmiyorsa elle girilir.
  const kutukKnown = !!(ngoKutukNo && ngoKutukNo.trim());

  const [stepIdx, setStepIdx] = useState(0);
  const [packageId, setPackageId] = useState<string>('');
  const [documentLabels, setDocumentLabels] = useState<string>('');
  const [selectedNumberId, setSelectedNumberId] = useState<string>('');
  const companyType = lockedCompanyType;
  const [companyTaxId, setCompanyTaxId] = useState<string>(ngoKutukNo?.trim() || '');
  const [contactPerson, setContactPerson] = useState<string>('');
  // KEP adresi (kurumsal kayıtlı e-posta) — format sorgusu
  const [kepAddress, setKepAddress] = useState<string>('');
  const [kepChecked, setKepChecked] = useState(false);
  // Belge yüklemeleri (Storage: ngos/{ngoId}/santral/...)
  const [boardDecisionUrl, setBoardDecisionUrl] = useState<string>('');
  const [boardUploading, setBoardUploading] = useState(false);
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [signatureUploading, setSignatureUploading] = useState(false);
  // İletişim sorumlusu telefon yetkilendirme (OTP)
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpMasked, setOtpMasked] = useState('');
  const [contactPhoneVerified, setContactPhoneVerified] = useState(false);
  // Onaylar (bu sayfada verilir)
  const [serviceProtocolAccepted, setServiceProtocolAccepted] = useState(false);
  const [kvkkConsentAccepted, setKvkkConsentAccepted] = useState(false);
  // İletişim sorumlusu user search — STK kayıtlı kullanıcılarından
  const [contactUid, setContactUid] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userResults, setUserResults] = useState<Array<{ uid: string; name: string; email: string; phone: string; role: string }>>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  // Belge arşivi — documentArchive'den STK'nın belgeleri + 6 ay tazelik
  const [archivedDocs, setArchivedDocs] = useState<Array<{
    id: string; docType: string; fileUrl: string; year: string;
    uploadedAt: string | null; isFresh: boolean; daysUntilExpiry: number;
  }>>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ formId: string } | null>(null);
  const { user: authedUser } = useUser();

  // STK kullanıcılarını listele — Iletisim Sorumlusu picker için
  useEffect(() => {
    let cancelled = false;
    async function fetchUsers() {
      if (!authedUser) return;
      setUserSearchLoading(true);
      try {
        const token = await authedUser.getIdToken();
        const url = userSearchQuery.trim()
          ? `/api/ngo-admin/users/list?q=${encodeURIComponent(userSearchQuery.trim())}`
          : '/api/ngo-admin/users/list';
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = (await res.json()) as { users: typeof userResults };
        if (!cancelled) setUserResults(data.users);
      } finally {
        if (!cancelled) setUserSearchLoading(false);
      }
    }
    const t = setTimeout(fetchUsers, userSearchQuery ? 300 : 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [authedUser, userSearchQuery]);

  // STK'nın documentArchive belgelerini çek — Belgeler adımı için 6 ay tazelik kontrolü
  useEffect(() => {
    let cancelled = false;
    async function fetchDocs() {
      if (!authedUser) return;
      setDocsLoading(true);
      try {
        const token = await authedUser.getIdToken();
        const res = await fetch('/api/ngo-admin/documents/list', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as { documents: typeof archivedDocs };
        if (!cancelled) setArchivedDocs(data.documents);
      } finally {
        if (!cancelled) setDocsLoading(false);
      }
    }
    fetchDocs();
    return () => { cancelled = true; };
  }, [authedUser]);

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

  // Belge yükleme — Storage ngos/{ngoId}/santral/{kind}-... (rules: managedNgoId yazabilir)
  async function uploadDoc(file: File, kind: 'board-decision' | 'signature-circular'): Promise<string> {
    const storage = getStorage();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-60);
    const path = `ngos/${ngoId}/santral/${kind}-${Date.now()}-${safeName}`;
    const r = storageRef(storage, path);
    await uploadBytes(r, file);
    return getDownloadURL(r);
  }

  async function handleBoardUpload(file: File | undefined) {
    if (!file) return;
    setBoardUploading(true);
    try {
      const url = await uploadDoc(file, 'board-decision');
      setBoardDecisionUrl(url);
      toast({ title: 'Yönetim kurulu kararı yüklendi' });
    } catch {
      toast({ variant: 'destructive', title: 'Yükleme başarısız', description: 'Dosya yüklenemedi, tekrar deneyin.' });
    } finally {
      setBoardUploading(false);
    }
  }

  async function handleSignatureUpload(file: File | undefined) {
    if (!file) return;
    setSignatureUploading(true);
    try {
      const url = await uploadDoc(file, 'signature-circular');
      setSignatureUrl(url);
      toast({ title: 'İmza sirküsü yüklendi' });
    } catch {
      toast({ variant: 'destructive', title: 'Yükleme başarısız', description: 'Dosya yüklenemedi, tekrar deneyin.' });
    } finally {
      setSignatureUploading(false);
    }
  }

  // İletişim sorumlusu telefonuna OTP gönder
  async function sendContactOtp() {
    if (!authedUser || !contactPhone) return;
    setOtpSending(true);
    setOtpError('');
    try {
      const token = await authedUser.getIdToken();
      const res = await fetch('/api/ngo-admin/call-center/contact-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: contactPhone, contactName: contactPerson }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setOtpError(data.message || 'Kod gönderilemedi.');
        return;
      }
      setOtpSent(true);
      setOtpMasked(data.masked || '');
      // Teslim edilemediyse (ne SMS ne WhatsApp) kod yanıtta gelir, test için otomatik doldur.
      if (data.devCode) setOtpCode(String(data.devCode));
      const chan = data.channel === 'whatsapp' ? 'WhatsApp' : data.channel === 'sms' ? 'SMS' : '';
      toast({
        title: 'Doğrulama kodu gönderildi',
        description: data.devCode
          ? `Test modu — kod: ${data.devCode}`
          : data.masked ? `${data.masked} numarasına ${chan} ile gönderildi.` : undefined,
      });
    } catch {
      setOtpError('Kod gönderilemedi, tekrar deneyin.');
    } finally {
      setOtpSending(false);
    }
  }

  // OTP doğrula → contactPhoneVerified
  async function verifyContactOtp() {
    if (!authedUser || !contactPhone || otpCode.trim().length !== 6) return;
    setOtpVerifying(true);
    setOtpError('');
    try {
      const token = await authedUser.getIdToken();
      const res = await fetch('/api/ngo-admin/call-center/contact-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ phone: contactPhone, code: otpCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.verified) {
        setOtpError(data.message || 'Kod hatalı.');
        return;
      }
      setContactPhoneVerified(true);
      toast({ title: 'İletişim sorumlusu doğrulandı 🧡' });
    } catch {
      setOtpError('Doğrulama başarısız, tekrar deneyin.');
    } finally {
      setOtpVerifying(false);
    }
  }

  function next() {
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  }
  function back() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  function canAdvance(): boolean {
    if (stepIdx === 0) return !!packageId;
    if (stepIdx === 1) {
      // Belgeler + yetkilendirme + onaylar
      return (
        !!companyTaxId.trim() &&
        !!contactUid &&
        contactPhoneVerified &&
        !!boardDecisionUrl &&
        !!signatureUrl &&
        serviceProtocolAccepted &&
        kvkkConsentAccepted
      );
    }
    if (stepIdx === 2) return !!selectedNumberId;
    return false;
  }

  async function handleSubmit() {
    // KVKK onayı artık Belgeler adımında veriliyor (ayrı adım kaldırıldı).
    if (!kvkkConsentAccepted || !serviceProtocolAccepted) {
      toast({ variant: 'destructive', title: 'Onaylar gerekli', description: 'Belgeler adımında hizmet protokolü ve KVKK rızasını onaylayın.' });
      setStepIdx(1);
      return;
    }
    setSubmitting(true);
    try {
      // Belgeler: arşivde varsa onların doc ID'leri + docType etiketi geçer;
      // arşiv boşsa eski manuel "etiket" alanı fallback olarak kullanılır.
      const documentsRefs = archivedDocs.length > 0
        ? archivedDocs.map((d) => `${d.docType} (${d.isFresh ? 'taze' : 'bayatlamış'} · ${d.id})`)
        : documentLabels.split(',').map((s) => s.trim()).filter(Boolean);
      const archivedFresh = archivedDocs.filter((d) => d.isFresh).map((d) => d.id);
      const archivedStale = archivedDocs.filter((d) => !d.isFresh).map((d) => d.id);
      const result = await messagingFetch<{ ok: boolean; ngoCallCenterId: string; formId: string; message: string }>(
        '/api/ngo-admin/call-center/onboard',
        {
          method: 'POST',
          body: JSON.stringify({
            packageId,
            documentsRefs,
            requestedCallerIdNumber: selectedNumberId,
            dpaAccepted: kvkkConsentAccepted,
            companyType,
            formData: {
              companyTaxId: companyTaxId || null,
              kutukAuto: kutukKnown,
              kepAddress: kepAddress.trim() || null,
              contactPerson: contactPerson || null,
              contactUid: contactUid || null,
              contactPhone: contactPhone || null,
              contactPhoneVerified,
              boardDecisionUrl: boardDecisionUrl || null,
              signatureCircularUrl: signatureUrl || null,
              serviceProtocolAccepted,
              kvkkConsentAccepted,
              archivedDocsFresh: archivedFresh,
              archivedDocsStale: archivedStale,
            },
          }),
        },
      );
      setSuccess({ formId: result.formId });
      // Kurulum tamamlandı — kutlama: konfeti + haptik.
      celebrate({ title: 'Başvurun tamamlandı 🎉', message: 'Onaylanınca santralın açılacak.' });
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

        {/* Adım 2 — Belgeler + yetkilendirme + onaylar */}
        {stepIdx === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Sağlayıcı firma tüzük, faaliyet belgesi ve yönetim kurulu kararı talep eder.
              Kurum tipi ve kütük numarası STK profilinizden otomatik gelir.
            </p>

            {/* Profil eksikse uyar — tip/kütük otomatik gelemiyor */}
            {(!ngoType || !kutukKnown) && (
              <div className="flex items-start gap-2.5 rounded-md border border-amber-300 bg-amber-50/60 p-3 text-xs text-amber-900">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">STK profiliniz eksik.</p>
                  <p>
                    {!ngoType && 'Kurum tipi profilinizde kayıtlı değil (varsayılan: Dernek). '}
                    {!kutukKnown && 'Kütük/tescil numaranız profilinizde yok, aşağıdan elle girin. '}
                    Profilinizi tamamlarsanız bu alanlar otomatik dolar.
                  </p>
                  <a href="/ngo-admin/manage-profile" className="inline-flex items-center gap-1 font-medium text-amber-800 hover:underline">
                    Profili tamamla <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {/* Kurum Tipi — STK profilinden, KİLİTLİ */}
            <div className="space-y-1.5">
              <Label>Kurum Tipi</Label>
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="font-medium">
                  {COMPANY_TYPES.find((t) => t.value === companyType)?.label ?? companyType}
                  {ngoName && <span className="text-muted-foreground font-normal"> · {ngoName}</span>}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3" /> Profilden
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                STK profilinizde kayıtlı kurum tipi. Değiştirmek için STK profil bilgilerini güncelleyin.
              </p>
            </div>

            {/* Kütük / Tescil No — otomatik */}
            <div className="space-y-1.5">
              <Label htmlFor="taxId">
                {companyType === 'Diğer' ? 'Vergi Numarası' : 'Kütük / Tescil Numarası'}
              </Label>
              {kutukKnown ? (
                <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  <span className="font-mono font-medium">{companyTaxId}</span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Profilden alındı
                  </span>
                </div>
              ) : (
                <>
                  <Input
                    id="taxId"
                    value={companyTaxId}
                    onChange={(e) => setCompanyTaxId(e.target.value)}
                    placeholder={COMPANY_TYPES.find((t) => t.value === companyType)?.numberPlaceholder || ''}
                  />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {COMPANY_TYPES.find((t) => t.value === companyType)?.numberHint}
                  </p>
                </>
              )}
            </div>

            {/* KEP adresi sorgusu */}
            <div className="space-y-1.5">
              <Label htmlFor="kep">KEP Adresi (Kayıtlı Elektronik Posta)</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="kep"
                    value={kepAddress}
                    onChange={(e) => { setKepAddress(e.target.value); setKepChecked(false); }}
                    placeholder="kurum@hs03.kep.tr"
                    className="pl-9"
                    autoComplete="off"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setKepChecked(true)}
                  disabled={!kepAddress.trim()}
                >
                  <Search className="h-4 w-4 mr-1.5" /> Sorgula
                </Button>
              </div>
              {kepChecked && (
                KEP_REGEX.test(kepAddress.trim()) ? (
                  <p className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Geçerli KEP formatı (.kep.tr).
                  </p>
                ) : (
                  <p className="flex items-center gap-1.5 text-[11px] text-rose-700">
                    <AlertCircle className="h-3.5 w-3.5" /> Geçersiz format — KEP adresi <span className="font-mono">@…kep.tr</span> ile biter.
                  </p>
                )
              )}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                KEP adresinizi PTT KEP rehberinden doğrulayabilirsiniz:{' '}
                <a href="https://kep.gov.tr/sorgula" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:underline inline-flex items-center gap-0.5">
                  kep.gov.tr/sorgula <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-search">İletişim Sorumlusu (Genel Yönetici)</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact-search"
                  type="tel"
                  inputMode="tel"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Genel yönetici telefon numarası — 05XX XXX XX XX"
                  className="pl-9"
                  autoComplete="off"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                İletişim sorumlusu STK'nın <strong>genel yönetici</strong> rolündeki kişisi olmalıdır.
                Telefon numarasını yazarak bulun ve seçin.
              </p>
              {userSearchLoading && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Genel yöneticiler aranıyor...
                </p>
              )}
              {(() => {
                const managers = userResults.filter((u) => u.role === 'ngo-admin');
                if (!userSearchLoading && userSearchQuery.trim() && managers.length === 0) {
                  return (
                    <p className="text-[11px] text-amber-700">
                      Bu numarayla genel yönetici bulunamadı. Kişi STK'da <strong>genel yönetici</strong> değilse{' '}
                      <a href="/ngo-admin/users" className="font-medium text-emerald-700 hover:underline">Yetkili Yönetimi</a>'nden
                      yönetici yapın, sonra tekrar deneyin.
                    </p>
                  );
                }
                if (managers.length === 0) return null;
                return (
                  <div className="max-h-48 overflow-y-auto rounded-md border bg-background divide-y">
                    {managers.map((u) => {
                      const selected = contactUid === u.uid;
                      return (
                        <button
                          key={u.uid}
                          type="button"
                          onClick={() => {
                            setContactUid(u.uid);
                            setContactPerson(u.name);
                            setContactPhone(u.phone);
                            // Yeni kişi seçilince telefon doğrulamasını sıfırla
                            setContactPhoneVerified(false);
                            setOtpSent(false);
                            setOtpCode('');
                            setOtpError('');
                            setOtpMasked('');
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 hover:bg-muted/40 transition-colors',
                            selected && 'bg-emerald-50/40 border-l-2 border-emerald-500',
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">{u.name}</p>
                            <Badge variant="outline" className="text-[9px] shrink-0 bg-emerald-50 text-emerald-700 border-emerald-300">Genel Yönetici</Badge>
                            {selected && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {u.phone || 'telefon kayıtlı değil'} {u.email && `· ${u.email}`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
              {contactUid && (
                <div className="rounded-md bg-emerald-50/50 border border-emerald-200 p-3 text-xs space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">Seçili: {contactPerson}</p>
                      {contactPhone && <p className="text-muted-foreground">📞 {contactPhone}</p>}
                    </div>
                    {contactPhoneVerified && (
                      <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Telefon doğrulandı
                      </Badge>
                    )}
                  </div>

                  {/* Telefonla yetkilendirme */}
                  {!contactPhoneVerified && (
                    <div className="space-y-2 border-t border-emerald-200 pt-2.5">
                      {!contactPhone ? (
                        <p className="flex items-center gap-1.5 text-amber-700">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Bu kişinin kayıtlı telefonu yok — yetkilendirme için telefonlu bir kullanıcı seçin.
                        </p>
                      ) : !otpSent ? (
                        <>
                          <p className="text-muted-foreground">
                            İletişim sorumlusunu yetkilendirmek için telefonuna SMS doğrulama kodu gönderilecek.
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            onClick={sendContactOtp}
                            disabled={otpSending}
                          >
                            {otpSending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Phone className="h-3.5 w-3.5 mr-1.5" />}
                            Doğrulama kodu gönder
                          </Button>
                        </>
                      ) : (
                        <>
                          <p className="text-muted-foreground">
                            {otpMasked || contactPhone} numarasına gelen 6 haneli kodu girin.
                          </p>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="● ● ● ● ● ●"
                                inputMode="numeric"
                                className="pl-9 tracking-[0.3em] font-mono"
                              />
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={verifyContactOtp}
                              disabled={otpVerifying || otpCode.trim().length !== 6}
                            >
                              {otpVerifying ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : null}
                              Doğrula
                            </Button>
                          </div>
                          <button
                            type="button"
                            onClick={sendContactOtp}
                            disabled={otpSending}
                            className="text-[11px] text-emerald-700 hover:underline disabled:opacity-50"
                          >
                            Kodu tekrar gönder
                          </button>
                        </>
                      )}
                      {otpError && <p className="text-rose-700">{otpError}</p>}
                    </div>
                  )}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Seçilen genel yönetici, sağlayıcı firma ile iletişimde STK'nın resmi temsilcisi
                olur ve telefonuyla (SMS doğrulama) yetkilendirilir.
              </p>
            </div>

            {/* Yönetim Kurulu Kararı yükleme */}
            <div className="space-y-1.5">
              <Label>Yönetim Kurulu Kararı</Label>
              <label className={cn(
                'flex items-center gap-3 rounded-md border border-dashed px-3 py-3 text-sm cursor-pointer transition hover:bg-muted/30',
                boardDecisionUrl ? 'border-emerald-300 bg-emerald-50/30' : 'border-border',
              )}>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleBoardUpload(e.target.files?.[0])}
                  disabled={boardUploading}
                />
                {boardUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" />
                ) : boardDecisionUrl ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <Gavel className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className="min-w-0 flex-1">
                  {boardDecisionUrl ? (
                    <span className="text-emerald-700 font-medium">Yüklendi — değiştirmek için tıklayın</span>
                  ) : (
                    <>Çağrı merkezi hizmeti için yönetim kurulu kararı fotoğrafı/PDF — <span className="text-muted-foreground">yüklemek için tıklayın</span></>
                  )}
                </span>
                {boardDecisionUrl && (
                  <a href={boardDecisionUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </label>
            </div>

            {/* İmza Sirküsü yükleme */}
            <div className="space-y-1.5">
              <Label>İmza Sirküleri (İletişim Sorumlusu)</Label>
              <label className={cn(
                'flex items-center gap-3 rounded-md border border-dashed px-3 py-3 text-sm cursor-pointer transition hover:bg-muted/30',
                signatureUrl ? 'border-emerald-300 bg-emerald-50/30' : 'border-border',
              )}>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={(e) => handleSignatureUpload(e.target.files?.[0])}
                  disabled={signatureUploading}
                />
                {signatureUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground shrink-0" />
                ) : signatureUrl ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                ) : (
                  <FileSignature className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <span className="min-w-0 flex-1">
                  {signatureUrl ? (
                    <span className="text-emerald-700 font-medium">Yüklendi — değiştirmek için tıklayın</span>
                  ) : (
                    <>İletişim sorumlusunun imza yetkisini gösteren imza sirküleri — <span className="text-muted-foreground">yüklemek için tıklayın</span></>
                  )}
                </span>
                {signatureUrl && (
                  <a href={signatureUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-foreground shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </label>
            </div>
            <div className="space-y-2">
              <Label>Belgeler</Label>
              {docsLoading ? (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> STK belgeleri yükleniyor...
                </p>
              ) : archivedDocs.length === 0 ? (
                <div className="rounded-md border border-dashed bg-muted/20 p-3 text-xs space-y-1.5">
                  <p className="font-medium">Bu STK için henüz belge arşivinde kayıt yok.</p>
                  <p className="text-muted-foreground">
                    Tüzük, faaliyet belgesi ve vergi levhasını STK Yönetim → Belge Arşivi
                    bölümünden yükleyebilirsiniz. Yüklenen belgeler 6 ay boyunca tüm
                    başvurularda yeniden istenmez.
                  </p>
                  <Input
                    value={documentLabels}
                    onChange={(e) => setDocumentLabels(e.target.value)}
                    placeholder="Geçici: dosya etiketleri (virgülle ayır)"
                    className="mt-2"
                  />
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-muted-foreground">
                    Arşivdeki belgeler — son 6 ay içinde yüklenenler geçerli sayılır.
                    Bayatlamış belgeleri güncellediğinizde tüm başvurularınızda otomatik tazelenir.
                  </p>
                  <div className="space-y-2">
                    {archivedDocs.map((d) => {
                      const fresh = d.isFresh;
                      const days = Math.abs(d.daysUntilExpiry);
                      return (
                        <div
                          key={d.id}
                          className={cn(
                            'flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs',
                            fresh ? 'border-emerald-200 bg-emerald-50/30' : 'border-amber-300 bg-amber-50/40',
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold truncate">{d.docType}</p>
                            <p className="text-muted-foreground truncate">
                              {d.uploadedAt
                                ? `Yüklendi: ${new Date(d.uploadedAt).toLocaleDateString('tr-TR')}`
                                : 'Yükleme tarihi bilinmiyor'}
                              {d.year && ` · ${d.year}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {fresh ? (
                              <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 text-[9px]">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Geçerli · {days} gün kaldı
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-[9px]">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {days} gün önce · güncelle
                              </Badge>
                            )}
                            {d.fileUrl && (
                              <a
                                href={d.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground"
                                title="Belgeyi aç"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <a
                    href="/ngo-admin/transparency"
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:underline mt-1"
                  >
                    <RefreshCw className="h-3 w-3" /> Belge Arşivi'nde güncelle
                  </a>
                </>
              )}
            </div>

            {/* Çağrı Merkezi Hizmet Protokolü */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Çağrı Merkezi Hizmet Protokolü</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap leading-relaxed">
                {SERVICE_PROTOCOL_MARKDOWN.trim()}
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <Checkbox
                  checked={serviceProtocolAccepted}
                  onCheckedChange={(v) => setServiceProtocolAccepted(v === true)}
                  aria-label="Hizmet protokolü onayı"
                />
                <span>
                  Çağrı Merkezi Hizmet Protokolü'nü okudum ve kabul ediyorum. hangel'in 3. parti
                  yazılım sağlayıcı rolünü, hattın STK'ya ait olduğunu kabul ederim.
                </span>
              </label>
            </div>

            {/* KVKK Aydınlatma & Açık Rıza + Veri İşleyen Sözleşmesi (DPA) */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-emerald-600" /> KVKK Aydınlatma, Açık Rıza ve Veri İşleyen Sözleşmesi</Label>
              <details className="rounded-md border bg-muted/30 text-xs">
                <summary className="cursor-pointer select-none px-3 py-2 font-medium">Veri İşleyen Sözleşmesi (DPA) — tam metni gör</summary>
                <div className="max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed px-3 pb-3 border-t">
                  {DPA_MARKDOWN.trim()}
                </div>
              </details>
              <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                <Checkbox
                  checked={kvkkConsentAccepted}
                  onCheckedChange={(v) => setKvkkConsentAccepted(v === true)}
                  aria-label="KVKK ve DPA onayı"
                />
                <span>
                  6698 sayılı KVKK kapsamında, çağrı merkezi üzerinden işlenen kişisel verilerin
                  STK (Veri Sorumlusu) talimatıyla işlendiğini, aradığım kişilere görüşmenin kayıt
                  altına alındığını duyurma yükümlülüğümü kabul ediyorum. Yukarıdaki <strong>Veri İşleyen
                  Sözleşmesi'ni (DPA)</strong> okudum; STK olarak Veri Sorumlusu sıfatımı, hangel'in
                  Veri İşleyen sıfatını kabul ediyorum.
                </span>
              </label>
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
