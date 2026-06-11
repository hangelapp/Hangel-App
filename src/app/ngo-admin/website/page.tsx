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
import { useFirestore, useUser } from '@/firebase';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { useTranslation } from '@/components/providers/language-provider';
import { SectionCard } from './_components/section-card';
import { DomainSection } from './_components/domain-section';
import { CustomDomainSection } from './_components/custom-domain-section';
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
    const { t } = useTranslation();
    const db = useFirestore();
    useUser();

    // Aktif kurum (ActiveEntityProvider) — banner ve sayfa içeriği tek kaynak.
    // Website builder yalnızca NGO için anlamlı; aktif kurum NGO değilse null bırakılır.
    const { id: activeIdFromCtx, kind: activeKind } = useActiveEntity();
    const { data: activeDoc } = useActiveEntityDoc<NgoDoc>();
    const ngoData = useMemo(() => (activeKind === 'ngo' && activeDoc ? activeDoc : null), [activeKind, activeDoc]);
    const ngoId: string | null = activeKind === 'ngo' ? activeIdFromCtx : null;

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
        const state = !sections[key] ? t('ngo_admin_website.toggleActive') : t('ngo_admin_website.togglePassive');
        toast({
            title: t('ngo_admin_website.toggleTitle'),
            description: t('ngo_admin_website.toggleDescription').replace('{section}', String(key).toUpperCase()).replace('{state}', state),
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
            toast({ variant: 'destructive', title: t('ngo_admin_website.noEntityTitle'), description: t('ngo_admin_website.noEntityDescription') });
            return false;
        }
        setIsSaving(true);
        try {
            await updateDoc(doc(db, COLLECTIONS.ngos, ngoId), buildPayload() as Record<string, unknown>);
            setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
            if (!silent) {
                toast({ title: t('ngo_admin_website.saveSuccessTitle'), description: t('ngo_admin_website.saveSuccessDescription') });
            }
            return true;
        } catch (err) {
            const e = err as { message?: string };
            toast({ variant: 'destructive', title: t('ngo_admin_website.saveErrorTitle'), description: e?.message || t('ngo_admin_website.saveErrorDefault') });
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: t('ngo_admin_website.copiedTitle'),
            description: t('ngo_admin_website.copiedDescription').replace('{label}', label),
        });
    };

    const addBanner = () => {
        const newId = (banners.length + 1).toString();
        setBanners([...banners, { id: newId, url: `https://picsum.photos/seed/banner${newId}/1920/600`, isPrimary: false }]);
        toast({ title: t('ngo_admin_website.bannerAddedTitle'), description: t('ngo_admin_website.bannerAddedDescription') });
    };

    const removeBanner = (id: string) => {
        setBanners(prev => prev.filter(b => b.id !== id));
        toast({ variant: "destructive", title: t('ngo_admin_website.bannerRemovedTitle') });
    };

    const handleBannerReplaceClick = () => {
        toast({ title: t('ngo_admin_website.bannerReplaceTitle'), description: t('ngo_admin_website.bannerReplaceDescription') });
    };

    const handleAnalyticsConnect = (providerName: string) => {
        toast({ title: t('ngo_admin_website.analyticsConnectTitle').replace('{provider}', providerName) });
    };

    const handlePublish = async () => {
        if (!ngoId) {
            toast({ variant: 'destructive', title: t('ngo_admin_website.publishNoEntityTitle') });
            return;
        }
        if (!domainName.trim()) {
            toast({ variant: 'destructive', title: t('ngo_admin_website.publishMissingDomainTitle'), description: t('ngo_admin_website.publishMissingDomainDescription') });
            return;
        }
        // 1) DNS doğrulaması
        setIsVerifying(true);
        const dns = await checkDnsRecords(domainName.trim());
        setIsVerifying(false);
        if (!dns.ok) {
            toast({
                variant: 'destructive',
                title: t('ngo_admin_website.publishDnsErrorTitle'),
                description: dns.error
                    ? dns.error
                    : t('ngo_admin_website.publishDnsErrorDescription').replace('{found}', dns.foundNS.join(', ') || t('ngo_admin_website.publishDnsErrorEmpty')),
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
            toast({ title: t('ngo_admin_website.publishSuccessTitle'), description: t('ngo_admin_website.publishSuccessDescription') });
            window.open(`/ngo-admin/website/preview?primary=${primaryColor.replace('#', '')}&id=${ngoId}`, '_blank');
        } catch (err) {
            const e = err as { message?: string };
            toast({ variant: 'destructive', title: t('ngo_admin_website.publishFailedTitle'), description: e?.message || t('ngo_admin_website.saveErrorDefault') });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0 max-w-5xl mx-auto pb-32">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('ngo_admin_website.backAria')}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">{t('ngo_admin_website.heading')}</h1>
                <p className="text-muted-foreground text-sm">
                    {ngoData?.name ? (
                        <><span className="font-semibold text-foreground">{ngoData.name}</span> {t('ngo_admin_website.subheadingForName')}</>
                    ) : (
                        t('ngo_admin_website.subheadingDefault')
                    )}
                </p>
            </div>

            <div className="space-y-6">
                <SectionCard
                    icon={<Globe className="h-5 w-5 text-white" />}
                    iconBg="bg-blue-500"
                    title={t('ngo_admin_website.sectionDomainTitle')}
                    description={t('ngo_admin_website.sectionDomainDescription')}
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
                    {ngoId && (
                        <div className="mt-6 pt-6 border-t">
                            <CustomDomainSection
                                ngoId={ngoId}
                                initial={(ngoData?.siteSettings as { customDomain?: { hostname?: string; status?: string; sslStatus?: string; cnameTarget?: string } } | undefined)?.customDomain}
                            />
                        </div>
                    )}
                </SectionCard>

                <SectionCard
                    icon={<Palette className="h-5 w-5 text-white" />}
                    iconBg="bg-gray-500"
                    title={t('ngo_admin_website.sectionColorsTitle')}
                    description={t('ngo_admin_website.sectionColorsDescription')}
                    enabled={sections.colors}
                    onToggle={() => toggleSection('colors')}
                >
                    <ColorsSection primaryColor={primaryColor} onColorChange={setPrimaryColor} />
                </SectionCard>

                <SectionCard
                    icon={<ImageIcon className="h-5 w-5 text-white" />}
                    iconBg="bg-orange-500"
                    title={t('ngo_admin_website.sectionBannersTitle')}
                    description={t('ngo_admin_website.sectionBannersDescription')}
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
                    title={t('ngo_admin_website.sectionAboutTitle')}
                    description={t('ngo_admin_website.sectionAboutDescription')}
                    enabled={sections.about}
                    onToggle={() => toggleSection('about')}
                >
                    <AboutSection />
                </SectionCard>

                <SectionCard
                    icon={<MessageSquare className="h-5 w-5 text-white" />}
                    iconBg="bg-blue-500"
                    title={t('ngo_admin_website.sectionPresidentTitle')}
                    description={t('ngo_admin_website.sectionPresidentDescription')}
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
                    title={t('ngo_admin_website.sectionStatsTitle')}
                    description={t('ngo_admin_website.sectionStatsDescription')}
                    enabled={sections.stats}
                    onToggle={() => toggleSection('stats')}
                >
                    <StatsSection stats={stats} onStatsChange={setStats} onSave={() => handleSave()} />
                </SectionCard>

                <SectionCard
                    icon={<Heart className="h-5 w-5 text-white" />}
                    iconBg="bg-green-600"
                    title={t('ngo_admin_website.sectionDonationsTitle')}
                    description={t('ngo_admin_website.sectionDonationsDescription')}
                    enabled={sections.donations}
                    onToggle={() => toggleSection('donations')}
                >
                    <DonationsSection />
                </SectionCard>

                <SectionCard
                    icon={<HeartHandshake className="h-5 w-5 text-white" />}
                    iconBg="bg-red-500"
                    title={t('ngo_admin_website.sectionVolunteeringTitle')}
                    description={t('ngo_admin_website.sectionVolunteeringDescription')}
                    enabled={sections.volunteering}
                    onToggle={() => toggleSection('volunteering')}
                >
                    <VolunteeringSection />
                </SectionCard>

                <SectionCard
                    icon={<Calendar className="h-5 w-5 text-white" />}
                    iconBg="bg-rose-500"
                    title={t('ngo_admin_website.sectionEventsTitle')}
                    description={t('ngo_admin_website.sectionEventsDescription')}
                    enabled={sections.events}
                    onToggle={() => toggleSection('events')}
                >
                    <EventsSection />
                </SectionCard>

                <SectionCard
                    icon={<ShoppingCart className="h-5 w-5 text-white" />}
                    iconBg="bg-violet-500"
                    title={t('ngo_admin_website.sectionEcommerceTitle')}
                    description={t('ngo_admin_website.sectionEcommerceDescription')}
                    enabled={sections.ecommerce}
                    onToggle={() => toggleSection('ecommerce')}
                >
                    <EcommerceSection />
                </SectionCard>

                <SectionCard
                    icon={<Newspaper className="h-5 w-5 text-white" />}
                    iconBg="bg-orange-500"
                    title={t('ngo_admin_website.sectionNewsTitle')}
                    description={t('ngo_admin_website.sectionNewsDescription')}
                    enabled={sections.news}
                    onToggle={() => toggleSection('news')}
                >
                    <NewsSection />
                </SectionCard>

                <SectionCard
                    icon={<Target className="h-5 w-5 text-white" />}
                    iconBg="bg-red-600"
                    title={t('ngo_admin_website.sectionSdgTitle')}
                    description={t('ngo_admin_website.sectionSdgDescription')}
                    enabled={sections.sdg}
                    onToggle={() => toggleSection('sdg')}
                >
                    <SdgSection />
                </SectionCard>

                <SectionCard
                    icon={<Shield className="h-5 w-5 text-white" />}
                    iconBg="bg-green-600"
                    title={t('ngo_admin_website.sectionTransparencyTitle')}
                    description={t('ngo_admin_website.sectionTransparencyDescription')}
                    enabled={sections.transparency}
                    onToggle={() => toggleSection('transparency')}
                >
                    <TransparencySection />
                </SectionCard>

                <SectionCard
                    icon={<Phone className="h-5 w-5 text-white" />}
                    iconBg="bg-gray-500"
                    title={t('ngo_admin_website.sectionContactTitle')}
                    description={t('ngo_admin_website.sectionContactDescription')}
                    enabled={sections.contact}
                    onToggle={() => toggleSection('contact')}
                >
                    <ContactSection />
                </SectionCard>

                <SectionCard
                    icon={<Code className="h-5 w-5 text-white" />}
                    iconBg="bg-sky-500"
                    title={t('ngo_admin_website.sectionAnalyticsTitle')}
                    description={t('ngo_admin_website.sectionAnalyticsDescription')}
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
