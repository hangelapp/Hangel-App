'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, ImageIcon, X, Pencil, Plus, Trash2, FilePlus2, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useTranslation } from '@/components/providers/language-provider';

// Sayfa slug'larından, sayfanın yayında kullandığı varsayılan metne eşleme.
// Düzenle dialog'u, CMS override boşken bu değerlerle form'u pre-populate eder
// → kullanıcı yayındaki içeriği görüp düzenleyebilir.
//
// Değer formatı:
//   • `marketing.*` ile başlıyorsa: translation key — t() ile resolve edilir
//     (pages source-of-truth bu key'leri `marketing.*` namespace'inden okur,
//     örn. logo-usage/page.tsx:449 → drift olmaz)
//   • Diğer durumda: literal TR metin (pages dosyasındaki hardcoded fallback
//     ile birebir, örn. yatirimci-iliskileri/page.tsx:77 `cms.title || '...'`)
//
// Bilinmeyen slug → boş varsayılan (mevcut davranış, regresyon yok).
const PAGE_DEFAULT_KEYS: Record<string, { title?: string; subtitle?: string; description?: string }> = {
    // --- Translation key kaynaklı (10 sayfa, t() ile çekilir) ---
    'social-impact': {
        title: 'marketing.socialImpact.heroTitleFallback',
        subtitle: 'marketing.socialImpact.heroSubtitleFallback',
        description: 'marketing.socialImpact.heroDescriptionFallback',
    },
    'press': {
        title: 'marketing.press.heroTitleFallback',
        description: 'marketing.press.heroDescriptionFallback',
    },
    'careers': {
        title: 'marketing.careers.heroTitle',
        subtitle: 'marketing.careers.heroSubtitle',
        description: 'marketing.careers.heroDescription',
    },
    'logo-usage': {
        title: 'marketing.logo.heroTitle',
        description: 'marketing.logo.heroDescription',
    },
    'support': {
        title: 'marketing.support.heroTitleFallback',
        description: 'marketing.support.heroDescriptionFallback',
    },
    'merchant': {
        title: 'marketing.merchant.heroTitle',
        subtitle: 'marketing.merchant.heroSubtitle',
        description: 'marketing.merchant.heroDescription',
    },
    'campus-advantages': {
        title: 'marketing.campus.heroTitleFallback',
        description: 'marketing.campus.heroDescriptionFallback',
    },
    'ngo-onboarding': {
        title: 'marketing.ngoOnboarding.heroTitleFallback',
        description: 'marketing.ngoOnboarding.heroDescriptionFallback',
    },
    'accessibility': {
        title: 'marketing.accessibility.heroTitleFallback',
        description: 'marketing.accessibility.heroDescriptionFallback',
    },
    'bilgi-toplumu-hizmetleri': {
        title: 'marketing.info.heroTitleFallback',
        description: 'marketing.info.heroDescriptionFallback',
    },
    // --- Literal text kaynaklı (page'deki hardcoded fallback ile birebir) ---
    'yatirimci-iliskileri': {
        title: 'Şeffaf Finansal Gelecek.',
        subtitle: 'Sosyal etkinin ekonomik değeri.',
        description: "hangel'in sürdürülebilir iş modeli, elde edilen gelirlerin %85'inin toplumsal faydaya aktarıldığı, kâr amacı gütmeyen kuruluşlarla ticari ekosistemi buluşturan bir yapıdır.",
    },
    'social-entrepreneurship': {
        title: 'Kârın Amacı: Toplumsal Fayda.',
        subtitle: 'Sosyal Girişim Nedir?',
        description: 'Bir sosyal girişim, ticari faaliyetlerden elde ettiği geliri öncelikli olarak toplumsal veya çevresel bir sorunu çözmek için kullanan bir iş modelidir. Geleneksel şirketlerden farkı, kârı maksimize etmek yerine etkiyi maksimize etmesidir.',
    },
    'standards': {
        title: 'Standartlarına Uyum sağladığımız Sertifikasyon Kurumları.',
        description: 'hangel, teknoloji ve sosyal fayda arasındaki köprüyü uluslararası otoritelerin belirlediği en sıkı standartlarla inşaa eder. Güvenimiz, uyum sağladığımız bu ilkelerden gelir.',
    },
    'support-app-support': {
        title: 'Uygulama Destek Merkezi',
        description: 'Sıkça sorulan sorulara göz atın veya bizimle iletişime geçin.',
    },
    'feedback': {
        title: 'Fikirleriniz Değerli.',
        description: 'Platformumuzu her geçen gün sizinle birlikte geliştiriyoruz. Deneyimlerinizi bizimle paylaşın.',
    },
    'corporate': {
        title: 'Kamu ve Özel Sektör için Değer Üretiyoruz.',
        subtitle: 'hangel Kurumsal Çözümler',
        description: 'Teknoloji, veri ve geniş topluluk ağımızı kullanarak kurumunuzun sosyal etki hedeflerine ulaşmasını sağlıyoruz. Üniversiteler, belediyeler, bakanlıklar ve şirketler için sürdürülebilir işbirliği modelleri sunuyoruz.',
    },
    'about': {
        // /about sayfası ayrı bir CMS şeması kullanır (Hakkımızda sekmesi).
        // Sayfalar sekmesinden de görmek için defaults eklendi; ancak buradan
        // kaydedilen override /about live'da ETKİSİZDİR — gerçek edit Hakkımızda
        // sekmesindendir. Hint dialog header'ında belirtilir.
        title: 'İyiliği Dijitalleştirdik.',
        subtitle: 'Geleceğin dayanışma modelini inşa ediyoruz.',
        description: 'Bireyleri, sivil toplum kuruluşlarını ve markaları toplumsal fayda odağında birleştiren, dünyanın en kapsayıcı sosyal etki platformuyuz.',
    },
    // login: /login redirect-only (cms yok); sitemap: hardcoded navigasyon (cms yok).
    // Bu iki sayfada Düzenle anlamlı değil — Sayfalar listesinde gösterilse de
    // değişiklik live'da yansımaz. Map'te yok → form boş açılır (kullanıcı
    // "neden boş?" sorgularsa bilinçli skip).
};

type SitePageMeta = { slug: string; label: string; href: string; group?: string };

// Sitemap section "1- WEB (Bilgi İçerikli, Tanıtım ve Kurumsal Portal)" tüm sayfalar.
// Anasayfa ve Hakkımızda ayrı tablarda yönetildiği için burada üst düzey ile çakışmaz.
const SITE_PAGES: SitePageMeta[] = [
    // 1.1 Ana Sayfa
    { slug: 'login', label: 'Ana Sayfa (Karşılama)', href: '/login', group: 'Ana Sayfa' },
    // 1.2 Kurumsal
    { slug: 'about', label: 'Biz Kimiz? / Hakkımızda', href: '/about', group: 'Kurumsal' },
    { slug: 'social-impact', label: 'Sürdürülebilirlik (Sosyal Etki)', href: '/social-impact', group: 'Kurumsal' },
    { slug: 'press', label: 'Basın Odası', href: '/press', group: 'Kurumsal' },
    { slug: 'yatirimci-iliskileri', label: 'Yatırımcı İlişkileri', href: '/yatirimci-iliskileri', group: 'Kurumsal' },
    { slug: 'careers', label: 'Kariyer', href: '/careers', group: 'Kurumsal' },
    { slug: 'social-entrepreneurship', label: 'Sosyal Girişimcilik', href: '/social-entrepreneurship', group: 'Kurumsal' },
    // 1.3 Yasal & Standartlar
    { slug: 'bilgi-toplumu-hizmetleri', label: 'Bilgi Toplumu Hizmetleri', href: '/bilgi-toplumu-hizmetleri', group: 'Yasal & Standartlar' },
    { slug: 'accessibility', label: 'Erişilebilirlik Beyanı', href: '/accessibility', group: 'Yasal & Standartlar' },
    { slug: 'standards', label: 'Kalite Standartlarımız', href: '/standards', group: 'Yasal & Standartlar' },
    { slug: 'logo-usage', label: 'Logo ve Marka Kullanımı', href: '/logo-usage', group: 'Yasal & Standartlar' },
    { slug: 'sitemap', label: 'Site Haritası', href: '/sitemap', group: 'Yasal & Standartlar' },
    // 1.4 Bilgi & Destek
    { slug: 'support', label: 'Destek Merkezi', href: '/support', group: 'Bilgi & Destek' },
    { slug: 'support-app-support', label: 'Uygulama Desteği (SSS)', href: '/support/app-support', group: 'Bilgi & Destek' },
    { slug: 'feedback', label: 'Geri Bildirim', href: '/feedback', group: 'Bilgi & Destek' },
    // 1.5 İş Birlikleri (Bilgi Sayfaları)
    { slug: 'corporate', label: 'İş Birlikleri / Kamu Modelleri', href: '/corporate', group: 'İş Birlikleri' },
    { slug: 'merchant', label: 'Üye İşyeri Avantajları', href: '/merchant', group: 'İş Birlikleri' },
    { slug: 'ngo-onboarding', label: 'STK Kayıt Bilgileri', href: '/ngo-onboarding', group: 'İş Birlikleri' },
    { slug: 'campus-advantages', label: 'Kampüs Avantajları (Kulüpler)', href: '/campus-advantages', group: 'İş Birlikleri' },
];

type PageContent = {
    title?: string;
    subtitle?: string;
    description?: string;
    heroImageUrl?: string;
    image2Url?: string;
    image3Url?: string;
    body?: string;
};

const SETTINGS_DOC = 'siteSettings';
const CONTENT_ID = 'webContent';

// Public base path for super-admin-created custom pages: /sayfa/[slug].
// (`/p/[slug]` is a SEPARATE system backed by the `sitePages` collection — not used here.)
const CUSTOM_PAGE_BASE = '/sayfa';

type CustomPageContent = {
    title?: string;
    subtitle?: string;
    description?: string;
    heroImageUrl?: string;
    body?: string;
};

// Slug çakışmasını önlemek için rezerve edilen değerler:
// (a) 19 sabit web sayfası slug'ı, (b) üst düzey app route klasör adları.
// Bunlar /sayfa/[slug] altında oluşturulamaz — mevcut route'ları gölgelemez/karıştırmaz.
const RESERVED_SLUGS = new Set<string>([
    ...SITE_PAGES.map(p => p.slug),
    'about', 'accessibility', 'admin', 'association', 'auth', 'bilgi-toplumu-hizmetleri',
    'brand-admin', 'campus-advantages', 'careers', 'club-admin', 'clubs', 'contact',
    'corporate', 'emergency', 'events', 'feedback', 'hangelassociation', 'home', 'imece',
    'impact-story', 'invite', 'leaderboard', 'library', 'login', 'logo-usage', 'logo',
    'market', 'merchant', 'messages', 'my-applications', 'my-badges', 'my-donations',
    'ngo-admin', 'ngo-onboarding', 'ngos', 'notifications', 'onboarding', 'p', 'payment',
    'posts', 'press', 'profile', 'qr-payment', 'sayfa', 'settings', 'sitemap',
    'social-entrepreneurship', 'social-impact', 'standards', 'stories', 'super-admin',
    'support', 'timeline', 'u', 'volunteering', 'yatirimci-iliskileri',
]);

function ImageUploaderCompact({
    value,
    onChange,
    pathPrefix,
}: { value: string; onChange: (url: string) => void; pathPrefix: string }) {
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon'].includes(file.type)) {
            toast({ variant: 'destructive', title: 'Geçersiz format' });
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Dosya çok büyük' });
            return;
        }
        setUploading(true);
        try {
            const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const r = storageRef(getStorage(), `${pathPrefix}/${Date.now()}-${safe}`);
            await uploadBytes(r, file);
            const url = await getDownloadURL(r);
            onChange(url);
            toast({ title: 'Yüklendi' });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Hata oluştu.';
            toast({ variant: 'destructive', title: 'Hata', description: message });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex items-center gap-3 p-3 border rounded-xl bg-muted/20 border-dashed">
            <div className="h-14 w-20 rounded-lg bg-background border flex items-center justify-center overflow-hidden shrink-0">
                {value ? <img src={value} alt="preview" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 space-y-2 min-w-0">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,.ico"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); if (inputRef.current) inputRef.current.value = ''; }}
                />
                <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => inputRef.current?.click()}>
                        {uploading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Upload className="mr-2 h-3.5 w-3.5" />}
                        {value ? 'Değiştir' : 'Yükle'}
                    </Button>
                    {value && (
                        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange('')}>
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    )}
                </div>
                <Input value={value} onChange={e => onChange(e.target.value)} placeholder="Veya URL girin..." className="text-xs h-8" />
            </div>
        </div>
    );
}

export default function WebContentPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // About page fields
    const [aboutTitle, setAboutTitle] = useState('İyiliği Dijitalleştirdik.');
    const [aboutSubtitle, setAboutSubtitle] = useState('Geleceğin dayanışma modelini inşa ediyoruz.');
    const [aboutDesc, setAboutDesc] = useState('Bireyleri, sivil toplum kuruluşlarını ve markaları toplumsal fayda odağında birleştiren, en kapsamlı sosyal etki platformuyuz.');
    const [socialTitle, setSocialTitle] = useState('Bir Sosyal Girişim Hikayesi.');
    const [socialDesc, setSocialDesc] = useState('hangel, kârını toplumsal faydaya yatıran bir sosyal girişimdir. Amacımız ticari başarıyı, sosyal sorunlara sürdürülebilir çözümler üretmek için bir araç olarak kullanmaktır.');
    const [foundationTitle, setFoundationTitle] = useState('Kuruluş Felsefemiz.');
    const [foundationDesc, setFoundationDesc] = useState('Yola çıkarken tek bir mottomuz vardı: "Yok öyle yalnız başına mücadele etmek".');

    // Logo/branding fields
    const [logoUrl, setLogoUrl] = useState('');
    const [logoText, setLogoText] = useState('hangel');
    const [primaryColor, setPrimaryColor] = useState('#0070f3');
    const [siteTitle, setSiteTitle] = useState('hangel');
    const [siteDescription, setSiteDescription] = useState('Sosyal Etki Platformu');
    const [faviconUrl, setFaviconUrl] = useState('');

    // Generic page editor state
    const [pages, setPages] = useState<Record<string, PageContent>>({});
    const [editingSlug, setEditingSlug] = useState<string | null>(null);
    const [editPage, setEditPage] = useState<PageContent>({});
    const [savingPage, setSavingPage] = useState(false);

    // Custom (super-admin-created) page state → /sayfa/[slug]
    const [customPages, setCustomPages] = useState<Record<string, CustomPageContent>>({});
    const [editingCustomSlug, setEditingCustomSlug] = useState<string | null>(null);
    const [editingCustomIsNew, setEditingCustomIsNew] = useState(false);
    const [editCustomPage, setEditCustomPage] = useState<CustomPageContent & { slug?: string }>({});
    const [savingCustomPage, setSavingCustomPage] = useState(false);

    // Home page sections
    const [homeHeroTitle, setHomeHeroTitle] = useState('yok öyle yalnız başına mücadele etmek.');
    const [homeHeroSubtitle, setHomeHeroSubtitle] = useState('Umudu Büyütüyor Toplumsal Sorunlar İçin Birlikte Çalışıyoruz.');
    const [homeHeroTagline, setHomeHeroTagline] = useState('#wearehangel');
    const [homeHeroCta, setHomeHeroCta] = useState('Hemen Katıl');
    const [homeDonationTitle, setHomeDonationTitle] = useState('hangel Bağış');
    const [homeDonationSubtitle, setHomeDonationSubtitle] = useState('Alışverişi iyiliğe dönüştürün.');
    const [homeDonationDescription, setHomeDonationDescription] = useState("Yüzlerce markadan yaptığınız alışverişlerle, hiçbir ek ücret ödemeden seçtiğiniz STK'ya destek olun.");
    const [homeVolunteeringTitle, setHomeVolunteeringTitle] = useState('hangel İmece');
    const [homeVolunteeringSubtitle, setHomeVolunteeringSubtitle] = useState('Zamanınız en değerli bağış.');
    const [homeVolunteeringDescription, setHomeVolunteeringDescription] = useState('Yetkinliklerinizi ve zamanınızı toplumsal faydaya dönüştürün.');
    const [homeValuesTitle, setHomeValuesTitle] = useState('Değerlerimizle Fark Oluşturuyoruz');
    const [homeValuesDescription, setHomeValuesDescription] = useState('Şeffaflık, güvenlik ve erişilebilirlik üzerine kurulu bir sosyal etki ekosistemi tasarlıyoruz.');
    const [homeHeroImageUrl, setHomeHeroImageUrl] = useState('');

    useEffect(() => {
        if (!db) return;
        const load = async () => {
            try {
                const snap = await getDoc(doc(db, SETTINGS_DOC, CONTENT_ID));
                if (snap.exists()) {
                    const d = snap.data();
                    if (d.about) {
                        setAboutTitle(d.about.title || aboutTitle);
                        setAboutSubtitle(d.about.subtitle || aboutSubtitle);
                        setAboutDesc(d.about.description || aboutDesc);
                        setSocialTitle(d.about.socialTitle || socialTitle);
                        setSocialDesc(d.about.socialDesc || socialDesc);
                        setFoundationTitle(d.about.foundationTitle || foundationTitle);
                        setFoundationDesc(d.about.foundationDesc || foundationDesc);
                    }
                    if (d.branding) {
                        setLogoUrl(d.branding.logoUrl || '');
                        setLogoText(d.branding.logoText || logoText);
                        setPrimaryColor(d.branding.primaryColor || primaryColor);
                        setSiteTitle(d.branding.siteTitle || siteTitle);
                        setSiteDescription(d.branding.siteDescription || siteDescription);
                        setFaviconUrl(d.branding.faviconUrl || '');
                    }
                    if (d.pages) {
                        setPages(d.pages);
                    }
                    if (d.customPages && typeof d.customPages === 'object') {
                        setCustomPages(d.customPages);
                    }
                    if (d.home) {
                        setHomeHeroTitle(d.home.heroTitle || homeHeroTitle);
                        setHomeHeroSubtitle(d.home.heroSubtitle || homeHeroSubtitle);
                        setHomeHeroTagline(d.home.heroTagline || homeHeroTagline);
                        setHomeHeroCta(d.home.heroCta || homeHeroCta);
                        setHomeDonationTitle(d.home.donationTitle || homeDonationTitle);
                        setHomeDonationSubtitle(d.home.donationSubtitle || homeDonationSubtitle);
                        setHomeDonationDescription(d.home.donationDescription || homeDonationDescription);
                        setHomeVolunteeringTitle(d.home.volunteeringTitle || homeVolunteeringTitle);
                        setHomeVolunteeringSubtitle(d.home.volunteeringSubtitle || homeVolunteeringSubtitle);
                        setHomeVolunteeringDescription(d.home.volunteeringDescription || homeVolunteeringDescription);
                        setHomeValuesTitle(d.home.valuesTitle || homeValuesTitle);
                        setHomeValuesDescription(d.home.valuesDescription || homeValuesDescription);
                        setHomeHeroImageUrl(d.home.heroImageUrl || '');
                    }
                }
            } catch {
                // No settings yet, use defaults
            } finally {
                setIsLoading(false);
            }
        };
        load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db]);

    const handleSaveAbout = async () => {
        if (!db) return;
        setIsSaving(true);
        try {
            setDocumentNonBlocking(doc(db, SETTINGS_DOC, CONTENT_ID), {
                about: {
                    title: aboutTitle,
                    subtitle: aboutSubtitle,
                    description: aboutDesc,
                    socialTitle,
                    socialDesc,
                    foundationTitle,
                    foundationDesc,
                }
            }, { merge: true });
            toast({ title: 'Kaydedildi', description: 'Hakkımızda sayfası güncellendi.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveBranding = async () => {
        if (!db) return;
        setIsSaving(true);
        try {
            setDocumentNonBlocking(doc(db, SETTINGS_DOC, CONTENT_ID), {
                branding: {
                    logoUrl,
                    logoText,
                    primaryColor,
                    siteTitle,
                    siteDescription,
                    faviconUrl,
                }
            }, { merge: true });
            toast({ title: 'Kaydedildi', description: 'Marka ayarları güncellendi.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveHome = async () => {
        if (!db) return;
        setIsSaving(true);
        try {
            setDocumentNonBlocking(doc(db, SETTINGS_DOC, CONTENT_ID), {
                home: {
                    heroTitle: homeHeroTitle,
                    heroSubtitle: homeHeroSubtitle,
                    heroTagline: homeHeroTagline,
                    heroCta: homeHeroCta,
                    donationTitle: homeDonationTitle,
                    donationSubtitle: homeDonationSubtitle,
                    donationDescription: homeDonationDescription,
                    volunteeringTitle: homeVolunteeringTitle,
                    volunteeringSubtitle: homeVolunteeringSubtitle,
                    volunteeringDescription: homeVolunteeringDescription,
                    valuesTitle: homeValuesTitle,
                    valuesDescription: homeValuesDescription,
                    heroImageUrl: homeHeroImageUrl,
                }
            }, { merge: true });
            toast({ title: 'Kaydedildi', description: 'Anasayfa içerikleri güncellendi.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleStartEditPage = (slug: string) => {
        setEditingSlug(slug);
        const stored = pages[slug] || {};
        const defs = PAGE_DEFAULT_KEYS[slug];
        // CMS override yoksa, sayfanın yayındaki fallback metniyle form'u doldur.
        // Değer `marketing.*` ile başlıyorsa translation key — t() ile resolve;
        // diğer durumda literal TR string olarak doğrudan kullan.
        const lookupDefault = (v?: string): string => {
            if (!v) return '';
            if (v.startsWith('marketing.')) {
                const resolved = t(v);
                return resolved && resolved !== v ? resolved : '';
            }
            return v;
        };
        setEditPage({
            title: stored.title || lookupDefault(defs?.title),
            subtitle: stored.subtitle || lookupDefault(defs?.subtitle),
            description: stored.description || lookupDefault(defs?.description),
            heroImageUrl: stored.heroImageUrl || '',
            image2Url: stored.image2Url || '',
            image3Url: stored.image3Url || '',
            body: stored.body || '',
        });
    };

    const handleSavePage = async () => {
        if (!db || !editingSlug) return;
        setSavingPage(true);
        try {
            await setDoc(
                doc(db, SETTINGS_DOC, CONTENT_ID),
                { pages: { [editingSlug]: editPage } },
                { merge: true },
            );
            setPages(prev => ({ ...prev, [editingSlug]: editPage }));
            toast({ title: 'Kaydedildi', description: 'Sayfa içeriği güncellendi.' });
            setEditingSlug(null);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Hata oluştu.';
            toast({ variant: 'destructive', title: 'Hata', description: message });
        } finally {
            setSavingPage(false);
        }
    };

    // ------- Özel Sayfalar (/sayfa/[slug]) -------

    const handleStartNewCustomPage = () => {
        setEditingCustomSlug('__new__');
        setEditingCustomIsNew(true);
        setEditCustomPage({ slug: '', title: '', subtitle: '', description: '', heroImageUrl: '', body: '' });
    };

    const handleStartEditCustomPage = (slug: string) => {
        setEditingCustomSlug(slug);
        setEditingCustomIsNew(false);
        setEditCustomPage({ slug, ...(customPages[slug] || {}) });
    };

    const handleSaveCustomPage = async () => {
        if (!db) return;
        const slug = (editCustomPage.slug || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (!slug) {
            toast({ variant: 'destructive', title: 'Slug gerekli', description: 'URL için kısa bir slug girin (örn: etki-raporu-2026).' });
            return;
        }
        if (editingCustomIsNew && RESERVED_SLUGS.has(slug)) {
            toast({ variant: 'destructive', title: 'Slug rezerve', description: 'Bu slug mevcut bir sayfayla çakışıyor. Farklı bir slug seçin.' });
            return;
        }
        if (editingCustomIsNew && customPages[slug]) {
            toast({ variant: 'destructive', title: 'Slug zaten var', description: 'Bu slug ile bir özel sayfa zaten mevcut.' });
            return;
        }
        setSavingCustomPage(true);
        try {
            const { slug: _s, ...payload } = editCustomPage;
            await setDoc(
                doc(db, SETTINGS_DOC, CONTENT_ID),
                { customPages: { [slug]: payload } },
                { merge: true },
            );
            setCustomPages(prev => ({ ...prev, [slug]: payload }));
            toast({ title: 'Kaydedildi', description: `Özel sayfa "${slug}" kaydedildi.` });
            setEditingCustomSlug(null);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Hata oluştu.';
            toast({ variant: 'destructive', title: 'Hata', description: message });
        } finally {
            setSavingCustomPage(false);
        }
    };

    const handleDeleteCustomPage = async (slug: string) => {
        if (!db) return;
        if (!confirm(`"${slug}" özel sayfası silinecek. Emin misiniz?`)) return;
        try {
            await updateDoc(
                doc(db, SETTINGS_DOC, CONTENT_ID),
                { [`customPages.${slug}`]: deleteField() },
            );
            setCustomPages(prev => {
                const next = { ...prev };
                delete next[slug];
                return next;
            });
            toast({ title: 'Silindi', description: `Özel sayfa "${slug}" silindi.` });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Silinemedi.';
            toast({ variant: 'destructive', title: 'Silinemedi', description: message });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">WEB İçerik Yönetimi</h1>
                <p className="text-muted-foreground text-sm">Web sayfalarının metin ve marka içeriklerini yönetin.</p>
            </div>

            <Tabs defaultValue="branding" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 h-auto gap-1 p-1">
                    <TabsTrigger value="branding">Logo & Marka</TabsTrigger>
                    <TabsTrigger value="home">Anasayfa</TabsTrigger>
                    <TabsTrigger value="about">Hakkımızda</TabsTrigger>
                    <TabsTrigger value="pages">Sayfalar</TabsTrigger>
                    <TabsTrigger value="custom">Özel Sayfalar</TabsTrigger>
                </TabsList>

                {/* Logo & Marka */}
                <TabsContent value="branding" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Logo & Marka Ayarları</CardTitle>
                            <CardDescription>Site logosu, renkleri ve genel marka bilgilerini buradan yönetin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Logo</h4>
                                <div className="space-y-2">
                                    <Label>Logo Görseli</Label>
                                    <ImageUploaderCompact value={logoUrl} onChange={setLogoUrl} pathPrefix="siteContent/web/logo" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Logo Metni (Logo yoksa gösterilir)</Label>
                                    <Input
                                        value={logoText}
                                        onChange={e => setLogoText(e.target.value)}
                                        placeholder="hangel"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Site Bilgileri</h4>
                                <div className="space-y-2">
                                    <Label>Site Başlığı</Label>
                                    <Input value={siteTitle} onChange={e => setSiteTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Site Açıklaması (SEO)</Label>
                                    <Input value={siteDescription} onChange={e => setSiteDescription(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Favicon</Label>
                                    <ImageUploaderCompact value={faviconUrl} onChange={setFaviconUrl} pathPrefix="siteContent/web/favicon" />
                                </div>
                            </div>

                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Renkler</h4>
                                <div className="flex items-center gap-4">
                                    <div className="space-y-2 flex-1">
                                        <Label>Ana Renk</Label>
                                        <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} placeholder="#0070f3" />
                                    </div>
                                    <div className="mt-6">
                                        <input
                                            type="color"
                                            value={primaryColor}
                                            onChange={e => setPrimaryColor(e.target.value)}
                                            className="h-10 w-10 rounded cursor-pointer border"
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveBranding} disabled={isSaving} className="rounded-xl">
                                {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                Marka Ayarlarını Kaydet
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Anasayfa */}
                <TabsContent value="home" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Anasayfa İçerikleri</CardTitle>
                            <CardDescription>hangel.org anasayfasının (/) tüm bölümlerini düzenleyin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Hero / Üst Bölüm</h4>
                                <div className="space-y-2"><Label>Üst Slogan</Label><Input value={homeHeroSubtitle} onChange={e => setHomeHeroSubtitle(e.target.value)} /></div>
                                <div className="space-y-2"><Label>Ana Başlık</Label><Textarea value={homeHeroTitle} onChange={e => setHomeHeroTitle(e.target.value)} rows={2} /></div>
                                <div className="space-y-2"><Label>Hashtag / Etiket</Label><Input value={homeHeroTagline} onChange={e => setHomeHeroTagline(e.target.value)} /></div>
                                <div className="space-y-2"><Label>CTA Buton Metni</Label><Input value={homeHeroCta} onChange={e => setHomeHeroCta(e.target.value)} /></div>
                                <div className="space-y-2"><Label>Hero Görseli</Label><ImageUploaderCompact value={homeHeroImageUrl} onChange={setHomeHeroImageUrl} pathPrefix="siteContent/web/home/hero" /></div>
                            </div>
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Bağış Bölümü (hangel Bağış)</h4>
                                <div className="space-y-2"><Label>Başlık</Label><Input value={homeDonationTitle} onChange={e => setHomeDonationTitle(e.target.value)} /></div>
                                <div className="space-y-2"><Label>Alt Başlık</Label><Input value={homeDonationSubtitle} onChange={e => setHomeDonationSubtitle(e.target.value)} /></div>
                                <div className="space-y-2"><Label>Açıklama</Label><Textarea value={homeDonationDescription} onChange={e => setHomeDonationDescription(e.target.value)} rows={3} /></div>
                            </div>
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Gönüllülük Bölümü (hangel İmece)</h4>
                                <div className="space-y-2"><Label>Başlık</Label><Input value={homeVolunteeringTitle} onChange={e => setHomeVolunteeringTitle(e.target.value)} /></div>
                                <div className="space-y-2"><Label>Alt Başlık</Label><Input value={homeVolunteeringSubtitle} onChange={e => setHomeVolunteeringSubtitle(e.target.value)} /></div>
                                <div className="space-y-2"><Label>Açıklama</Label><Textarea value={homeVolunteeringDescription} onChange={e => setHomeVolunteeringDescription(e.target.value)} rows={3} /></div>
                            </div>
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Değerlerimiz Bölümü</h4>
                                <div className="space-y-2"><Label>Başlık</Label><Input value={homeValuesTitle} onChange={e => setHomeValuesTitle(e.target.value)} /></div>
                                <div className="space-y-2"><Label>Açıklama</Label><Textarea value={homeValuesDescription} onChange={e => setHomeValuesDescription(e.target.value)} rows={3} /></div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveHome} disabled={isSaving} className="rounded-xl">
                                {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                Anasayfa İçeriklerini Kaydet
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Hakkımızda */}
                <TabsContent value="about" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hakkımızda Sayfası</CardTitle>
                            <CardDescription>/about sayfasının içeriklerini düzenleyin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Ana Başlık</h4>
                                <div className="space-y-2">
                                    <Label>Başlık</Label>
                                    <Input value={aboutTitle} onChange={e => setAboutTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Alt Başlık</Label>
                                    <Input value={aboutSubtitle} onChange={e => setAboutSubtitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Açıklama</Label>
                                    <Textarea value={aboutDesc} onChange={e => setAboutDesc(e.target.value)} rows={3} />
                                </div>
                            </div>
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Sosyal Girişim Bölümü</h4>
                                <div className="space-y-2">
                                    <Label>Başlık</Label>
                                    <Input value={socialTitle} onChange={e => setSocialTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Açıklama</Label>
                                    <Textarea value={socialDesc} onChange={e => setSocialDesc(e.target.value)} rows={3} />
                                </div>
                            </div>
                            <div className="space-y-4 p-4 border rounded-lg">
                                <h4 className="font-semibold">Kuruluş Felsefesi</h4>
                                <div className="space-y-2">
                                    <Label>Başlık</Label>
                                    <Input value={foundationTitle} onChange={e => setFoundationTitle(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Açıklama</Label>
                                    <Textarea value={foundationDesc} onChange={e => setFoundationDesc(e.target.value)} rows={3} />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handleSaveAbout} disabled={isSaving} className="rounded-xl">
                                {isSaving && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                Hakkımızda Sayfasını Güncelle
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* Sayfalar — generic editor for all WEB section pages */}
                <TabsContent value="pages" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Web Sayfaları</CardTitle>
                            <CardDescription>
                                Tanıtım/kurumsal sayfaların başlık, açıklama, kapak görseli ve içeriklerini düzenleyin.
                                Sayfaların kendi yapısı (örn. tablolar, accordion'lar) korunur — buradaki alanlar başlık ve hero bölümlerinde kullanılır.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {Array.from(new Set(SITE_PAGES.map(p => p.group || 'Diğer'))).map(group => (
                                <div key={group} className="space-y-3">
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground px-1">{group}</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {SITE_PAGES.filter(p => (p.group || 'Diğer') === group).map(p => {
                                            const stored = pages[p.slug] || {};
                                            const hasContent = !!(stored.title || stored.subtitle || stored.description || stored.heroImageUrl || stored.image2Url || stored.image3Url || stored.body);
                                            const previewTitle = stored.title || PAGE_DEFAULT_KEYS[p.slug]?.title || p.label;
                                            const resolvedTitle = previewTitle.startsWith('marketing.') ? t(previewTitle) : previewTitle;
                                            return (
                                                <Card key={p.slug} className="overflow-hidden rounded-2xl border-border shadow-sm hover:shadow-lg transition-all group">
                                                    <div className="relative h-32 bg-gradient-to-br from-muted to-muted/40 overflow-hidden">
                                                        {stored.heroImageUrl ? (
                                                             
                                                            <img src={stored.heroImageUrl} alt={p.label} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center">
                                                                <FileText className="h-10 w-10 text-muted-foreground/30" />
                                                            </div>
                                                        )}
                                                        <div className="absolute top-2 right-2">
                                                            {hasContent ? (
                                                                <Badge className="bg-green-600 hover:bg-green-600 text-[9px] font-black uppercase tracking-wider">Düzenlendi</Badge>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-wider bg-background/80 backdrop-blur">Varsayılan</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="p-3 space-y-2">
                                                        <div className="space-y-0.5">
                                                            <p className="font-bold text-sm truncate" title={p.label}>{p.label}</p>
                                                            <p className="text-[11px] text-muted-foreground truncate" title={resolvedTitle}>{resolvedTitle}</p>
                                                        </div>
                                                        <code className="text-[10px] text-muted-foreground/80 bg-muted/40 px-1.5 py-0.5 rounded inline-block truncate max-w-full">{p.href}</code>
                                                        <div className="flex items-center gap-1 pt-1 border-t border-border">
                                                            <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title="Yayında görüntüle">
                                                                <Link href={p.href} target="_blank" rel="noopener noreferrer" aria-label="Yayında görüntüle">
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>
                                                            </Button>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleStartEditPage(p.slug)} title="Görseli değiştir" aria-label="Görseli değiştir">
                                                                <ImageIcon className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="default" size="sm" className="h-8 rounded-lg ml-auto gap-1.5" onClick={() => handleStartEditPage(p.slug)} title="İçeriği düzenle">
                                                                <Pencil className="h-3.5 w-3.5" /> Düzenle
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Özel Sayfalar — super-admin tarafından oluşturulan dinamik sayfalar (/sayfa/[slug]) */}
                <TabsContent value="custom" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <CardTitle className="flex items-center gap-2"><FilePlus2 className="h-5 w-5" /> Özel Sayfalar</CardTitle>
                                <CardDescription>
                                    Sabit sayfalar dışında kendi tanıtım/kurumsal sayfalarınızı oluşturun.
                                    Her sayfa <code className="bg-muted px-1 rounded">{CUSTOM_PAGE_BASE}/[slug]</code> adresinde yayınlanır.
                                </CardDescription>
                            </div>
                            <Button onClick={handleStartNewCustomPage} className="rounded-xl shrink-0">
                                <Plus className="h-4 w-4 mr-1" /> Yeni Sayfa Oluştur
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {Object.keys(customPages).length === 0 ? (
                                <div className="py-16 text-center space-y-3 border-2 border-dashed rounded-2xl">
                                    <FilePlus2 className="h-12 w-12 mx-auto text-muted-foreground/30" />
                                    <p className="text-sm text-muted-foreground">Henüz özel sayfa oluşturulmadı.</p>
                                    <Button onClick={handleStartNewCustomPage} className="rounded-xl">
                                        <Plus className="h-4 w-4 mr-1" /> İlk Sayfanı Oluştur
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(customPages).map(([slug, p]) => (
                                        <Card key={slug} className="overflow-hidden rounded-2xl border-border shadow-sm hover:shadow-lg transition-all group">
                                            <div className="relative h-32 bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden">
                                                {p.heroImageUrl ? (
                                                     
                                                    <img src={p.heroImageUrl} alt={p.title || slug} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                                ) : (
                                                    <div className="h-full w-full flex items-center justify-center">
                                                        <FileText className="h-10 w-10 text-primary/30" />
                                                    </div>
                                                )}
                                                <Badge className="absolute top-2 right-2 bg-primary text-[9px] font-black uppercase tracking-wider">Özel</Badge>
                                            </div>
                                            <div className="p-3 space-y-2">
                                                <div className="space-y-0.5">
                                                    <p className="font-bold text-sm truncate" title={p.title || slug}>{p.title || slug}</p>
                                                    {p.subtitle && <p className="text-[11px] text-muted-foreground truncate">{p.subtitle}</p>}
                                                </div>
                                                <code className="text-[10px] text-muted-foreground/80 bg-muted/40 px-1.5 py-0.5 rounded inline-block truncate max-w-full">{CUSTOM_PAGE_BASE}/{slug}</code>
                                                <div className="flex items-center gap-1 pt-1 border-t border-border">
                                                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-lg" title="Yayında görüntüle">
                                                        <Link href={`${CUSTOM_PAGE_BASE}/${slug}`} target="_blank" rel="noopener noreferrer" aria-label="Yayında görüntüle">
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleStartEditCustomPage(slug)} title="Görseli değiştir" aria-label="Görseli değiştir">
                                                        <ImageIcon className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10" onClick={() => handleDeleteCustomPage(slug)} title="Sayfayı sil" aria-label="Sayfayı sil">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="default" size="sm" className="h-8 rounded-lg ml-auto gap-1.5" onClick={() => handleStartEditCustomPage(slug)} title="İçeriği düzenle">
                                                        <Pencil className="h-3.5 w-3.5" /> Düzenle
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Custom page create/edit dialog */}
            <Dialog open={!!editingCustomSlug} onOpenChange={(o) => !o && setEditingCustomSlug(null)}>
                <DialogContent className="max-w-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingCustomIsNew ? 'Yeni Özel Sayfa' : 'Özel Sayfayı Düzenle'}</DialogTitle>
                        <DialogDescription>
                            URL: <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{CUSTOM_PAGE_BASE}/{editCustomPage.slug || '...'}</code>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Slug (URL parçası)</Label>
                            <Input
                                value={editCustomPage.slug || ''}
                                onChange={e => setEditCustomPage({ ...editCustomPage, slug: e.target.value })}
                                placeholder="ornek: etki-raporu-2026"
                                disabled={!editingCustomIsNew}
                            />
                            {editingCustomIsNew && (
                                <p className="text-[10px] text-muted-foreground">Sadece küçük harf, rakam ve tire. Kayıttan sonra değişmez.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Ana Başlık</Label>
                            <Input
                                value={editCustomPage.title || ''}
                                onChange={e => setEditCustomPage({ ...editCustomPage, title: e.target.value })}
                                placeholder="Sayfa başlığı"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Alt Başlık / Etiket</Label>
                            <Input
                                value={editCustomPage.subtitle || ''}
                                onChange={e => setEditCustomPage({ ...editCustomPage, subtitle: e.target.value })}
                                placeholder="Hero üstündeki kısa etiket veya alt başlık"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Açıklama</Label>
                            <Textarea
                                value={editCustomPage.description || ''}
                                onChange={e => setEditCustomPage({ ...editCustomPage, description: e.target.value })}
                                rows={3}
                                placeholder="Hero bölümünün altında yer alan kısa açıklama"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Kapak / Hero Görseli</Label>
                            <ImageUploaderCompact
                                value={editCustomPage.heroImageUrl || ''}
                                onChange={(url) => setEditCustomPage({ ...editCustomPage, heroImageUrl: url })}
                                pathPrefix={`siteContent/web/custom/${editCustomPage.slug || 'new'}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>İçerik</Label>
                            <RichTextEditor
                                value={editCustomPage.body || ''}
                                onChange={(html) => setEditCustomPage({ ...editCustomPage, body: html })}
                                placeholder="Sayfa içeriğini buraya yazın..."
                                minHeight={280}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setEditingCustomSlug(null)}>İptal</Button>
                        <Button onClick={handleSaveCustomPage} disabled={savingCustomPage} className="font-bold">
                            {savingCustomPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Page edit dialog */}
            <Dialog open={!!editingSlug} onOpenChange={(o) => !o && setEditingSlug(null)}>
                <DialogContent className="max-w-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {SITE_PAGES.find(p => p.slug === editingSlug)?.label || 'Sayfa'} — Düzenle
                        </DialogTitle>
                        <DialogDescription className="space-y-1">
                            <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                {SITE_PAGES.find(p => p.slug === editingSlug)?.href}
                            </code>
                            <span className="block text-[11px] text-muted-foreground italic">
                                Formdaki metinler şu an yayında olan içerikler. Üzerinde değişiklik yapıp Kaydet ile yayına alabilirsiniz.
                                Bir alanı boş bırakıp kaydederseniz, sayfa o alanın varsayılan halini gösterir.
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Ana Başlık</Label>
                            <Input
                                value={editPage.title || ''}
                                onChange={e => setEditPage({ ...editPage, title: e.target.value })}
                                placeholder="Sayfa başlığı"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Alt Başlık / Etiket</Label>
                            <Input
                                value={editPage.subtitle || ''}
                                onChange={e => setEditPage({ ...editPage, subtitle: e.target.value })}
                                placeholder="Hero üstündeki kısa etiket veya alt başlık"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Açıklama</Label>
                            <Textarea
                                value={editPage.description || ''}
                                onChange={e => setEditPage({ ...editPage, description: e.target.value })}
                                rows={3}
                                placeholder="Hero bölümünün altında yer alan kısa açıklama"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Kapak / Hero Görseli</Label>
                            <ImageUploaderCompact
                                value={editPage.heroImageUrl || ''}
                                onChange={(url) => setEditPage({ ...editPage, heroImageUrl: url })}
                                pathPrefix={`siteContent/web/pages/${editingSlug}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ek Görsel #2 (opsiyonel)</Label>
                            <ImageUploaderCompact
                                value={editPage.image2Url || ''}
                                onChange={(url) => setEditPage({ ...editPage, image2Url: url })}
                                pathPrefix={`siteContent/web/pages/${editingSlug}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Ek Görsel #3 (opsiyonel)</Label>
                            <ImageUploaderCompact
                                value={editPage.image3Url || ''}
                                onChange={(url) => setEditPage({ ...editPage, image3Url: url })}
                                pathPrefix={`siteContent/web/pages/${editingSlug}`}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>İçerik</Label>
                            <RichTextEditor
                                value={editPage.body || ''}
                                onChange={(html) => setEditPage({ ...editPage, body: html })}
                                placeholder="Sayfa içeriğini buraya yazın..."
                                minHeight={280}
                            />
                            <p className="text-[10px] text-muted-foreground">
                                Boş bırakılırsa sayfanın varsayılan içeriği gösterilir.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setEditingSlug(null)}>İptal</Button>
                        <Button onClick={handleSavePage} disabled={savingPage} className="font-bold">
                            {savingPage && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
