'use client'

import React, { useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Milestone, CheckCircle, Lock, Award, FileText, LogIn, Download, Share2, MessageCircle, Linkedin, Mail, Instagram, Eye } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { computeAreaPoints, mapCategoryToBadgeArea, enrichBadges, type TierEnrichedBadge } from '@/lib/badge-points';
import type { Application } from '@/lib/types';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, collection, query, where, updateDoc } from 'firebase/firestore';
import { Badge as BadgeType, BadgeLevel } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { groupBy } from 'lodash';
import { Progress } from '@/components/ui/progress';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';
import { isNativeApp } from '@/lib/capacitor';
import { EtkiTabContent } from '@/components/profile/etki-tab-content';

const levelColors: Record<BadgeLevel, { bg: string; text: string }> = {
  'Bakır':  { bg: 'bg-orange-700/15',  text: 'text-orange-800' },
  'Bronz':  { bg: 'bg-amber-700/20',   text: 'text-amber-800' },
  'Gümüş':  { bg: 'bg-gray-400/20',    text: 'text-gray-500' },
  'Altın':  { bg: 'bg-yellow-500/20',  text: 'text-yellow-600' },
  'Platin': { bg: 'bg-cyan-300/20',    text: 'text-cyan-500' },
};

const LEVEL_ORDER: BadgeLevel[] = ['Bakır', 'Bronz', 'Gümüş', 'Altın', 'Platin'];

/**
 * PRD kuralı: kullanıcı bir STK'yı bağış/destek (supportedNgos) veya gönüllülük
 * (volunteerNgos) için seçtiğinde, o STK'nın kategorisinin eşlendiği rozet
 * alanına +10 puan kazandırır. Her nitelikli seçim için 10 puan.
 */
const SELECTION_AREA_POINTS = 10;

type NextBadgeRow = TierBadge & { tierCurrent: number; tierDelta: number; tierProgress: number };

const NextBadgeGoal = ({ nextBadge, t }: { nextBadge: NextBadgeRow | null; t: (key: string) => string }) => {
    if (!nextBadge) {
        return (
            <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" /> {t('dashboard.badges.nextGoalTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {t('dashboard.badges.nextGoalEmptyDesc')}
                    </p>
                </CardContent>
            </Card>
        );
    }
    const Icon = nextBadge.iconName;
    const remaining = Math.max(nextBadge.tierDelta - nextBadge.tierCurrent, 0);
    return (
        <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" /> {t('dashboard.badges.nextGoalTitle')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <div className={cn('p-3 rounded-2xl shadow-sm bg-white')}>
                        <Icon className={cn('h-8 w-8', levelColors[nextBadge.level].text)} />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-end">
                            <p className="font-bold text-sm">{nextBadge.name}</p>
                            <p className="text-xs font-bold text-primary">%{Math.round(nextBadge.tierProgress)}</p>
                        </div>
                        <Progress value={nextBadge.tierProgress} className="h-2" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {nextBadge.tierCurrent.toLocaleString('tr-TR')} / {nextBadge.tierDelta.toLocaleString('tr-TR')} Puan (Kalan: {remaining.toLocaleString('tr-TR')})
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

/**
 * Tier-based ilerleme:
 * Bir alanda Bakır=100, Bronz=250, Gümüş=500, areaPoints=350 ise:
 *   - Bakır: 100/100 TAMAMLANDI
 *   - Bronz: 150/150 TAMAMLANDI (delta = 250-100)
 *   - Gümüş: 100/250 (areaPoints-Bronz = 100, delta = 500-250 = 250)
 * Yani 1. kademe dolduğunda 2. kademenin sayacı SIFIRDAN başlar.
 */
type TierBadge = BadgeType & { prevTierRequired: number };

const VectorBadge = ({ badge }: { badge: TierBadge }) => {
    const isEarned = badge.currentPoints >= badge.pointsRequired;
    const Icon = badge.iconName;
    const colors = levelColors[badge.level];

    const tierDelta = Math.max(1, badge.pointsRequired - badge.prevTierRequired);
    const tierCurrent = Math.max(0, Math.min(tierDelta, badge.currentPoints - badge.prevTierRequired));
    const progress = Math.min((tierCurrent / tierDelta) * 100, 100);
    const pointsRemaining = Math.max(tierDelta - tierCurrent, 0);

    return (
        <Card
            className={cn(
                "rounded-[2rem] border-black/5 flex flex-col items-center text-center p-6 transition-all hover:shadow-xl group",
                // PRD görsel kuralı: hak kazanılmayan rozetler renksiz/gri,
                // hak kazanıldığında ikon renkli görünür.
                !isEarned && "grayscale opacity-50",
            )}
        >
            <div className={cn('relative w-20 h-20 flex items-center justify-center rounded-3xl transition-all duration-500 mb-4 group-hover:scale-110', isEarned ? colors.bg : 'bg-muted')}>
                <Icon className={cn('w-10 h-10 transition-colors', isEarned ? colors.text : 'text-muted-foreground/60')} />
                {isEarned ? (
                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 text-white shadow-lg border-2 border-white">
                        <CheckCircle className="h-3 w-3" />
                    </div>
                ) : (
                    <div className="absolute -top-2 -right-2 bg-muted-foreground/30 rounded-full p-1.5 text-white shadow-md border-2 border-white">
                        <Lock className="h-3 w-3" />
                    </div>
                )}
            </div>
            <div className="space-y-1 w-full">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{badge.level}</p>
                <h4 className="font-bold text-sm leading-tight h-10 flex items-center justify-center">{badge.name}</h4>
                <div className="pt-2">
                    <Progress value={progress} className="h-1.5" />
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mt-2">
                        <span className="text-muted-foreground">
                            {tierCurrent.toLocaleString('tr-TR')} / {tierDelta.toLocaleString('tr-TR')}
                        </span>
                        {isEarned ? (
                            <span className="text-green-600">TAMAMLANDI</span>
                        ) : (
                            <span className="text-primary">{pointsRemaining.toLocaleString('tr-TR')} KALDI</span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default function MyBadgesPage() {
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const db = useFirestore();
    const userDocRef = useMemoFirebase(
        () => authUser ? doc(db, COLLECTIONS.users, authUser.uid) : null,
        [db, authUser?.uid],
    );
    const { data: userData } = useDoc(userDocRef);

    // Sertifikalar: users/{uid}/certificates alt koleksiyonu (profile/page.tsx ile birebir).
    type CertificateDoc = { id?: string; title: string; organization: string; date: string };
    const certificatesRef = useMemoFirebase(
        () => (db && authUser ? collection(db, COLLECTIONS.users, authUser.uid, COLLECTIONS.certificates) : null),
        [db, authUser?.uid],
    );
    const { data: certificatesData } = useCollection<CertificateDoc>(certificatesRef);

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
            }));
    }, [approvedAppsData]);

    // Manuel girilen sertifikalar (users/{uid}/certificates) + onaylı katılımlar.
    // Aynı başlık+kuruluş tekrarını önlemek için dedupe uygula.
    const certificates = useMemo<CertificateDoc[]>(() => {
        const manual = certificatesData ?? [];
        const seen = new Set(manual.map(c => `${c.title}|${c.organization}`));
        const merged: CertificateDoc[] = [...manual];
        for (const c of approvedCertificates) {
            const key = `${c.title}|${c.organization}`;
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(c);
        }
        return merged;
    }, [certificatesData, approvedCertificates]);

    // Aktivite kaynakları: areaPoints'i kullanıcının gerçek bağış / gönüllülük / davetinden hesapla.
    type DonationDoc = { id?: string; status?: string; ngoIds?: string[]; ngo?: string[] };
    type NgoDoc = { id?: string; category?: string };
    type PastVolunteeringDoc = { id?: string; points?: number; socialArea?: string; area?: string; ngoId?: string; organization?: string };

    const donationsQuery = useMemoFirebase(
        () => (db && authUser ? query(collection(db, COLLECTIONS.donations), where('userId', '==', authUser.uid)) : null),
        [db, authUser?.uid],
    );
    const { data: donationsData } = useCollection<DonationDoc>(donationsQuery);
    const donations = useMemo(() => donationsData ?? [], [donationsData]);

    const ngosRef = useMemoFirebase(
        () => (db ? collection(db, COLLECTIONS.ngos) : null),
        [db],
    );
    const { data: ngosData } = useCollection<NgoDoc>(ngosRef);
    const ngoCategoryById = useMemo<Record<string, string>>(() => {
        const map: Record<string, string> = {};
        (ngosData ?? []).forEach(n => {
            if (n.id && typeof n.category === 'string') map[n.id] = n.category;
        });
        return map;
    }, [ngosData]);

    const pastVolunteeringRef = useMemoFirebase(
        () => (db && authUser ? collection(db, COLLECTIONS.users, authUser.uid, COLLECTIONS.pastVolunteering) : null),
        [db, authUser?.uid],
    );
    const { data: pastVolunteeringData } = useCollection<PastVolunteeringDoc>(pastVolunteeringRef);
    const pastVolunteering = useMemo(() => pastVolunteeringData ?? [], [pastVolunteeringData]);

    // PDF alıcı adı: profile/page.tsx currentUser.name kullanıyor; burada userData.name / authUser.displayName.
    const recipientName = (userData as { name?: string } | undefined)?.name || authUser?.displayName || 'Gönüllü';

    // Sertifika PDF'ini oluştur (jsPDF dinamik import). İndir ve Görüntüle aynı çıktıyı paylaşır.
    const buildCertificatePdf = async (cert: { title: string; organization: string; date: string }) => {
        const { default: jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();

        // Border
        pdf.setDrawColor(234, 88, 12);
        pdf.setLineWidth(2);
        pdf.rect(10, 10, pageW - 20, pageH - 20);
        pdf.setLineWidth(0.5);
        pdf.rect(14, 14, pageW - 28, pageH - 28);

        // Title
        pdf.setFontSize(32);
        pdf.setTextColor(234, 88, 12);
        pdf.text('SERTİFİKA', pageW / 2, 45, { align: 'center' });

        pdf.setFontSize(12);
        pdf.setTextColor(80, 80, 80);
        pdf.text('Bu sertifika hangel platformu aracılığıyla verilmiştir.', pageW / 2, 58, { align: 'center' });

        // Recipient
        pdf.setFontSize(14);
        pdf.setTextColor(60, 60, 60);
        pdf.text('Sayın', pageW / 2, 78, { align: 'center' });

        pdf.setFontSize(22);
        pdf.setTextColor(20, 20, 20);
        pdf.text(recipientName, pageW / 2, 92, { align: 'center' });

        // Body
        pdf.setFontSize(13);
        pdf.setTextColor(60, 60, 60);
        const body = `${cert.organization} tarafından düzenlenen aşağıdaki çalışmayı başarıyla tamamladığını belgeler:`;
        pdf.text(body, pageW / 2, 108, { align: 'center', maxWidth: pageW - 60 });

        // Title of cert
        pdf.setFontSize(20);
        pdf.setTextColor(20, 20, 20);
        pdf.text(cert.title, pageW / 2, 130, { align: 'center', maxWidth: pageW - 60 });

        // Date / org footer
        pdf.setFontSize(11);
        pdf.setTextColor(80, 80, 80);
        pdf.text(`Veren Kuruluş: ${cert.organization}`, pageW / 2, 160, { align: 'center' });
        pdf.text(`Tarih: ${cert.date}`, pageW / 2, 168, { align: 'center' });

        pdf.setFontSize(9);
        pdf.setTextColor(120, 120, 120);
        pdf.text('hangel.org', pageW / 2, pageH - 18, { align: 'center' });

        return pdf;
    };

    const certFileName = (cert: { title: string }) =>
        `sertifika-${cert.title.replace(/[^\w-]+/g, '-').toLowerCase()}.pdf`;

    // Native: write to Documents/ + share; Web: pdf.save().
    const handleDownloadCertificate = async (cert: { title: string; organization: string; date: string }) => {
        try {
            const pdf = await buildCertificatePdf(cert);
            const filename = certFileName(cert);
            if (isNativeApp()) {
                const { Filesystem, Directory } = await import('@capacitor/filesystem');
                const { Share } = await import('@capacitor/share');
                const base64 = pdf.output('datauristring').split(',')[1];
                const written = await Filesystem.writeFile({
                    path: filename,
                    data: base64,
                    directory: Directory.Documents,
                });
                try {
                    await Share.share({
                        title: cert.title,
                        text: `${cert.title} sertifikam`,
                        url: written.uri,
                        dialogTitle: 'Sertifikayı kaydet veya paylaş',
                    });
                } catch {
                    // user dismissed share — file is already saved
                }
                toast({ title: 'Sertifika Kaydedildi', description: `${filename} dosyanıza eklendi.` });
                return;
            }
            pdf.save(filename);
            toast({ title: 'Sertifika İndirildi', description: `${cert.title} başarıyla indirildi.` });
        } catch (error) {
            console.error('Certificate PDF download failed:', error);
            toast({ variant: 'destructive', title: 'Sertifika İndirilemedi', description: 'PDF oluşturulurken bir hata oluştu.' });
        }
    };

    // Native: write temp + open via Browser; Web: bloburl + window.open.
    const handleViewCertificate = async (cert: { title: string; organization: string; date: string }) => {
        try {
            const pdf = await buildCertificatePdf(cert);
            if (isNativeApp()) {
                const { Filesystem, Directory } = await import('@capacitor/filesystem');
                const { Browser } = await import('@capacitor/browser');
                const filename = certFileName(cert);
                const base64 = pdf.output('datauristring').split(',')[1];
                const written = await Filesystem.writeFile({
                    path: filename,
                    data: base64,
                    directory: Directory.Cache,
                });
                await Browser.open({ url: written.uri });
                return;
            }
            const blobUrl = pdf.output('bloburl');
            const opened = window.open(blobUrl, '_blank', 'noopener,noreferrer');
            if (!opened) {
                toast({ variant: 'destructive', title: 'Sertifika Açılamadı', description: 'Tarayıcı yeni sekme açmayı engelledi. Lütfen indir seçeneğini kullanın.' });
            }
        } catch (error) {
            console.error('Certificate PDF view failed:', error);
            toast({ variant: 'destructive', title: 'Sertifika Açılamadı', description: 'PDF oluşturulurken bir hata oluştu.' });
        }
    };

    const buildShareText = (certTitle: string) => `${certTitle} sertifikamı Hangel'de kazandım! `;
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
                dialogTitle: 'Sertifikayı paylaş',
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
        const subject = encodeURIComponent(`${certTitle} sertifikam`);
        const bodyText = encodeURIComponent(`${buildShareText(certTitle)}${shareUrl}`);
        window.open(`mailto:?subject=${subject}&body=${bodyText}`, '_blank', 'noopener,noreferrer');
    };
    const shareInstagram = async (certTitle: string) => {
        if (await nativeShare(certTitle)) return;
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard) {
                await navigator.clipboard.writeText(`${buildShareText(certTitle)}${shareUrl}`);
            }
            toast({ title: 'Metin kopyalandı', description: "Metin kopyalandı, Instagram'da paylaşabilirsin" });
        } catch {
            toast({ variant: 'destructive', title: 'Paylaşılamadı', description: 'Metin kopyalanırken bir hata oluştu.' });
        }
        window.open('https://www.instagram.com', '_blank', 'noopener,noreferrer');
    };

    // Top-level veya stats.* — invite akışı top-level yazıyor, signup stats altına yazıyor.
    type UserDataLike = {
        impactScore?: number;
        stats?: { impactScore?: number };
        areaPoints?: Record<string, number>;
        inviteCount?: number;
        supportedNgos?: string[];
        volunteerNgos?: string[];
    };

    // Kullanıcının bağış/destek için seçtiği STK'lar (ngos/[id] "Destekle" akışı yazar).
    const supportedNgoIds = useMemo<string[]>(
        () => {
            const v = (userData as UserDataLike | undefined)?.supportedNgos;
            return Array.isArray(v) ? v : [];
        },
        [userData]
    );
    // Kullanıcının gönüllülük için seçtiği STK'lar (ngos/[id] "Gönüllü Ol" akışı yazar).
    const volunteerNgoIds = useMemo<string[]>(
        () => {
            const v = (userData as UserDataLike | undefined)?.volunteerNgos;
            return Array.isArray(v) ? v : [];
        },
        [userData]
    );

    // Kullanıcının seçtiği sosyal hassasiyetler (volunteerInfo.interests).
    const userInterests = useMemo<string[]>(() => {
        const raw = (userData as { volunteerInfo?: { interests?: string[] } } | undefined)?.volunteerInfo?.interests;
        return Array.isArray(raw) ? raw.filter(s => typeof s === 'string' && s.trim()) : [];
    }, [userData]);

    // PRD: her nitelikli STK seçimi (bağış VEYA gönüllülük) → o STK kategorisinin
    // eşlendiği rozet alanına +10 puan. Bağış seçimi ve gönüllülük seçimi ayrı
    // sinyaller olduğundan ikisi de ayrı ayrı 10 puan kazandırır.
    // Ayrıca her sosyal hassasiyet seçimi (volunteerInfo.interests) ilgili
    // rozet alanına +10 puan kazandırır.
    const selectionAreaPoints = useMemo<Record<string, number>>(() => {
        const totals: Record<string, number> = {};
        const credit = (areaCandidate: string | undefined | null) => {
            const area = mapCategoryToBadgeArea(areaCandidate);
            if (!area) return;
            totals[area] = (totals[area] || 0) + SELECTION_AREA_POINTS;
        };
        for (const id of supportedNgoIds) credit(ngoCategoryById[id]);
        for (const id of volunteerNgoIds) credit(ngoCategoryById[id]);
        // Hassasiyet seçimleri — her biri +10 puan
        for (const interest of userInterests) credit(interest);
        return totals;
    }, [supportedNgoIds, volunteerNgoIds, ngoCategoryById, userInterests]);
    const impactScore: number = Math.max(
        Number((userData as UserDataLike | undefined)?.impactScore) || 0,
        Number((userData as UserDataLike | undefined)?.stats?.impactScore) || 0,
    );

    // Sosyal alan bazında saklı puan haritası: userData.areaPoints[socialArea] = number
    const storedAreaPoints = useMemo<Record<string, number>>(
        () => (userData as UserDataLike | undefined)?.areaPoints || {},
        [userData]
    );
    const inviteCount = Number((userData as UserDataLike | undefined)?.inviteCount) || 0;

    // Gerçek aktiviteden hesaplanan alan puanları (bağış + gönüllülük + davet).
    const computed = useMemo(
        () => computeAreaPoints({ donations, ngoCategoryById, pastVolunteering, inviteCount }),
        [donations, ngoCategoryById, pastVolunteering, inviteCount]
    );

    // PRD birincil sinyali: supportedNgos/volunteerNgos seçimlerinden gelen 10'luk
    // puanlar (selectionAreaPoints) ile bağış/gönüllülük/davet aktivitesinden
    // hesaplanan puanları (computed) topla; ardından saklı puan ile max al.
    // Böylece her alanda gösterilen değer kullanıcının GERÇEK seçimlerini yansıtır,
    // hiçbir nitelikli seçim yoksa 0 kalır.
    const effectiveAreaPoints = useMemo<Record<string, number>>(() => {
        const merged: Record<string, number> = { ...storedAreaPoints };
        const areas = new Set<string>([...Object.keys(computed), ...Object.keys(selectionAreaPoints)]);
        for (const area of areas) {
            const activity = (Number(computed[area]) || 0) + (Number(selectionAreaPoints[area]) || 0);
            merged[area] = Math.max(Number(merged[area]) || 0, activity);
        }
        return merged;
    }, [storedAreaPoints, computed, selectionAreaPoints]);

    // Saklı puan ile etkin puan farklıysa kullanıcı dokümanına yaz (write-if-changed,
    // hata durumunda non-fatal). Giriş yapılmamışsa yazma; sonsuz döngüye karşı JSON karşılaştır.
    useEffect(() => {
        if (!db || !authUser) return;
        const serialize = (m: Record<string, number>) =>
            JSON.stringify(Object.entries(m).sort(([a], [b]) => a.localeCompare(b)));
        if (serialize(storedAreaPoints) === serialize(effectiveAreaPoints)) return;
        (async () => {
            try {
                await updateDoc(doc(db, COLLECTIONS.users, authUser.uid), { areaPoints: effectiveAreaPoints });
            } catch {
                // non-fatal: puan kalıcılaştırması başarısızsa UI yine hesaplanan değerlerle çalışır.
            }
        })();
    }, [db, authUser, storedAreaPoints, effectiveAreaPoints]);

    // Rozetlere effectiveAreaPoints'ten currentPoints + tier-prev hesabı aktar.
    // Profile sayfası ile aynı kaynağı kullanmak için lib/badge-points/enrichBadges
    // çağrılır — her iki sayfa da aynı puanlardan aynı listeyi türetir.
    const enrichedBadges: TierEnrichedBadge[] = useMemo(
        () => enrichBadges(effectiveAreaPoints),
        [effectiveAreaPoints]
    );

    // Sıradaki hedef: en yakın kazanılmamış tier (delta cinsinden kalan puan en az).
    const nextBadge = useMemo<NextBadgeRow | null>(() => {
        const candidates = enrichedBadges
            .filter(b => b.currentPoints < b.pointsRequired)
            .map(b => {
                const tierDelta = Math.max(1, b.pointsRequired - b.prevTierRequired);
                const tierCurrent = Math.max(0, Math.min(tierDelta, b.currentPoints - b.prevTierRequired));
                return {
                    ...b,
                    tierCurrent,
                    tierDelta,
                    tierProgress: Math.min((tierCurrent / tierDelta) * 100, 100),
                    remaining: tierDelta - tierCurrent,
                };
            })
            .sort((a, b) => a.remaining - b.remaining);
        return candidates[0] || null;
    }, [enrichedBadges]);

    // Sosyal alan başlığı altında, seviye sırası ile
    const groupedBadges = useMemo(() => {
        const grouped = groupBy(enrichedBadges, 'socialArea');
        Object.keys(grouped).forEach(area => {
            grouped[area].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
        });
        return grouped;
    }, [enrichedBadges]);

    const earnedCount = enrichedBadges.filter(b => b.currentPoints >= b.pointsRequired).length;

    return (
        <div className="p-4 space-y-8 animate-in fade-in-0 max-w-5xl mx-auto pb-32">
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter font-headline">{t('dashboard.badges.heading')}</h1>
                <p className="text-muted-foreground text-sm font-medium">{t('dashboard.badges.subheading')}</p>
            </div>

            <NextBadgeGoal nextBadge={nextBadge} t={t} />

            <Tabs defaultValue="badges" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/50 p-1.5 rounded-2xl backdrop-blur-xl">
                    <TabsTrigger value="impact-score" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">{t('dashboard.badges.tabImpactScore')}</TabsTrigger>
                    <TabsTrigger value="badges" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">{t('dashboard.badges.tabBadges')}</TabsTrigger>
                    <TabsTrigger value="certificates" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">{t('dashboard.badges.tabCertificates')}</TabsTrigger>
                </TabsList>

                <TabsContent value="impact-score" className="mt-8 space-y-6">
                    <EtkiTabContent
                        user={{
                            impactScore,
                            stats: ((userData as { stats?: Parameters<typeof EtkiTabContent>[0]['user']['stats'] } | undefined)?.stats) || {
                                totalDonation: 0, donationCount: 0, highestSingleDonation: 0, mostSupportedNgo: '-',
                                avgDonation: 0, volunteerHours: 0, completedProjects: 0, mostActiveVolunteerArea: '-',
                                totalImpactValue: 0, volunteerRank: {},
                            },
                        }}
                        earnedBadgeCount={earnedCount}
                        certificateCount={certificates.length}
                        impactCardTitle={t('dashboard.badges.impactTotalLabel')}
                    />
                </TabsContent>

                <TabsContent value="badges" className="mt-8 space-y-12">
                    {enrichedBadges.length === 0 && (
                        <EmptyState
                            icon={Award}
                            title={t('dashboard.badges.emptyTitle')}
                            description={t('dashboard.badges.emptyDesc')}
                            action={{ label: t('dashboard.badges.emptyAction'), href: '/events' }}
                        />
                    )}
                    {Object.entries(groupedBadges).map(([socialArea, areaBadges]) => {
                        const areaCurrent = Number(effectiveAreaPoints[socialArea]) || 0;
                        return (
                            <div key={socialArea} className="space-y-6">
                                <div className="px-1 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight">{socialArea} Alanı</h2>
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                                            Bu alandaki puanın: {areaCurrent.toLocaleString('tr-TR')}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">
                                        {areaBadges.filter(b => b.currentPoints >= b.pointsRequired).length} / {areaBadges.length} Rozet
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                    {areaBadges.map(badge => (
                                        <VectorBadge key={badge.id} badge={badge} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </TabsContent>

                <TabsContent value="certificates" className="mt-8 space-y-4">
                    {!authUser ? (
                        <EmptyState
                            icon={LogIn}
                            title="Sertifikalarını görmek için giriş yap"
                            description="Onaylanan gönüllülük ve etkinlik katılımlarının sertifikaları hesabına bağlıdır."
                            action={{ label: 'Giriş yap', href: '/login' }}
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
                                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleViewCertificate({ title: cert.title, organization: cert.organization, date: cert.date })}>
                                            <Eye className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">Görüntüle</span>
                                        </Button>
                                        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleDownloadCertificate({ title: cert.title, organization: cert.organization, date: cert.date })}>
                                            <Download className="h-4 w-4 sm:mr-2" />
                                            <span className="hidden sm:inline">İndir</span>
                                        </Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="outline" className="rounded-xl">
                                                    <Share2 className="h-4 w-4 sm:mr-2" />
                                                    <span className="hidden sm:inline">Paylaş</span>
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
                                                    <Mail className="mr-2 h-4 w-4" /> E-posta
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
