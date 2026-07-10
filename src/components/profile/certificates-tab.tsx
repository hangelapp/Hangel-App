'use client';

import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X as XIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Milestone, FileText, LogIn, Download, Share2, MessageCircle, Linkedin, Mail, Instagram, Eye } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Application } from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';
import { isNativeApp } from '@/lib/capacitor';
import { generateEventCertificate, eventCertificateFileName, partnerLogosForEventName } from '@/lib/event-certificate';
import { generateVolunteerCertificate } from '@/lib/volunteer-certificate';
import { celebrate } from '@/lib/celebrate';

// Sertifikalar: users/{uid}/certificates alt koleksiyonu. Etkinlik sertifikaları
// title yerine eventName/ngoName/completedAt tutar → ortak şekle normalize edilir,
// tür (event/volunteer) belirlenir (gönüllülük ve etkinlik sertifikası farklı).
type RawCertDoc = {
    id?: string;
    title?: string; eventName?: string;
    organization?: string; ngoName?: string;
    date?: string; completedAt?: { seconds?: number } | string | number;
    type?: string;
    code?: string; organizerLogoUrl?: string;
};
type CertificateDoc = { id?: string; title: string; organization: string; date: string; kind: 'event' | 'volunteer'; code?: string; logoUrl?: string };
type CertInput = { title: string; organization: string; date: string; id?: string; kind?: 'event' | 'volunteer'; code?: string; logoUrl?: string };

/**
 * Profil ve /my-badges sayfalarının PAYLAŞTIĞI sertifika sekmesi. Veriyi prop
 * yerine kendi hook'larıyla (useUser/useFirestore) çeker; böylece her sayfada
 * BİREBİR aynı listeyi, indirme ve doğrulama davranışını gösterir.
 */
export function CertificatesTab() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const db = useFirestore();

    const userDocRef = useMemoFirebase(
        () => (authUser ? doc(db, COLLECTIONS.users, authUser.uid) : null),
        [db, authUser?.uid],
    );
    const { data: userData } = useDoc(userDocRef);

    const certificatesRef = useMemoFirebase(
        () => (db && authUser ? collection(db, COLLECTIONS.users, authUser.uid, COLLECTIONS.certificates) : null),
        [db, authUser?.uid],
    );
    const { data: certificatesData } = useCollection<RawCertDoc>(certificatesRef);

    // Firestore Timestamp / sayı / ISO → "YYYY-MM-DD".
    const tsToDateStr = (v: RawCertDoc['completedAt']): string => {
        if (!v) return '';
        if (typeof v === 'string') return v.slice(0, 10);
        if (typeof v === 'number') return new Date(v).toISOString().slice(0, 10);
        if (typeof v === 'object' && typeof v.seconds === 'number') return new Date(v.seconds * 1000).toISOString().slice(0, 10);
        return '';
    };

    // Onaylı gönüllülük katılımları → sertifika.
    // Veri modeli: applications koleksiyonunda type === 'Gönüllülük' ve
    // status === 'Onaylandı' (STK yetkilisi ngo-admin/volunteer ekranından onaylar:
    // updateDoc(applications/{id}, { status: 'Onaylandı', reviewedAt, reviewedBy })).
    // Bu, "katılımı kuruluşun yetkili kişisi tarafından ONAYLANAN gönüllüler"
    // koşulunu karşılar.
    const approvedAppsQuery = useMemoFirebase(
        () => (db && authUser ? query(collection(db, COLLECTIONS.applications), where('userId', '==', authUser.uid)) : null),
        [db, authUser?.uid],
    );
    const { data: approvedAppsData } = useCollection<Application>(approvedAppsQuery);

    // Onaylı gönüllülük başvurularını sertifika satırına dönüştür.
    const approvedCertificates = useMemo<CertificateDoc[]>(() => {
        return (approvedAppsData ?? [])
            .filter(app => app.type === 'Gönüllülük' && app.status === 'Onaylandı')
            .map(app => ({
                id: `app-${app.id}`,
                title: app.title,
                organization: app.org || '',
                date: app.date || '',
                kind: 'volunteer' as const,
            }));
    }, [approvedAppsData]);

    // Manuel girilen sertifikalar (users/{uid}/certificates) + onaylı katılımlar.
    // Aynı başlık+kuruluş tekrarını önlemek için dedupe uygula.
    const certificates = useMemo<CertificateDoc[]>(() => {
        // Etkinlik sertifikaları eventName/ngoName/completedAt tutar → ortak şekle indir.
        const manual: CertificateDoc[] = (certificatesData ?? []).map((c) => ({
            id: c.id,
            title: (c.title || c.eventName || '').trim(),
            organization: (c.organization || c.ngoName || '').trim(),
            date: c.date || tsToDateStr(c.completedAt),
            kind: (c.type === 'volunteering' || c.type === 'volunteer') ? 'volunteer' : 'event',
            code: c.code,
            logoUrl: c.organizerLogoUrl,
        }));
        const seen = new Set(manual.map(c => `${c.title}|${c.organization}`));
        const merged: CertificateDoc[] = [...manual];
        for (const c of approvedCertificates) {
            const key = `${c.title}|${c.organization}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(c);
        }
        // Adsız sertifikaları gösterme (boş başlıklı kayıt = açılamaz/anlamsız).
        return merged.filter((c) => (c.title || '').trim().length > 0);
    }, [certificatesData, approvedCertificates]);

    // PDF alıcı adı: userData.name / authUser.displayName.
    const recipientName = (userData as { name?: string } | undefined)?.name || authUser?.displayName || t('dashboard.badges.anonVolunteer');

    // Sertifika çıktısı: yeni Apple-kimlikli, iOS-GÜVENLİ üretici (SVG→canvas→jsPDF,
    // sistem fontuyla Türkçe ğ/ş/ı/İ doğru render). İndir + Görüntüle aynı Blob'u paylaşır.
    const buildCertBlob = (cert: CertInput) => {
        const certificateId = cert.id || cert.title;
        // Gönüllülük ve etkinlik sertifikaları AYRI tasarım + AYRI metin kullanır.
        // code GEÇİLİRSE (DB'de saklı) onu kullanır → QR'daki kod DB ile eşleşir.
        if (cert.kind === 'volunteer') {
            return generateVolunteerCertificate({
                taskTitle: cert.title,
                organizerName: cert.organization,
                userName: recipientName,
                date: cert.date,
                certificateId,
                code: cert.code,
                logoUrl: cert.logoUrl,
            });
        }
        return generateEventCertificate({
            eventName: cert.title,
            eventDate: cert.date,
            userName: recipientName,
            organizerName: cert.organization,
            role: 'participant',
            certificateId,
            code: cert.code,
            logoUrl: cert.logoUrl,
            // Gelir Modeli konferansları: organizatör (Social Business Global) logosunun
            // yanında T.C. İçişleri Bakanlığı Sivil Toplumla İlişkiler GM logoları.
            partnerLogoUrls: partnerLogosForEventName(cert.title),
        });
    };

    const certFileName = (cert: { title: string; id?: string }) =>
        eventCertificateFileName({ eventName: cert.title, certificateId: cert.id || cert.title });

    // Blob → base64 (native Filesystem.writeFile için). FileReader webview'de çalışır.
    const blobToBase64 = (blob: Blob): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(((reader.result as string) || '').split(',')[1] || '');
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
        });

    // Native: write to Documents/ + share; Web: blob indir.
    const handleDownloadCertificate = async (cert: CertInput) => {
        try {
            const blob = await buildCertBlob(cert);
            const filename = certFileName(cert);
            if (isNativeApp()) {
                const { Filesystem, Directory } = await import('@capacitor/filesystem');
                const { Share } = await import('@capacitor/share');
                const base64 = await blobToBase64(blob);
                const written = await Filesystem.writeFile({
                    path: filename,
                    data: base64,
                    directory: Directory.Documents,
                });
                try {
                    await Share.share({
                        title: cert.title,
                        text: `${cert.title} ${t('dashboard.badges.shareCertSuffix')}`,
                        url: written.uri,
                        dialogTitle: t('dashboard.badges.saveOrShareDialog'),
                    });
                } catch {
                    // user dismissed share — file is already saved
                }
                celebrate({ title: `Sertifikan hazır 🧡`, message: cert.title });
                toast({ title: t('dashboard.badges.certSavedTitle'), description: `${filename} ${t('dashboard.badges.certSavedSuffix')}` });
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
            celebrate({ title: `Sertifikan hazır 🧡`, message: cert.title });
            toast({ title: t('dashboard.badges.certDownloadedTitle'), description: `${cert.title} ${t('dashboard.badges.certDownloadedSuffix')}` });
        } catch (error) {
            console.error('Certificate PDF download failed:', error);
            toast({ variant: 'destructive', title: t('dashboard.badges.certDownloadFailTitle'), description: t('dashboard.badges.certPdfFailDesc') });
        }
    };

    // Modal popup preview için cert PDF blob URL'i ve seçili cert.
    const [previewState, setPreviewState] = useState<{ url: string; cert: CertInput } | null>(null);

    // Native: write temp + open via Browser; Web: iframe preview modal.
    const handleViewCertificate = async (cert: CertInput) => {
        try {
            const blob = await buildCertBlob(cert);
            if (isNativeApp()) {
                const { Filesystem, Directory } = await import('@capacitor/filesystem');
                const { Browser } = await import('@capacitor/browser');
                const filename = certFileName(cert);
                const base64 = await blobToBase64(blob);
                const written = await Filesystem.writeFile({
                    path: filename,
                    data: base64,
                    directory: Directory.Cache,
                });
                await Browser.open({ url: written.uri });
                return;
            }
            // Web: iframe modal preview (popup yerine in-app dialog).
            const blobUrl = URL.createObjectURL(blob);
            // Önceki blob'u serbest bırak (memory leak önle).
            if (previewState?.url) {
                try { URL.revokeObjectURL(previewState.url); } catch { /* ignore */ }
            }
            setPreviewState({ url: blobUrl, cert });
        } catch (error) {
            console.error('Certificate PDF view failed:', error);
            toast({ variant: 'destructive', title: t('dashboard.badges.certOpenFailTitle'), description: t('dashboard.badges.certPdfFailDesc') });
        }
    };

    const closePreview = () => {
        if (previewState?.url) {
            try { URL.revokeObjectURL(previewState.url); } catch { /* ignore */ }
        }
        setPreviewState(null);
    };

    const buildShareText = (certTitle: string) => `${certTitle} ${t('dashboard.badges.shareCertEarned')}`;
    const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hangel.org';

    // Native: iOS/Android share sheet (Capacitor Share). Web: deep link to platform.
    const nativeShare = async (certTitle: string): Promise<boolean> => {
        if (!isNativeApp()) return false;
        try {
            const { Share } = await import('@capacitor/share');
            await Share.share({
                title: certTitle,
                text: buildShareText(certTitle),
                url: shareUrl,
                dialogTitle: t('dashboard.badges.shareCertDialog'),
            });
            return true;
        } catch {
            return false;
        }
    };

    const shareWhatsApp = async (certTitle: string) => {
        if (await nativeShare(certTitle)) return;
        const text = encodeURIComponent(`${buildShareText(certTitle)}${shareUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    };
    const shareLinkedIn = async (certTitle: string) => {
        if (await nativeShare(certTitle)) return;
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,noreferrer');
    };
    const shareEmail = async (certTitle: string) => {
        if (await nativeShare(certTitle)) return;
        const subject = encodeURIComponent(`${certTitle} ${t('dashboard.badges.shareCertSuffix')}`);
        const bodyText = encodeURIComponent(`${buildShareText(certTitle)}${shareUrl}`);
        window.open(`mailto:?subject=${subject}&body=${bodyText}`, '_blank', 'noopener,noreferrer');
    };
    const shareInstagram = async (certTitle: string) => {
        if (await nativeShare(certTitle)) return;
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(`${buildShareText(certTitle)}${shareUrl}`);
            }
            toast({ title: t('dashboard.badges.textCopiedTitle'), description: t('dashboard.badges.textCopiedDesc') });
        } catch {
            toast({ variant: 'destructive', title: t('dashboard.badges.shareFailTitle'), description: t('dashboard.badges.shareCopyError') });
        }
        window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="mt-8 space-y-4">
            {!authUser ? (
                <EmptyState
                    icon={LogIn}
                    title={t('dashboard.badges.certLoginPromptTitle')}
                    description={t('dashboard.badges.certLoginPromptDesc')}
                    action={{ label: t('dashboard.badges.loginCta'), href: '/login' }}
                />
            ) : certificates.length === 0 ? (
                <div className="text-center py-20">
                    <Milestone className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">{t('dashboard.badges.certificatesPlaceholder')}</p>
                </div>
            ) : (
                certificates.map(cert => (
                    <Card key={cert.id} className="rounded-2xl">
                        <CardContent className="flex items-center justify-between gap-4 p-5">
                            <div className="flex items-start gap-4 min-w-0">
                                <div className="p-3 rounded-2xl bg-primary/10 shrink-0">
                                    <FileText className="h-6 w-6 text-primary" />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-sm leading-tight truncate">{cert.title}</p>
                                    {(cert.organization || cert.date) && (
                                        <p className="text-xs text-muted-foreground mt-1 truncate">
                                            {[cert.organization, cert.date].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleViewCertificate(cert)}>
                                    <Eye className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">{t('dashboard.badges.viewCta')}</span>
                                </Button>
                                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleDownloadCertificate(cert)}>
                                    <Download className="h-4 w-4 sm:mr-2" />
                                    <span className="hidden sm:inline">{t('dashboard.badges.downloadCta')}</span>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline" className="rounded-xl">
                                            <Share2 className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">{t('dashboard.badges.shareCta')}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => shareWhatsApp(cert.title)}>
                                            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => shareInstagram(cert.title)}>
                                            <Instagram className="mr-2 h-4 w-4" /> Instagram
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => shareLinkedIn(cert.title)}>
                                            <Linkedin className="mr-2 h-4 w-4" /> LinkedIn
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => shareEmail(cert.title)}>
                                            <Mail className="mr-2 h-4 w-4" /> {t('dashboard.badges.shareEmail')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}

            {/* Sertifika önizleme modal — popup yerine in-app dialog */}
            <Dialog open={!!previewState} onOpenChange={(open) => { if (!open) closePreview(); }}>
                <DialogContent className="max-w-4xl w-[95vw] h-[90vh] flex flex-col rounded-3xl overflow-hidden p-0">
                    <DialogHeader className="px-6 py-3 border-b flex flex-row items-center justify-between space-y-0 gap-3">
                        <DialogTitle className="text-base font-semibold truncate flex-1">
                            {previewState?.cert.title ?? ''}
                        </DialogTitle>
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={closePreview} aria-label="Kapat">
                            <XIcon className="h-5 w-5" />
                        </Button>
                    </DialogHeader>
                    {previewState?.url && (
                        <iframe
                            src={previewState.url}
                            title={previewState.cert.title}
                            className="flex-1 w-full border-0 bg-muted"
                        />
                    )}
                    <DialogFooter className="px-6 py-3 border-t gap-2 sm:gap-2">
                        {previewState && (
                            <Button onClick={() => handleDownloadCertificate(previewState.cert)} className="gap-2">
                                <Download className="h-4 w-4" /> {t('dashboard.badges.downloadPdf') || 'PDF İndir'}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
