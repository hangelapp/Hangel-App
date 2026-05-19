'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { X, Sparkles, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import {
    TrendingUp, Users, Heart, HeartHandshake,
    Newspaper, ShieldCheck, Building2, Loader2,
} from 'lucide-react';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, query, updateDoc, where } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { COLLECTIONS } from '@/firebase/collections';

export type ImpactSlide = {
  id: string;
  title: string;
  subtitle: string;
  content: string;
  icon: React.ComponentType<{ className?: string }>;
  stat?: string;
  background?: string;
};

const STORY_DURATION = 5000;

type EntityKind = 'ngo' | 'brand' | 'club';
interface EntityDoc {
  id: string;
  name?: string;
  adminUserId?: string;
  coverUrl?: string;
  avatarUrl?: string;
  logoUrl?: string;
}
interface UserDocData {
  id?: string;
  managedNgoId?: string;
  managedBrandId?: string;
  managedClubId?: string;
  supportedNgos?: string[];
  volunteerNgos?: string[];
  followedBrands?: string[];
}
interface DonationDoc {
  id?: string;
  ngoIds?: string[];
  brandId?: string;
  brandName?: string;
  userId?: string;
  donationAmount?: string | number;
  amount?: string | number;
}
interface OpportunityDoc {
  id?: string;
  status?: string;
  volunteerCount?: { applications?: number };
}
interface PostDoc {
  id?: string;
}
interface TransparencyDoc {
  id?: string;
}
type ManagedEntity = { kind: EntityKind; id: string; name: string; data: EntityDoc };

function StoryViewer() {
    const router = useRouter();
    const { toast } = useToast();

    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [coverOverride, setCoverOverride] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const { user: authUser } = useUser();
    const db = useFirestore();

    // Yönetici olduğu varlığı tespit et
    const adminNgosQ = useMemoFirebase(
      () => (db && authUser?.uid ? query(collection(db, COLLECTIONS.ngos), where('adminUserId', '==', authUser.uid)) : null),
      [db, authUser?.uid],
    );
    const adminBrandsQ = useMemoFirebase(
      () => (db && authUser?.uid ? query(collection(db, COLLECTIONS.brands), where('adminUserId', '==', authUser.uid)) : null),
      [db, authUser?.uid],
    );
    const adminClubsQ = useMemoFirebase(
      () => (db && authUser?.uid ? query(collection(db, COLLECTIONS.clubs), where('adminUserId', '==', authUser.uid)) : null),
      [db, authUser?.uid],
    );
    const { data: adminNgos, isLoading: ngosLoading } = useCollection<EntityDoc>(adminNgosQ);
    const { data: adminBrands, isLoading: brandsLoading } = useCollection<EntityDoc>(adminBrandsQ);
    const { data: adminClubs, isLoading: clubsLoading } = useCollection<EntityDoc>(adminClubsQ);

    const userDocRef = useMemoFirebase(
      () => (db && authUser?.uid ? doc(db, COLLECTIONS.users, authUser.uid) : null),
      [db, authUser?.uid],
    );
    const { data: userData } = useDoc<UserDocData>(userDocRef);

    const fallbackNgoRef = useMemoFirebase(
      () => (db && userData?.managedNgoId ? doc(db, COLLECTIONS.ngos, userData.managedNgoId) : null),
      [db, userData?.managedNgoId],
    );
    const fallbackBrandRef = useMemoFirebase(
      () => (db && userData?.managedBrandId ? doc(db, COLLECTIONS.brands, userData.managedBrandId) : null),
      [db, userData?.managedBrandId],
    );
    const fallbackClubRef = useMemoFirebase(
      () => (db && userData?.managedClubId ? doc(db, COLLECTIONS.clubs, userData.managedClubId) : null),
      [db, userData?.managedClubId],
    );
    const { data: fallbackNgo } = useDoc<EntityDoc>(fallbackNgoRef);
    const { data: fallbackBrand } = useDoc<EntityDoc>(fallbackBrandRef);
    const { data: fallbackClub } = useDoc<EntityDoc>(fallbackClubRef);

    const activeEntity = useMemo<ManagedEntity | null>(() => {
        const ngo = (adminNgos && adminNgos[0]) || fallbackNgo;
        if (ngo?.id) return { kind: 'ngo', id: ngo.id, name: ngo.name || 'STK', data: ngo };
        const brand = (adminBrands && adminBrands[0]) || fallbackBrand;
        if (brand?.id) return { kind: 'brand', id: brand.id, name: brand.name || 'Marka', data: brand };
        const club = (adminClubs && adminClubs[0]) || fallbackClub;
        if (club?.id) return { kind: 'club', id: club.id, name: club.name || 'Kulüp', data: club };
        return null;
    }, [adminNgos, adminBrands, adminClubs, fallbackNgo, fallbackBrand, fallbackClub]);

    // İlgili koleksiyonları topla
    const allUsersQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.users) : null), [db]);
    const { data: allUsers } = useCollection<UserDocData>(allUsersQ);

    const donationsQ = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.donations) : null), [db]);
    const { data: allDonations } = useCollection<DonationDoc>(donationsQ);

    const volunteeringQ = useMemoFirebase(
      () => (db && activeEntity?.kind === 'ngo' ? query(collection(db, COLLECTIONS.volunteering), where('ngoId', '==', activeEntity.id)) : null),
      [db, activeEntity?.kind, activeEntity?.id],
    );
    const { data: opportunities } = useCollection<OpportunityDoc>(volunteeringQ);

    const postsQ = useMemoFirebase(
      () => (db && authUser?.uid ? query(collection(db, COLLECTIONS.posts), where('authorId', '==', authUser.uid)) : null),
      [db, authUser?.uid],
    );
    const { data: posts } = useCollection<PostDoc>(postsQ);

    const transparencyQ = useMemoFirebase(
      () => (db && activeEntity?.kind === 'ngo' ? query(collection(db, COLLECTIONS.transparency), where('ngoId', '==', activeEntity.id)) : null),
      [db, activeEntity?.kind, activeEntity?.id],
    );
    const { data: transparencyItems } = useCollection<TransparencyDoc>(transparencyQ);

    // İstatistikleri hesapla
    const stats = useMemo(() => {
        const id = activeEntity?.id;
        if (!id) return null;

        // Bu varlığa yapılan bağışlar
        const matchingDonations = (allDonations || []).filter((d) => {
            if (Array.isArray(d.ngoIds) && d.ngoIds.includes(id)) return true;
            if (activeEntity?.kind === 'brand' && (d.brandId === id || d.brandName === activeEntity.name)) return true;
            return false;
        });
        const totalDonationAmount = matchingDonations.reduce((sum: number, d) => {
            const amt = parseFloat(String(d.donationAmount || d.amount || '0'));
            return sum + (isNaN(amt) ? 0 : amt);
        }, 0);
        const donorIds = new Set(matchingDonations.map((d) => d.userId).filter(Boolean));

        // Destekçi & gönüllüler
        const supporterCount = (allUsers || []).filter((u) => {
            if (activeEntity?.kind === 'ngo') {
              return (Array.isArray(u.supportedNgos) && u.supportedNgos.includes(id))
                || (Array.isArray(u.volunteerNgos) && u.volunteerNgos.includes(id));
            }
            if (activeEntity?.kind === 'brand') {
              return Array.isArray(u.followedBrands) && u.followedBrands.includes(id);
            }
            return false;
        }).length;
        const volunteerCount = (allUsers || []).filter((u) =>
            Array.isArray(u.volunteerNgos) && u.volunteerNgos.includes(id),
        ).length;

        // Açık ilanlar
        const openOpportunities = (opportunities || []).filter((o) =>
            o.status === 'Aktif' || o.status === 'Yayında',
        ).length;
        const totalOpportunities = (opportunities || []).length;
        const totalApplications = (opportunities || []).reduce((s: number, o) =>
            s + (o.volunteerCount?.applications || 0), 0);

        const postsCount = (posts || []).length;
        const transparencyCount = (transparencyItems || []).length;

        return {
            totalDonationAmount,
            donorCount: donorIds.size,
            supporterCount,
            volunteerCount,
            openOpportunities,
            totalOpportunities,
            totalApplications,
            postsCount,
            transparencyCount,
        };
    }, [activeEntity, allUsers, allDonations, opportunities, posts, transparencyItems]);

    // Story slide'larını oluştur
    const stories = useMemo<ImpactSlide[]>(() => {
        if (!activeEntity || !stats) return [];

        const slides: ImpactSlide[] = [];

        // 1) Kapak — varlığın adı
        slides.push({
            id: 'cover',
            title: activeEntity.name,
            subtitle: activeEntity.kind === 'ngo' ? 'STK Etki Raporu' : activeEntity.kind === 'brand' ? 'Marka Etki Raporu' : 'Kulüp Etki Raporu',
            content: 'Birlikte yarattığımız değişimi rakamlarla anlatıyoruz.',
            icon: Building2,
            background: coverOverride || activeEntity.data?.coverUrl || activeEntity.data?.avatarUrl || activeEntity.data?.logoUrl,
        });

        // 2) Bağış toplam tutarı
        if (stats.totalDonationAmount > 0) {
            slides.push({
                id: 'donations',
                title: 'Toplam Bağış',
                subtitle: 'Finansal Destek',
                content: `${stats.donorCount.toLocaleString('tr-TR')} bağışçı aracılığıyla toplam ${stats.totalDonationAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺ destek aldık.`,
                stat: `₺${stats.totalDonationAmount.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`,
                icon: Heart,
            });
        }

        // 3) Destekçi/gönüllü sayısı
        if (stats.supporterCount > 0 || stats.volunteerCount > 0) {
            slides.push({
                id: 'supporters',
                title: activeEntity.kind === 'brand' ? 'Takipçilerimiz' : 'Destekçilerimiz',
                subtitle: 'Topluluğumuz',
                content: activeEntity.kind === 'brand'
                    ? `${stats.supporterCount.toLocaleString('tr-TR')} kişi sizi takip ediyor.`
                    : `${stats.supporterCount.toLocaleString('tr-TR')} destekçi, bunların ${stats.volunteerCount.toLocaleString('tr-TR')}'i aktif gönüllü.`,
                stat: stats.supporterCount.toLocaleString('tr-TR'),
                icon: Users,
            });
        }

        // 4) Gönüllülük ilanları (yalnızca NGO)
        if (activeEntity.kind === 'ngo' && stats.totalOpportunities > 0) {
            slides.push({
                id: 'opportunities',
                title: 'Gönüllülük İlanları',
                subtitle: 'Sahada İhtiyaç',
                content: `Toplam ${stats.totalOpportunities} ilan yayınladık, ${stats.totalApplications.toLocaleString('tr-TR')} başvuru aldık. Şu anda ${stats.openOpportunities} aktif ilan var.`,
                stat: stats.openOpportunities.toString(),
                icon: HeartHandshake,
            });
        }

        // 5) Gönderiler
        if (stats.postsCount > 0) {
            slides.push({
                id: 'posts',
                title: 'Paylaşımlarımız',
                subtitle: 'Topluluk İletişimi',
                content: `Topluluğumuzla ${stats.postsCount.toLocaleString('tr-TR')} gönderi paylaştık.`,
                stat: stats.postsCount.toString(),
                icon: Newspaper,
            });
        }

        // 6) Şeffaflık (yalnızca NGO)
        if (activeEntity.kind === 'ngo' && stats.transparencyCount > 0) {
            slides.push({
                id: 'transparency',
                title: 'Şeffaflık Endeksi',
                subtitle: 'Hesap Veriyoruz',
                content: `${stats.transparencyCount} kayıtlı şeffaflık girişimiz ile hesap verme sorumluluğumuzu sürdürüyoruz.`,
                stat: stats.transparencyCount.toString(),
                icon: ShieldCheck,
            });
        }

        // 7) Kapanış — kayda değer veri yoksa bile en az bu görünür
        slides.push({
            id: 'closing',
            title: 'Birlikte Daha Güçlüyüz',
            subtitle: activeEntity.name,
            content: 'Hangel topluluğuyla iyiliği büyütmeye devam ediyoruz.',
            icon: TrendingUp,
        });

        return slides;
    }, [activeEntity, stats, coverOverride]);

    const handleClose = useCallback(() => router.back(), [router]);

    const handleCoverUpload = useCallback(async (file: File) => {
        if (!activeEntity || !db) return;
        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'Maksimum 5MB yükleyebilirsiniz.' });
            return;
        }
        if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) {
            toast({ variant: 'destructive', title: 'Geçersiz format', description: 'Sadece JPG, PNG, WebP veya SVG kabul edilir.' });
            return;
        }
        setUploading(true);
        const collectionName = activeEntity.kind === 'ngo'
            ? 'ngos' : activeEntity.kind === 'brand' ? 'brands' : 'clubs';
        try {
            // 1) Firebase Storage'a yükle
            const storage = getStorage(getApp());
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `impact-stories/${activeEntity.id}/${Date.now()}-${safeName}`;
            const ref = storageRef(storage, path);
            await uploadBytes(ref, file, { contentType: file.type });
            const url = await getDownloadURL(ref);
            await updateDoc(doc(db, collectionName, activeEntity.id), { coverUrl: url });
            setCoverOverride(url);
            toast({ title: 'Kapak güncellendi', description: 'Etki hikayeniz için yeni kapak yüklendi.' });
        } catch (err) {
            console.warn('Storage upload failed, falling back to Base64:', err);
            const sErr = err as { code?: string };
            // 2) Base64 fallback (max 500KB)
            if (file.size > 500 * 1024) {
                toast({
                    variant: 'destructive',
                    title: 'Görsel yüklenemedi',
                    description: sErr?.code === 'storage/unauthorized'
                        ? 'Kapak yükleme izniniz yok ve dosya 500KB üzerinde. Lütfen dosyayı küçültün veya Hangel ekibi ile iletişime geçin.'
                        : 'Storage yüklemesi başarısız. Maksimum 500KB önerilir, dosyayı küçültün.',
                });
                setUploading(false);
                return;
            }
            try {
                const reader = new FileReader();
                const dataUrl: string = await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => reject(reader.error);
                    reader.readAsDataURL(file);
                });
                await updateDoc(doc(db, collectionName, activeEntity.id), { coverUrl: dataUrl });
                setCoverOverride(dataUrl);
                toast({ title: 'Base64 olarak kaydedildi', description: 'Storage erişilemediği için görsel Base64 olarak gömüldü.' });
            } catch (fallbackErr) {
                console.error('Base64 fallback failed:', fallbackErr);
                toast({ variant: 'destructive', title: 'Yükleme başarısız', description: 'Görsel kaydedilemedi.' });
            }
        } finally {
            setUploading(false);
        }
    }, [activeEntity, db, toast]);

    useEffect(() => {
        if (!api) return;
        setCurrent(api.selectedScrollSnap() + 1);
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap() + 1);
        });
    }, [api]);

    const handleNext = useCallback(() => {
        if (!api) return;
        if (api.canScrollNext()) api.scrollNext();
        else handleClose();
    }, [api, handleClose]);

    const handlePrev = useCallback(() => {
        if (!api) return;
        api.scrollPrev();
    }, [api]);

    const isLoading = ngosLoading || brandsLoading || clubsLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full bg-white">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!activeEntity) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-white p-8 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="font-bold text-lg mb-2">Etki Hikayesi Hazır Değil</p>
                <p className="text-sm text-muted-foreground mb-6">
                    Etki hikayesi oluşturulabilmesi için bir varlığın yöneticisi olmanız gerekiyor.
                </p>
                <Button onClick={handleClose} variant="outline">Kapat</Button>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-white md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            {/* Progress Bars */}
            <div className="absolute top-4 inset-x-4 flex gap-1.5 z-50">
                {stories.map((_, idx) => (
                    <div key={`${idx}-${current === idx + 1}`} className="h-1 flex-1 bg-black/5 rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full bg-primary transition-all",
                                idx < current - 1 && "w-full",
                                idx === current - 1 && "animate-story-progress"
                            )}
                            style={{ animationDuration: `${STORY_DURATION}ms` }}
                            onAnimationEnd={(e) => {
                                if (e.animationName === 'story-progress') {
                                    handleNext();
                                }
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="absolute top-10 inset-x-4 px-2 flex justify-between items-center z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/80 backdrop-blur-xl flex items-center justify-center border shadow-sm overflow-hidden">
                        {activeEntity.data?.avatarUrl || activeEntity.data?.logoUrl ? (
                            <Image src={activeEntity.data.avatarUrl || activeEntity.data.logoUrl || ''} alt={activeEntity.name} width={40} height={40} className="object-cover h-full w-full" />
                        ) : (
                            <HangelLogo className="text-xl" />
                        )}
                    </div>
                    <div className="text-left drop-shadow-sm">
                        <p className="font-black text-xs uppercase tracking-widest text-foreground">
                            {stories[current - 1]?.subtitle || activeEntity.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {stories[current - 1]?.id === 'cover' && (
                        <>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                className="hidden"
                                onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleCoverUpload(f);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                            />
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={uploading}
                                className="text-foreground hover:bg-black/5 rounded-full h-10 w-10 backdrop-blur-md bg-white/40 border shadow-sm"
                                onClick={() => fileInputRef.current?.click()}
                                aria-label="Kapak görseli yükle"
                            >
                                {uploading
                                    ? <Loader2 className="h-5 w-5 animate-spin" />
                                    : <Camera className="h-5 w-5" />}
                            </Button>
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-foreground hover:bg-black/5 rounded-full h-10 w-10 backdrop-blur-md bg-white/40 border shadow-sm"
                        onClick={handleClose}
                        aria-label="Kapat"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Click Nav Regions */}
            <div className="absolute inset-0 z-30 flex">
                <div className="w-1/3 h-full cursor-pointer" onClick={handlePrev} />
                <div className="w-2/3 h-full cursor-pointer" onClick={handleNext} />
            </div>

            <Carousel setApi={setApi} className="w-full h-full">
                <CarouselContent className="h-full">
                    {stories.map((slide) => {
                        const Icon = slide.icon;
                        return (
                            <CarouselItem key={slide.id} className="h-full">
                                <div className="w-full h-full flex flex-col bg-white">
                                    <div className="relative flex-1 w-full min-h-0 bg-gradient-to-br from-primary/15 via-primary/5 to-background">
                                        {slide.background && (
                                            <Image
                                                src={slide.background}
                                                alt={slide.title}
                                                fill
                                                className="object-cover"
                                                priority
                                            />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-white" />
                                    </div>
                                    <div className="p-6 md:p-10 text-foreground bg-white border-t border-black/5 relative z-10 overflow-y-auto">
                                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                                                <Icon className="h-7 w-7" />
                                            </div>
                                            <h2 className="text-2xl md:text-4xl font-black tracking-tighter leading-[1.05] mb-4 break-words">
                                                {slide.title}
                                            </h2>
                                            <p className="text-base md:text-lg text-muted-foreground leading-relaxed font-medium whitespace-pre-wrap break-words">
                                                {slide.content}
                                            </p>
                                            {slide.stat && (
                                                <div className="mt-8 pt-8 border-t border-black/5">
                                                    <p className="text-6xl md:text-7xl font-black tracking-tighter text-primary">{slide.stat}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CarouselItem>
                        )
                    })}
                </CarouselContent>
            </Carousel>
        </div>
    );
}

export default function ImpactStoryPage() {
    return (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-0 md:p-8 backdrop-blur-sm">
            <div className="relative w-full max-w-[450px] h-full max-h-full md:max-h-[850px] aspect-[9/16] bg-white rounded-none md:rounded-[3rem] overflow-hidden">
                <Suspense fallback={<div className="flex items-center justify-center h-full bg-white"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
                    <StoryViewer />
                </Suspense>
            </div>
        </div>
    );
}
