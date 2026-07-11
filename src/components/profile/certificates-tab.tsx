'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X as XIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Milestone, FileText, LogIn, Download, Share2, MessageCircle, Linkedin, Mail, Instagram, Eye, ScrollText, Search, ArrowDownUp } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Application } from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';
import { isNativeApp, openExternalUrl } from '@/lib/capacitor';
import { saveAndShareFileNative, downloadDataUrlSmart } from '@/lib/native-file';
import { generateEventCertificate, buildEventCertificateJpeg, eventCertificateFileName } from '@/lib/event-certificate';
import { generateVolunteerCertificate, buildVolunteerCertificateJpeg } from '@/lib/volunteer-certificate';
import { buildCertificateStoryJpeg } from '@/lib/certificate-story';
import { buildCertCode, certVerifyUrl } from '@/lib/certificate-code';
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
        });
    };

    const certFileName = (cert: { title: string; id?: string }) =>
        eventCertificateFileName({ eventName: cert.title, certificateId: cert.id || cert.title });

    // Sertifikanın tek sayfalık JPEG görüntüsü (önizleme için) — PDF ile aynı görsel.
    const buildCertJpeg = async (cert: CertInput): Promise<string> => {
        const certificateId = cert.id || cert.title;
        if (cert.kind === 'volunteer') {
            const { jpeg } = await buildVolunteerCertificateJpeg({
                taskTitle: cert.title,
                organizerName: cert.organization,
                userName: recipientName,
                date: cert.date,
                certificateId,
                code: cert.code,
                logoUrl: cert.logoUrl,
            });
            return jpeg;
        }
        const { jpeg } = await buildEventCertificateJpeg({
            eventName: cert.title,
            eventDate: cert.date,
            userName: recipientName,
            organizerName: cert.organization,
            role: 'participant',
            certificateId,
            code: cert.code,
            logoUrl: cert.logoUrl,
        });
        return jpeg;
    };

    // Native: Cache'e yaz + paylaşım sayfası (Documents Android 11+'ta yazılamaz,
    // ayrıntı: src/lib/native-file.ts); Web: blob indir.
    const handleDownloadCertificate = async (cert: CertInput) => {
        try {
            const blob = await buildCertBlob(cert);
            const filename = certFileName(cert);
            if (isNativeApp()) {
                await saveAndShareFileNative(blob, filename, {
                    title: cert.title,
                    text: `${cert.title} ${t('dashboard.badges.shareCertSuffix')}`,
                    dialogTitle: t('dashboard.badges.saveOrShareDialog'),
                });
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

    // Önizleme modalı: sertifikanın JPEG görüntüsü (data URI) + seçili cert.
    const [previewState, setPreviewState] = useState<{ jpeg: string; cert: CertInput } | null>(null);

    // Önizleme HER platformda app-içi görsel diyaloğu. Native'de eskiden
    // Browser.open(file://) kullanılıyordu — iOS/Android yalnız http(s) açar,
    // her cihazda hata veriyordu. Görsel data-URI olduğu için dosya yazma,
    // izin, revoke gerekmez.
    const handleViewCertificate = async (cert: CertInput) => {
        try {
            const jpeg = await buildCertJpeg(cert);
            setPreviewState({ jpeg, cert });
        } catch (error) {
            console.error('Certificate preview failed:', error);
            toast({ variant: 'destructive', title: t('dashboard.badges.certOpenFailTitle'), description: t('dashboard.badges.certPdfFailDesc') });
        }
    };

    const closePreview = () => setPreviewState(null);

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
    // LinkedIn "Add to Profile" — sertifikayı kullanıcının LinkedIn profilindeki
    // "Lisanslar ve Sertifikalar" bölümüne ekleten resmi derin link. certUrl,
    // PDF'teki QR ile AYNI doğrulama sayfasına (/c/{kod}) gider.
    const linkedInAdd = (cert: CertInput) => {
        const code = cert.code || buildCertCode({
            kind: cert.kind === 'volunteer' ? 'volunteer' : 'event',
            idSeed: cert.id || cert.title,
        });
        const params = new URLSearchParams({
            startTask: 'CERTIFICATION_NAME',
            name: cert.title,
            organizationName: cert.organization || 'hangel',
            certUrl: certVerifyUrl(code),
            certId: code,
        });
        const year = (cert.date || '').slice(0, 4);
        const month = Number((cert.date || '').slice(5, 7));
        if (/^\d{4}$/.test(year)) params.set('issueYear', year);
        if (month >= 1 && month <= 12) params.set('issueMonth', String(month));
        void openExternalUrl(`https://www.linkedin.com/profile/add?${params.toString()}`);
    };

    // Instagram hikâyesi: sertifikayı 9:16 marka kimlikli görsele çevirip
    // paylaşım sayfasına ver (native) / indir (web). Kullanıcı Instagram'da
    // "Hikâyene ekle" ile paylaşır — salt metin kopyalamaktan çok daha etkili.
    const [storyBusyId, setStoryBusyId] = useState<string | null>(null);
    const shareInstagramStory = async (cert: CertInput) => {
        setStoryBusyId(cert.id || cert.title);
        try {
            const certJpeg = await buildCertJpeg(cert);
            const story = await buildCertificateStoryJpeg({
                certJpegDataUri: certJpeg,
                title: cert.title,
                organization: cert.organization,
                date: cert.date,
                userName: recipientName,
            });
            await downloadDataUrlSmart(story, `hangel-sertifika-hikaye-${(cert.id || 'sertifika').toString().slice(0, 24)}.jpg`, {
                title: cert.title,
                text: `${cert.title} ${t('dashboard.badges.shareCertSuffix')}`,
                dialogTitle: 'Instagram hikâyesi olarak paylaş',
            });
            if (!isNativeApp()) {
                toast({ title: 'Hikâye görseli indirildi', description: "Instagram'da hikâyene ekleyerek paylaşabilirsin." });
            }
        } catch (error) {
            console.error('Certificate story failed:', error);
            toast({ variant: 'destructive', title: t('dashboard.badges.shareFailTitle'), description: t('dashboard.badges.certPdfFailDesc') });
        } finally {
            setStoryBusyId(null);
        }
    };
    const shareEmail = async (certTitle: string) => {
        if (await nativeShare(certTitle)) return;
        const subject = encodeURIComponent(`${certTitle} ${t('dashboard.badges.shareCertSuffix')}`);
        const bodyText = encodeURIComponent(`${buildShareText(certTitle)}${shareUrl}`);
        window.open(`mailto:?subject=${subject}&body=${bodyText}`, '_blank', 'noopener,noreferrer');
    };
    // Arama + sıralama — sertifika sayısı artınca listeyi yönetilebilir tutar.
    const [certQuery, setCertQuery] = useState('');
    const [certSort, setCertSort] = useState<'newest' | 'oldest' | 'org'>('newest');
    const visibleCertificates = useMemo(() => {
        const q = certQuery.trim().toLocaleLowerCase('tr');
        const list = q
            ? certificates.filter(c => `${c.title} ${c.organization}`.toLocaleLowerCase('tr').includes(q))
            : [...certificates];
        return list.sort((a, b) => {
            if (certSort === 'org') return (a.organization || '').localeCompare(b.organization || '', 'tr');
            const cmp = (b.date || '').localeCompare(a.date || '');
            return certSort === 'newest' ? cmp : -cmp;
        });
    }, [certificates, certQuery, certSort]);

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
                <>
                {/* Etki Transkripti — tüm gönüllülük geçmişi tek belgede */}
                <Button asChild variant="outline" className="w-full rounded-xl min-h-[44px]">
                    <Link href="/volunteering/transcript">
                        <ScrollText className="h-4 w-4 mr-2 shrink-0" />
                        <span className="text-sm font-semibold">Tümünü tek transkriptte gör</span>
                    </Link>
                </Button>

                {/* Arama + sıralama — 4+ sertifikada görünür */}
                {certificates.length >= 4 && (
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 min-w-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                value={certQuery}
                                onChange={(e) => setCertQuery(e.target.value)}
                                placeholder="Sertifika veya kuruluş ara"
                                className="pl-9 rounded-xl min-h-[44px]"
                                aria-label="Sertifika ara"
                            />
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="rounded-xl min-h-[44px] min-w-[44px] shrink-0" aria-label="Sırala">
                                    <ArrowDownUp className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setCertSort('newest')}>Yeniden eskiye{certSort === 'newest' ? ' ✓' : ''}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setCertSort('oldest')}>Eskiden yeniye{certSort === 'oldest' ? ' ✓' : ''}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setCertSort('org')}>Kuruluşa göre (A-Z){certSort === 'org' ? ' ✓' : ''}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
                {visibleCertificates.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-8">"{certQuery}" ile eşleşen sertifika yok.</p>
                )}
                {visibleCertificates.map(cert => (
                    <Card key={cert.id} className="rounded-2xl">
                        {/* Mobil okunurluk: başlık KESİLMEZ (truncate yok) — hangi sertifika
                            olduğu ayırt edilebilir kalır; aksiyonlar etiketli ayrı sırada. */}
                        <CardContent className="p-4 sm:p-5 space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm leading-snug break-words">{cert.title}</p>
                                    {(cert.organization || cert.date) && (
                                        <p className="text-xs text-muted-foreground mt-1 break-words">
                                            {[cert.organization, cert.date].filter(Boolean).join(' · ')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* Üç eşit buton: min-w-0 + truncate + px-2 → uzun etiket/dar ekranda
                                taşma olmaz, sıra hizalı kalır (tasarımsal kayma düzeltmesi). */}
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="rounded-xl flex-1 min-w-0 min-h-[44px] px-2" onClick={() => handleViewCertificate(cert)}>
                                    <Eye className="h-4 w-4 mr-1.5 shrink-0" />
                                    <span className="text-xs font-semibold truncate">{t('dashboard.badges.viewCta')}</span>
                                </Button>
                                <Button size="sm" variant="outline" className="rounded-xl flex-1 min-w-0 min-h-[44px] px-2" onClick={() => handleDownloadCertificate(cert)}>
                                    <Download className="h-4 w-4 mr-1.5 shrink-0" />
                                    <span className="text-xs font-semibold truncate">{t('dashboard.badges.downloadCta')}</span>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline" className="rounded-xl flex-1 min-w-0 min-h-[44px] px-2">
                                            <Share2 className="h-4 w-4 mr-1.5 shrink-0" />
                                            <span className="text-xs font-semibold truncate">{t('dashboard.badges.shareCta')}</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                            disabled={storyBusyId === (cert.id || cert.title)}
                                            onClick={() => shareInstagramStory(cert)}
                                        >
                                            <Instagram className="mr-2 h-4 w-4" />
                                            {storyBusyId === (cert.id || cert.title) ? 'Hikâye hazırlanıyor…' : 'Instagram Hikâyesi'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => linkedInAdd(cert)}>
                                            <Linkedin className="mr-2 h-4 w-4" /> LinkedIn'e Ekle
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => shareWhatsApp(cert.title)}>
                                            <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => shareEmail(cert.title)}>
                                            <Mail className="mr-2 h-4 w-4" /> {t('dashboard.badges.shareEmail')}
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                </>
            )}

            {/* Sertifika önizleme modal — app-içi görsel (web + native aynı yol) */}
            <Dialog open={!!previewState} onOpenChange={(open) => { if (!open) closePreview(); }}>
                <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col rounded-3xl overflow-hidden p-0">
                    <DialogHeader className="px-6 py-3 border-b flex flex-row items-center justify-between space-y-0 gap-3">
                        <DialogTitle className="text-base font-semibold truncate flex-1">
                            {previewState?.cert.title ?? ''}
                        </DialogTitle>
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={closePreview} aria-label="Kapat">
                            <XIcon className="h-5 w-5" />
                        </Button>
                    </DialogHeader>
                    {previewState?.jpeg && (
                        <div className="flex-1 min-h-0 overflow-auto bg-muted p-3 sm:p-6 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={previewState.jpeg}
                                alt={previewState.cert.title}
                                className="max-w-full h-auto rounded-lg shadow-lg"
                            />
                        </div>
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
