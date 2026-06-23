'use client';

/**
 * MessagingSetupWizard — STK yöneticisi için toplu SMS + toplu mail kurulum
 * sihirbazı. Santral (call-center) OnboardingWizard deseninin SMS/mail karşılığı.
 *
 * Adımlar:
 *   1) Kontör / Paket  — kısa açıklama + "Paketleri Gör" yönlendirmesi
 *   2) Belgeler        — KVKK, İYS, gönderici başlığı dilekçesi yükleme
 *   3) SMS Gönderici Başlığı — max 11 karakter alfanümerik
 *   4) Mail Gönderen   — gönderen adı + e-posta + alan adı (SPF/DKIM/DMARC notu)
 *   Son) Özet → Sağlayıcıya gönder (action: 'submit' → status 'pending')
 *
 * Durum `ngoMessagingWallets/{ngoId}.setup` içinde tutulur (GET/POST /api/ngo-admin/messaging/setup).
 */

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  CheckCircle2,
  FileText,
  Wallet,
  MessageSquare,
  Mail,
  Send,
  Upload,
  ExternalLink,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { cn } from '@/lib/utils';

type SetupStatus = 'not_started' | 'pending' | 'active';

interface SetupState {
  status: SetupStatus;
  smsSenderId: string | null;
  mailFromName: string | null;
  mailFromEmail: string | null;
  mailDomain: string | null;
  docsKvkk: string | boolean | null;
  docsIys: string | boolean | null;
  docsDilekce: string | boolean | null;
}

const HANGEL_ORANGE = '#f34723';

const STEPS = [
  { key: 'package', label: 'Kontör', icon: Wallet },
  { key: 'documents', label: 'Belgeler', icon: FileText },
  { key: 'sms', label: 'SMS Başlığı', icon: MessageSquare },
  { key: 'mail', label: 'Mail Gönderen', icon: Mail },
  { key: 'submit', label: 'Gönder', icon: Send },
] as const;

type DocKey = 'docsKvkk' | 'docsIys' | 'docsDilekce';
const DOC_FIELDS: Array<{ key: DocKey; title: string; description: string }> = [
  { key: 'docsKvkk', title: 'KVKK Aydınlatma Metni', description: 'Kişisel verilerin işlenmesine dair aydınlatma metni.' },
  { key: 'docsIys', title: 'İYS İzin Kaydı', description: 'İleti Yönetim Sistemi (İYS) ticari ileti izin belgesi.' },
  { key: 'docsDilekce', title: 'Gönderici Başlığı Dilekçesi', description: 'Operatör onayı için gönderici başlığı (Sender ID) başvuru dilekçesi.' },
];

function docDone(v: string | boolean | null | undefined): boolean {
  return v === true || (typeof v === 'string' && v.length > 0);
}

interface Props {
  ngoId: string;
  initialSetup: SetupState;
}

export function MessagingSetupWizard({ ngoId, initialSetup }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser } = useUser();
  const { kind } = useActiveEntity();

  const [stepIdx, setStepIdx] = useState(0);
  const [setup, setSetup] = useState<SetupState>(initialSetup);
  const [smsSenderId, setSmsSenderId] = useState(initialSetup.smsSenderId ?? '');
  const [mailFromName, setMailFromName] = useState(initialSetup.mailFromName ?? '');
  const [mailFromEmail, setMailFromEmail] = useState(initialSetup.mailFromEmail ?? '');
  const [mailDomain, setMailDomain] = useState(initialSetup.mailDomain ?? '');
  const [uploadingKey, setUploadingKey] = useState<DocKey | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

  // Sağlayıcı kurulumu tamamlayınca (status 'active') paneller açılır.
  useEffect(() => {
    if (setup.status === 'active') {
      router.replace('/ngo-admin/sms');
    }
  }, [setup.status, router]);

  async function postSetup(payload: Record<string, unknown>): Promise<SetupState | null> {
    const token = await authUser?.getIdToken();
    if (!token) {
      toast({ variant: 'destructive', title: 'Oturum bulunamadı' });
      return null;
    }
    const res = await fetch('/api/ngo-admin/messaging/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      toast({
        variant: 'destructive',
        title: 'İşlem başarısız',
        description: typeof data?.message === 'string' ? data.message : undefined,
      });
      return null;
    }
    if (data?.setup) setSetup(data.setup as SetupState);
    return (data?.setup as SetupState) ?? null;
  }

  async function handleDocUpload(file: File, docKey: DocKey, title: string) {
    if (!ngoId || !kind) {
      toast({ variant: 'destructive', title: 'Aktif kurum bulunamadı' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'En fazla 10 MB.' });
      return;
    }
    setUploadingKey(docKey);
    try {
      const storage = getStorage();
      const folder = kind === 'ngo' ? 'ngos' : kind === 'brand' ? 'brands' : 'clubs';
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${folder}/${ngoId}/messaging-setup-${docKey}-${Date.now()}-${safe}`;
      const r = storageRef(storage, path);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);

      const token = await authUser?.getIdToken();
      if (token) {
        // Belge arşivine de kaydet (messaging-packages deseni).
        await fetch('/api/ngo/archive', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ docType: title, fileUrl: url, entityType: kind, entityId: ngoId, entityName: '' }),
        });
      }
      await postSetup({ [docKey]: url });
      toast({ title: 'Belge yüklendi', description: title });
    } catch {
      toast({ variant: 'destructive', title: 'Yükleme başarısız', description: 'Lütfen tekrar deneyin.' });
    } finally {
      setUploadingKey(null);
    }
  }

  async function handleSaveSms() {
    const saved = await postSetup({ smsSenderId: smsSenderId.trim() });
    return !!saved;
  }

  async function handleSaveMail() {
    const saved = await postSetup({
      mailFromName: mailFromName.trim(),
      mailFromEmail: mailFromEmail.trim(),
      mailDomain: mailDomain.trim(),
    });
    return !!saved;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const saved = await postSetup({
        action: 'submit',
        smsSenderId: smsSenderId.trim(),
        mailFromName: mailFromName.trim(),
        mailFromEmail: mailFromEmail.trim(),
        mailDomain: mailDomain.trim(),
      });
      if (saved?.status === 'pending') {
        toast({ title: 'Kurulum talebiniz alındı', description: 'Sağlayıcıya iletildi. Aktivasyon bekleniyor.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const senderIdValid = /^[A-Za-z0-9]{1,11}$/.test(smsSenderId.trim());
  const mailValid =
    mailFromName.trim().length > 0 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mailFromEmail.trim()) &&
    /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(mailDomain.trim());

  function canAdvance(): boolean {
    if (stepIdx === 0) return true;
    if (stepIdx === 1) return true; // belgeler opsiyonel; submit'te zorunlu değil
    if (stepIdx === 2) return senderIdValid;
    if (stepIdx === 3) return mailValid;
    return true;
  }

  async function next() {
    // Adımda girilen değerleri ilerlemeden önce kaydet.
    if (stepIdx === 2) {
      const ok = await handleSaveSms();
      if (!ok) return;
    }
    if (stepIdx === 3) {
      const ok = await handleSaveMail();
      if (!ok) return;
    }
    if (stepIdx < STEPS.length - 1) setStepIdx(stepIdx + 1);
  }
  function back() {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  }

  // Pending durumu → bekleme ekranı (santral pending deseni).
  if (setup.status === 'pending') {
    return (
      <Card className="border-amber-300 bg-amber-50/40">
        <CardHeader className="flex flex-row items-center gap-2">
          <Clock className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-base">Kurulum onayı bekleniyor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            Kurulum talebiniz alındı ve sağlayıcıya iletildi. Aktivasyon sağlayıcı tarafından
            yapılıyor; tamamlandığında SMS ve mail panellerini kullanmaya başlayabilirsiniz.
          </p>
          <ul className="text-muted-foreground text-xs space-y-1 list-disc ml-5">
            <li>SMS gönderici başlığı: {setup.smsSenderId ?? '—'}</li>
            <li>Mail gönderen: {setup.mailFromEmail ?? '—'}</li>
            <li>Alan adı: {setup.mailDomain ?? '—'}</li>
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kurulum Adımları</CardTitle>
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
                style={active ? { backgroundColor: HANGEL_ORANGE, color: '#fff', borderColor: HANGEL_ORANGE } : undefined}
              >
                <Icon className="h-3 w-3" /> {i + 1}. {s.label}
              </Badge>
            );
          })}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adım 1 — Kontör / Paket */}
        {stepIdx === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Toplu SMS ve mail göndermek için kontör (paket) gerekir. Paketleri inceleyip
              satın alabilir, ardından bu sihirbazla kurulumu tamamlayabilirsiniz.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/ngo-admin/messaging-packages')}
              className="gap-2"
            >
              <Wallet className="h-4 w-4" /> Paketleri Gör
            </Button>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Kontör satın alımı ayrı bir sayfada yapılır. Kontör olmadan da kuruluma devam
              edebilirsiniz; gönderim için kontör gerekir.
            </p>
          </div>
        )}

        {/* Adım 2 — Belgeler */}
        {stepIdx === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Toplu gönderim için aşağıdaki belgeleri yükleyin. Belgeler kurum arşivinize de kaydedilir.
            </p>
            {DOC_FIELDS.map((d) => {
              const done = docDone(setup[d.key]);
              const url = typeof setup[d.key] === 'string' ? (setup[d.key] as string) : null;
              return (
                <div key={d.key} className="flex items-center gap-3 p-3 rounded-xl border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold flex items-center gap-2">
                      {d.title}
                      {done && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{d.description}</p>
                  </div>
                  {url && (
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0" title="Belgeyi aç">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <input
                    ref={(el) => { fileInputs.current[d.key] = el; }}
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleDocUpload(f, d.key, d.title);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => fileInputs.current[d.key]?.click()}
                    disabled={uploadingKey !== null}
                  >
                    {uploadingKey === d.key ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {done ? 'Değiştir' : 'Yükle'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Adım 3 — SMS Gönderici Başlığı */}
        {stepIdx === 2 && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="smsSenderId">SMS Gönderici Başlığı (Sender ID)</Label>
              <Input
                id="smsSenderId"
                value={smsSenderId}
                onChange={(e) => setSmsSenderId(e.target.value)}
                placeholder="HANGEL"
                maxLength={11}
                autoComplete="off"
              />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                En fazla 11 karakter, yalnızca harf ve rakam, boşluk yok. Operatör onayı gerekir;
                başvuru sağlayıcı tarafından yapılır.
              </p>
              {smsSenderId.trim() && !senderIdValid && (
                <p className="text-[11px] text-destructive flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" /> Başlık en fazla 11 karakter, alfanümerik ve boşluksuz olmalı.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Adım 4 — Mail Gönderen */}
        {stepIdx === 3 && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="mailFromName">Gönderen Adı</Label>
              <Input id="mailFromName" value={mailFromName} onChange={(e) => setMailFromName(e.target.value)} placeholder="hangel" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mailFromEmail">Gönderen E-posta</Label>
              <Input id="mailFromEmail" type="email" value={mailFromEmail} onChange={(e) => setMailFromEmail(e.target.value)} placeholder="bilgi@kurumunuz.org" autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mailDomain">Alan Adı (Domain)</Label>
              <Input id="mailDomain" value={mailDomain} onChange={(e) => setMailDomain(e.target.value)} placeholder="kurumunuz.org" autoComplete="off" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Mailleriniz spam'e düşmeden ulaşsın diye alan adınıza SPF, DKIM ve DMARC kayıtları
                eklenmelidir. Sağlayıcı, kurulum sırasında gereken DNS kayıtlarını sizinle paylaşır.
              </p>
            </div>
          </div>
        )}

        {/* Son — Özet + Gönder */}
        {stepIdx === 4 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Bilgileri kontrol edin ve kurulumu sağlayıcıya gönderin. Gönderdikten sonra aktivasyon
              sağlayıcı tarafından yapılır.
            </p>
            <div className="rounded-xl border divide-y text-sm">
              <div className="flex justify-between gap-3 p-3">
                <span className="text-muted-foreground">SMS gönderici başlığı</span>
                <span className="font-semibold">{smsSenderId.trim() || '—'}</span>
              </div>
              <div className="flex justify-between gap-3 p-3">
                <span className="text-muted-foreground">Mail gönderen adı</span>
                <span className="font-semibold">{mailFromName.trim() || '—'}</span>
              </div>
              <div className="flex justify-between gap-3 p-3">
                <span className="text-muted-foreground shrink-0">Mail gönderen e-posta</span>
                <span className="font-semibold break-all text-right">{mailFromEmail.trim() || '—'}</span>
              </div>
              <div className="flex justify-between gap-3 p-3">
                <span className="text-muted-foreground shrink-0">Alan adı</span>
                <span className="font-semibold break-all text-right">{mailDomain.trim() || '—'}</span>
              </div>
              <div className="flex justify-between gap-3 p-3">
                <span className="text-muted-foreground">Belgeler</span>
                <span className="font-semibold">
                  {[setup.docsKvkk, setup.docsIys, setup.docsDilekce].filter(docDone).length}/3 yüklendi
                </span>
              </div>
            </div>
            {(!senderIdValid || !mailValid) && (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-300 bg-amber-50/60 text-amber-800 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>SMS başlığı ve mail gönderen bilgilerini eksiksiz girin. Eksik adımlara geri dönün.</span>
              </div>
            )}
            <Button
              className="w-full text-white"
              style={{ backgroundColor: HANGEL_ORANGE }}
              onClick={handleSubmit}
              disabled={submitting || !senderIdValid || !mailValid}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Kurulumu Tamamla ve Sağlayıcıya Gönder
            </Button>
          </div>
        )}

        {stepIdx < STEPS.length - 1 && (
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={back} disabled={stepIdx === 0}>
              Geri
            </Button>
            <Button
              onClick={next}
              disabled={!canAdvance()}
              className="text-white"
              style={{ backgroundColor: HANGEL_ORANGE }}
            >
              Devam
            </Button>
          </div>
        )}
        {stepIdx === STEPS.length - 1 && (
          <div className="flex justify-start pt-2">
            <Button variant="outline" onClick={back} disabled={submitting}>
              Geri
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
