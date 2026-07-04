'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { PlusCircle, Loader2, MousePointerClick, Eye, Percent, Sparkles, BarChart3, ChevronDown } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { AD_PLACEMENTS, SEED_MARKET_ADS, type MarketAdBanner, type AdPlacement, type AdDesign } from '@/lib/market/ad-banners';
import { AdStats } from '@/components/admin/ad-stats';

type BannerDoc = MarketAdBanner;

type BannerFormValues = Omit<MarketAdBanner, 'id' | 'createdAt' | 'updatedAt' | 'clickCount' | 'impressionCount'>;

const EMPTY_DESIGN: AdDesign = {
    bg: 'linear-gradient(120deg, #ff4d6d 0%, #ff6b4a 55%, #ff8a3d 100%)',
    fg: '#ffffff',
    accent: '#ffe4e9',
    ctaBg: '#ffffff',
    ctaFg: '#e11d48',
    logoText: 'hangel',
    imageUrl: '',
};

/** epoch ms → yyyy-mm-dd (date input değeri) */
function msToDateInput(ms?: number | null): string {
    if (!ms) return '';
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return '';
    return d.toISOString().slice(0, 10);
}

/** yyyy-mm-dd → epoch ms (boş = null) */
function dateInputToMs(v: string): number | null {
    if (!v) return null;
    const ms = new Date(v).getTime();
    return Number.isNaN(ms) ? null : ms;
}

/** Reklam banner önizlemesi — design'a göre inline stil ile küçük render. */
function BannerPreview({
    design,
    eyebrow,
    title,
    subtitle,
    ctaText,
}: {
    design: AdDesign;
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaText: string;
}) {
    return (
        <div
            className="relative w-full overflow-hidden rounded-xl px-5 py-4"
            style={{
                background: design.bg,
                color: design.fg,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                ...(design.imageUrl
                    ? { backgroundImage: `${design.bg}, url(${design.imageUrl})` }
                    : {}),
            }}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    {eyebrow && (
                        <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: design.accent }}>
                            {eyebrow}
                        </p>
                    )}
                    <p className="truncate text-base font-bold leading-tight">{title || 'Başlık'}</p>
                    {subtitle && <p className="mt-0.5 line-clamp-2 text-xs opacity-90">{subtitle}</p>}
                    {ctaText && (
                        <span
                            className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
                            style={{ background: design.ctaBg, color: design.ctaFg }}
                        >
                            {ctaText}
                        </span>
                    )}
                </div>
                {design.logoText && (
                    <div className="shrink-0 text-2xl font-black opacity-90">{design.logoText}</div>
                )}
            </div>
        </div>
    );
}

const BannerForm = ({ banner, onSave, saving }: { banner: BannerDoc | null; onSave: (values: BannerFormValues) => void; saving: boolean }) => {
    const [name, setName] = useState('');
    const [eyebrow, setEyebrow] = useState('');
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [ctaText, setCtaText] = useState('');
    const [linkUrl, setLinkUrl] = useState('');
    const [design, setDesign] = useState<AdDesign>(EMPTY_DESIGN);
    const [placements, setPlacements] = useState<AdPlacement[]>(['home']);
    const [rowSlot, setRowSlot] = useState<number>(5);
    const [order, setOrder] = useState<number>(0);
    const [startAt, setStartAt] = useState<string>('');
    const [endAt, setEndAt] = useState<string>('');
    const [active, setActive] = useState<boolean>(true);
    const [targetCategories, setTargetCategories] = useState<string>('');
    const [targetBrands, setTargetBrands] = useState<string>('');
    const { toast } = useToast();

    useEffect(() => {
        setName(banner?.name || '');
        setEyebrow(banner?.eyebrow || '');
        setTitle(banner?.title || '');
        setSubtitle(banner?.subtitle || '');
        setCtaText(banner?.ctaText || '');
        setLinkUrl(banner?.linkUrl || '');
        setDesign(banner?.design ? { ...EMPTY_DESIGN, ...banner.design } : EMPTY_DESIGN);
        setPlacements(banner?.placements?.length ? banner.placements : ['home']);
        setRowSlot(banner?.rowSlot ?? 5);
        setOrder(banner?.order ?? 0);
        setStartAt(msToDateInput(banner?.startAt));
        setEndAt(msToDateInput(banner?.endAt));
        setActive(banner?.active ?? true);
        setTargetCategories((banner?.targetCategories || []).join(', '));
        setTargetBrands((banner?.targetBrands || []).join(', '));
    }, [banner]);

    /** "a, b ,c" → ['a','b','c'] (boş parçalar atılır). Hepsi boşsa undefined döner. */
    const splitCsv = (v: string): string[] | undefined => {
        const arr = v.split(',').map((s) => s.trim()).filter(Boolean);
        return arr.length ? arr : undefined;
    };

    const patchDesign = (patch: Partial<AdDesign>) => setDesign((d) => ({ ...d, ...patch }));

    const togglePlacement = (key: AdPlacement) => {
        setPlacements((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]));
    };

    const handleSave = () => {
        if (!name || !title || !ctaText || !linkUrl) {
            toast({ variant: 'destructive', title: 'Eksik Bilgi', description: 'İç ad, başlık, buton metni ve hedef link zorunludur.' });
            return;
        }
        if (placements.length === 0) {
            toast({ variant: 'destructive', title: 'Yerleşim seçin', description: 'En az bir sayfa türü seçmelisiniz.' });
            return;
        }
        onSave({
            name,
            eyebrow,
            title,
            subtitle,
            ctaText,
            linkUrl,
            design,
            placements,
            rowSlot: Number(rowSlot) || 5,
            order: Number(order) || 0,
            active,
            startAt: dateInputToMs(startAt),
            endAt: dateInputToMs(endAt),
            targetCategories: splitCsv(targetCategories),
            targetBrands: splitCsv(targetBrands),
        });
    };

    return (
        <div className="space-y-4">
            {/* Canlı önizleme */}
            <div className="space-y-1">
                <Label>Canlı Önizleme</Label>
                <BannerPreview design={design} eyebrow={eyebrow} title={title} subtitle={subtitle} ctaText={ctaText} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="ad-name">İç ad</Label>
                    <Input id="ad-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Gelir Modeli Konferansları (hangel)" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ad-eyebrow">Üst etiket</Label>
                    <Input id="ad-eyebrow" value={eyebrow} onChange={(e) => setEyebrow(e.target.value)} placeholder="hangel ile büyü" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ad-title">Başlık</Label>
                    <Input id="ad-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Gelir Modeli Oluşturma Konferansları" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="ad-subtitle">Alt açıklama</Label>
                    <Input id="ad-subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="STK'ler için sürdürülebilir gelir modelleri…" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ad-cta">Buton metni</Label>
                    <Input id="ad-cta" value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Yerini ayır" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ad-link">Hedef link</Label>
                    <Input id="ad-link" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="/etkinlikler veya https://…" />
                </div>
            </div>

            {/* Tasarım (kurumsal kimlik) */}
            <div className="rounded-lg border p-3 space-y-3">
                <p className="text-sm font-semibold">Tasarım (kurumsal kimlik)</p>
                <div className="space-y-2">
                    <Label htmlFor="ad-bg">Arka plan (CSS)</Label>
                    <textarea
                        id="ad-bg"
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        value={design.bg}
                        onChange={(e) => patchDesign({ bg: e.target.value })}
                        placeholder="linear-gradient(...) veya #renk"
                    />
                    <p className="text-xs text-muted-foreground">linear-gradient(...) veya #renk</p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                        <Label htmlFor="ad-fg">Metin rengi</Label>
                        <Input id="ad-fg" value={design.fg} onChange={(e) => patchDesign({ fg: e.target.value })} placeholder="#ffffff" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ad-accent">Vurgu</Label>
                        <Input id="ad-accent" value={design.accent} onChange={(e) => patchDesign({ accent: e.target.value })} placeholder="#ffe4e9" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ad-ctabg">Buton arka planı</Label>
                        <Input id="ad-ctabg" value={design.ctaBg} onChange={(e) => patchDesign({ ctaBg: e.target.value })} placeholder="#ffffff" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ad-ctafg">Buton metni</Label>
                        <Input id="ad-ctafg" value={design.ctaFg} onChange={(e) => patchDesign({ ctaFg: e.target.value })} placeholder="#e11d48" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ad-logo">Wordmark/emoji</Label>
                        <Input id="ad-logo" value={design.logoText || ''} onChange={(e) => patchDesign({ logoText: e.target.value })} placeholder="hangel / ✈️" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ad-imageurl">Görsel URL</Label>
                        <Input id="ad-imageurl" value={design.imageUrl || ''} onChange={(e) => patchDesign({ imageUrl: e.target.value })} placeholder="(opsiyonel) https://…" />
                    </div>
                </div>
            </div>

            {/* Yerleşim */}
            <div className="space-y-2">
                <Label>Yerleşim (sayfa türleri)</Label>
                <div className="grid grid-cols-2 gap-2">
                    {AD_PLACEMENTS.map((p) => (
                        <label key={p.key} className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-input"
                                checked={placements.includes(p.key)}
                                onChange={() => togglePlacement(p.key)}
                            />
                            {p.label}
                        </label>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="ad-rowslot">Satır slotu (kaçıncı satır)</Label>
                    <Input id="ad-rowslot" type="number" value={rowSlot} onChange={(e) => setRowSlot(Number(e.target.value))} placeholder="5" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ad-order">Sıra (order)</Label>
                    <Input id="ad-order" type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} placeholder="0" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ad-start">Başlangıç (opsiyonel)</Label>
                    <Input id="ad-start" type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ad-end">Bitiş (opsiyonel)</Label>
                    <Input id="ad-end" type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </div>
            </div>

            {/* Hedefleme (opsiyonel) */}
            <div className="rounded-lg border p-3 space-y-3">
                <p className="text-sm font-semibold">Hedefleme (opsiyonel)</p>
                <div className="space-y-2">
                    <Label htmlFor="ad-targetcats">Hedef kategoriler (virgülle)</Label>
                    <Input
                        id="ad-targetcats"
                        value={targetCategories}
                        onChange={(e) => setTargetCategories(e.target.value)}
                        placeholder="Otel, Uçak Bileti, Elektronik"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="ad-targetbrands">Hedef markalar (virgülle)</Label>
                    <Input
                        id="ad-targetbrands"
                        value={targetBrands}
                        onChange={(e) => setTargetBrands(e.target.value)}
                        placeholder="apple, egaranti"
                    />
                </div>
                <p className="text-xs text-muted-foreground">Boş bırakılırsa tüm sayfalarda görünür.</p>
            </div>

            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4 rounded border-input" checked={active} onChange={(e) => setActive(e.target.checked)} />
                Aktif (yayında)
            </label>

            <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Kaydet
            </Button>
        </div>
    );
};

export default function MarketAdsPage() {
    const { toast } = useToast();
    const db = useFirestore();

    const bannersQuery = useMemoFirebase(
        () => (db ? query(collection(db, COLLECTIONS.marketAdBanners), orderBy('rowSlot', 'asc')) : null),
        [db],
    );
    const { data: banners, isLoading } = useCollection<BannerDoc>(bannersQuery);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<BannerDoc | null>(null);
    const [saving, setSaving] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);
    const [statsOpenId, setStatsOpenId] = useState<string | null>(null);

    const sortedBanners = [...(banners || [])].sort(
        (a, b) => (a.rowSlot ?? 0) - (b.rowSlot ?? 0) || (a.order ?? 0) - (b.order ?? 0),
    );

    const handleSaveBanner = async (values: BannerFormValues) => {
        if (!db) return;
        setSaving(true);
        try {
            if (editingBanner) {
                await updateDoc(doc(db, COLLECTIONS.marketAdBanners, editingBanner.id), {
                    ...values,
                    updatedAt: serverTimestamp(),
                });
                toast({ title: 'Reklam Güncellendi' });
            } else {
                await addDoc(collection(db, COLLECTIONS.marketAdBanners), {
                    ...values,
                    clickCount: 0,
                    impressionCount: 0,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                toast({ title: 'Yeni Reklam Eklendi' });
            }
            setIsFormOpen(false);
            setEditingBanner(null);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'İşlem tamamlanamadı.';
            toast({ variant: 'destructive', title: 'Kaydedilemedi', description: message });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (banner: BannerDoc) => {
        if (!db) return;
        setTogglingId(banner.id);
        try {
            await updateDoc(doc(db, COLLECTIONS.marketAdBanners, banner.id), {
                active: !banner.active,
                updatedAt: serverTimestamp(),
            });
            toast({ title: 'Durum Güncellendi', description: !banner.active ? 'Reklam aktif edildi.' : 'Reklam pasife alındı.' });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'İşlem tamamlanamadı.';
            toast({ variant: 'destructive', title: 'Güncellenemedi', description: message });
        } finally {
            setTogglingId(null);
        }
    };

    const handleDeleteBanner = async (id: string) => {
        if (!db) return;
        try {
            await deleteDoc(doc(db, COLLECTIONS.marketAdBanners, id));
            toast({ variant: 'destructive', title: 'Reklam Silindi' });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'İşlem tamamlanamadı.';
            toast({ variant: 'destructive', title: 'Silinemedi', description: message });
        }
    };

    const handleSeed = async () => {
        if (!db) return;
        setSeeding(true);
        try {
            const existingIds = new Set((banners || []).map((b) => b.id));
            let added = 0;
            for (const seed of SEED_MARKET_ADS) {
                if (existingIds.has(seed.id)) continue;
                await setDoc(doc(db, COLLECTIONS.marketAdBanners, seed.id), {
                    ...seed,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
                added += 1;
            }
            toast({ title: 'Tohum reklamları yüklendi', description: added > 0 ? `${added} reklam eklendi.` : 'Tüm tohum reklamlar zaten mevcuttu.' });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'İşlem tamamlanamadı.';
            toast({ variant: 'destructive', title: 'Yüklenemedi', description: message });
        } finally {
            setSeeding(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-lg font-semibold md:text-2xl">Reklam Alanı Yönetimi</h1>
                    <p className="text-sm text-muted-foreground">
                        Market ürün şeritleri arasına her 5 satırda bir giren reklamları yönetin.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={handleSeed} disabled={seeding}>
                        {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Tohum reklamları yükle
                    </Button>
                    <Button onClick={() => { setEditingBanner(null); setIsFormOpen(true); }}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Yeni Reklam Ekle
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Reklam Bannerları</CardTitle>
                    <CardDescription>
                        Kurumsal kimlikli reklamlar; satır slotuna göre sıralı. Tıklama ve gösterim ölçülür.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : sortedBanners.length === 0 ? (
                        <p className="py-12 text-center text-muted-foreground">
                            Henüz reklam yok. &quot;Tohum reklamları yükle&quot; ile başlayın ya da yeni ekleyin.
                        </p>
                    ) : sortedBanners.map((banner) => {
                        const clicks = banner.clickCount ?? 0;
                        const impressions = banner.impressionCount ?? 0;
                        const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;
                        const statsOpen = statsOpenId === banner.id;
                        return (
                            <Card key={banner.id}>
                                <CardContent className="p-4">
                                  <div className="flex flex-col gap-4 lg:flex-row">
                                    <div className="w-full lg:w-72 lg:shrink-0">
                                        <BannerPreview
                                            design={banner.design}
                                            eyebrow={banner.eyebrow}
                                            title={banner.title}
                                            subtitle={banner.subtitle}
                                            ctaText={banner.ctaText}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold">{banner.name}</p>
                                            <span className={cn(
                                                "rounded-full px-2 py-0.5 text-xs font-medium",
                                                banner.active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground",
                                            )}>
                                                {banner.active ? 'Aktif' : 'Pasif'}
                                            </span>
                                            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                                                {banner.rowSlot}. satır
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {(banner.placements || []).map((p) => {
                                                const label = AD_PLACEMENTS.find((x) => x.key === p)?.label || p;
                                                return (
                                                    <span key={p} className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
                                                        {label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                        {((banner.targetCategories && banner.targetCategories.length > 0) ||
                                          (banner.targetBrands && banner.targetBrands.length > 0)) && (
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {(banner.targetCategories || []).map((c) => (
                                                    <span key={`cat-${c}`} className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
                                                        Kategori: {c}
                                                    </span>
                                                ))}
                                                {(banner.targetBrands || []).map((br) => (
                                                    <span key={`brand-${br}`} className="rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-700">
                                                        Marka: {br}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-4 pt-1">
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <MousePointerClick className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold">{clicks.toLocaleString('tr-TR')}</span>
                                                <span className="text-muted-foreground">Tıklama</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Eye className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold">{impressions.toLocaleString('tr-TR')}</span>
                                                <span className="text-muted-foreground">Gösterim</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Percent className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold">{ctr !== null ? `%${ctr.toFixed(1)}` : '—'}</span>
                                                <span className="text-muted-foreground">CTR</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex w-full flex-col gap-2 self-start md:w-auto md:flex-row lg:flex-col">
                                        <Button size="sm" variant="outline" onClick={() => setStatsOpenId(statsOpen ? null : banner.id)}>
                                            <BarChart3 className="mr-2 h-3.5 w-3.5" />
                                            Detaylı istatistik
                                            <ChevronDown className={cn('ml-1 h-3.5 w-3.5 transition-transform', statsOpen && 'rotate-180')} />
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => { setEditingBanner(banner); setIsFormOpen(true); }}>Düzenle</Button>
                                        <Button size="sm" variant="outline" disabled={togglingId === banner.id} onClick={() => handleToggleActive(banner)}>
                                            {togglingId === banner.id && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
                                            {banner.active ? 'Pasife Al' : 'Aktif Et'}
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="destructive">Sil</Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Reklamı silmek istediğinizden emin misiniz?</AlertDialogTitle>
                                                    <AlertDialogDescription>Bu işlem geri alınamaz.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>İptal</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteBanner(banner.id)} className={cn(buttonVariants({ variant: "destructive" }))}>Evet, Sil</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                  </div>
                                  {statsOpen && (
                                    <AdStats
                                      bannerId={banner.id}
                                      clickCount={clicks}
                                      impressionCount={impressions}
                                    />
                                  )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingBanner ? 'Reklamı Düzenle' : 'Yeni Reklam Ekle'}</DialogTitle>
                    </DialogHeader>
                    <BannerForm banner={editingBanner} onSave={handleSaveBanner} saving={saving} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
