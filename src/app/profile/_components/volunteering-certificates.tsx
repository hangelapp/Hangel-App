'use client';

/**
 * Gönüllülük Sertifikaları — profile/badges-certificates sekmesinin
 * gelişmiş listing'i (sertifikalar bölümünden ayrı).
 *
 * Kaynak (3 origin merge):
 *   1) users/{uid}/pastVolunteering  — review (rating + comment), description, dates
 *   2) approvedApplications          — applications where userId == uid && status == 'Onaylandı'
 *   3) users/{uid}/certificates      — manuel girilmiş yedek (NGO logo yok)
 *
 * Dedupe key: `${title}|${organization}` (my-badges + profile/page.tsx ile birebir aynı pattern).
 *
 * NGO logosu için volunteerNgos / supportedNgos bundle'larından lookup yapılır
 * (ek Firestore çağrısı yok — parent zaten okuyor). Eşleşme bulunamazsa
 * Avatar fallback (NGO ad baş harfi) gösterilir.
 *
 * A6 yaka kartı:
 *   - Önizleme: Dialog içinde canvas-rendered preview (image/jpeg)
 *   - İndir   : aynı canvas'tan download (JPG)
 *   - PDF     : jspdf (A6 landscape 148x105 mm)
 *   - Paylaş  : Web Share API → fallback clipboard
 *
 * Agent D output entegrasyonu: yaka kartı canvas/PDF renderer ileride
 * `@/lib/lanyard-card` helper'ına refactor edilirse buradan import edilebilir;
 * şimdilik dosya-içi self-contained (ek bağımlılık eklemiyoruz).
 */

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { Award, Download, Eye, FileText, Share2, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export interface NgoLite {
    id: string;
    name?: string;
    avatarUrl?: string;
    logoUrl?: string;
    files?: { logo?: string };
}

export interface PastVolunteeringDoc {
    id: string;
    title?: string;
    organization?: string;
    ngoId?: string;
    description?: string;
    dates?: { eventEnd?: string };
    completedAt?: string;
    review?: { rating?: number; comment?: string };
}

export interface ApprovedApp {
    id?: string;
    type?: string;
    status?: string;
    title?: string;
    org?: string;
    entityId?: string;
    date?: string;
}

export interface CertificateDoc {
    id?: string;
    title: string;
    organization: string;
    date: string;
}

export interface VolunteeringCertificate {
    id: string;
    title: string;
    organization: string;
    /** ISO veya kullanıcı dostu string */
    completedAt: string;
    ngoLogoUrl?: string;
    rating?: number;
    comment?: string;
}

interface Props {
    /** Kullanıcının görünen adı (sertifika içeriğinde basılır). */
    userName: string;
    /** Geçmiş gönüllülük kayıtları (review içerebilir). */
    pastVolunteering: PastVolunteeringDoc[];
    /** STK yetkilisi onayladığı başvurular (sertifika olarak sayılır). */
    approvedApplications: ApprovedApp[];
    /** Manuel girilen sertifikalar (yedek; rating/comment olmayabilir). */
    manualCertificates: CertificateDoc[];
    /** NGO logo lookup için — bundle'dan gelir. */
    volunteerNgos?: NgoLite[];
    supportedNgos?: NgoLite[];
}

function pickNgoLogo(ngo?: NgoLite): string | undefined {
    if (!ngo) return undefined;
    return ngo.avatarUrl || ngo.logoUrl || ngo.files?.logo;
}

function formatDate(value: string, locale: 'tr' | 'en'): string {
    if (!value) return '';
    try {
        const d = value.includes('T') ? parseISO(value) : new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        return format(d, 'dd MMMM yyyy', { locale: locale === 'tr' ? tr : undefined });
    } catch {
        return value;
    }
}

/**
 * A6 yaka kartı canvas renderer.
 * A6 landscape ≈ 148×105 mm. Print-quality için 300 DPI → 1748×1240 px.
 * Önizleme amacıyla 4× DPI yeterli (744×525), download için 300 DPI kullanırız.
 */
function renderLanyardCanvas(
    cert: VolunteeringCertificate,
    userName: string,
    opts: { dpi?: number } = {},
): HTMLCanvasElement | null {
    const dpi = opts.dpi ?? 300;
    const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi);
    const W = mmToPx(148);
    const H = mmToPx(105);

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Arka plan: pastel turuncudan beyaza degrade
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#fff7ed');
    bg.addColorStop(1, '#ffffff');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Yaka kartı delik (üst ortada)
    const holeR = Math.round(W * 0.018);
    ctx.fillStyle = '#e5e7eb';
    ctx.beginPath();
    ctx.arc(W / 2, holeR * 2.2, holeR, 0, Math.PI * 2);
    ctx.fill();

    // Çerçeve
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = Math.max(3, Math.round(W * 0.005));
    ctx.strokeRect(
        Math.round(W * 0.02),
        Math.round(H * 0.08),
        W - Math.round(W * 0.04),
        H - Math.round(H * 0.16),
    );

    // Brand
    ctx.fillStyle = '#ea580c';
    ctx.font = `bold ${Math.round(H * 0.07)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('hangel', W / 2, Math.round(H * 0.22));

    ctx.fillStyle = '#525252';
    ctx.font = `${Math.round(H * 0.035)}px Arial`;
    ctx.fillText('Gönüllülük Sertifikası', W / 2, Math.round(H * 0.3));

    // Sahibi
    ctx.fillStyle = '#171717';
    ctx.font = `bold ${Math.round(H * 0.075)}px Arial`;
    ctx.fillText(userName || 'Gönüllü', W / 2, Math.round(H * 0.46));

    // Başlık
    ctx.fillStyle = '#404040';
    ctx.font = `${Math.round(H * 0.04)}px Arial`;
    ctx.fillText(cert.title, W / 2, Math.round(H * 0.6));

    // Kuruluş
    ctx.fillStyle = '#737373';
    ctx.font = `${Math.round(H * 0.034)}px Arial`;
    ctx.fillText(cert.organization, W / 2, Math.round(H * 0.68));

    // Tarih
    ctx.fillStyle = '#525252';
    ctx.font = `${Math.round(H * 0.03)}px Arial`;
    if (cert.completedAt) {
        ctx.fillText(cert.completedAt, W / 2, Math.round(H * 0.78));
    }

    // Rozet alt-band
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(0, H - Math.round(H * 0.07), W, Math.round(H * 0.07));
    ctx.fillStyle = '#9a3412';
    ctx.font = `${Math.round(H * 0.028)}px Arial`;
    ctx.fillText('hangel.org', W / 2, H - Math.round(H * 0.025));

    return canvas;
}

const LanyardPreview = React.memo(function LanyardPreview({
    cert,
    userName,
}: {
    cert: VolunteeringCertificate;
    userName: string;
}) {
    const [src, setSrc] = useState<string | null>(null);
    React.useEffect(() => {
        const c = renderLanyardCanvas(cert, userName, { dpi: 96 });
        if (c) setSrc(c.toDataURL('image/jpeg', 0.9));
    }, [cert, userName]);
    if (!src) {
        return (
            <div className="aspect-[148/105] w-full rounded-lg border bg-muted animate-pulse" aria-hidden />
        );
    }
    return (
        // Önizleme — yaka kartı görseli (raster, data URL). next/image dataURL'i
        // optimize edemez, ham <img> kullanıyoruz. PDF/JPG indir 300 DPI canvas'tan.
        <img
            src={src}
            alt="Yaka kartı önizleme"
            className="aspect-[148/105] w-full rounded-lg border object-contain"
        />
    );
});

export function VolunteeringCertificates({
    userName,
    pastVolunteering,
    approvedApplications,
    manualCertificates,
    volunteerNgos = [],
    supportedNgos = [],
}: Props) {
    const { t, language } = useTranslation();
    const { toast } = useToast();
    const [previewing, setPreviewing] = useState<VolunteeringCertificate | null>(null);

    // NGO logo lookup haritası (id → logoUrl). Hem id hem isim üzerinden ara.
    const ngoLogoById = useMemo<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        for (const n of [...volunteerNgos, ...supportedNgos]) {
            const url = pickNgoLogo(n);
            if (url) map[n.id] = url;
        }
        return map;
    }, [volunteerNgos, supportedNgos]);

    const ngoLogoByName = useMemo<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        for (const n of [...volunteerNgos, ...supportedNgos]) {
            const url = pickNgoLogo(n);
            if (url && n.name) map[n.name.trim().toLowerCase()] = url;
        }
        return map;
    }, [volunteerNgos, supportedNgos]);

    const certificates = useMemo<VolunteeringCertificate[]>(() => {
        const merged: VolunteeringCertificate[] = [];
        const seen = new Set<string>();
        const addUnique = (c: VolunteeringCertificate) => {
            const key = `${c.title.trim()}|${c.organization.trim()}`.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(c);
        };

        // 1) pastVolunteering (en zengin: review + ngoId)
        for (const pv of pastVolunteering) {
            const title = pv.title || '';
            const organization = pv.organization || '';
            if (!title || !organization) continue;
            const completedRaw = pv.dates?.eventEnd || pv.completedAt || '';
            addUnique({
                id: `pv-${pv.id}`,
                title,
                organization,
                completedAt: formatDate(completedRaw, language === 'tr' ? 'tr' : 'en'),
                ngoLogoUrl: pv.ngoId
                    ? ngoLogoById[pv.ngoId]
                    : ngoLogoByName[organization.trim().toLowerCase()],
                rating: pv.review?.rating,
                comment: pv.review?.comment,
            });
        }

        // 2) Onaylı başvurular
        for (const app of approvedApplications) {
            if (app.type !== 'Gönüllülük' || app.status !== 'Onaylandı') continue;
            const title = app.title || '';
            const organization = app.org || '';
            if (!title || !organization) continue;
            addUnique({
                id: `app-${app.id ?? title}`,
                title,
                organization,
                completedAt: formatDate(app.date || '', language === 'tr' ? 'tr' : 'en'),
                ngoLogoUrl: app.entityId
                    ? ngoLogoById[app.entityId]
                    : ngoLogoByName[organization.trim().toLowerCase()],
            });
        }

        // 3) Manuel girilen sertifikalar
        for (const c of manualCertificates) {
            if (!c.title || !c.organization) continue;
            addUnique({
                id: c.id ? `manual-${c.id}` : `manual-${c.title}`,
                title: c.title,
                organization: c.organization,
                completedAt: formatDate(c.date || '', language === 'tr' ? 'tr' : 'en'),
                ngoLogoUrl: ngoLogoByName[c.organization.trim().toLowerCase()],
            });
        }

        return merged;
    }, [pastVolunteering, approvedApplications, manualCertificates, ngoLogoById, ngoLogoByName, language]);

    const handleDownloadJpg = (cert: VolunteeringCertificate) => {
        try {
            const canvas = renderLanyardCanvas(cert, userName, { dpi: 300 });
            if (!canvas) throw new Error('canvas oluşturulamadı');
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/jpeg', 0.95);
            a.download = `yaka-karti-${cert.title.replace(/\s+/g, '-').toLowerCase()}.jpg`;
            a.click();
            toast({
                title: t('profile_certificates.downloaded'),
                description: cert.title,
            });
        } catch (e) {
            console.error('Lanyard JPG generation failed:', e);
            toast({
                variant: 'destructive',
                title: t('profile_certificates.downloadFail'),
                description: t('profile_certificates.downloadFailDesc'),
            });
        }
    };

    const handleDownloadPdf = async (cert: VolunteeringCertificate) => {
        try {
            const canvas = renderLanyardCanvas(cert, userName, { dpi: 300 });
            if (!canvas) throw new Error('canvas oluşturulamadı');
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            const { default: jsPDF } = await import('jspdf');
            // A6 landscape: 148×105 mm
            const pdf = new jsPDF({ unit: 'mm', format: 'a6', orientation: 'landscape' });
            const pageW = pdf.internal.pageSize.getWidth();
            const pageH = pdf.internal.pageSize.getHeight();
            pdf.addImage(dataUrl, 'JPEG', 0, 0, pageW, pageH);
            pdf.save(`yaka-karti-${cert.title.replace(/\s+/g, '-').toLowerCase()}.pdf`);
            toast({
                title: t('profile_certificates.downloaded'),
                description: `${cert.title} (PDF)`,
            });
        } catch (e) {
            console.error('Lanyard PDF generation failed:', e);
            toast({
                variant: 'destructive',
                title: t('profile_certificates.downloadFail'),
                description: t('profile_certificates.downloadFailDesc'),
            });
        }
    };

    const handleShare = async (cert: VolunteeringCertificate) => {
        const shareText = `${cert.title} — ${cert.organization}${cert.completedAt ? ` (${cert.completedAt})` : ''}`;
        const url = typeof window !== 'undefined' ? window.location.href : '';
        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({
                    title: cert.title,
                    text: `${shareText} — hangel`,
                    url,
                });
                return;
            }
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(`${shareText} ${url}`);
                toast({
                    title: t('profile_certificates.copied'),
                    description: t('profile_certificates.copiedDesc'),
                });
                return;
            }
            toast({
                title: t('profile_certificates.shareTitle'),
                description: t('profile_certificates.shareUnsupported'),
            });
        } catch {
            /* user cancelled */
        }
    };

    return (
        <Card variant="glass">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                    {t('profile_certificates.sectionTitle')}
                </CardTitle>
                {certificates.length > 0 && (
                    <Badge variant="secondary" className="rounded-full">
                        {certificates.length}
                    </Badge>
                )}
            </CardHeader>
            <CardContent>
                {certificates.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title={t('profile_certificates.emptyTitle')}
                        description={t('profile_certificates.emptyDesc')}
                    />
                ) : (
                    <div className="space-y-3">
                        {certificates.map((cert) => (
                            <article
                                key={cert.id}
                                className="rounded-2xl border bg-card/40 p-4 space-y-3"
                            >
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-12 w-12 shrink-0">
                                        <AvatarImage
                                            src={cert.ngoLogoUrl}
                                            alt={cert.organization}
                                        />
                                        <AvatarFallback className="text-sm font-bold">
                                            {(cert.organization || '?').charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-muted-foreground truncate">
                                            {cert.organization}
                                        </p>
                                        <h3 className="font-semibold leading-snug">
                                            {cert.title}
                                        </h3>
                                        {cert.completedAt && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {t('profile_certificates.completedOn')}{' '}
                                                {cert.completedAt}
                                            </p>
                                        )}
                                    </div>
                                    <Award
                                        className="h-5 w-5 text-amber-500 shrink-0"
                                        aria-hidden
                                    />
                                </div>

                                {typeof cert.rating === 'number' && (
                                    <div
                                        className="flex items-center gap-1"
                                        aria-label={`${cert.rating}/5`}
                                    >
                                        {[0, 1, 2, 3, 4].map((i) => (
                                            <Star
                                                key={i}
                                                className={cn(
                                                    'h-4 w-4',
                                                    i < (cert.rating ?? 0)
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-muted-foreground/30',
                                                )}
                                            />
                                        ))}
                                        <span className="ml-1.5 text-xs font-medium text-muted-foreground">
                                            {cert.rating}/5
                                        </span>
                                    </div>
                                )}

                                {cert.comment && (
                                    <blockquote className="text-sm italic text-muted-foreground border-l-2 border-primary/30 pl-3">
                                        “{cert.comment}”
                                    </blockquote>
                                )}

                                <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setPreviewing(cert)}
                                    >
                                        <Eye className="mr-1.5 h-4 w-4" />
                                        {t('profile_certificates.previewBtn')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDownloadJpg(cert)}
                                    >
                                        <Download className="mr-1.5 h-4 w-4" />
                                        {t('profile_certificates.downloadBtn')}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => handleShare(cert)}
                                    >
                                        <Share2 className="mr-1.5 h-4 w-4" />
                                        {t('profile_certificates.shareBtn')}
                                    </Button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </CardContent>

            <Dialog
                open={!!previewing}
                onOpenChange={(open) => {
                    if (!open) setPreviewing(null);
                }}
            >
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{t('profile_certificates.previewTitle')}</DialogTitle>
                        <DialogDescription>
                            {previewing
                                ? `${previewing.organization} — ${previewing.title}`
                                : ''}
                        </DialogDescription>
                    </DialogHeader>
                    {previewing && (
                        <LanyardPreview cert={previewing} userName={userName} />
                    )}
                    <DialogFooter className="gap-2 sm:gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setPreviewing(null)}
                        >
                            {t('profile_certificates.close')}
                        </Button>
                        {previewing && (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => handleDownloadJpg(previewing)}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    JPG
                                </Button>
                                <Button onClick={() => handleDownloadPdf(previewing)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    PDF
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
