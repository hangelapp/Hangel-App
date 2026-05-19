'use client';
import { Button } from '@/components/ui/button';
import {
    Globe,
    Palette,
    Code,
    Image as ImageIcon,
    MessageSquare,
    BarChart3,
    Heart,
    HeartHandshake,
    Newspaper,
    Target,
    Shield,
    Phone,
    Building2,
    ArrowLeft,
    Calendar,
    ShoppingCart,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { SectionCard } from './_components/section-card';
import { DomainSection } from './_components/domain-section';
import { ColorsSection } from './_components/colors-section';
import { BannersSection } from './_components/banners-section';
import { PresidentSection } from './_components/president-section';
import { StatsSection } from './_components/stats-section';
import { DonationsSection } from './_components/donations-section';
import {
    AboutSection,
    VolunteeringSection,
    EventsSection,
    EcommerceSection,
    NewsSection,
    SdgSection,
    TransparencySection,
    ContactSection,
} from './_components/simple-link-sections';
import { AnalyticsSection } from './_components/analytics-section';
import { PublishBar } from './_components/publish-bar';
import { checkDnsRecords } from './_components/dns';
import { defaultSections } from './_components/types';
import type { Banner, NgoDoc, NgoSiteBanner, SectionKey } from './_components/types';

export default function WebsiteBuilderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const db = useFirestore();
    const { user: authUser } = useUser();

    // Yönetici olduğu varlığı tespit et (NGO öncelikli)
    const adminNgosQ = useMemoFirebase(
        () => (db && authUser?.uid ? query(collection(db, COLLECTIONS.ngos), where('adminUserId', '==', authUser.uid)) : null),
        [db, authUser?.uid],
    );
    const { data: adminNgos } = useCollection<NgoDoc>(adminNgosQ);
    const userDocRef = useMemoFirebase(
        () => (db && authUser?.uid ? doc(db, COLLECTIONS.users, authUser.uid) : null),
        [db, authUser?.uid],
    );
    const { data: userData } = useDoc<{ managedNgoId?: string }>(userDocRef);
    const fallbackNgoRef = useMemoFirebase(
        () => (db && userData?.managedNgoId ? doc(db, COLLECTIONS.ngos, userData.managedNgoId) : null),
        [db, userData?.managedNgoId],
    );
    const { data: fallbackNgo } = useDoc<NgoDoc>(fallbackNgoRef);

    const ngoData = useMemo(() => (adminNgos && adminNgos[0]) || fallbackNgo || null, [adminNgos, fallbackNgo]);
    const ngoId: string | null = ngoData?.id || null;

    const [sections, setSections] = useState(defaultSections);

    // Content States
    const [primaryColor, setPrimaryColor] = useState('#f34723');
    const [selectedRegistrar, setSelectedRegistrar] = useState('');
    const [domainName, setDomainName] = useState('');
    const [presidentName, setPresidentName] = useState('');
    const [presidentsMessage, setPresidentsMessage] = useState('');
    const [stats, setStats] = useState({ volunteers: '', donors: '', foundedYear: '', activeCampaigns: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [hydrated, setHydrated] = useState(false);

    // Banner State
    const [banners, setBanners] = useState<Banner[]>([]);

    // NGO verisi gelince state'i hydrate et (yalnızca bir kere)
    useEffect(() => {
        if (!ngoData || hydrated) return;
        const s = ngoData.siteSettings || {};
        setSections(prev => ({ ...prev, ...(s.sections || {}) }));
        setPrimaryColor(s.primaryColor || ngoData.primaryColor || '#f34723');
        setSelectedRegistrar(s.registrar || '');
        setDomainName(s.domain || ngoData.website || '');
        setPresidentName(s.presidentName || ngoData.presidentName || '');
        setPresidentsMessage(s.presidentMessage || ngoData.presidentMessage || '');
        setStats({
            volunteers: String(s.stats?.volunteers ?? ngoData.stats?.volunteers ?? ''),
            donors: String(s.stats?.donors ?? ngoData.stats?.donors ?? ''),
            foundedYear: String(s.stats?.foundedYear ?? ngoData.foundedYear ?? ''),
            activeCampaigns: String(s.stats?.activeCampaigns ?? ngoData.stats?.activeCampaigns ?? ''),
        });
        if (Array.isArray(s.banners) && s.banners.length > 0) {
            setBanners(s.banners.map((b: NgoSiteBanner, i: number) => ({
                id: b.id || String(i + 1),
                url: b.url,
                isPrimary: !!b.isPrimary || i === 0,
            })));
        } else if (ngoData.coverUrl) {
            setBanners([{ id: '1', url: ngoData.coverUrl, isPrimary: true }]);
        }
        if (s.publishedAt) {
            try {
                const pub = s.publishedAt as { toDate?: () => Date } | string;
                const d = typeof pub === 'object' && pub.toDate ? pub.toDate() : new Date(pub as string);
                setLastUpdated(d.toLocaleTimeString('tr-TR'));
            } catch {}
        }
        setHydrated(true);
    }, [ngoData, hydrated]);

    const toggleSection = (key: SectionKey) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
        toast({
            title: "Görünüm Güncellendi",
            description: `${String(key).toUpperCase()} bölümü ${!sections[key] ? 'aktif' : 'pasif'} hale getirildi.`,
        });
    };

    const buildPayload = () => ({
        siteSettings: {
            domain: domainName.trim(),
            registrar: selectedRegistrar,
            primaryColor,
            presidentName: presidentName.trim(),
            presidentMessage: presidentsMessage.trim(),
            banners: banners.map(b => ({ id: b.id, url: b.url, isPrimary: b.isPrimary })),
            sections,
            stats: {
                volunteers: Number(stats.volunteers) || 0,
                donors: Number(stats.donors) || 0,
                foundedYear: Number(stats.foundedYear) || 0,
                activeCampaigns: Number(stats.activeCampaigns) || 0,
            },
            updatedAt: serverTimestamp(),
        },
    });

    const handleSave = async (silent = false) => {
        if (!db || !ngoId) {
            toast({ variant: 'destructive', title: 'Yönetici varlık bulunamadı', description: 'Kaydetmek için yönettiğiniz bir STK olmalı.' });
            return false;
        }
        setIsSaving(true);
        try {
            await updateDoc(doc(db, COLLECTIONS.ngos, ngoId), buildPayload() as Record<string, unknown>);
            setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
            if (!silent) {
                toast({ title: 'Tüm Değişiklikler Kaydedildi', description: 'Web siteniz güncel bilgilerle yayına hazır.' });
            }
            return true;
        } catch (err) {
            const e = err as { message?: string };
            toast({ variant: 'destructive', title: 'Kaydedilemedi', description: e?.message || 'Beklenmeyen bir hata oluştu.' });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Kopyalandı",
            description: `${label} başarıyla panoya kopyalandı.`,
        });
    };

    const addBanner = () => {
        const newId = (banners.length + 1).toString();
        setBanners([...banners, { id: newId, url: `https://picsum.photos/seed/banner${newId}/1920/600`, isPrimary: false }]);
        toast({ title: "Yeni Banner Eklendi", description: "Listeye yeni bir görsel alanı tanımlandı." });
    };

    const removeBanner = (id: string) => {
        setBanners(prev => prev.filter(b => b.id !== id));
        toast({ variant: "destructive", title: "Banner Kaldırıldı" });
    };

    const handleBannerReplaceClick = () => {
        toast({ title: "Görsel Değiştir", description: "Dosya seçici açılıyor..." });
    };

    const handleAnalyticsConnect = (providerName: string) => {
        toast({ title: `${providerName} Bağlantısı` });
    };

    const handlePublish = async () => {
        if (!ngoId) {
            toast({ variant: 'destructive', title: 'Yönetici varlık bulunamadı' });
            return;
        }
        if (!domainName.trim()) {
            toast({ variant: 'destructive', title: 'Alan adı eksik', description: 'Yayına almak için Alan Adınızı girin.' });
            return;
        }
        // 1) DNS doğrulaması
        setIsVerifying(true);
        const dns = await checkDnsRecords(domainName.trim());
        setIsVerifying(false);
        if (!dns.ok) {
            toast({
                variant: 'destructive',
                title: 'DNS doğrulanamadı',
                description: dns.error
                    ? dns.error
                    : `Alan adınızın NS kayıtları henüz ns1.hangel.org / ns2.hangel.org değerlerini göstermiyor. Bulunan: ${dns.foundNS.join(', ') || 'kayıt yok'}.`,
            });
            return;
        }
        // 2) Verileri kaydet ve yayın bilgisini ekle
        setIsSaving(true);
        try {
            await updateDoc(doc(db!, 'ngos', ngoId), {
                ...buildPayload(),
                'siteSettings.published': true,
                'siteSettings.publishedAt': serverTimestamp(),
                'siteSettings.dnsVerified': true,
                'siteSettings.dnsVerifiedAt': serverTimestamp(),
            } as Record<string, unknown>);
            setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
            toast({ title: 'Siteniz Yayınlandı!', description: 'DNS doğrulandı, içerikler kaydedildi. Önizleme yeni sekmede açılıyor...' });
            window.open(`/ngo-admin/website/preview?primary=${primaryColor.replace('#', '')}&id=${ngoId}`, '_blank');
        } catch (err) {
            const e = err as { message?: string };
            toast({ variant: 'destructive', title: 'Yayınlama başarısız', description: e?.message || 'Beklenmeyen bir hata oluştu.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0 max-w-5xl mx-auto pb-32">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label="Geri">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Web Sitesi Yönetimi</h1>
                <p className="text-muted-foreground text-sm">
                    {ngoData?.name ? (
                        <><span className="font-semibold text-foreground">{ngoData.name}</span> için web sitesinin görünüm ve içerik ayarları.</>
                    ) : (
                        'Kuruluşunuza özel web sitesinin tüm görünüm ve içerik ayarlarını yönetin.'
                    )}
                </p>
            </div>

            <div className="space-y-6">
                <SectionCard
                    icon={<Globe className="h-5 w-5 text-white" />}
                    iconBg="bg-blue-500"
                    title="Alan Adı (Domain) Ayarları"
                    description="Web sitenizi kurumsal markanıza bağlayın."
                    enabled={sections.domain}
                    onToggle={() => toggleSection('domain')}
                >
                    <DomainSection
                        domainName={domainName}
                        onDomainChange={setDomainName}
                        selectedRegistrar={selectedRegistrar}
                        onRegistrarChange={setSelectedRegistrar}
                        onCopy={copyToClipboard}
                    />
                </SectionCard>

                <SectionCard
                    icon={<Palette className="h-5 w-5 text-white" />}
                    iconBg="bg-gray-500"
                    title="Kurumsal Renk Seçimi"
                    description="Sitenizin ana temasını belirleyecek kurumsal rengi seçin."
                    enabled={sections.colors}
                    onToggle={() => toggleSection('colors')}
                >
                    <ColorsSection primaryColor={primaryColor} onColorChange={setPrimaryColor} />
                </SectionCard>

                <SectionCard
                    icon={<ImageIcon className="h-5 w-5 text-white" />}
                    iconBg="bg-orange-500"
                    title="Görsel Yönetimi (Banner)"
                    description="Web sitesi ana sayfasında dönecek görselleri yönetin."
                    enabled={sections.banners}
                    onToggle={() => toggleSection('banners')}
                >
                    <BannersSection
                        banners={banners}
                        onAdd={addBanner}
                        onRemove={removeBanner}
                        onReplaceClick={handleBannerReplaceClick}
                    />
                </SectionCard>

                <SectionCard
                    icon={<Building2 className="h-5 w-5 text-white" />}
                    iconBg="bg-blue-400"
                    title="Hakkımızda Bölümü"
                    description="Kuruluş hikayesi ve misyon bilgilerini yönetin."
                    enabled={sections.about}
                    onToggle={() => toggleSection('about')}
                >
                    <AboutSection />
                </SectionCard>

                <SectionCard
                    icon={<MessageSquare className="h-5 w-5 text-white" />}
                    iconBg="bg-blue-500"
                    title="Başkanın Mesajı"
                    description="Web sitesi ana sayfasında yer alacak kurumsal mesaj."
                    enabled={sections.president}
                    onToggle={() => toggleSection('president')}
                >
                    <PresidentSection
                        presidentName={presidentName}
                        onPresidentNameChange={setPresidentName}
                        presidentsMessage={presidentsMessage}
                        onPresidentsMessageChange={setPresidentsMessage}
                        onSave={() => handleSave()}
                    />
                </SectionCard>

                <SectionCard
                    icon={<BarChart3 className="h-5 w-5 text-white" />}
                    iconBg="bg-indigo-500"
                    title="Kurumsal İstatistikler"
                    description="Web sitesinde gösterilecek sayaçları yönetin."
                    enabled={sections.stats}
                    onToggle={() => toggleSection('stats')}
                >
                    <StatsSection stats={stats} onStatsChange={setStats} onSave={() => handleSave()} />
                </SectionCard>

                <SectionCard
                    icon={<Heart className="h-5 w-5 text-white" />}
                    iconBg="bg-green-600"
                    title="Bağış ve Destek Yöntemleri"
                    description="Aktif bağış kanallarını yapılandırın."
                    enabled={sections.donations}
                    onToggle={() => toggleSection('donations')}
                >
                    <DonationsSection />
                </SectionCard>

                <SectionCard
                    icon={<HeartHandshake className="h-5 w-5 text-white" />}
                    iconBg="bg-red-500"
                    title="Gönüllülük İlanları"
                    description="İlanların web sitesindeki görünümünü yönetin."
                    enabled={sections.volunteering}
                    onToggle={() => toggleSection('volunteering')}
                >
                    <VolunteeringSection />
                </SectionCard>

                <SectionCard
                    icon={<Calendar className="h-5 w-5 text-white" />}
                    iconBg="bg-rose-500"
                    title="Etkinlik Takvimi"
                    description="Web sitesinde yaklaşan etkinliklerinizi listeleyin."
                    enabled={sections.events}
                    onToggle={() => toggleSection('events')}
                >
                    <EventsSection />
                </SectionCard>

                <SectionCard
                    icon={<ShoppingCart className="h-5 w-5 text-white" />}
                    iconBg="bg-violet-500"
                    title="İktisadi İşletme Mağazası"
                    description="Ürünlerinizi web sitesi vitrininde sergileyin."
                    enabled={sections.ecommerce}
                    onToggle={() => toggleSection('ecommerce')}
                >
                    <EcommerceSection />
                </SectionCard>

                <SectionCard
                    icon={<Newspaper className="h-5 w-5 text-white" />}
                    iconBg="bg-orange-500"
                    title="Haberler ve Duyurular"
                    description="Mini Blog içeriklerini yayına alın."
                    enabled={sections.news}
                    onToggle={() => toggleSection('news')}
                >
                    <NewsSection />
                </SectionCard>

                <SectionCard
                    icon={<Target className="h-5 w-5 text-white" />}
                    iconBg="bg-red-600"
                    title="Küresel Amaçlar (SKA)"
                    description="Desteklediğiniz 17 amacı web sitenizde listeleyin."
                    enabled={sections.sdg}
                    onToggle={() => toggleSection('sdg')}
                >
                    <SdgSection />
                </SectionCard>

                <SectionCard
                    icon={<Shield className="h-5 w-5 text-white" />}
                    iconBg="bg-green-600"
                    title="Şeffaflık Endeksi"
                    description="Güven puanınızı ve belgelerinizi gösterin."
                    enabled={sections.transparency}
                    onToggle={() => toggleSection('transparency')}
                >
                    <TransparencySection />
                </SectionCard>

                <SectionCard
                    icon={<Phone className="h-5 w-5 text-white" />}
                    iconBg="bg-gray-500"
                    title="İletişim Bilgileri"
                    description="İletişim kanallarını yapılandırın."
                    enabled={sections.contact}
                    onToggle={() => toggleSection('contact')}
                >
                    <ContactSection />
                </SectionCard>

                <SectionCard
                    icon={<Code className="h-5 w-5 text-white" />}
                    iconBg="bg-sky-500"
                    title="Web Analiz Araçları"
                    description="Takip kodlarını sitenize entegre edin."
                    enabled={sections.analytics}
                    onToggle={() => toggleSection('analytics')}
                >
                    <AnalyticsSection onConnectClick={handleAnalyticsConnect} onSave={() => handleSave()} />
                </SectionCard>
            </div>

            <PublishBar
                lastUpdated={lastUpdated}
                isSaving={isSaving}
                isVerifying={isVerifying}
                onPublish={handlePublish}
            />
        </div>
    );
}
