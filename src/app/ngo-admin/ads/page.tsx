'use client';

/**
 * /ngo-admin/ads — STK "Reklam Yönetimi" (Google Ad Grants).
 *
 * Faz 0: kullanımı çok kolay sihirbaz —
 *   1) Durum stepper: web sitesi → Google başvurusu → hesap bağlama
 *   2) Başvuru: "Web siten var mı?" — yoksa önce /ngo-admin/website ile ücretsiz
 *      site kur (DNS ~24s), sonra Google'da başvur.
 *   3) Yapay zeka 5 reklam önerisi (kurum adı + faaliyet alanından; 3 strateji
 *      + hangel bağış + hangel imece gönüllülük).
 *
 * Google Ads API entegrasyonu (hesap bağlama, yayınlama) Faz 1.
 * Tasarım: Apple iOS dili + hangel renkleri.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Megaphone, HandCoins, Users, Heart, Sparkles, Globe, Check, ExternalLink,
    Loader2, ChevronRight, AlertTriangle, Clock, Search, Wand2,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EntityDoc {
    name?: string;
    faaliyetAlani?: string;
    category?: string;
    il?: string;
    city?: string;
    website?: string;
    shortLink?: string;
}

type ProposalKind = 'search-donation' | 'search-awareness' | 'search-beneficiary' | 'hangel-donation' | 'hangel-volunteer';
interface AdProposal {
    kind: ProposalKind;
    title: string;
    goal: string;
    landing: 'kurum-sitesi' | 'hangel-bagis' | 'hangel-gonulluluk';
    keywords: string[];
    headlines: string[];
    descriptions: string[];
    regions: string[];
    estReach: string;
}

const KIND_META: Record<ProposalKind, { label: string; icon: React.ElementType; tint: string }> = {
    'search-donation': { label: 'Bağış Topla', icon: HandCoins, tint: 'bg-rose-500/10 text-rose-600' },
    'search-awareness': { label: 'Bilinirlik', icon: Megaphone, tint: 'bg-blue-500/10 text-blue-600' },
    'search-beneficiary': { label: 'Yararlanıcıya Ulaş', icon: Users, tint: 'bg-amber-500/10 text-amber-600' },
    'hangel-donation': { label: 'hangel Bağış Sayfası', icon: Heart, tint: 'bg-primary/10 text-primary' },
    'hangel-volunteer': { label: 'hangel İmece Gönüllülük', icon: Sparkles, tint: 'bg-emerald-500/10 text-emerald-600' },
};
const LANDING_LABEL: Record<AdProposal['landing'], string> = {
    'kurum-sitesi': 'Açılış: kurum siteniz',
    'hangel-bagis': 'Açılış: hangel bağış sayfası',
    'hangel-gonulluluk': 'Açılış: hangel gönüllülük',
};

type PlanStatus = 'submitted' | 'approved' | 'linked' | 'active' | 'rejected';
const STATUS_LABEL: Record<PlanStatus, string> = {
    submitted: 'Başvuruldu',
    approved: 'Onaylandı',
    linked: 'Bağlandı',
    active: 'Aktif',
    rejected: 'Reddedildi',
};
const STATUS_TINT: Record<PlanStatus, string> = {
    submitted: 'bg-amber-500/10 text-amber-600',
    approved: 'bg-blue-500/10 text-blue-600',
    linked: 'bg-indigo-500/10 text-indigo-600',
    active: 'bg-emerald-500/10 text-emerald-600',
    rejected: 'bg-rose-500/10 text-rose-600',
};

interface SavedPlan {
    kind: ProposalKind;
    status: PlanStatus;
}

const GOOGLE_NONPROFITS_URL = 'https://www.google.com/intl/tr/nonprofits/';

export default function AdsPage() {
    const { user } = useUser();
    const { id: entityId, kind: entityKind, isLoading } = useActiveEntity();
    const { data: activeDoc } = useActiveEntityDoc<EntityDoc>();
    const { toast } = useToast();

    const [origin, setOrigin] = useState('');
    useEffect(() => { if (typeof window !== 'undefined') setOrigin(window.location.origin); }, []);

    // Web sitesi dallanması (Faz 0: yerel state; web sitesi yönetimi entegrasyonu sonra)
    const [hasWebsite, setHasWebsite] = useState<'unknown' | 'yes' | 'no'>('unknown');
    const [domain, setDomain] = useState('');

    // AI öneriler
    const [loading, setLoading] = useState(false);
    const [proposals, setProposals] = useState<AdProposal[]>([]);
    const [selected, setSelected] = useState<Set<ProposalKind>>(new Set());

    // STK'nın kayıtlı planları (Google ilerleme durumu)
    const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);

    // Kayıtlı planları çek; 'selected' Set'ini hidrate et.
    useEffect(() => {
        if (!user || !entityId) return;
        let cancelled = false;
        (async () => {
            try {
                const idToken = await user.getIdToken();
                const res = await fetch('/api/ngo-admin/ads/select', {
                    headers: { Authorization: `Bearer ${idToken}` },
                });
                if (!res.ok) return;
                const data = (await res.json().catch(() => null)) as { plans?: SavedPlan[] } | null;
                if (cancelled || !data?.plans) return;
                const plans = data.plans.filter((p) => p.kind in KIND_META);
                setSavedPlans(plans);
                setSelected((prev) => {
                    const next = new Set(prev);
                    for (const p of plans) next.add(p.kind);
                    return next;
                });
            } catch {
                /* sessizce yoksay; sayfa kayıtlı plan olmadan da çalışır */
            }
        })();
        return () => { cancelled = true; };
    }, [user, entityId]);

    // kind → güncel kayıtlı durum
    const savedStatusByKind = useMemo(() => {
        const m = new Map<ProposalKind, PlanStatus>();
        for (const p of savedPlans) m.set(p.kind, p.status);
        return m;
    }, [savedPlans]);

    // Step2/Step3 durum hesabı (savedPlans tabanlı)
    const statuses = useMemo(() => savedPlans.map((p) => p.status), [savedPlans]);
    const step2State: 'done' | 'pending' | 'todo' =
        statuses.some((s) => s === 'approved' || s === 'linked' || s === 'active') ? 'done'
            : statuses.some((s) => s === 'submitted') ? 'pending'
                : 'todo';
    const step3State: 'done' | 'pending' | 'todo' =
        statuses.some((s) => s === 'linked' || s === 'active') ? 'done'
            : statuses.some((s) => s === 'approved') ? 'pending'
                : 'todo';

    const entityName = activeDoc?.name || 'Kuruluşunuz';
    const faaliyetAlani = activeDoc?.faaliyetAlani || activeDoc?.category || '';
    const city = activeDoc?.il || activeDoc?.city || '';
    const orgType = entityKind === 'ngo' ? 'STK (Dernek/Vakıf)' : entityKind === 'club' ? 'Kulüp' : 'Marka';

    const profilePath = useMemo(() => {
        if (!entityId || !entityKind) return '';
        if (entityKind === 'ngo') return `/ngos/${entityId}`;
        if (entityKind === 'brand') return `/market/${entityId}`;
        return `/clubs/profile/${entityId}`;
    }, [entityId, entityKind]);
    const hangelDonationUrl = origin && profilePath ? `${origin}${profilePath}` : '';
    const hangelVolunteerUrl = origin ? `${origin}/volunteering` : '';

    // Site var mı → activeDoc.website varsa otomatik "var" say.
    useEffect(() => {
        if (activeDoc?.website && hasWebsite === 'unknown') {
            setHasWebsite('yes');
            setDomain(activeDoc.website);
        }
    }, [activeDoc?.website, hasWebsite]);

    const websiteReady = hasWebsite === 'yes' && domain.trim().length > 3;

    const generate = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Lütfen giriş yapın.' });
            return;
        }
        setLoading(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/ads/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({
                    orgName: entityName,
                    orgType,
                    faaliyetAlani,
                    city,
                    hangelDonationUrl,
                    hangelVolunteerUrl,
                    website: websiteReady ? domain.trim() : '',
                }),
            });
            const data = (await res.json().catch(() => null)) as { proposals?: AdProposal[]; message?: string } | null;
            if (!res.ok || !data?.proposals) {
                throw new Error(data?.message || 'Plan oluşturulamadı.');
            }
            setProposals(data.proposals);
            toast({ title: 'Reklam planın hazır', description: `${data.proposals.length} öneri oluşturuldu.` });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Oluşturulamadı', description: e instanceof Error ? e.message : 'Bir hata oluştu.' });
        } finally {
            setLoading(false);
        }
    };

    const chooseProposal = async (p: AdProposal) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Lütfen giriş yapın.' });
            return;
        }
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/ngo-admin/ads/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({
                    ngoName: entityName,
                    kind: p.kind, title: p.title, goal: p.goal, landing: p.landing,
                    keywords: p.keywords, headlines: p.headlines, descriptions: p.descriptions,
                    regions: p.regions, estReach: p.estReach,
                }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || 'Kaydedilemedi');
            setSelected((prev) => new Set(prev).add(p.kind));
            toast({
                title: 'Planın hangel ekibine iletildi',
                description: `"${p.title}" kaydedildi; Google hesabın bağlanınca yayına alınacak.`,
            });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Kaydedilemedi', description: e instanceof Error ? e.message : 'Lütfen tekrar dene.' });
        }
    };

    if (isLoading) {
        return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }
    if (!entityId || !entityKind) {
        return (
            <div className="p-4 sm:p-6">
                <div className="rounded-3xl bg-card border border-border/60 shadow-sm py-12 text-center space-y-2">
                    <Megaphone className="h-10 w-10 text-muted-foreground mx-auto" />
                    <p className="font-semibold">Aktif kurum bulunamadı</p>
                    <p className="text-sm text-muted-foreground">Reklam yönetimi için üstteki kurum seçiciden bir kurum seçin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-dvh bg-[#f5f5f7]">
            <div className="mx-auto w-full max-w-2xl px-4 sm:px-5 py-6 space-y-6 animate-in fade-in-0 duration-300">

                {/* HERO */}
                <div className="text-center space-y-3 pt-2">
                    <span className="inline-flex h-[76px] w-[76px] items-center justify-center rounded-[24px] bg-gradient-to-br from-primary to-[#ff7a55] shadow-[0_10px_30px_-8px_rgba(243,71,35,0.5)]">
                        <Megaphone className="h-9 w-9 text-white" strokeWidth={1.8} />
                    </span>
                    <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight text-foreground leading-[1.1]">Google Reklam Hakkın</h1>
                    <p className="text-[15px] text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Uygun STK&apos;lara Google&apos;dan <span className="font-semibold text-foreground">ayda 10.000 USD</span> ücretsiz reklam hakkı. hangel senin için planlar, sen sadece seçersin.
                    </p>
                </div>

                {/* DURUM STEPPER */}
                <section className="space-y-2.5">
                    <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Durumun</h2>
                    <div className="rounded-3xl bg-card border border-border/60 shadow-sm divide-y divide-border/50 overflow-hidden">
                        <StepRow n={1} title="Web sitesi"
                            state={websiteReady ? 'done' : hasWebsite === 'no' ? 'pending' : 'todo'}
                            note={websiteReady ? domain : hasWebsite === 'no' ? 'Ücretsiz hangel sitesi kurulacak' : 'Aşağıdan belirt'} />
                        <StepRow n={2} title="Google başvurusu"
                            state={step2State}
                            note={step2State === 'done' ? 'Başvurun hangel tarafından onaylandı'
                                : step2State === 'pending' ? 'Başvurun hangel ekibinde incelemede'
                                    : 'Web sitesi hazır olunca'} />
                        <StepRow n={3} title="Hesabı bağla & yayınla"
                            state={step3State}
                            note={step3State === 'done' ? 'Google hesabın bağlandı, yayında'
                                : step3State === 'pending' ? 'Onaylandı, hesap bağlanıyor'
                                    : 'Onaydan sonra'} />
                    </div>
                </section>

                {/* BAŞVURU — web sitesi dallanması */}
                <section className="space-y-2.5">
                    <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Reklam Hakkına Başvur</h2>
                    <div className="rounded-3xl bg-card border border-border/60 shadow-sm p-4 space-y-4">
                        <div>
                            <p className="text-[15px] font-semibold text-foreground">Web siteniz var mı?</p>
                            <p className="text-[13px] text-muted-foreground">Google Ad Grants için kuruma ait çalışan bir web sitesi şarttır.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            <button onClick={() => setHasWebsite('yes')}
                                className={cn('rounded-2xl border p-4 text-left active:scale-[0.97] transition',
                                    hasWebsite === 'yes' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border/60 bg-muted/30')}>
                                <Globe className="h-5 w-5 text-primary mb-1.5" />
                                <p className="text-[14px] font-semibold text-foreground">Evet, var</p>
                                <p className="text-[11px] text-muted-foreground">Domainimi gireyim</p>
                            </button>
                            <button onClick={() => setHasWebsite('no')}
                                className={cn('rounded-2xl border p-4 text-left active:scale-[0.97] transition',
                                    hasWebsite === 'no' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border/60 bg-muted/30')}>
                                <Wand2 className="h-5 w-5 text-primary mb-1.5" />
                                <p className="text-[14px] font-semibold text-foreground">Hayır, yok</p>
                                <p className="text-[11px] text-muted-foreground">hangel ücretsiz kursun</p>
                            </button>
                        </div>

                        {hasWebsite === 'yes' && (
                            <div className="space-y-3 pt-1">
                                <input
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    placeholder="ornekstk.org.tr"
                                    className="w-full h-11 rounded-2xl bg-muted border border-border/60 px-4 text-[14px] outline-none focus:ring-2 focus:ring-primary/40"
                                />
                                <a href={GOOGLE_NONPROFITS_URL} target="_blank" rel="noopener noreferrer"
                                    className={cn('w-full h-12 rounded-2xl flex items-center justify-center gap-2 text-[15px] font-semibold transition active:scale-[0.98]',
                                        websiteReady ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground pointer-events-none')}>
                                    Google&apos;da Başvur <ExternalLink className="h-4 w-4" />
                                </a>
                                <p className="text-[11px] text-muted-foreground text-center">Yeni sekmede Google for Nonprofits açılır; Goodstack doğrulaması ile tamamlanır.</p>
                            </div>
                        )}

                        {hasWebsite === 'no' && (
                            <div className="space-y-3 pt-1">
                                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                                    <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                    <p className="text-[12px] text-amber-800 leading-relaxed">
                                        Önce ücretsiz hangel web siteni kur. DNS ayarları nedeniyle siten <span className="font-semibold">~24 saat içinde</span> yayına girer. Yayınlanınca buraya dönüp Google başvurusunu yap.
                                    </p>
                                </div>
                                <Link href="/ngo-admin/website"
                                    className="w-full h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center gap-2 text-[15px] font-semibold shadow-sm active:scale-[0.98] transition">
                                    <Globe className="h-[18px] w-[18px]" /> Ücretsiz Web Sitesi Kur
                                </Link>
                                <div className="w-full h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center gap-2 text-[15px] font-semibold">
                                    <AlertTriangle className="h-4 w-4" /> Google&apos;da Başvur (site yayınlanınca açılır)
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* AI ÖNERİLER */}
                <section className="space-y-2.5">
                    <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Yapay Zeka Reklam Planı</h2>
                    <div className="rounded-3xl bg-card border border-border/60 shadow-sm p-4 space-y-4">
                        {proposals.length === 0 ? (
                            <div className="text-center space-y-3 py-2">
                                <span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary/10">
                                    <Wand2 className="h-7 w-7 text-primary" strokeWidth={1.8} />
                                </span>
                                <div className="space-y-1">
                                    <p className="font-semibold text-[15px] text-foreground">Sana özel 5 reklam önerisi</p>
                                    <p className="text-[13px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                        <span className="font-medium text-foreground">{entityName}</span>{faaliyetAlani ? ` · ${faaliyetAlani}` : ''} için yapay zeka hazır kampanyalar kurgular — bağış, bilinirlik, gönüllülük. Sen sadece beğendiğini seç.
                                    </p>
                                </div>
                                <button onClick={generate} disabled={loading}
                                    className="w-full h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center gap-2 text-[15px] font-semibold shadow-sm active:scale-[0.98] transition disabled:opacity-60">
                                    {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Hazırlanıyor...</> : <><Sparkles className="h-[18px] w-[18px]" /> Reklam Planımı Oluştur</>}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[13px] text-muted-foreground">{proposals.length} öneri · beğendiğini kur</p>
                                    <button onClick={generate} disabled={loading} className="text-[13px] font-semibold text-primary inline-flex items-center gap-1">
                                        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Yenile
                                    </button>
                                </div>
                                {proposals.map((p, i) => {
                                    const meta = KIND_META[p.kind] ?? KIND_META['search-awareness'];
                                    const Icon = meta.icon;
                                    const isSel = selected.has(p.kind);
                                    const savedStatus = savedStatusByKind.get(p.kind);
                                    return (
                                        <div key={`${p.kind}-${i}`} className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
                                            <div className="flex items-start gap-3">
                                                <span className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', meta.tint)}>
                                                    <Icon className="h-5 w-5" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-[15px] font-semibold text-foreground">{p.title}</p>
                                                        <span className="text-[10px] font-semibold rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{meta.label}</span>
                                                    </div>
                                                    <p className="text-[13px] text-muted-foreground leading-relaxed mt-0.5">{p.goal}</p>
                                                </div>
                                            </div>

                                            {p.keywords?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {p.keywords.slice(0, 8).map((k) => (
                                                        <span key={k} className="inline-flex items-center gap-1 rounded-full bg-card border border-border/60 px-2.5 py-1 text-[11px] text-foreground">
                                                            <Search className="h-3 w-3 text-muted-foreground" /> {k}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {p.headlines?.[0] && (
                                                <div className="rounded-xl bg-card border border-border/50 p-2.5">
                                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Örnek reklam</p>
                                                    <p className="text-[13px] font-semibold text-[#1a0dab] mt-0.5">{p.headlines[0]}</p>
                                                    {p.descriptions?.[0] && <p className="text-[12px] text-muted-foreground">{p.descriptions[0]}</p>}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                                <div className="text-[11px] text-muted-foreground">
                                                    <span>{LANDING_LABEL[p.landing]}</span>
                                                    {p.estReach && <span> · {p.estReach}</span>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {savedStatus && (
                                                        <span className={cn('h-9 rounded-full px-3 text-[12px] font-semibold inline-flex items-center', STATUS_TINT[savedStatus])}>
                                                            {STATUS_LABEL[savedStatus]}
                                                        </span>
                                                    )}
                                                    <button onClick={() => chooseProposal(p)}
                                                        className={cn('h-9 rounded-full px-4 text-[13px] font-semibold inline-flex items-center gap-1.5 transition active:scale-95',
                                                            isSel ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary text-primary-foreground')}>
                                                        {isSel ? <><Check className="h-4 w-4" /> Seçildi</> : <>Bunu Kur <ChevronRight className="h-4 w-4" /></>}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <p className="text-[11px] text-muted-foreground text-center pt-1">
                                    Seçtiğin kampanyalar Google hesabın bağlandığında otomatik yayına alınır (yakında).
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

function StepRow({ n, title, state, note }: { n: number; title: string; state: 'done' | 'pending' | 'todo'; note: string }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <span className={cn('h-8 w-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0',
                state === 'done' ? 'bg-emerald-500/15 text-emerald-600'
                    : state === 'pending' ? 'bg-amber-500/15 text-amber-600'
                        : 'bg-secondary text-muted-foreground')}>
                {state === 'done' ? <Check className="h-4 w-4" /> : state === 'pending' ? <Clock className="h-4 w-4" /> : n}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-foreground leading-tight">{title}</p>
                <p className="text-[12px] text-muted-foreground truncate">{note}</p>
            </div>
        </div>
    );
}
