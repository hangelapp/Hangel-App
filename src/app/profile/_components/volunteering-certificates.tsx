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
import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, useCollection, useUser } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { generateCertificateHtml } from '@/lib/certificates/generate';
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
    /** Eski şema (manuel kayıt): title/organization. */
    title?: string;
    organization?: string;
    /** Yeni şema (volunteerCompletions onayı → pastVolunteering): volunteeringTitle/ngoName. */
    volunteeringTitle?: string;
    ngoName?: string;
    ngoId?: string;
    description?: string;
    dates?: { eventEnd?: string };
    /** ISO string (eski) veya Firestore Timestamp ({ seconds }) olabilir. */
    completedAt?: string | { seconds: number } | null;
    completionId?: string;
    hoursLogged?: number;
    impactValueTRY?: number;
    review?: { rating?: number; comment?: string };
}

/** Onaylı gönüllü tamamlama kaydı (volunteerCompletions koleksiyonu). */
export interface VolunteerCompletionDoc {
    id: string;
    userId?: string;
    taskId?: string;
    ngoId?: string;
    professionLabel?: string;
    hoursLogged?: number;
    adjustedHours?: number;
    impactValueTRY?: number;
    ngoApproved?: boolean;
    status?: string;
    completedAt?: string | { seconds: number } | null;
    approvedAt?: string | { seconds: number } | null;
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
    /** Sertifika gövdesi için ham tarih (Date'e çevrilebilir). */
    completedAtRaw?: string;
    /** Onaylı tamamlamadan gelen gerçek değerler (sertifikaya basılır). */
    hoursLogged?: number;
    impactValueTRY?: number;
    professionLabel?: string;
    /** Sertifika numarası (volunteerCompletions doc id). */
    completionId?: string;
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

/**
 * ISO string ya da Firestore Timestamp ({ seconds }) → Date | null.
 * (admin-SDK serileştirmesinde `_seconds`, client SDK'da `seconds` gelebilir.)
 */
function toDate(value: string | { seconds?: number; _seconds?: number } | null | undefined): Date | null {
    if (!value) return null;
    if (typeof value === 'string') {
        const d = value.includes('T') ? parseISO(value) : new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    const secs = value.seconds ?? value._seconds;
    if (typeof secs === 'number') return new Date(secs * 1000);
    return null;
}

function formatDate(
    value: string | { seconds?: number; _seconds?: number } | null | undefined,
    locale: 'tr' | 'en',
): string {
    const d = toDate(value);
    if (!d) return typeof value === 'string' ? value : '';
    return format(d, 'dd MMMM yyyy', { locale: locale === 'tr' ? tr : undefined });
}

// hangel resmi paleti (Apple marka kimliği): Mercan, koyu koral, Gece Siyahı, Açık Gri.
const CORAL = '#f34723';
const CORAL_DARK = '#c5391b';
const INK = '#1f1f1f';
const LIGHT_GRAY = '#f1f1f1';
// Sistem SF font yığını → Türkçe ğ/ş/ı/İ/ç/ö/ü glyph'leri doğru render edilir.
const LANYARD_FONT =
    "-apple-system,'SF Pro Display',system-ui,'Helvetica Neue',Arial,sans-serif";

const escXml = (s: string): string =>
    String(s).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string),
    );

/**
 * A6 yaka kartı SVG string'i. Yatay 148×105 mm.
 *
 * iOS FIX 2026-06-20: önceki sürüm doğrudan 300 DPI (1748×1240) canvas çiziyordu —
 * iOS WKWebView bellek limitinde toDataURL boş/hata dönebiliyordu. Yeni yol: kartı
 * mantıksal px boyutunda SVG (<text> + <image>) olarak kur, rasterizeSvgToJpeg ile
 * makul ölçekte (scale 2/3) JPEG'e çevir. <foreignObject> YOK (iOS'u kıran element).
 * Palet: hangel coral (#f34723 / #c5391b), Gece Siyahı (#1f1f1f), Açık Gri (#f1f1f1).
 */
function buildLanyardSvg(cert: VolunteeringCertificate, userName: string): { svg: string; w: number; h: number } {
    // Mantıksal tasarım boyutu (96dpi A6 yatay ≈ 559×397). Ölçek raster aşamasında.
    const W = 559;
    const H = 397;
    const fit = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s);

    const metaParts: string[] = [];
    if (typeof cert.hoursLogged === 'number' && cert.hoursLogged > 0) {
        metaParts.push(`${cert.hoursLogged.toLocaleString('tr-TR')} saat gönüllülük`);
    }
    if (typeof cert.impactValueTRY === 'number' && cert.impactValueTRY > 0) {
        metaParts.push(`${cert.impactValueTRY.toLocaleString('tr-TR')} ₺ sosyal etki`);
    }
    const meta = metaParts.join('   •   ');
    const bandH = Math.round(H * 0.07);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <style>text{font-family:${LANYARD_FONT};}</style>
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="${Math.round(W * 0.02)}" y="${Math.round(H * 0.08)}" width="${W - Math.round(W * 0.04)}" height="${H - Math.round(H * 0.16)}" rx="14" fill="none" stroke="${CORAL}" stroke-width="2"/>
  <circle cx="${W / 2}" cy="${Math.round(H * 0.05)}" r="${Math.round(W * 0.018)}" fill="${LIGHT_GRAY}"/>

  <text x="${W / 2}" y="${Math.round(H * 0.22)}" font-size="${Math.round(H * 0.075)}" font-weight="800" letter-spacing="-0.5" fill="${CORAL}" text-anchor="middle">hangel</text>
  <text x="${W / 2}" y="${Math.round(H * 0.31)}" font-size="${Math.round(H * 0.038)}" font-weight="500" fill="#86868b" text-anchor="middle">Gönüllülük Sertifikası</text>

  <text x="${W / 2}" y="${Math.round(H * 0.47)}" font-size="${Math.round(H * 0.078)}" font-weight="800" letter-spacing="-0.4" fill="${INK}" text-anchor="middle">${escXml(fit(userName || 'Gönüllü', 28))}</text>

  <text x="${W / 2}" y="${Math.round(H * 0.6)}" font-size="${Math.round(H * 0.042)}" font-weight="600" fill="#515154" text-anchor="middle">${escXml(fit(cert.title, 40))}</text>
  <text x="${W / 2}" y="${Math.round(H * 0.68)}" font-size="${Math.round(H * 0.036)}" font-weight="500" fill="#86868b" text-anchor="middle">${escXml(fit(cert.organization, 44))}</text>

  ${meta ? `<text x="${W / 2}" y="${Math.round(H * 0.76)}" font-size="${Math.round(H * 0.034)}" font-weight="700" fill="${CORAL_DARK}" text-anchor="middle">${escXml(fit(meta, 48))}</text>` : ''}
  ${cert.completedAt ? `<text x="${W / 2}" y="${Math.round(H * 0.83)}" font-size="${Math.round(H * 0.032)}" font-weight="500" fill="#86868b" text-anchor="middle">${escXml(fit(cert.completedAt, 40))}</text>` : ''}

  <rect x="0" y="${H - bandH}" width="${W}" height="${bandH}" fill="${CORAL}"/>
  <text x="${W / 2}" y="${H - Math.round(bandH * 0.32)}" font-size="${Math.round(H * 0.03)}" font-weight="700" letter-spacing="0.5" fill="#ffffff" text-anchor="middle">hangel.org</text>
</svg>`;
    return { svg, w: W, h: H };
}

/**
 * SVG string'i iOS-GÜVENLİ JPEG data URI'ye çevirir (native Image → canvas →
 * toDataURL). data: URI görseller canvas'ı taint etmez; <foreignObject> yok.
 */
function rasterizeSvgToJpeg(svg: string, widthPx: number, heightPx: number, scale = 2): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(widthPx * scale);
                canvas.height = Math.round(heightPx * scale);
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('canvas 2d context alınamadı'));
                    return;
                }
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.95));
            } catch (e) {
                reject(e instanceof Error ? e : new Error('SVG rasterize hatası'));
            }
        };
        img.onerror = () => reject(new Error('Yaka kartı görseli oluşturulamadı'));
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
}

/** Yaka kartını iOS-güvenli JPEG data URI olarak üretir (önizleme + indirme ortak yol). */
function renderLanyardJpeg(
    cert: VolunteeringCertificate,
    userName: string,
    opts: { scale?: number } = {},
): Promise<string> {
    const { svg, w, h } = buildLanyardSvg(cert, userName);
    return rasterizeSvgToJpeg(svg, w, h, opts.scale ?? 2);
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
        let active = true;
        renderLanyardJpeg(cert, userName, { scale: 1.5 })
            .then((dataUrl) => {
                if (active) setSrc(dataUrl);
            })
            .catch(() => {
                /* önizleme oluşmazsa skeleton kalır */
            });
        return () => {
            active = false;
        };
    }, [cert, userName]);
    if (!src) {
        return (
            <div className="aspect-[148/105] w-full rounded-lg border bg-muted animate-pulse" aria-hidden />
        );
    }
    return (
        // Önizleme — yaka kartı görseli (raster, data URL). next/image dataURL'i
        // optimize edemez, ham <img> kullanıyoruz. İndirme daha yüksek ölçekten.
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
    const db = useFirestore();
    const { user: authUser } = useUser();
    const [previewing, setPreviewing] = useState<VolunteeringCertificate | null>(null);

    // Onaylı gönüllü tamamlamaları — sertifikanın asıl kaynağı.
    // userId == profil sahibi (kendi /profile sayfası); onaylıları client'ta süzeriz
    // (ngoApproved === true || status === 'approved' — iki bayrak da yazılıyor).
    const completionsRef = useMemoFirebase(
        () =>
            db && authUser
                ? query(
                      collection(db, COLLECTIONS.volunteerCompletions),
                      where('userId', '==', authUser.uid),
                  )
                : null,
        [db, authUser?.uid],
    );
    const { data: completionsData } = useCollection<VolunteerCompletionDoc>(completionsRef);

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
        const loc = language === 'tr' ? ('tr' as const) : ('en' as const);
        const addUnique = (c: VolunteeringCertificate) => {
            const key = `${c.title.trim()}|${c.organization.trim()}`.toLowerCase();
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(c);
        };

        // pastVolunteering kayıtlarını completionId ile indeksle — volunteerCompletions
        // doc'unda title/ngoName YOK; bunları buradan zenginleştiririz.
        const pvByCompletionId = new Map<string, PastVolunteeringDoc>();
        for (const pv of pastVolunteering) {
            if (pv.completionId) pvByCompletionId.set(pv.completionId, pv);
        }
        const pvTitle = (pv: PastVolunteeringDoc) => pv.title || pv.volunteeringTitle || '';
        const pvOrg = (pv: PastVolunteeringDoc) => pv.organization || pv.ngoName || '';

        // 0) Onaylı gönüllü tamamlamaları (volunteerCompletions) — ASIL kaynak.
        //    Gerçek saat + mali etki + meslek + sertifika no taşır.
        for (const comp of completionsData ?? []) {
            const approved = comp.ngoApproved === true || comp.status === 'approved';
            if (!approved) continue;
            const linked = pvByCompletionId.get(comp.id);
            const title = (linked && pvTitle(linked)) || comp.professionLabel || 'Gönüllülük görevi';
            const organization = (linked && pvOrg(linked)) || 'STK';
            const hours =
                typeof comp.adjustedHours === 'number' ? comp.adjustedHours : comp.hoursLogged;
            const completedRaw = comp.approvedAt ?? comp.completedAt;
            addUnique({
                id: `comp-${comp.id}`,
                title,
                organization,
                completedAt: formatDate(completedRaw, loc),
                completedAtRaw: toDate(completedRaw)?.toISOString(),
                hoursLogged: hours,
                impactValueTRY: comp.impactValueTRY,
                professionLabel: comp.professionLabel,
                completionId: comp.id,
                ngoLogoUrl: comp.ngoId
                    ? ngoLogoById[comp.ngoId]
                    : ngoLogoByName[organization.trim().toLowerCase()],
                rating: linked?.review?.rating,
                comment: linked?.review?.comment,
            });
        }

        // 1) pastVolunteering (review + ngoId; completion ile eşleşmeyenler de dahil)
        for (const pv of pastVolunteering) {
            const title = pvTitle(pv);
            const organization = pvOrg(pv);
            if (!title || !organization) continue;
            const completedRaw = pv.dates?.eventEnd ?? pv.completedAt ?? '';
            addUnique({
                id: `pv-${pv.id}`,
                title,
                organization,
                completedAt: formatDate(completedRaw, loc),
                completedAtRaw: toDate(completedRaw)?.toISOString(),
                hoursLogged: pv.hoursLogged,
                impactValueTRY: pv.impactValueTRY,
                completionId: pv.completionId,
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
                completedAt: formatDate(app.date || '', loc),
                completedAtRaw: toDate(app.date || '')?.toISOString(),
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
                completedAt: formatDate(c.date || '', loc),
                completedAtRaw: toDate(c.date || '')?.toISOString(),
                ngoLogoUrl: ngoLogoByName[c.organization.trim().toLowerCase()],
            });
        }

        return merged;
    }, [
        completionsData,
        pastVolunteering,
        approvedApplications,
        manualCertificates,
        ngoLogoById,
        ngoLogoByName,
        language,
    ]);

    const handleDownloadJpg = async (cert: VolunteeringCertificate) => {
        try {
            // iOS-güvenli: SVG → Image → canvas (scale 3 ≈ baskı kalitesi, bellek dostu).
            const dataUrl = await renderLanyardJpeg(cert, userName, { scale: 3 });
            const a = document.createElement('a');
            a.href = dataUrl;
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
            // iOS-güvenli: SVG → Image → canvas (scale 3), sonra jsPDF'e göm.
            const dataUrl = await renderLanyardJpeg(cert, userName, { scale: 3 });
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

    /**
     * Tam boy resmi sertifika (A4 yatay). `@/lib/certificates/generate` ile aynı
     * HTML şablonu üretilir, yeni sekmede açılır ve yazdırma diyaloğu tetiklenir —
     * kullanıcı "PDF olarak kaydet" ile indirir (yeni paket yok). Event handler
     * içinde `new Date()` kullanımı render dışı olduğu için React 19 saf.
     */
    const handleOpenCertificate = (cert: VolunteeringCertificate) => {
        try {
            const completedAt = cert.completedAtRaw ? new Date(cert.completedAtRaw) : new Date();
            const html = generateCertificateHtml({
                completionId: cert.completionId ?? cert.id,
                userName: userName || 'Gönüllü',
                taskTitle: cert.title,
                ngoName: cert.organization,
                professionLabel: cert.professionLabel,
                hoursLogged: cert.hoursLogged ?? 0,
                impactValueTRY: cert.impactValueTRY ?? 0,
                completedAt,
            });
            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const win = window.open(url, '_blank');
            if (win) {
                win.addEventListener('load', () => {
                    win.focus();
                    win.print();
                });
            } else {
                // Pop-up engellendi → en azından indirilebilir .html ver.
                const a = document.createElement('a');
                a.href = url;
                a.download = `sertifika-${cert.title.replace(/\s+/g, '-').toLowerCase()}.html`;
                a.click();
            }
            // Blob URL'i bir süre sonra serbest bırak (yeni sekme yüklenene dek tut).
            window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
            toast({
                title: t('profile_certificates.downloaded'),
                description: `${cert.title} (sertifika)`,
            });
        } catch (e) {
            console.error('Certificate HTML generation failed:', e);
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
            <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-lg min-w-0 truncate">
                    {t('profile_certificates.sectionTitle')}
                </CardTitle>
                {certificates.length > 0 && (
                    <Badge variant="secondary" className="rounded-full shrink-0">
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
                                        <p className="text-sm font-semibold text-muted-foreground break-words">
                                            {cert.organization}
                                        </p>
                                        <h3 className="font-semibold leading-snug break-words">
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

                                {(typeof cert.hoursLogged === 'number' && cert.hoursLogged > 0) ||
                                (typeof cert.impactValueTRY === 'number' && cert.impactValueTRY > 0) ? (
                                    <div className="flex flex-wrap gap-2">
                                        {typeof cert.hoursLogged === 'number' && cert.hoursLogged > 0 && (
                                            <Badge variant="outline" className="rounded-full font-medium">
                                                {cert.hoursLogged.toLocaleString('tr-TR')} saat
                                            </Badge>
                                        )}
                                        {typeof cert.impactValueTRY === 'number' && cert.impactValueTRY > 0 && (
                                            <Badge
                                                variant="outline"
                                                className="rounded-full font-medium text-[#f34723] border-[#f34723]/40"
                                            >
                                                {cert.impactValueTRY.toLocaleString('tr-TR')} ₺ sosyal etki
                                            </Badge>
                                        )}
                                    </div>
                                ) : null}

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
                                        className="bg-[#f34723] text-white hover:bg-[#c5391b]"
                                        onClick={() => handleOpenCertificate(cert)}
                                    >
                                        <FileText className="mr-1.5 h-4 w-4" />
                                        {language === 'tr' ? 'Sertifika' : 'Certificate'}
                                    </Button>
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
                                <Button
                                    variant="outline"
                                    onClick={() => handleDownloadPdf(previewing)}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    PDF
                                </Button>
                                <Button
                                    className="bg-[#f34723] text-white hover:bg-[#c5391b]"
                                    onClick={() => handleOpenCertificate(previewing)}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    {language === 'tr' ? 'Sertifika' : 'Certificate'}
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
