'use client';

/**
 * Sertifikalarımız — aktif kurumun OTOMATİK ETKİ SERTİFİKASI + verdiği sertifikalar.
 *
 * Ana odak: her kurum (STK/marka/öğrenci kulübü) KENDİ faaliyetinden otomatik
 * etki sertifikası kazanır. Süper-admin elle vermez. İki tür:
 *   - Toplam Etki: tüm zamanların birikimli metrikleri (üstte büyük kart).
 *   - Aylık: her ay için ayrı sertifika (altında liste).
 * Metrikler GET /api/ngo-admin/impact-certificate'ten gelir; PDF client'ta
 * generateOrgImpactCertificate ile üretilir (iOS-güvenli SVG→canvas→jsPDF).
 *
 * İkinci sekme "Verdiğimiz": kurumun etkinlik/akışlardan KİŞİLERE verdiği
 * sertifikalar (GET /api/ngo-admin/certificates → issued). Korunur.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award, FileText, Loader2, ShieldCheck, Calendar, Download, Eye,
  Clock, Users, HeartHandshake, HandCoins, Sparkles, X,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { useToast } from '@/hooks/use-toast';
import { isNativeApp } from '@/lib/capacitor';
import { generateOrgImpactCertificate, type OrgImpactMetrics } from '@/lib/org-impact-certificate';
import { buildCertCode } from '@/lib/certificate-code';

// ---- Etki sertifikası tipleri (API ile aynı şekil) ----
interface ImpactMonth extends OrgImpactMetrics {
  ym: string;
  label: string;
}
interface ImpactResponse {
  ok?: boolean;
  orgName?: string;
  cumulative?: OrgImpactMetrics;
  months?: ImpactMonth[];
  logoUrl?: string;
  message?: string;
}

// ---- Kişilere verilen sertifika satırı (mevcut /certificates issued listesi) ----
interface CertRow {
  id: string;
  title?: string;
  eventName?: string;
  code?: string;
  date?: string;
  ngoName?: string;
  description?: string;
}

const TRY = (n: number) => Math.round(Number.isFinite(n) ? n : 0).toLocaleString('tr-TR');
const HRS = (n: number) => (Math.round((Number.isFinite(n) ? n : 0) * 10) / 10).toLocaleString('tr-TR');
const CNT = (n: number) => Math.round(Number.isFinite(n) ? n : 0).toLocaleString('tr-TR');

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(((reader.result as string) || '').split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function slugifyFileName(orgName: string, periodLabel: string): string {
  const base = `${orgName}-${periodLabel}-etki-sertifikasi`
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `${base || 'etki-sertifikasi'}.pdf`;
}

// Aylık kart için sertifika kodu — kararlı (ay + kurum türevli), kartta "Doğrula" linki için.
function monthCertCode(kind: 'ngo' | 'brand' | 'club', orgName: string, ym: string): string {
  const digits = ym.replace(/[^0-9]/g, '');
  const year = Number(ym.slice(0, 4)) || new Date().getFullYear();
  const activityNo = digits.length >= 4 ? Number(digits.slice(-5)) || 0 : 0;
  return buildCertCode({ kind, country: '90', year, activityNo, personNo: 1, idSeed: `${orgName}-${ym}` });
}
function totalCertCode(kind: 'ngo' | 'brand' | 'club', orgName: string): string {
  return buildCertCode({ kind, country: '90', year: new Date().getFullYear(), activityNo: 0, personNo: 1, idSeed: `${orgName}-toplam` });
}

// ---- Metrik özet satırı (kart içinde) ----
function MetricRow({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-7 w-7 shrink-0 rounded-lg bg-[#f34723]/10 flex items-center justify-center text-[#f34723]">{icon}</div>
      <div className="min-w-0">
        <span className="font-bold text-sm text-foreground">{value}</span>{' '}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

function MetricGrid({ m }: { m: OrgImpactMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
      <MetricRow icon={<Clock className="h-4 w-4" />} value={`${HRS(m.volunteerHours)}`} label="saat gönüllülük" />
      <MetricRow icon={<Calendar className="h-4 w-4" />} value={`${HRS(m.eventHours)}`} label="saat etkinlik" />
      <MetricRow icon={<HeartHandshake className="h-4 w-4" />} value={`${CNT(m.volunteerCount)}`} label="gönüllü" />
      <MetricRow icon={<Users className="h-4 w-4" />} value={`${CNT(m.participantCount)}`} label="katılımcı" />
      <MetricRow icon={<HandCoins className="h-4 w-4" />} value={`${TRY(m.donationTRY)} TL`} label="bağış" />
      <MetricRow icon={<Sparkles className="h-4 w-4" />} value={`${TRY(m.impactValueTRY)} TL`} label="sosyal etki" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="rounded-[2rem] border-border shadow-xl">
      <CardContent className="p-16 text-center text-muted-foreground">
        <Award className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="italic">{message}</p>
      </CardContent>
    </Card>
  );
}

export default function OrgCertificatesPage() {
  const { user } = useUser();
  const { id: orgId, kind, isLoading: entityLoading } = useActiveEntity();
  const { toast } = useToast();

  const [orgName, setOrgName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [cumulative, setCumulative] = useState<OrgImpactMetrics | null>(null);
  const [months, setMonths] = useState<ImpactMonth[]>([]);
  const [issued, setIssued] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (entityLoading) return;
    if (!user || !orgId || !kind) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const headers = { Authorization: `Bearer ${idToken}` };
        const [impactRes, certsRes] = await Promise.all([
          fetch(`/api/ngo-admin/impact-certificate?orgId=${encodeURIComponent(orgId)}&kind=${encodeURIComponent(kind)}`, { headers }),
          fetch(`/api/ngo-admin/certificates?orgId=${encodeURIComponent(orgId)}&kind=${encodeURIComponent(kind)}`, { headers }),
        ]);
        const impact = (await impactRes.json().catch(() => null)) as ImpactResponse | null;
        const certs = (await certsRes.json().catch(() => null)) as { ok?: boolean; issued?: CertRow[] } | null;
        if (cancelled) return;
        if (!impactRes.ok || !impact?.ok) {
          setError(impact?.message ?? 'Etki sertifikası yüklenemedi.');
          setCumulative(null);
          setMonths([]);
        } else {
          setOrgName(impact.orgName ?? '');
          setLogoUrl(impact.logoUrl);
          setCumulative(impact.cumulative ?? null);
          setMonths(impact.months ?? []);
        }
        setIssued(certs?.ok ? certs.issued ?? [] : []);
      } catch {
        if (!cancelled) setError('Etki sertifikası yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, orgId, kind, entityLoading]);

  const buildBlob = useCallback(
    async (metrics: OrgImpactMetrics, periodLabel: string, ym?: string, code?: string) => {
      if (!kind) throw new Error('kind yok');
      return generateOrgImpactCertificate({ orgName: orgName || 'Kurum', kind, periodLabel, metrics, ym, code, logoUrl });
    },
    [kind, orgName, logoUrl],
  );

  const handleDownload = useCallback(
    async (key: string, metrics: OrgImpactMetrics, periodLabel: string, ym?: string, code?: string) => {
      setBusyKey(key);
      try {
        const blob = await buildBlob(metrics, periodLabel, ym, code);
        const filename = slugifyFileName(orgName || 'kurum', periodLabel);
        if (isNativeApp()) {
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          const { Share } = await import('@capacitor/share');
          const base64 = await blobToBase64(blob);
          const written = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Documents });
          try {
            await Share.share({ title: `${orgName} ${periodLabel}`, url: written.uri, dialogTitle: 'Sertifikayı kaydet veya paylaş' });
          } catch {
            /* paylaşım iptal edildi — dosya zaten kaydedildi */
          }
          toast({ title: 'Sertifika kaydedildi', description: `${filename} cihazına indirildi.` });
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => { try { URL.revokeObjectURL(url); } catch { /* ignore */ } }, 1500);
        toast({ title: 'Sertifika indirildi', description: `${periodLabel} etki sertifikası indirildi.` });
      } catch {
        toast({ variant: 'destructive', title: 'İndirilemedi', description: 'Sertifika PDF üretilemedi.' });
      } finally {
        setBusyKey(null);
      }
    },
    [buildBlob, orgName, toast],
  );

  const handleView = useCallback(
    async (key: string, metrics: OrgImpactMetrics, periodLabel: string, ym?: string, code?: string) => {
      setBusyKey(key);
      try {
        const blob = await buildBlob(metrics, periodLabel, ym, code);
        if (isNativeApp()) {
          const { Filesystem, Directory } = await import('@capacitor/filesystem');
          const { Browser } = await import('@capacitor/browser');
          const filename = slugifyFileName(orgName || 'kurum', periodLabel);
          const base64 = await blobToBase64(blob);
          const written = await Filesystem.writeFile({ path: filename, data: base64, directory: Directory.Cache });
          await Browser.open({ url: written.uri });
          return;
        }
        const url = URL.createObjectURL(blob);
        setPreview((prev) => {
          if (prev?.url) { try { URL.revokeObjectURL(prev.url); } catch { /* ignore */ } }
          return { url, title: `${orgName} — ${periodLabel}` };
        });
      } catch {
        toast({ variant: 'destructive', title: 'Açılamadı', description: 'Sertifika PDF üretilemedi.' });
      } finally {
        setBusyKey(null);
      }
    },
    [buildBlob, orgName, toast],
  );

  const closePreview = useCallback(() => {
    setPreview((prev) => {
      if (prev?.url) { try { URL.revokeObjectURL(prev.url); } catch { /* ignore */ } }
      return null;
    });
  }, []);

  if (entityLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Sertifikalar Yükleniyor...</p>
      </div>
    );
  }

  const totalCode = kind ? totalCertCode(kind, orgName) : '';

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter text-foreground flex items-center gap-2">
          <Award className="h-7 w-7 text-[#f34723]" /> Sertifikalarımız
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Kurumunuzun kendi faaliyetinden otomatik kazandığı etki sertifikaları ve kurumunuzun gönüllülere/katılımcılara verdiği sertifikalar.
        </p>
      </div>

      {error && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm font-medium text-destructive">{error}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="impact" className="w-full">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="impact" className="rounded-xl font-bold">
            Etki Sertifikamız
          </TabsTrigger>
          <TabsTrigger value="issued" className="rounded-xl font-bold">
            Verdiğimiz ({issued.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="impact" className="mt-4 space-y-6">
          {/* TOPLAM ETKİ — büyük vurgulu kart */}
          {cumulative && (
            <Card className="rounded-[2rem] border-[#f34723]/15 shadow-xl overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-[#f34723] to-[#c5391b]" />
              <CardContent className="p-6 sm:p-8 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-[0.2em] text-[#f34723] uppercase">Kurum Etki Sertifikası</p>
                    <h2 className="text-2xl font-black tracking-tight text-foreground truncate mt-0.5">{orgName || 'Kurumunuz'}</h2>
                    <span className="inline-flex items-center gap-1.5 mt-2 rounded-full bg-[#f34723]/10 px-3 py-1 text-xs font-bold text-[#c5391b]">
                      <Sparkles className="h-3.5 w-3.5" /> Toplam Etki
                    </span>
                  </div>
                  <Award className="h-10 w-10 text-[#f34723]/30 shrink-0" />
                </div>

                <MetricGrid m={cumulative} />

                <div className="rounded-2xl bg-[#f34723]/5 border border-[#f34723]/10 p-4">
                  <p className="text-sm font-bold text-[#c5391b] leading-snug">
                    Toplamda {TRY(cumulative.totalSocialValueTRY)} TL sosyal fayda mali değeri üretilmiştir.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => handleView('total', cumulative, 'Toplam Etki', undefined, totalCode)}
                    disabled={busyKey === 'total'}
                    className="rounded-xl font-bold bg-[#f34723] hover:bg-[#d83e1f]"
                  >
                    {busyKey === 'total' ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Eye className="h-4 w-4 mr-1.5" />} Görüntüle
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleDownload('total', cumulative, 'Toplam Etki', undefined, totalCode)}
                    disabled={busyKey === 'total'}
                    className="rounded-xl font-bold"
                  >
                    <Download className="h-4 w-4 mr-1.5" /> İndir
                  </Button>
                  {totalCode && (
                    <Link
                      href={`/c/${encodeURIComponent(totalCode)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#f34723] hover:underline ml-1"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" /> Doğrula
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AYLIK SERTİFİKALAR */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Aylık Etki Sertifikaları
            </h3>
            {months.length === 0 ? (
              <EmptyState message="Henüz aylık etki verisi yok. Kurumunuz faaliyet yürüttükçe her ay için otomatik sertifika oluşur." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {months.map((m) => {
                  const code = kind ? monthCertCode(kind, orgName, m.ym) : '';
                  return (
                    <Card key={m.ym} className="rounded-2xl border-border shadow-sm overflow-hidden">
                      <CardContent className="p-5 space-y-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-base text-foreground">{m.label}</h4>
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[#f34723]/10 px-2.5 py-1 text-xs font-bold text-[#c5391b]">
                            {TRY(m.totalSocialValueTRY)} TL
                          </span>
                        </div>
                        <MetricGrid m={m} />
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleView(m.ym, m, m.label, m.ym, code)}
                            disabled={busyKey === m.ym}
                            className="rounded-xl font-bold bg-[#f34723] hover:bg-[#d83e1f] h-9"
                          >
                            {busyKey === m.ym ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />} Görüntüle
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(m.ym, m, m.label, m.ym, code)}
                            disabled={busyKey === m.ym}
                            className="rounded-xl font-bold h-9"
                          >
                            <Download className="h-3.5 w-3.5 mr-1.5" /> İndir
                          </Button>
                          {code && (
                            <Link
                              href={`/c/${encodeURIComponent(code)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#f34723] hover:underline ml-auto"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" /> Doğrula
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="issued" className="mt-4">
          {issued.length === 0 ? (
            <EmptyState message="Kurumunuz henüz kimseye sertifika vermedi." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {issued.map((c) => (
                <Card key={c.id} className="rounded-2xl border-border shadow-sm overflow-hidden">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm leading-tight">{c.title || c.eventName || 'Sertifika'}</h3>
                        {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{c.description}</p>}
                        {c.ngoName && <p className="text-[11px] text-muted-foreground mt-1 truncate">{c.ngoName}</p>}
                      </div>
                    </div>
                    {c.date && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" /> {c.date}
                      </div>
                    )}
                    {c.code && (
                      <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
                        <span className="font-mono text-xs font-bold tracking-wider truncate">{c.code}</span>
                        <Link
                          href={`/c/${encodeURIComponent(c.code)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#f34723] hover:underline shrink-0"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" /> Doğrula
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Web önizleme modalı (iframe) */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={closePreview}>
          <div className="relative w-full max-w-3xl rounded-2xl bg-card shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <p className="font-bold text-sm truncate text-foreground">{preview.title}</p>
              <button onClick={closePreview} className="rounded-lg p-1.5 hover:bg-muted" aria-label="Kapat">
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe src={preview.url} title={preview.title} className="w-full h-[70vh]" />
          </div>
        </div>
      )}
    </div>
  );
}
