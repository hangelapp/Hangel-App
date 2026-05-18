'use client';

import React, { useEffect, useState } from 'react';
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
import { ArrowLeft, Save, Loader2, Upload, ImageIcon, X, Plus, Pencil, Trash2, ExternalLink, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

type ProjectPage = {
    title?: string;
    subtitle?: string;
    description?: string;
    heroImageUrl?: string;
    body?: string;
};

const SETTINGS_DOC = 'siteSettings';
const CONTENT_ID = 'associationContent';

type SectionKey =
    | 'homepage'
    | 'about'
    | 'press'
    | 'events'
    | 'workshop'
    | 'conferences'
    | 'projects'
    | 'entrepreneurshipLibrary'
    | 'impactAtlas'
    | 'employmentProtocol'
    | 'legislation'
    | 'contact'
    | 'feedback';

type ContentMap = Record<string, unknown>;

const DEFAULTS: ContentMap = {
    homepage: {
        workshopSubtitle: 'Küresel Diyalog',
        workshopTitle: 'Uluslararası Sosyal Girişimcilik Çalıştayı.',
        workshopDescription: "54 ülkeden vizyoner liderlerle ortak sorunlara kolektif çözümler üretiyoruz. Türkiye'nin ilk, dünyanın 27. Sosyal Girişimcilik Yüksek Lisans programına ilham verdik.",
        legislationSubtitle: 'Hukuki Reform',
        legislationTitle: 'Sosyal Girişimcilik Kanunu Teklifi.',
        legislationDescription: '29 maddelik kanun teklifimizle, sosyal girişimciliğin yasal statüsünü, denetim standartlarını ve teşvik mekanizmalarını tanımlıyoruz.',
        heroImageUrl: '',
    },
    about: {
        heroBadge: 'BİZ KİMİZ?',
        heroTitle: 'Daha İyi Bir Dünya İçin Kolektif Bir Bilinç.',
        heroDescription: 'Biz, dünyayı daha iyi bir yer haline getirme vizyonumuzu ve ideallerimizi paylaşan insanları dünyanın dört bir yanından bir araya getiriyoruz.',
        missionTitle: 'Misyonumuz.',
        missionDescription: 'hangel ve Social Business Global olarak misyonumuz; hayatın her kesiminden, kurum ve sivil toplumdan herkesin iyilik yapmaya katılabildiği adil ve kapsayıcı bir sistem inşa etmektir.',
        visionTitle: 'Küresel Ağ Hedefimiz.',
        visionDescription: 'Ulusal ve uluslararası paydaşlarımız ile hayata sosyal fayda odaklı bakan sosyal girişimcileri bir araya getirerek, birbirlerinden ilham almalarını sağlayacak doğal bir ağ oluşturuyoruz.',
        coverImageUrl: '',
    },
    press: {
        title: 'Basında Biz',
        subtitle: 'Hangel Derneği medya kayıtları.',
        description: 'Derneğimizin ulusal ve uluslararası basında yer alan haberlerini, röportajlarını ve duyurularını bu sayfada bulabilirsiniz.',
        coverImageUrl: '',
    },
    events: {
        title: 'Etkinliklerimiz',
        description: 'Çalıştaylar, paneller ve buluşmalar.',
        upcomingTitle: 'Yaklaşan Etkinlikler',
        archiveTitle: 'Geçmiş Etkinlikler',
        coverImageUrl: '',
    },
    workshop: {
        title: 'Sosyal Girişimcilik Çalıştayı',
        subtitle: 'Küresel diyalog, kolektif çözüm.',
        description: '54 ülkeden vizyoner liderlerle yıllık olarak gerçekleşen uluslararası çalıştay programı.',
        applicationUrl: '',
        coverImageUrl: '',
    },
    conferences: {
        title: 'Konferanslar',
        subtitle: 'Sosyal etki için bilgi paylaşımı.',
        description: 'Sivil toplum, akademi ve kamu temsilcilerinin bir araya geldiği konferans programlarımız.',
        coverImageUrl: '',
    },
    legislation: {
        title: 'Sosyal Girişimcilik Kanunu Teklifi',
        subtitle: '29 maddelik hukuki reform önerisi.',
        description: 'Sosyal girişimciliğin yasal statüsünü, denetim standartlarını ve teşvik mekanizmalarını tanımlayan kapsamlı kanun teklifimiz.',
        documentUrl: '',
        coverImageUrl: '',
    },
    projects: {
        title: 'Projelerimiz',
        description: 'Sosyal etki yaratan girişimlerimiz.',
        coverImageUrl: '',
    },
    entrepreneurshipLibrary: {
        title: 'Girişimcilik Kütüphanesi',
        subtitle: 'Sosyal girişimcilik için referans kaynaklar.',
        description: 'Sosyal girişimcilere ve kurumlara yönelik araştırmalar, rehberler ve metodolojik dokümanlar.',
        coverImageUrl: '',
    },
    impactAtlas: {
        title: 'Sosyal Etki Atlası',
        subtitle: 'Türkiye sosyal etki haritası.',
        description: 'Sivil toplum kuruluşlarının ve sosyal girişimlerin yarattığı etkiyi görselleştiren atlas projesi.',
        coverImageUrl: '',
    },
    employmentProtocol: {
        title: 'Etki Odaklı İstihdam Protokolü',
        subtitle: 'Sosyal fayda odaklı istihdam standartları.',
        description: 'Şirketlerin sosyal etki yaratan istihdam politikalarını standartlaştıran protokol metni.',
        coverImageUrl: '',
    },
    contact: {
        title: 'Bize Ulaşın.',
        subtitle: 'Sorularınız, iş birlikleri ve geri bildirimleriniz için.',
        description: 'Hangel ekibiyle iletişime geçmek için aşağıdaki kanalları kullanabilirsiniz.',
        coverImageUrl: '',
    },
    feedback: {
        title: 'Fikirleriniz Geleceğimiz.',
        subtitle: 'Görüşleriniz bize yol gösterir.',
        description: 'Dernek faaliyetlerimiz, web sitemiz ve iş birliği önerileriniz için aşağıdaki formu kullanabilirsiniz.',
        coverImageUrl: '',
    },
};

function ImageUploader({
    label,
    value,
    onChange,
    pathPrefix,
}: {
    label: string;
    value: string;
    onChange: (url: string) => void;
    pathPrefix: string;
}) {
    const { toast } = useToast();
    const [uploading, setUploading] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const handleUpload = async (file: File) => {
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
            toast({ variant: 'destructive', title: 'Geçersiz format', description: 'JPG, PNG veya WEBP yükleyin.' });
            return;
        }
        if (file.size > 8 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'En fazla 8MB.' });
            return;
        }
        setUploading(true);
        try {
            const storage = getStorage();
            const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${pathPrefix}/${Date.now()}-${safe}`;
            const r = storageRef(storage, path);
            await uploadBytes(r, file);
            const url = await getDownloadURL(r);
            onChange(url);
            toast({ title: 'Yüklendi', description: 'Görsel kaydet butonuyla kalıcı yapılır.' });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Hata';
            toast({ variant: 'destructive', title: 'Yükleme hatası', description: message });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-2">
            <Label className="text-sm font-semibold">{label}</Label>
            <div className="flex items-center gap-3 p-3 border rounded-xl bg-muted/20 border-dashed">
                <div className="h-16 w-24 rounded-lg bg-background border flex items-center justify-center overflow-hidden shrink-0">
                    {value ? (
                        <img src={value} alt={label} className="h-full w-full object-cover" />
                    ) : (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    )}
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUpload(f);
                            if (inputRef.current) inputRef.current.value = '';
                        }}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploading}
                            onClick={() => inputRef.current?.click()}
                        >
                            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            {value ? 'Değiştir' : 'Görsel Yükle'}
                        </Button>
                        {value && (
                            <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => onChange('')}>
                                <X className="h-4 w-4 mr-1" /> Kaldır
                            </Button>
                        )}
                    </div>
                    <Input
                        placeholder="Veya URL girin..."
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        className="text-xs h-8"
                    />
                </div>
            </div>
        </div>
    );
}

function SectionEditor({
    sectionKey,
    section,
    onChange,
    fields,
}: {
    sectionKey: SectionKey;
    section: Record<string, unknown>;
    onChange: (key: string, value: unknown) => void;
    fields: { key: string; label: string; type: 'text' | 'textarea' | 'image' }[];
}) {
    return (
        <div className="space-y-4">
            {fields.map(f => {
                if (f.type === 'image') {
                    return (
                        <ImageUploader
                            key={f.key}
                            label={f.label}
                            value={(section[f.key] as string) || ''}
                            onChange={(url) => onChange(f.key, url)}
                            pathPrefix={`siteContent/association/${sectionKey}`}
                        />
                    );
                }
                return (
                    <div key={f.key} className="space-y-2">
                        <Label className="text-sm font-semibold">{f.label}</Label>
                        {f.type === 'textarea' ? (
                            <Textarea
                                value={(section[f.key] as string) || ''}
                                onChange={e => onChange(f.key, e.target.value)}
                                rows={3}
                            />
                        ) : (
                            <Input
                                value={(section[f.key] as string) || ''}
                                onChange={e => onChange(f.key, e.target.value)}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

const SECTION_FIELDS: Record<SectionKey, { key: string; label: string; type: 'text' | 'textarea' | 'image' }[]> = {
    homepage: [
        { key: 'workshopSubtitle', label: 'Çalıştay — Alt Başlık', type: 'text' },
        { key: 'workshopTitle', label: 'Çalıştay — Ana Başlık', type: 'text' },
        { key: 'workshopDescription', label: 'Çalıştay — Açıklama', type: 'textarea' },
        { key: 'legislationSubtitle', label: 'Mevzuat — Alt Başlık', type: 'text' },
        { key: 'legislationTitle', label: 'Mevzuat — Ana Başlık', type: 'text' },
        { key: 'legislationDescription', label: 'Mevzuat — Açıklama', type: 'textarea' },
        { key: 'heroImageUrl', label: 'Ana Sayfa Hero Görseli', type: 'image' },
    ],
    about: [
        { key: 'heroBadge', label: 'Hero — Badge', type: 'text' },
        { key: 'heroTitle', label: 'Hero — Başlık', type: 'text' },
        { key: 'heroDescription', label: 'Hero — Açıklama', type: 'textarea' },
        { key: 'missionTitle', label: 'Misyon — Başlık', type: 'text' },
        { key: 'missionDescription', label: 'Misyon — Açıklama', type: 'textarea' },
        { key: 'visionTitle', label: 'Vizyon — Başlık', type: 'text' },
        { key: 'visionDescription', label: 'Vizyon — Açıklama', type: 'textarea' },
        { key: 'coverImageUrl', label: 'Kapak Görseli', type: 'image' },
    ],
    press: [
        { key: 'title', label: 'Başlık', type: 'text' },
        { key: 'subtitle', label: 'Alt Başlık', type: 'text' },
        { key: 'description', label: 'Açıklama', type: 'textarea' },
        { key: 'coverImageUrl', label: 'Kapak Görseli', type: 'image' },
    ],
    events: [
        { key: 'title', label: 'Sayfa Başlığı', type: 'text' },
        { key: 'description', label: 'Sayfa Açıklaması', type: 'textarea' },
        { key: 'upcomingTitle', label: 'Yaklaşan Etkinlikler Başlığı', type: 'text' },
        { key: 'archiveTitle', label: 'Geçmiş Etkinlikler Başlığı', type: 'text' },
        { key: 'coverImageUrl', label: 'Kapak Görseli', type: 'image' },
    ],
    workshop: [
        { key: 'title', label: 'Başlık', type: 'text' },
        { key: 'subtitle', label: 'Alt Başlık', type: 'text' },
        { key: 'description', label: 'Açıklama', type: 'textarea' },
        { key: 'applicationUrl', label: 'Başvuru Linki', type: 'text' },
        { key: 'coverImageUrl', label: 'Kapak Görseli', type: 'image' },
    ],
    conferences: [
        { key: 'title', label: 'Başlık', type: 'text' },
        { key: 'subtitle', label: 'Alt Başlık', type: 'text' },
        { key: 'description', label: 'Açıklama', type: 'textarea' },
        { key: 'coverImageUrl', label: 'Kapak Görseli', type: 'image' },
    ],
    legislation: [
        { key: 'title', label: 'Başlık', type: 'text' },
        { key: 'subtitle', label: 'Alt Başlık', type: 'text' },
        { key: 'description', label: 'Açıklama', type: 'textarea' },
        { key: 'documentUrl', label: 'Belge URL (PDF vb.)', type: 'text' },
        { key: 'coverImageUrl', label: 'Kapak Görseli', type: 'image' },
    ],
    projects: [
        { key: 'title', label: 'Başlık', type: 'text' },
        { key: 'description', label: 'Açıklama', type: 'textarea' },
        { key: 'coverImageUrl', label: 'Kapak Görseli', type: 'image' },
    ],
    entrepreneurshipLibrary: [
        { key: 'title', label: 'Başlık', type: 'text' },
        { key: 'subtitle', label: 'Alt Başlık', type: 'text' },
        { key: 'description', label: 'Açıklama', type: 'textarea' },
        { key: 'coverImageUrl', label: 'Kapak Görseli', type: 'image' },
    ],
    impactAtlas: [
        { key: 'title', label: 'Başlık', type: 'text' },
        { key: 'subtitle', label: 'Alt Başlık', type: 'text' },
        { key: 'description', label: 'Açıklama', type: 'textarea' },
        { key: 'coverImageUrl', label: 'Kapak Görseli', type: 'image' },
    ],
    employmentProtocol: [
        { key: 'title', label: 'Başlık', type: 'text' },
        { key: 'subtitle', label: 'Alt Başlık', type: 'text' },
        { key: 'description', label: 'Açıklama', type: 'textarea' },
        { key: 'coverImageUrl', label: 'Kapak Görseli', type: 'image' },
    ],
    contact: [
        { key: 'title', label: 'Başlık', type: 'text' },
        { key: 'subtitle', label: 'Alt Başlık', type: 'text' },
        { key: 'description', label: 'Açıklama', type: 'textarea' },
        { key: 'coverImageUrl', label: 'Kapak Görseli', type: 'image' },
    ],
    feedback: [
        { key: 'title', label: 'Başlık', type: 'text' },
        { key: 'subtitle', label: 'Alt Başlık', type: 'text' },
        { key: 'description', label: 'Açıklama', type: 'textarea' },
        { key: 'coverImageUrl', label: 'Kapak Görseli', type: 'image' },
    ],
};

export default function AssociationContentPage() {
    const { toast } = useToast();
    const router = useRouter();
    const db = useFirestore();

    const [content, setContent] = useState<ContentMap>(DEFAULTS);
    const [projectPages, setProjectPages] = useState<Record<string, ProjectPage>>({});
    const [editingProjectSlug, setEditingProjectSlug] = useState<string | null>(null);
    const [editingProjectIsNew, setEditingProjectIsNew] = useState(false);
    const [editProjectData, setEditProjectData] = useState<ProjectPage & { slug?: string }>({});
    const [savingProject, setSavingProject] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [savingSection, setSavingSection] = useState<SectionKey | null>(null);

    useEffect(() => {
        if (!db) return;
        let cancelled = false;
        (async () => {
            try {
                const snap = await getDoc(doc(db, SETTINGS_DOC, CONTENT_ID));
                if (cancelled) return;
                if (snap.exists()) {
                    const d = snap.data() as ContentMap;
                    // Defaults ile merge
                    const merged: ContentMap = {};
                    for (const k of Object.keys(DEFAULTS)) {
                        merged[k] = { ...(DEFAULTS[k] as Record<string, unknown>), ...((d[k] as Record<string, unknown>) || {}) };
                    }
                    setContent(merged);
                    // Project pages (dynamic /hangelassociation/projects/[slug])
                    if (d.projectPages && typeof d.projectPages === 'object') {
                        setProjectPages(d.projectPages as Record<string, ProjectPage>);
                    }
                }
            } catch (e) {
                console.error('Load failed', e);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [db]);

    const updateField = (sectionKey: SectionKey, fieldKey: string, value: unknown) => {
        setContent(prev => ({
            ...prev,
            [sectionKey]: { ...(prev[sectionKey] as Record<string, unknown>), [fieldKey]: value },
        }));
    };

    const handleSave = async (sectionKey: SectionKey, label: string) => {
        if (!db) return;
        setSavingSection(sectionKey);
        try {
            await setDoc(
                doc(db, SETTINGS_DOC, CONTENT_ID),
                { [sectionKey]: content[sectionKey] },
                { merge: true },
            );
            toast({ title: 'Kaydedildi', description: `${label} sayfası güncellendi.` });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Kaydedilemedi.';
            toast({ variant: 'destructive', title: 'Hata', description: message });
        } finally {
            setSavingSection(null);
        }
    };

    // ------- Proje Sayfaları (dynamic /hangelassociation/projects/[slug]) -------

    const handleStartEditProject = (slug: string) => {
        setEditingProjectSlug(slug);
        setEditingProjectIsNew(false);
        setEditProjectData({ slug, ...(projectPages[slug] || {}) });
    };

    const handleStartNewProject = () => {
        setEditingProjectSlug('__new__');
        setEditingProjectIsNew(true);
        setEditProjectData({ slug: '', title: '', subtitle: '', description: '', heroImageUrl: '', body: '' });
    };

    const handleSaveProject = async () => {
        if (!db) return;
        const slug = (editProjectData.slug || '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (!slug) {
            toast({ variant: 'destructive', title: 'Slug gerekli', description: 'URL için kısa bir slug girin (örn: etki-atlasi).' });
            return;
        }
        if (editingProjectIsNew && projectPages[slug]) {
            toast({ variant: 'destructive', title: 'Slug zaten var', description: 'Farklı bir slug seçin.' });
            return;
        }
        setSavingProject(true);
        try {
            const { slug: _s, ...payload } = editProjectData;
            await setDoc(
                doc(db, SETTINGS_DOC, CONTENT_ID),
                { projectPages: { [slug]: payload } },
                { merge: true },
            );
            setProjectPages(prev => ({ ...prev, [slug]: payload }));
            toast({ title: 'Kaydedildi', description: `Proje sayfası "${slug}" güncellendi.` });
            setEditingProjectSlug(null);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Hata oluştu.';
            toast({ variant: 'destructive', title: 'Hata', description: message });
        } finally {
            setSavingProject(false);
        }
    };

    const handleDeleteProject = async (slug: string) => {
        if (!db) return;
        if (!confirm(`"${slug}" projesi silinecek. Emin misiniz?`)) return;
        try {
            await updateDoc(
                doc(db, SETTINGS_DOC, CONTENT_ID),
                { [`projectPages.${slug}`]: deleteField() },
            );
            setProjectPages(prev => {
                const next = { ...prev };
                delete next[slug];
                return next;
            });
            toast({ title: 'Silindi', description: `Proje "${slug}" silindi.` });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Silinemedi.';
            toast({ variant: 'destructive', title: 'Silinemedi', description: message });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
    }

    const sections: { key: SectionKey; label: string; description: string }[] = [
        { key: 'homepage', label: 'Ana Sayfa', description: '/hangelassociation sayfasının içeriklerini düzenleyin.' },
        { key: 'about', label: 'Hakkında', description: '/hangelassociation/about sayfasının içeriklerini düzenleyin.' },
        { key: 'press', label: 'Basında Biz', description: 'Dernek basın haberleri sayfası.' },
        { key: 'events', label: 'Etkinlikler', description: '/hangelassociation/events sayfası.' },
        { key: 'workshop', label: 'Çalıştay', description: '/hangelassociation/workshop sayfası.' },
        { key: 'conferences', label: 'Konferanslar', description: 'Dernek konferans programları sayfası.' },
        { key: 'projects', label: 'Projeler', description: '/hangelassociation/projects bölümü.' },
        { key: 'entrepreneurshipLibrary', label: 'Girişimcilik Kütüphanesi', description: 'Sosyal girişimcilik referans kütüphanesi.' },
        { key: 'impactAtlas', label: 'Etki Atlası', description: 'Sosyal Etki Atlası projesi sayfası.' },
        { key: 'employmentProtocol', label: 'İstihdam Protokolü', description: 'Etki odaklı istihdam protokolü sayfası.' },
        { key: 'legislation', label: 'Mevzuat', description: '/hangelassociation/legislation sayfası.' },
        { key: 'contact', label: 'İletişim', description: '/hangelassociation/contact sayfası.' },
        { key: 'feedback', label: 'Geri Bildirim', description: '/hangelassociation/feedback sayfası.' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.push('/super-admin')} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Dernek Web Sitesi Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">
                        /hangelassociation altındaki tüm sayfaların içerik ve görsellerini Firestore üzerinden yönetin.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="homepage" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 h-auto gap-1 p-1">
                    {sections.map(s => (
                        <TabsTrigger key={s.key} value={s.key} className="text-xs whitespace-normal h-auto py-2">{s.label}</TabsTrigger>
                    ))}
                </TabsList>

                {sections.map(s => (
                    <TabsContent key={s.key} value={s.key} className="mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>{s.label} Sayfası</CardTitle>
                                <CardDescription>{s.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <SectionEditor
                                    sectionKey={s.key}
                                    section={(content[s.key] as Record<string, unknown>) || {}}
                                    onChange={(k, v) => updateField(s.key, k, v)}
                                    fields={SECTION_FIELDS[s.key]}
                                />
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={() => handleSave(s.key, s.label)}
                                    disabled={savingSection !== null}
                                    className="rounded-xl font-bold"
                                >
                                    {savingSection === s.key ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="mr-2 h-4 w-4" />
                                    )}
                                    {s.label} Sayfasını Kaydet
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Proje Sayfaları yönetimi — /hangelassociation/projects/[slug] */}
            <Card className="rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2"><FolderOpen className="h-5 w-5" /> Proje Sayfaları</CardTitle>
                        <CardDescription>
                            /hangelassociation/projects/[slug] altındaki bireysel proje sayfalarını yönet — yeni proje ekle, mevcudu düzenle/sil.
                        </CardDescription>
                    </div>
                    <Button onClick={handleStartNewProject} className="rounded-xl">
                        <Plus className="h-4 w-4 mr-1" /> Yeni Proje
                    </Button>
                </CardHeader>
                <CardContent>
                    {Object.keys(projectPages).length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                            Henüz CMS'te proje yok. (Statik fallback'lar: <code>etki-atlasi</code>, <code>istihdam-protokolu</code>, <code>gelir-modeli</code> hâlâ kodda.)
                        </div>
                    ) : (
                        <div className="border rounded-xl overflow-hidden divide-y">
                            {Object.entries(projectPages).map(([slug, p]) => (
                                <div key={slug} className="p-4 flex items-start justify-between gap-3 hover:bg-muted/30">
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-sm">{p.title || slug}</p>
                                            <Badge variant="outline" className="text-[10px]">/projects/{slug}</Badge>
                                            <Link
                                                href={`/hangelassociation/projects/${slug}`}
                                                target="_blank"
                                                className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                                            >
                                                aç <ExternalLink className="h-3 w-3" />
                                            </Link>
                                        </div>
                                        {p.subtitle && <p className="text-xs text-muted-foreground truncate">{p.subtitle}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button variant="outline" size="sm" onClick={() => handleStartEditProject(slug)} className="rounded-xl">
                                            <Pencil className="h-3.5 w-3.5 mr-1" /> Düzenle
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteProject(slug)}
                                            className="text-destructive hover:bg-destructive/10 rounded-xl"
                                            aria-label="Projeyi sil"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Proje Düzenle / Yeni Proje dialog */}
            <Dialog open={!!editingProjectSlug} onOpenChange={(o) => !o && setEditingProjectSlug(null)}>
                <DialogContent className="max-w-2xl rounded-[2rem] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingProjectIsNew ? 'Yeni Proje Sayfası' : 'Projeyi Düzenle'}</DialogTitle>
                        <DialogDescription>
                            URL: <code>/hangelassociation/projects/{editProjectData.slug || '...'}</code>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Slug (URL parçası)</Label>
                            <Input
                                value={editProjectData.slug || ''}
                                onChange={e => setEditProjectData({ ...editProjectData, slug: e.target.value })}
                                placeholder="ornek: etki-atlasi"
                                disabled={!editingProjectIsNew}
                            />
                            {editingProjectIsNew && (
                                <p className="text-[10px] text-muted-foreground">Sadece harf, rakam, tire. Kayıttan sonra değişmez.</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Başlık</Label>
                            <Input
                                value={editProjectData.title || ''}
                                onChange={e => setEditProjectData({ ...editProjectData, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Alt Başlık</Label>
                            <Input
                                value={editProjectData.subtitle || ''}
                                onChange={e => setEditProjectData({ ...editProjectData, subtitle: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Açıklama</Label>
                            <Textarea
                                value={editProjectData.description || ''}
                                onChange={e => setEditProjectData({ ...editProjectData, description: e.target.value })}
                                rows={3}
                            />
                        </div>
                        <ImageUploader
                            label="Kapak Görseli"
                            value={editProjectData.heroImageUrl || ''}
                            onChange={(url) => setEditProjectData({ ...editProjectData, heroImageUrl: url })}
                            pathPrefix={`siteContent/association/projects/${editProjectData.slug || 'new'}`}
                        />
                        <div className="space-y-2">
                            <Label>İçerik</Label>
                            <RichTextEditor
                                value={editProjectData.body || ''}
                                onChange={(html) => setEditProjectData({ ...editProjectData, body: html })}
                                placeholder="Proje detaylarını buraya yazın..."
                                minHeight={280}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setEditingProjectSlug(null)}>İptal</Button>
                        <Button onClick={handleSaveProject} disabled={savingProject} className="font-bold">
                            {savingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Card className="rounded-2xl border-amber-200 bg-amber-50/50">
                <CardContent className="p-4 text-sm space-y-2">
                    <p className="font-semibold text-amber-900">📝 Not:</p>
                    <p className="text-amber-800 leading-relaxed">
                        Buradaki içerikler Firestore'da <code className="bg-white px-1 rounded">siteSettings/associationContent</code> doc'una yazılır.
                        Ön yüzde görünmesi için ilgili sayfaların bu Firestore alanlarını okumaya bağlanması gerekir.
                        Yeni basın/etkinlik/duyuru sayfaları için <a href="/super-admin/pages" className="underline font-semibold">İçerik Sayfaları</a> bölümünü kullanın.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
