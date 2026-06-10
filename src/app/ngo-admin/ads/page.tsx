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

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    Megaphone, HandCoins, Users, Heart, Sparkles, Globe, Check, ExternalLink,
    Loader2, ChevronRight, AlertTriangle, Clock, Search, Wand2, Link2, BadgeCheck, Copy,
    Facebook, Music2, Building2, Info, Hash, Film, Target, Image as ImageIcon,
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
type AdPlatform = 'google' | 'meta' | 'tiktok';
interface AdProposal {
    kind: ProposalKind;
    title: string;
    goal: string;
    landing: 'kurum-sitesi' | 'hangel-bagis' | 'hangel-gonulluluk';
    keywords?: string[];
    headlines?: string[];
    descriptions?: string[];
    regions?: string[];
    estReach: string;
    // Meta (Facebook/Instagram) alanları — platforma özel önerilerde dolar.
    audience?: string;
    primaryText?: string;
    headline?: string;
    description?: string;
    creativeConcept?: string;
    // TikTok kısa video alanları — platforma özel önerilerde dolar.
    videoConcept?: string;
    caption?: string;
    hashtags?: string[];
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
    id?: string;
    title?: string;
    kind: ProposalKind;
    status: PlanStatus;
}

interface ConnectionState {
    configured: boolean;
    connected: boolean;
    customerId?: string;
}

interface MetaConnectionState {
    configured: boolean;
    connected: boolean;
    adAccountId?: string;
}

interface TiktokConnectionState {
    configured: boolean;
    connected: boolean;
    advertiserId?: string;
}

const GOOGLE_NONPROFITS_URL = 'https://www.google.com/intl/tr/nonprofits/';
const GOOGLE_ADS_URL = 'https://ads.google.com/';

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

    // AI öneriler — platforma özel (her platformun kendi öneri listesi + yükleniyor durumu)
    const [loadingPlatform, setLoadingPlatform] = useState<AdPlatform | null>(null);
    const [proposalsByPlatform, setProposalsByPlatform] = useState<Record<AdPlatform, AdProposal[]>>({ google: [], meta: [], tiktok: [] });
    const [selected, setSelected] = useState<Set<ProposalKind>>(new Set());

    // STK'nın kayıtlı planları (Google ilerleme durumu)
    const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);

    // Google Ads bağlantı durumu (Faz 1)
    const [connection, setConnection] = useState<ConnectionState>({ configured: false, connected: false });
    const [connectionLoaded, setConnectionLoaded] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [publishingId, setPublishingId] = useState<string | null>(null);
    // "Google Ads (Ad Grants) hesabın var mı?" dallanması (bağlanabilir ama henüz bağlı değilken)
    const [googleHasAccount, setGoogleHasAccount] = useState<'unknown' | 'yes' | 'no'>('unknown');

    // Meta (Facebook/Instagram) bağlantı durumu — Google ile birebir paralel
    const [metaConnection, setMetaConnection] = useState<MetaConnectionState>({ configured: false, connected: false });
    const [metaConnectionLoaded, setMetaConnectionLoaded] = useState(false);
    const [metaConnecting, setMetaConnecting] = useState(false);
    const [metaPublishingId, setMetaPublishingId] = useState<string | null>(null);
    // "Meta reklam hesabın var mı?" dallanması (bağlanabilir ama henüz bağlı değilken)
    const [metaHasAccount, setMetaHasAccount] = useState<'unknown' | 'yes' | 'no'>('unknown');

    // TikTok bağlantı durumu — Meta ile birebir paralel
    const [tiktokConnection, setTiktokConnection] = useState<TiktokConnectionState>({ configured: false, connected: false });
    const [tiktokConnectionLoaded, setTiktokConnectionLoaded] = useState(false);
    const [tiktokConnecting, setTiktokConnecting] = useState(false);
    const [tiktokPublishingId, setTiktokPublishingId] = useState<string | null>(null);
    // "TikTok reklam hesabın var mı?" dallanması (bağlanabilir ama henüz bağlı değilken)
    const [tiktokHasAccount, setTiktokHasAccount] = useState<'unknown' | 'yes' | 'no'>('unknown');

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
                const plans = data.plans
                    .filter((p) => p.kind in KIND_META)
                    .map((p) => ({ id: p.id, title: p.title, kind: p.kind, status: p.status }));
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

    // Google Ads bağlantı durumunu çek (configured/connected/customerId)
    const refreshConnection = useCallback(async () => {
        if (!user) return;
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/ngo-admin/ads/connection', {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (!res.ok) return;
            const data = (await res.json().catch(() => null)) as Partial<ConnectionState> | null;
            if (!data) return;
            setConnection({
                configured: data.configured === true,
                connected: data.connected === true,
                customerId: typeof data.customerId === 'string' ? data.customerId : undefined,
            });
        } catch {
            /* sessizce yoksay; bağlantı durumu olmadan da sayfa çalışır */
        }
    }, [user]);

    useEffect(() => {
        if (!user || !entityId) return;
        let cancelled = false;
        (async () => {
            await refreshConnection();
            if (!cancelled) setConnectionLoaded(true);
        })();
        return () => { cancelled = true; };
    }, [user, entityId, refreshConnection]);

    // Meta bağlantı durumunu çek (configured/connected/adAccountId)
    const refreshMetaConnection = useCallback(async () => {
        if (!user) return;
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/ngo-admin/ads/meta/connection', {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (!res.ok) return;
            const data = (await res.json().catch(() => null)) as Partial<MetaConnectionState> | null;
            if (!data) return;
            setMetaConnection({
                configured: data.configured === true,
                connected: data.connected === true,
                adAccountId: typeof data.adAccountId === 'string' ? data.adAccountId : undefined,
            });
        } catch {
            /* sessizce yoksay; bağlantı durumu olmadan da sayfa çalışır */
        }
    }, [user]);

    useEffect(() => {
        if (!user || !entityId) return;
        let cancelled = false;
        (async () => {
            await refreshMetaConnection();
            if (!cancelled) setMetaConnectionLoaded(true);
        })();
        return () => { cancelled = true; };
    }, [user, entityId, refreshMetaConnection]);

    // TikTok bağlantı durumunu çek (configured/connected/advertiserId)
    const refreshTiktokConnection = useCallback(async () => {
        if (!user) return;
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/ngo-admin/ads/tiktok/connection', {
                headers: { Authorization: `Bearer ${idToken}` },
            });
            if (!res.ok) return;
            const data = (await res.json().catch(() => null)) as Partial<TiktokConnectionState> | null;
            if (!data) return;
            setTiktokConnection({
                configured: data.configured === true,
                connected: data.connected === true,
                advertiserId: typeof data.advertiserId === 'string' ? data.advertiserId : undefined,
            });
        } catch {
            /* sessizce yoksay; bağlantı durumu olmadan da sayfa çalışır */
        }
    }, [user]);

    useEffect(() => {
        if (!user || !entityId) return;
        let cancelled = false;
        (async () => {
            await refreshTiktokConnection();
            if (!cancelled) setTiktokConnectionLoaded(true);
        })();
        return () => { cancelled = true; };
    }, [user, entityId, refreshTiktokConnection]);

    // OAuth popup'tan postMessage dinle
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const onMessage = (event: MessageEvent) => {
            if (event.origin !== window.location.origin) return;
            const data = event.data as { type?: string; message?: string } | null;
            if (!data || typeof data.type !== 'string') return;
            if (data.type === 'hangel-ads-connected') {
                setConnecting(false);
                void refreshConnection();
                toast({ title: 'Google Ads bağlandı', description: 'Hesabın başarıyla bağlandı; onaylı planlarını yayına alabilirsin.' });
            } else if (data.type === 'hangel-ads-error') {
                setConnecting(false);
                toast({ variant: 'destructive', title: 'Bağlanamadı', description: data.message || 'Google Ads hesabı bağlanamadı. Lütfen tekrar dene.' });
            } else if (data.type === 'hangel-meta-connected') {
                setMetaConnecting(false);
                void refreshMetaConnection();
                toast({ title: 'Meta bağlandı', description: 'Facebook/Instagram reklam hesabın bağlandı; planlarını Meta’da yayına alabilirsin.' });
            } else if (data.type === 'hangel-meta-error') {
                setMetaConnecting(false);
                toast({ variant: 'destructive', title: 'Bağlanamadı', description: data.message || 'Meta reklam hesabı bağlanamadı. Lütfen tekrar dene.' });
            } else if (data.type === 'hangel-tiktok-connected') {
                setTiktokConnecting(false);
                void refreshTiktokConnection();
                toast({ title: 'TikTok bağlandı', description: 'TikTok reklam hesabın bağlandı; planlarını TikTok’ta yayına alabilirsin.' });
            } else if (data.type === 'hangel-tiktok-error') {
                setTiktokConnecting(false);
                toast({ variant: 'destructive', title: 'Bağlanamadı', description: data.message || 'TikTok reklam hesabı bağlanamadı. Lütfen tekrar dene.' });
            }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [refreshConnection, refreshMetaConnection, refreshTiktokConnection, toast]);

    const connectGoogleAds = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Lütfen giriş yapın.' });
            return;
        }
        setConnecting(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/ngo-admin/ads/google/start', {
                method: 'POST',
                headers: { Authorization: `Bearer ${idToken}` },
            });
            const data = (await res.json().catch(() => null)) as { authorizeUrl?: string; errorCode?: string; message?: string } | null;
            if (res.status === 503 || data?.errorCode === 'ADS_NOT_CONFIGURED') {
                setConnection((prev) => ({ ...prev, configured: false }));
                toast({ title: 'Yapılandırma bekleniyor', description: 'hangel ekibi Google Ads bağlantısını yapılandırıyor — çok yakında.' });
                return;
            }
            if (!res.ok || !data?.authorizeUrl) {
                throw new Error(data?.message || 'Bağlantı başlatılamadı.');
            }
            const popup = window.open(data.authorizeUrl, 'hangel-ads-oauth', 'width=500,height=660');
            if (!popup) {
                throw new Error('Açılır pencere engellendi. Lütfen tarayıcı izinlerini kontrol edin.');
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Bağlanamadı', description: e instanceof Error ? e.message : 'Bir hata oluştu.' });
        } finally {
            setConnecting(false);
        }
    };

    const publishPlan = async (planId: string, title?: string) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Lütfen giriş yapın.' });
            return;
        }
        setPublishingId(planId);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/ngo-admin/ads/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ planId }),
            });
            const data = (await res.json().catch(() => null)) as { ok?: boolean; status?: PlanStatus; errorCode?: string; message?: string } | null;
            if (res.status === 503 || data?.errorCode === 'ADS_NOT_CONFIGURED') {
                toast({ title: 'Yapılandırma bekleniyor', description: 'hangel ekibi Google Ads bağlantısını yapılandırıyor — çok yakında.' });
                return;
            }
            if (res.status === 409 || data?.errorCode === 'NOT_CONNECTED') {
                setConnection((prev) => ({ ...prev, connected: false }));
                toast({ variant: 'destructive', title: 'Hesap bağlı değil', description: 'Önce Google Ads hesabını bağla, sonra yayına al.' });
                return;
            }
            if (!res.ok || !data?.ok) {
                throw new Error(data?.message || 'Yayınlanamadı.');
            }
            setSavedPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, status: 'active' } : p)));
            toast({ title: 'Kampanya yayında', description: title ? `"${title}" Google Ads üzerinde yayına alındı.` : 'Kampanya Google Ads üzerinde yayına alındı.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Yayınlanamadı', description: e instanceof Error ? e.message : 'Lütfen tekrar dene.' });
        } finally {
            setPublishingId(null);
        }
    };

    const connectMeta = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Lütfen giriş yapın.' });
            return;
        }
        setMetaConnecting(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/ngo-admin/ads/meta/start', {
                method: 'POST',
                headers: { Authorization: `Bearer ${idToken}` },
            });
            const data = (await res.json().catch(() => null)) as { authorizeUrl?: string; errorCode?: string; message?: string } | null;
            if (res.status === 503 || data?.errorCode === 'META_NOT_CONFIGURED') {
                setMetaConnection((prev) => ({ ...prev, configured: false }));
                toast({ title: 'Yapılandırma bekleniyor', description: 'hangel ekibi Meta bağlantısını yapılandırıyor — çok yakında.' });
                return;
            }
            if (!res.ok || !data?.authorizeUrl) {
                throw new Error(data?.message || 'Bağlantı başlatılamadı.');
            }
            const popup = window.open(data.authorizeUrl, 'hangel-meta-oauth', 'width=500,height=660');
            if (!popup) {
                throw new Error('Açılır pencere engellendi. Lütfen tarayıcı izinlerini kontrol edin.');
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Bağlanamadı', description: e instanceof Error ? e.message : 'Bir hata oluştu.' });
        } finally {
            setMetaConnecting(false);
        }
    };

    const publishMetaPlan = async (planId: string, title?: string) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Lütfen giriş yapın.' });
            return;
        }
        setMetaPublishingId(planId);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/ngo-admin/ads/meta/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ planId }),
            });
            const data = (await res.json().catch(() => null)) as { ok?: boolean; status?: PlanStatus; campaignId?: string; errorCode?: string; message?: string } | null;
            if (res.status === 503 || data?.errorCode === 'META_NOT_CONFIGURED') {
                toast({ title: 'Yapılandırma bekleniyor', description: 'hangel ekibi Meta bağlantısını yapılandırıyor — çok yakında.' });
                return;
            }
            if (res.status === 409 || data?.errorCode === 'NOT_CONNECTED') {
                setMetaConnection((prev) => ({ ...prev, connected: false }));
                toast({ variant: 'destructive', title: 'Hesap bağlı değil', description: 'Önce Meta hesabını bağla, sonra yayına al.' });
                return;
            }
            if (!res.ok || !data?.ok) {
                throw new Error(data?.message || 'Yayınlanamadı.');
            }
            setSavedPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, status: 'active' } : p)));
            toast({ title: 'Kampanya yayında', description: title ? `"${title}" Meta üzerinde yayına alındı.` : 'Kampanya Meta üzerinde yayına alındı.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Yayınlanamadı', description: e instanceof Error ? e.message : 'Lütfen tekrar dene.' });
        } finally {
            setMetaPublishingId(null);
        }
    };

    const connectTiktok = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Lütfen giriş yapın.' });
            return;
        }
        setTiktokConnecting(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/ngo-admin/ads/tiktok/start', {
                method: 'POST',
                headers: { Authorization: `Bearer ${idToken}` },
            });
            const data = (await res.json().catch(() => null)) as { authorizeUrl?: string; errorCode?: string; message?: string } | null;
            if (res.status === 503 || data?.errorCode === 'TIKTOK_NOT_CONFIGURED') {
                setTiktokConnection((prev) => ({ ...prev, configured: false }));
                toast({ title: 'Yapılandırma bekleniyor', description: 'hangel ekibi TikTok bağlantısını yapılandırıyor — çok yakında.' });
                return;
            }
            if (!res.ok || !data?.authorizeUrl) {
                throw new Error(data?.message || 'Bağlantı başlatılamadı.');
            }
            const popup = window.open(data.authorizeUrl, 'hangel-tiktok-oauth', 'width=500,height=660');
            if (!popup) {
                throw new Error('Açılır pencere engellendi. Lütfen tarayıcı izinlerini kontrol edin.');
            }
        } catch (e) {
            toast({ variant: 'destructive', title: 'Bağlanamadı', description: e instanceof Error ? e.message : 'Bir hata oluştu.' });
        } finally {
            setTiktokConnecting(false);
        }
    };

    const publishTiktokPlan = async (planId: string, title?: string) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Lütfen giriş yapın.' });
            return;
        }
        setTiktokPublishingId(planId);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/ngo-admin/ads/tiktok/publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({ planId }),
            });
            const data = (await res.json().catch(() => null)) as { ok?: boolean; status?: PlanStatus; campaignId?: string; errorCode?: string; message?: string } | null;
            if (res.status === 503 || data?.errorCode === 'TIKTOK_NOT_CONFIGURED') {
                toast({ title: 'Yapılandırma bekleniyor', description: 'hangel ekibi TikTok bağlantısını yapılandırıyor — çok yakında.' });
                return;
            }
            if (res.status === 409 || data?.errorCode === 'NOT_CONNECTED') {
                setTiktokConnection((prev) => ({ ...prev, connected: false }));
                toast({ variant: 'destructive', title: 'Hesap bağlı değil', description: 'Önce TikTok hesabını bağla, sonra yayına al.' });
                return;
            }
            if (!res.ok || !data?.ok) {
                throw new Error(data?.message || 'Yayınlanamadı.');
            }
            setSavedPlans((prev) => prev.map((p) => (p.id === planId ? { ...p, status: 'active' } : p)));
            toast({ title: 'Kampanya yayında', description: title ? `"${title}" TikTok üzerinde yayına alındı.` : 'Kampanya TikTok üzerinde yayına alındı.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Yayınlanamadı', description: e instanceof Error ? e.message : 'Lütfen tekrar dene.' });
        } finally {
            setTiktokPublishingId(null);
        }
    };

    // Planı Google Ads'e elle taşımak için panoya kopyala (credential gelene kadar
    // Ad Grants onaylı STK'lar bu metni kendi Google Ads hesabına yapıştırır).
    const copyPlan = async (p: AdProposal) => {
        const meta = KIND_META[p.kind] ?? KIND_META['search-awareness'];
        const text = [
            `${entityName} — Google Ads kampanya planı`,
            `Tür: ${meta.label}`,
            p.goal ? `Hedef: ${p.goal}` : '',
            p.regions?.length ? `Bölgeler: ${p.regions.join(', ')}` : '',
            '',
            'Anahtar Kelimeler:',
            ...(p.keywords || []).map((k) => `- ${k}`),
            '',
            'Başlıklar (Headlines):',
            ...(p.headlines || []).map((h) => `- ${h}`),
            '',
            'Açıklamalar (Descriptions):',
            ...(p.descriptions || []).map((d) => `- ${d}`),
        ].filter((l) => l !== undefined).join('\n');
        try {
            await navigator.clipboard.writeText(text);
            toast({ title: 'Plan kopyalandı', description: 'Google Ads’e gir → Yeni kampanya → Arama → bu planı yapıştır.' });
        } catch {
            toast({ variant: 'destructive', title: 'Kopyalanamadı', description: 'Tarayıcı pano erişimini engelledi; metni elle seçebilirsin.' });
        }
    };

    // kind → güncel kayıtlı durum
    const savedStatusByKind = useMemo(() => {
        const m = new Map<ProposalKind, PlanStatus>();
        for (const p of savedPlans) m.set(p.kind, p.status);
        return m;
    }, [savedPlans]);

    // kind → kayıtlı plan (yayınla için id'ye erişim)
    const savedPlanByKind = useMemo(() => {
        const m = new Map<ProposalKind, SavedPlan>();
        for (const p of savedPlans) m.set(p.kind, p);
        return m;
    }, [savedPlans]);

    // Yayınlanmaya hazır kayıtlı planlar — süper admin onayı GEREKMEZ; STK
    // kurduğu (henüz yayında olmayan / reddedilmemiş) planı doğrudan yayınlar.
    const publishablePlans = useMemo(
        () => savedPlans.filter((p) => p.status !== 'active' && p.status !== 'rejected' && typeof p.id === 'string'),
        [savedPlans],
    );

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

    const generate = async (platform: AdPlatform) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Oturum gerekli', description: 'Lütfen giriş yapın.' });
            return;
        }
        setLoadingPlatform(platform);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch('/api/ads/plan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({
                    platform,
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
            setProposalsByPlatform((prev) => ({ ...prev, [platform]: data.proposals as AdProposal[] }));
            toast({ title: 'Reklam planın hazır', description: `${data.proposals.length} öneri oluşturuldu.` });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Oluşturulamadı', description: e instanceof Error ? e.message : 'Bir hata oluştu.' });
        } finally {
            setLoadingPlatform(null);
        }
    };

    const chooseProposal = async (p: AdProposal, platform: AdPlatform) => {
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
                    platform,
                    ngoName: entityName,
                    kind: p.kind, title: p.title, goal: p.goal, landing: p.landing,
                    keywords: p.keywords, headlines: p.headlines, descriptions: p.descriptions,
                    regions: p.regions, estReach: p.estReach,
                }),
            });
            if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || 'Kaydedilemedi');
            setSelected((prev) => new Set(prev).add(p.kind));
            toast({
                title: 'Planın hazır',
                description: `"${p.title}" kaydedildi; hesabın bağlanınca yayına alınacak.`,
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

                {/* YENİ BAŞLAYAN BİLGİLENDİRME */}
                <div className="rounded-3xl bg-primary/5 border border-primary/15 p-4 flex items-start gap-3">
                    <span className="h-9 w-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Info className="h-5 w-5" />
                    </span>
                    <div className="space-y-0.5">
                        <p className="text-[14px] font-semibold text-foreground">Hiç reklam vermediysen merak etme</p>
                        <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                            Üç platformda da (Google, Meta, TikTok) hesabın yoksa adım adım nasıl açacağını anlatıyoruz; varsa tek dokunuşla bağlıyoruz. Yapay zeka her platform için sana özel 5 reklam önerisi hazırlar — sen sadece beğendiğini kur.
                        </p>
                    </div>
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

                {/* GOOGLE AI ÖNERİLER */}
                <section className="space-y-2.5">
                    <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Google · Yapay Zeka Reklam Planı</h2>
                    <AiPlanBlock
                        platform="google"
                        proposals={proposalsByPlatform.google}
                        loading={loadingPlatform === 'google'}
                        onGenerate={() => void generate('google')}
                        onChoose={(p) => void chooseProposal(p, 'google')}
                        onCopy={(p) => void copyPlan(p)}
                        selected={selected}
                        savedStatusByKind={savedStatusByKind}
                        savedPlanByKind={savedPlanByKind}
                        connected={connection.connected}
                        publishingId={publishingId}
                        onPublish={(id, title) => void publishPlan(id, title)}
                        entityName={entityName}
                        faaliyetAlani={faaliyetAlani}
                    />
                </section>

                {/* HESABI BAĞLA & YAYINLA (Faz 1) */}
                <section className="space-y-2.5">
                    <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Google Hesabını Bağla & Yayınla</h2>
                    <div className="rounded-3xl bg-card border border-border/60 shadow-sm p-4 space-y-4">
                        {!connectionLoaded ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : !connection.configured ? (
                            <div className="space-y-3">
                                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-[14px] font-semibold text-amber-900">Tek dokunuşla otomatik yayın yakında</p>
                                        <p className="text-[12px] text-amber-800 leading-relaxed">
                                            hangel ekibi Google Ads bağlantısını yapılandırıyor. Hazır olduğunda hesabını buradan bağlayıp kampanyalarını panelden tek dokunuşla yayına alabileceksin.
                                        </p>
                                    </div>
                                </div>
                                {/* Köprü: Ad Grants onaylı STK bugün kendi Google Ads hesabında yayınlayabilir. */}
                                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-2.5">
                                    <p className="text-[14px] font-semibold text-emerald-900">Reklam hakkın onaylandıysa bugün başlayabilirsin</p>
                                    <p className="text-[12px] text-emerald-800 leading-relaxed">
                                        Yukarıda bir reklam planı oluştur, plandaki <span className="font-semibold">Kopyala</span> simgesine dokun, sonra Google Ads hesabına gir → <span className="font-semibold">Yeni kampanya → Arama</span> → planı yapıştır. Otomatik yayın hazır olunca buradan tek dokunuşla da yapabileceksin.
                                    </p>
                                    <a href={GOOGLE_ADS_URL} target="_blank" rel="noopener noreferrer"
                                        className="w-full h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center gap-2 text-[14px] font-semibold active:scale-[0.98] transition">
                                        Google Ads&apos;i Aç <ExternalLink className="h-4 w-4" />
                                    </a>
                                </div>
                            </div>
                        ) : !connection.connected ? (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <span className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                        <Link2 className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[15px] font-semibold text-foreground">Google Ads hesabını bağla</p>
                                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                                            Kurduğun reklam planlarını yayına almak için Google Ads hesabını hangel&apos;e bağla. Bağlantı güvenli Google ekranında yapılır.
                                        </p>
                                    </div>
                                </div>
                                {/* Ad Grants hesabın var mı? dallanması — Bağla butonundan önce */}
                                {googleHasAccount === 'unknown' ? (
                                    <div className="rounded-2xl bg-muted/40 border border-border/60 p-4 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                            <p className="text-[14px] font-semibold text-foreground">Google Ad Grants hesabın var mı?</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <button onClick={() => setGoogleHasAccount('yes')}
                                                className="rounded-2xl border border-border/60 bg-card p-3 text-center active:scale-[0.97] transition">
                                                <p className="text-[14px] font-semibold text-foreground">Evet, var</p>
                                            </button>
                                            <button onClick={() => setGoogleHasAccount('no')}
                                                className="rounded-2xl border border-border/60 bg-card p-3 text-center active:scale-[0.97] transition">
                                                <p className="text-[14px] font-semibold text-foreground">Hayır, yok</p>
                                            </button>
                                        </div>
                                    </div>
                                ) : googleHasAccount === 'no' ? (
                                    <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Building2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                                            <p className="text-[14px] font-semibold text-emerald-900">Google Ad Grants başvurusu (ücretsiz)</p>
                                        </div>
                                        <ol className="space-y-1.5 text-[12px] text-emerald-800 leading-relaxed list-decimal list-inside">
                                            <li>Web siten yoksa önce yukarıdan ücretsiz hangel sitesini kur.</li>
                                            <li>google.com/nonprofits üzerinden Google for Nonprofits&apos;e başvur.</li>
                                            <li>Onay genelde ~1-2 hafta sürer.</li>
                                            <li>Onaylanınca buraya dön ve hesabını bağla.</li>
                                        </ol>
                                        <a href={GOOGLE_NONPROFITS_URL} target="_blank" rel="noopener noreferrer"
                                            className="w-full h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center gap-2 text-[14px] font-semibold active:scale-[0.98] transition">
                                            Google for Nonprofits&apos;i Aç <ExternalLink className="h-4 w-4" />
                                        </a>
                                        <p className="text-[11px] text-emerald-800 text-center">Ad Grants ile ayda 10.000 USD reklam tamamen ücretsizdir.</p>
                                        <button onClick={() => setGoogleHasAccount('yes')}
                                            className="w-full text-[12px] font-semibold text-emerald-900 underline underline-offset-2">
                                            Zaten onaylandı, bağlanayım
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={connectGoogleAds} disabled={connecting}
                                        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center gap-2 text-[15px] font-semibold shadow-sm active:scale-[0.98] transition disabled:opacity-60">
                                        {connecting ? <><Loader2 className="h-4 w-4 animate-spin" /> Bağlanıyor...</> : <><Link2 className="h-[18px] w-[18px]" /> Google Ads Hesabını Bağla</>}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
                                    <BadgeCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[14px] font-semibold text-emerald-900">Google Ads bağlı</p>
                                        {connection.customerId && (
                                            <span className="inline-flex items-center mt-0.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-700">
                                                Müşteri No: {connection.customerId}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {publishablePlans.length > 0 ? (
                                    <div className="space-y-2.5">
                                        <p className="text-[13px] text-muted-foreground">Kurduğun kampanyalar yayına hazır.</p>
                                        {publishablePlans.map((p) => {
                                            const meta = KIND_META[p.kind] ?? KIND_META['search-awareness'];
                                            const Icon = meta.icon;
                                            return (
                                                <div key={p.id} className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 flex items-center gap-3">
                                                    <span className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', meta.tint)}>
                                                        <Icon className="h-5 w-5" />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[14px] font-semibold text-foreground truncate">{p.title || meta.label}</p>
                                                        <p className="text-[12px] text-muted-foreground">{meta.label} · {STATUS_LABEL[p.status] || 'yayına hazır'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => { if (p.id) void publishPlan(p.id, p.title); }}
                                                        disabled={publishingId === p.id}
                                                        className="h-9 rounded-full px-4 text-[13px] font-semibold inline-flex items-center gap-1.5 transition active:scale-95 bg-primary text-primary-foreground disabled:opacity-60 shrink-0">
                                                        {publishingId === p.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Yayınlanıyor</> : <>Yayınla <ChevronRight className="h-4 w-4" /></>}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[12px] text-muted-foreground text-center">
                                        Henüz kurduğun kampanya yok. Yukarıdan bir reklam planı seç (&quot;Bunu Kur&quot;), sonra buradan tek dokunuşla yayınla.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </section>

                {/* META AI ÖNERİLER */}
                <section className="space-y-2.5">
                    <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Meta · Yapay Zeka Reklam Planı</h2>
                    <AiPlanBlock
                        platform="meta"
                        proposals={proposalsByPlatform.meta}
                        loading={loadingPlatform === 'meta'}
                        onGenerate={() => void generate('meta')}
                        onChoose={(p) => void chooseProposal(p, 'meta')}
                        selected={selected}
                        savedStatusByKind={savedStatusByKind}
                        savedPlanByKind={savedPlanByKind}
                        connected={metaConnection.connected}
                        publishingId={metaPublishingId}
                        onPublish={(id, title) => void publishMetaPlan(id, title)}
                        entityName={entityName}
                        faaliyetAlani={faaliyetAlani}
                    />
                </section>

                {/* META REKLAMLARI (Facebook/Instagram) — Google ile simetrik */}
                <section className="space-y-2.5">
                    <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Meta Hesabını Bağla & Yayınla</h2>
                    <div className="rounded-3xl bg-card border border-border/60 shadow-sm p-4 space-y-4">
                        {!metaConnectionLoaded ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : !metaConnection.configured ? (
                            <div className="space-y-3">
                                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-[14px] font-semibold text-amber-900">hangel ekibi Meta bağlantısını yapılandırıyor — çok yakında</p>
                                        <p className="text-[12px] text-amber-800 leading-relaxed">
                                            Hazır olduğunda Facebook/Instagram reklam hesabını buradan bağlayıp kampanyalarını panelden tek dokunuşla yayına alabileceksin.
                                        </p>
                                    </div>
                                </div>
                                <button disabled
                                    className="w-full h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center gap-2 text-[15px] font-semibold cursor-not-allowed">
                                    <Facebook className="h-[18px] w-[18px]" /> Meta Hesabını Bağla
                                </button>
                                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                                    Not: Meta reklamları ücretlidir (Google Ad Grants gibi bedava değildir).
                                </p>
                            </div>
                        ) : !metaConnection.connected ? (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <span className="h-10 w-10 rounded-xl bg-[#1877f2]/10 text-[#1877f2] flex items-center justify-center shrink-0">
                                        <Facebook className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[15px] font-semibold text-foreground">Meta hesabını bağla</p>
                                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                                            Kurduğun reklam planlarını Facebook/Instagram&apos;da yayına almak için Meta reklam hesabını hangel&apos;e bağla. Bağlantı güvenli Facebook ekranında yapılır.
                                        </p>
                                    </div>
                                </div>
                                {/* Reklam hesabı var mı? dallanması — Bağla butonundan önce */}
                                {metaHasAccount === 'unknown' ? (
                                    <div className="rounded-2xl bg-muted/40 border border-border/60 p-4 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Building2 className="h-5 w-5 text-[#1877f2] mt-0.5 shrink-0" />
                                            <p className="text-[14px] font-semibold text-foreground">Meta reklam hesabın var mı?</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <button onClick={() => setMetaHasAccount('yes')}
                                                className="rounded-2xl border border-border/60 bg-card p-3 text-center active:scale-[0.97] transition">
                                                <p className="text-[14px] font-semibold text-foreground">Evet, var</p>
                                            </button>
                                            <button onClick={() => setMetaHasAccount('no')}
                                                className="rounded-2xl border border-border/60 bg-card p-3 text-center active:scale-[0.97] transition">
                                                <p className="text-[14px] font-semibold text-foreground">Hayır, yok</p>
                                            </button>
                                        </div>
                                    </div>
                                ) : metaHasAccount === 'no' ? (
                                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Building2 className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                                            <p className="text-[14px] font-semibold text-amber-900">Meta reklam hesabı aç</p>
                                        </div>
                                        <ol className="space-y-1.5 text-[12px] text-amber-800 leading-relaxed list-decimal list-inside">
                                            <li>Meta Business&apos;ta bir işletme hesabı oluştur.</li>
                                            <li>İşletme hesabına bir reklam hesabı ekle.</li>
                                            <li>Reklam hesabına bir ödeme yöntemi ekle.</li>
                                            <li>Buraya dön ve hesabını bağla.</li>
                                        </ol>
                                        <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer"
                                            className="w-full h-11 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center gap-2 text-[14px] font-semibold active:scale-[0.98] transition">
                                            Meta Business&apos;ı Aç <ExternalLink className="h-4 w-4" />
                                        </a>
                                        <p className="text-[11px] text-amber-800 text-center">Not: Meta reklamları ücretlidir.</p>
                                        <button onClick={() => setMetaHasAccount('yes')}
                                            className="w-full text-[12px] font-semibold text-amber-900 underline underline-offset-2">
                                            Zaten açtım, bağlanayım
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                <button onClick={connectMeta} disabled={metaConnecting}
                                    className="w-full h-12 rounded-2xl bg-[#1877f2] text-white flex items-center justify-center gap-2 text-[15px] font-semibold shadow-sm active:scale-[0.98] transition disabled:opacity-60">
                                    {metaConnecting ? <><Loader2 className="h-4 w-4 animate-spin" /> Bağlanıyor...</> : <><Facebook className="h-[18px] w-[18px]" /> Meta Hesabını Bağla</>}
                                </button>
                                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                                    Mevcut hesabını ve izinlerini kullanarak bağla.
                                </p>
                                    </>
                                )}
                                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                                    Not: Meta reklamları ücretlidir (Google Ad Grants gibi bedava değildir).
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
                                    <BadgeCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[14px] font-semibold text-emerald-900">Meta bağlı</p>
                                        {metaConnection.adAccountId && (
                                            <span className="inline-flex items-center mt-0.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-700">
                                                Reklam Hesabı: {metaConnection.adAccountId}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {publishablePlans.length > 0 ? (
                                    <div className="space-y-2.5">
                                        <p className="text-[13px] text-muted-foreground">Kurduğun kampanyalar Meta&apos;da yayına hazır.</p>
                                        {publishablePlans.map((p) => {
                                            const meta = KIND_META[p.kind] ?? KIND_META['search-awareness'];
                                            const Icon = meta.icon;
                                            return (
                                                <div key={p.id} className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 flex items-center gap-3">
                                                    <span className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', meta.tint)}>
                                                        <Icon className="h-5 w-5" />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[14px] font-semibold text-foreground truncate">{p.title || meta.label}</p>
                                                        <p className="text-[12px] text-muted-foreground">{meta.label} · {STATUS_LABEL[p.status] || 'yayına hazır'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => { if (p.id) void publishMetaPlan(p.id, p.title); }}
                                                        disabled={metaPublishingId === p.id}
                                                        className="h-9 rounded-full px-4 text-[13px] font-semibold inline-flex items-center gap-1.5 transition active:scale-95 bg-[#1877f2] text-white disabled:opacity-60 shrink-0">
                                                        {metaPublishingId === p.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Yayınlanıyor</> : <>Meta&apos;da Yayınla <ChevronRight className="h-4 w-4" /></>}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[12px] text-muted-foreground text-center">
                                        Henüz kurduğun kampanya yok. Yukarıdan bir reklam planı seç (&quot;Bunu Kur&quot;), sonra buradan Meta&apos;da yayınla.
                                    </p>
                                )}
                                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                                    Not: Meta reklamları ücretlidir (Google Ad Grants gibi bedava değildir).
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* TIKTOK AI ÖNERİLER */}
                <section className="space-y-2.5">
                    <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">TikTok · Yapay Zeka Reklam Planı</h2>
                    <AiPlanBlock
                        platform="tiktok"
                        proposals={proposalsByPlatform.tiktok}
                        loading={loadingPlatform === 'tiktok'}
                        onGenerate={() => void generate('tiktok')}
                        onChoose={(p) => void chooseProposal(p, 'tiktok')}
                        selected={selected}
                        savedStatusByKind={savedStatusByKind}
                        savedPlanByKind={savedPlanByKind}
                        connected={tiktokConnection.connected}
                        publishingId={tiktokPublishingId}
                        onPublish={(id, title) => void publishTiktokPlan(id, title)}
                        entityName={entityName}
                        faaliyetAlani={faaliyetAlani}
                    />
                </section>

                {/* TIKTOK REKLAMLARI — Meta ile simetrik */}
                <section className="space-y-2.5">
                    <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">TikTok Hesabını Bağla & Yayınla</h2>
                    <div className="rounded-3xl bg-card border border-border/60 shadow-sm p-4 space-y-4">
                        {!tiktokConnectionLoaded ? (
                            <div className="flex items-center justify-center py-6">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : !tiktokConnection.configured ? (
                            <div className="space-y-3">
                                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
                                    <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-[14px] font-semibold text-amber-900">hangel ekibi TikTok bağlantısını yapılandırıyor — çok yakında</p>
                                        <p className="text-[12px] text-amber-800 leading-relaxed">
                                            Hazır olduğunda TikTok reklam hesabını buradan bağlayıp kampanyalarını panelden tek dokunuşla yayına alabileceksin.
                                        </p>
                                    </div>
                                </div>
                                <button disabled
                                    className="w-full h-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center gap-2 text-[15px] font-semibold cursor-not-allowed">
                                    <Music2 className="h-[18px] w-[18px]" /> TikTok Hesabını Bağla
                                </button>
                                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                                    Not: TikTok reklamları ücretlidir (Google Ad Grants gibi bedava değildir).
                                </p>
                            </div>
                        ) : !tiktokConnection.connected ? (
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <span className="h-10 w-10 rounded-xl bg-black text-[#25F4EE] flex items-center justify-center shrink-0">
                                        <Music2 className="h-5 w-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[15px] font-semibold text-foreground">TikTok hesabını bağla</p>
                                        <p className="text-[13px] text-muted-foreground leading-relaxed">
                                            Kurduğun reklam planlarını TikTok&apos;ta yayına almak için TikTok reklam hesabını hangel&apos;e bağla. Bağlantı güvenli TikTok ekranında yapılır.
                                        </p>
                                    </div>
                                </div>
                                {/* Reklam hesabı var mı? dallanması — Bağla butonundan önce */}
                                {tiktokHasAccount === 'unknown' ? (
                                    <div className="rounded-2xl bg-muted/40 border border-border/60 p-4 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Building2 className="h-5 w-5 text-foreground mt-0.5 shrink-0" />
                                            <p className="text-[14px] font-semibold text-foreground">TikTok reklam hesabın var mı?</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            <button onClick={() => setTiktokHasAccount('yes')}
                                                className="rounded-2xl border border-border/60 bg-card p-3 text-center active:scale-[0.97] transition">
                                                <p className="text-[14px] font-semibold text-foreground">Evet, var</p>
                                            </button>
                                            <button onClick={() => setTiktokHasAccount('no')}
                                                className="rounded-2xl border border-border/60 bg-card p-3 text-center active:scale-[0.97] transition">
                                                <p className="text-[14px] font-semibold text-foreground">Hayır, yok</p>
                                            </button>
                                        </div>
                                    </div>
                                ) : tiktokHasAccount === 'no' ? (
                                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 space-y-3">
                                        <div className="flex items-start gap-2">
                                            <Building2 className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                                            <p className="text-[14px] font-semibold text-amber-900">TikTok reklam hesabı aç</p>
                                        </div>
                                        <ol className="space-y-1.5 text-[12px] text-amber-800 leading-relaxed list-decimal list-inside">
                                            <li>TikTok Ads Manager&apos;a kaydol.</li>
                                            <li>Bir reklam hesabı oluştur.</li>
                                            <li>Reklam hesabına bir ödeme yöntemi ekle.</li>
                                            <li>Buraya dön ve hesabını bağla.</li>
                                        </ol>
                                        <a href="https://ads.tiktok.com/" target="_blank" rel="noopener noreferrer"
                                            className="w-full h-11 rounded-2xl bg-black text-[#25F4EE] flex items-center justify-center gap-2 text-[14px] font-semibold active:scale-[0.98] transition">
                                            TikTok Ads Manager&apos;ı Aç <ExternalLink className="h-4 w-4" />
                                        </a>
                                        <p className="text-[11px] text-amber-800 text-center">Not: TikTok reklamları ücretlidir.</p>
                                        <button onClick={() => setTiktokHasAccount('yes')}
                                            className="w-full text-[12px] font-semibold text-amber-900 underline underline-offset-2">
                                            Zaten açtım, bağlanayım
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                <button onClick={connectTiktok} disabled={tiktokConnecting}
                                    className="w-full h-12 rounded-2xl bg-black text-[#25F4EE] flex items-center justify-center gap-2 text-[15px] font-semibold shadow-sm active:scale-[0.98] transition disabled:opacity-60">
                                    {tiktokConnecting ? <><Loader2 className="h-4 w-4 animate-spin" /> Bağlanıyor...</> : <><Music2 className="h-[18px] w-[18px]" /> TikTok Hesabını Bağla</>}
                                </button>
                                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                                    Mevcut hesabını ve izinlerini kullanarak bağla.
                                </p>
                                    </>
                                )}
                                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                                    Not: TikTok reklamları ücretlidir (Google Ad Grants gibi bedava değildir).
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3">
                                    <BadgeCheck className="h-6 w-6 text-emerald-600 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[14px] font-semibold text-emerald-900">TikTok bağlı</p>
                                        {tiktokConnection.advertiserId && (
                                            <span className="inline-flex items-center mt-0.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-700">
                                                Reklam Hesabı: {tiktokConnection.advertiserId}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {publishablePlans.length > 0 ? (
                                    <div className="space-y-2.5">
                                        <p className="text-[13px] text-muted-foreground">Kurduğun kampanyalar TikTok&apos;ta yayına hazır.</p>
                                        {publishablePlans.map((p) => {
                                            const meta = KIND_META[p.kind] ?? KIND_META['search-awareness'];
                                            const Icon = meta.icon;
                                            return (
                                                <div key={p.id} className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 flex items-center gap-3">
                                                    <span className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', meta.tint)}>
                                                        <Icon className="h-5 w-5" />
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[14px] font-semibold text-foreground truncate">{p.title || meta.label}</p>
                                                        <p className="text-[12px] text-muted-foreground">{meta.label} · {STATUS_LABEL[p.status] || 'yayına hazır'}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => { if (p.id) void publishTiktokPlan(p.id, p.title); }}
                                                        disabled={tiktokPublishingId === p.id}
                                                        className="h-9 rounded-full px-4 text-[13px] font-semibold inline-flex items-center gap-1.5 transition active:scale-95 bg-black text-[#25F4EE] disabled:opacity-60 shrink-0">
                                                        {tiktokPublishingId === p.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Yayınlanıyor</> : <>TikTok&apos;ta Yayınla <ChevronRight className="h-4 w-4" /></>}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[12px] text-muted-foreground text-center">
                                        Henüz kurduğun kampanya yok. Yukarıdan bir reklam planı seç (&quot;Bunu Kur&quot;), sonra buradan TikTok&apos;ta yayınla.
                                    </p>
                                )}
                                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                                    Not: TikTok reklamları ücretlidir (Google Ad Grants gibi bedava değildir).
                                </p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

/**
 * Platforma özel AI reklam öneri bloğu (Google / Meta / TikTok).
 * Boşken "5 öneri oluştur" CTA; doluyken o platformun çıktı alanlarına göre
 * koşullu render. "Bunu Kur" → o platform için kaydeder; bağlıysa "Yayınla".
 */
function AiPlanBlock({
    platform, proposals, loading, onGenerate, onChoose, onCopy, selected,
    savedStatusByKind, savedPlanByKind, connected, publishingId, onPublish,
    entityName, faaliyetAlani,
}: {
    platform: AdPlatform;
    proposals: AdProposal[];
    loading: boolean;
    onGenerate: () => void;
    onChoose: (p: AdProposal) => void;
    onCopy?: (p: AdProposal) => void;
    selected: Set<ProposalKind>;
    savedStatusByKind: Map<ProposalKind, PlanStatus>;
    savedPlanByKind: Map<ProposalKind, SavedPlan>;
    connected: boolean;
    publishingId: string | null;
    onPublish: (id: string, title?: string) => void;
    entityName: string;
    faaliyetAlani: string;
}) {
    const platformLabel = platform === 'google' ? 'Google Arama' : platform === 'meta' ? 'Facebook/Instagram' : 'TikTok kısa video';
    const platformHint = platform === 'google'
        ? 'anahtar kelime, başlık ve açıklamalarla hazır Arama reklamları'
        : platform === 'meta'
            ? 'hedef kitle, birincil metin ve görsel/video konsepti'
            : 'video konsepti, açıklama ve hashtag fikirleri';

    return (
        <div className="rounded-3xl bg-card border border-border/60 shadow-sm p-4 space-y-4">
            {proposals.length === 0 ? (
                <div className="text-center space-y-3 py-2">
                    <span className="inline-flex h-14 w-14 items-center justify-center rounded-[18px] bg-primary/10">
                        <Wand2 className="h-7 w-7 text-primary" strokeWidth={1.8} />
                    </span>
                    <div className="space-y-1">
                        <p className="font-semibold text-[15px] text-foreground">{platformLabel} için 5 reklam önerisi</p>
                        <p className="text-[13px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
                            <span className="font-medium text-foreground">{entityName}</span>{faaliyetAlani ? ` · ${faaliyetAlani}` : ''} için yapay zeka {platformHint} hazırlar. Sen sadece beğendiğini kur.
                        </p>
                    </div>
                    <button onClick={onGenerate} disabled={loading}
                        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center gap-2 text-[15px] font-semibold shadow-sm active:scale-[0.98] transition disabled:opacity-60">
                        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Hazırlanıyor...</> : <><Sparkles className="h-[18px] w-[18px]" /> 5 Reklam Önerisi Oluştur</>}
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-[13px] text-muted-foreground">{proposals.length} öneri · beğendiğini kur</p>
                        <button onClick={onGenerate} disabled={loading} className="text-[13px] font-semibold text-primary inline-flex items-center gap-1">
                            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} Yenile
                        </button>
                    </div>
                    {proposals.map((p, i) => {
                        const meta = KIND_META[p.kind] ?? KIND_META['search-awareness'];
                        const Icon = meta.icon;
                        const isSel = selected.has(p.kind);
                        const savedStatus = savedStatusByKind.get(p.kind);
                        const savedId = savedPlanByKind.get(p.kind)?.id;
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

                                {/* GOOGLE: anahtar kelime + örnek arama reklamı */}
                                {platform === 'google' && (p.keywords?.length ?? 0) > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {(p.keywords ?? []).slice(0, 8).map((k) => (
                                            <span key={k} className="inline-flex items-center gap-1 rounded-full bg-card border border-border/60 px-2.5 py-1 text-[11px] text-foreground">
                                                <Search className="h-3 w-3 text-muted-foreground" /> {k}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {platform === 'google' && p.headlines?.[0] && (
                                    <div className="rounded-xl bg-card border border-border/50 p-2.5">
                                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Örnek reklam</p>
                                        <p className="text-[13px] font-semibold text-[#1a0dab] mt-0.5">{p.headlines[0]}</p>
                                        {p.descriptions?.[0] && <p className="text-[12px] text-muted-foreground">{p.descriptions[0]}</p>}
                                    </div>
                                )}

                                {/* META: hedef kitle + birincil metin/başlık + görsel konsept */}
                                {platform === 'meta' && (p.audience || p.primaryText || p.headline || p.creativeConcept) && (
                                    <div className="space-y-2">
                                        {p.audience && (
                                            <div className="flex items-start gap-2 rounded-xl bg-card border border-border/50 p-2.5">
                                                <Target className="h-4 w-4 text-[#1877f2] mt-0.5 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Hedef kitle</p>
                                                    <p className="text-[12px] text-foreground">{p.audience}</p>
                                                </div>
                                            </div>
                                        )}
                                        {(p.primaryText || p.headline) && (
                                            <div className="rounded-xl bg-card border border-border/50 p-2.5">
                                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Örnek reklam metni</p>
                                                {p.headline && <p className="text-[13px] font-semibold text-foreground mt-0.5">{p.headline}</p>}
                                                {p.primaryText && <p className="text-[12px] text-muted-foreground">{p.primaryText}</p>}
                                                {p.description && <p className="text-[11px] text-muted-foreground mt-0.5">{p.description}</p>}
                                            </div>
                                        )}
                                        {p.creativeConcept && (
                                            <div className="flex items-start gap-2 rounded-xl bg-card border border-border/50 p-2.5">
                                                <ImageIcon className="h-4 w-4 text-[#1877f2] mt-0.5 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Görsel/video fikri</p>
                                                    <p className="text-[12px] text-foreground">{p.creativeConcept}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* TIKTOK: video konsepti + caption + hashtag */}
                                {platform === 'tiktok' && (p.videoConcept || p.caption || (p.hashtags?.length ?? 0) > 0) && (
                                    <div className="space-y-2">
                                        {p.videoConcept && (
                                            <div className="flex items-start gap-2 rounded-xl bg-card border border-border/50 p-2.5">
                                                <Film className="h-4 w-4 text-foreground mt-0.5 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Video fikri</p>
                                                    <p className="text-[12px] text-foreground">{p.videoConcept}</p>
                                                </div>
                                            </div>
                                        )}
                                        {p.caption && (
                                            <div className="rounded-xl bg-card border border-border/50 p-2.5">
                                                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">Açıklama (caption)</p>
                                                <p className="text-[12px] text-foreground mt-0.5">{p.caption}</p>
                                            </div>
                                        )}
                                        {(p.hashtags?.length ?? 0) > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {(p.hashtags ?? []).slice(0, 6).map((h) => (
                                                    <span key={h} className="inline-flex items-center gap-1 rounded-full bg-card border border-border/60 px-2.5 py-1 text-[11px] text-foreground">
                                                        <Hash className="h-3 w-3 text-muted-foreground" /> {h.replace(/^#/, '')}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="text-[11px] text-muted-foreground">
                                        <span>{LANDING_LABEL[p.landing]}</span>
                                        {p.estReach && <span> · {p.estReach}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {onCopy && (
                                            <button onClick={() => onCopy(p)}
                                                className="h-9 w-9 rounded-full inline-flex items-center justify-center bg-secondary text-muted-foreground active:scale-95 transition"
                                                title="Planı kopyala" aria-label="Planı kopyala">
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        )}
                                        {savedStatus && (
                                            <span className={cn('h-9 rounded-full px-3 text-[12px] font-semibold inline-flex items-center', STATUS_TINT[savedStatus])}>
                                                {STATUS_LABEL[savedStatus]}
                                            </span>
                                        )}
                                        {savedStatus && savedStatus !== 'active' && savedStatus !== 'rejected' && connected && savedId ? (
                                            <button
                                                onClick={() => { const sp = savedPlanByKind.get(p.kind); if (sp?.id) onPublish(sp.id, sp.title || p.title); }}
                                                disabled={publishingId === savedId}
                                                className="h-9 rounded-full px-4 text-[13px] font-semibold inline-flex items-center gap-1.5 transition active:scale-95 bg-primary text-primary-foreground disabled:opacity-60">
                                                {publishingId === savedId
                                                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Yayınlanıyor</>
                                                    : <>Yayınla <ChevronRight className="h-4 w-4" /></>}
                                            </button>
                                        ) : (
                                            <button onClick={() => onChoose(p)}
                                                className={cn('h-9 rounded-full px-4 text-[13px] font-semibold inline-flex items-center gap-1.5 transition active:scale-95',
                                                    isSel ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary text-primary-foreground')}>
                                                {isSel ? <><Check className="h-4 w-4" /> Seçildi</> : <>Bunu Kur <ChevronRight className="h-4 w-4" /></>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <p className="text-[11px] text-muted-foreground text-center pt-1">
                        Seçtiğin kampanyaları, aşağıdan {platformLabel === 'Google Arama' ? 'Google Ads' : platform === 'meta' ? 'Meta' : 'TikTok'} hesabını bağladıktan sonra tek dokunuşla yayına alabilirsin.
                    </p>
                </div>
            )}
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
