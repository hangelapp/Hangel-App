'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/header';
import { SideNav } from '@/components/layout/SideNav';
import { AutoBreadcrumb } from '@/components/layout/auto-breadcrumb';
import type { SideNavItem, User } from '@/lib/types';
import { Sheet, SheetContent, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import { UserAvatar } from '@/components/shared/user-avatar';
import {
  ChevronRight,
  X,
  Info,
  LayoutGrid,
  Store,
  Building,
  Users,
  Calendar,
  Library,
  DollarSign,
  FileText,
  Award,
  MessageSquare,
  BarChart,
  Send,
  Shield,
  Settings,
  Globe,
  Zap,
  HeartHandshake,
  CircleHelp,
} from 'lucide-react';

// P2-4: Replaces `import * as Icons from 'lucide-react'`. Only the icons used
// by nav groups (group1Items..group4Items) are bundled; SideNav consumes the
// same icon name strings, so the closed set is determined here.
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'layout-grid': LayoutGrid,
  store: Store,
  building: Building,
  users: Users,
  calendar: Calendar,
  library: Library,
  'dollar-sign': DollarSign,
  'file-text': FileText,
  award: Award,
  'message-square': MessageSquare,
  'bar-chart': BarChart,
  send: Send,
  shield: Shield,
  settings: Settings,
  info: Info,
  globe: Globe,
  zap: Zap,
  HeartHandshake: HeartHandshake,
  'circle-help': CircleHelp,
};
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { doc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { signOut } from 'firebase/auth';
import { isNativeApp } from '@/lib/capacitor';
import { VerifyEmailBanner } from '@/components/shared/verify-email-banner';
import { useTranslation } from '@/components/providers/language-provider';
import { useToast } from '@/hooks/use-toast';

const group1Items: SideNavItem[] = [
  { href: '/timeline', label: 'nav.timeline', icon: 'layout-grid' },
  { href: '/market', label: 'nav.market', icon: 'store' },
  { href: '/ngos', label: 'nav.ngos', icon: 'building' },
  { href: '/clubs', label: 'nav.clubs', icon: 'users' },
  { href: '/events', label: 'nav.events', icon: 'calendar' },
  { href: '/library', label: 'nav.library', icon: 'library' },
];

const group2Items: SideNavItem[] = [
    { href: '/my-donations', label: 'nav.donations', icon: 'dollar-sign' },
    { href: '/my-applications', label: 'nav.applications', icon: 'file-text' },
    { href: '/my-badges', label: 'nav.badges', icon: 'award' },
    { href: '/messages', label: 'nav.messages', icon: 'message-square' },
];

const group3Items: SideNavItem[] = [
    { href: '/leaderboard', label: 'nav.leaderboard', icon: 'bar-chart' },
    { href: '/invite', label: 'nav.invite', icon: 'send' },
];

const group4Items: SideNavItem[] = [
  { href: '/admin', label: 'nav.admin', icon: 'layout-grid' },
  { href: '/super-admin', label: 'nav.superAdmin', icon: 'shield' },
  { href: '/settings', label: 'nav.settings', icon: 'settings' },
  { href: '/about', label: 'nav.about', icon: 'info' },
  { href: '/?welcome=1', label: 'nav.website', icon: 'globe' },
  { href: '/login/selection?action=register&type=corporate&entity=BRAND', label: 'nav.merchant', icon: 'zap' },
  { href: '/login/selection?action=register&type=corporate&entity=NGO', label: 'nav.ngoOnboarding', icon: 'HeartHandshake' },
  { href: '/support/app-support', label: 'nav.support', icon: 'circle-help' },
];

const iconColorMap: { [key: string]: string } = {
  store: 'bg-green-500',
  building: 'bg-orange-500',
  users: 'bg-blue-500',
  calendar: 'bg-rose-500',
  library: 'bg-amber-700',
  'dollar-sign': 'bg-green-600',
  'file-text': 'bg-sky-500',
  award: 'bg-amber-500',
  'message-square': 'bg-blue-400',
  'bar-chart': 'bg-indigo-500',
  send: 'bg-cyan-500',
  sparkles: 'bg-purple-500',
  'layout-grid': 'bg-slate-500',
  shield: 'bg-red-600',
  settings: 'bg-gray-500',
  info: 'bg-blue-400',
  zap: 'bg-yellow-500',
  'HeartHandshake': 'bg-rose-500',
  'circle-help': 'bg-teal-500',
};

const MobileNavLink = ({ item, onClick: _onClick }: { item: SideNavItem; onClick: () => void }) => {
    // P2-4: lookup happens via explicit iconMap (kebab-case + HeartHandshake exception).
    const Icon = iconMap[item.icon] || Info;
    const color = iconColorMap[item.icon] || 'bg-gray-500';

    return (
        <SheetClose asChild>
            <Link href={item.href} className='group flex items-center justify-between p-3 hover:bg-accent/50 transition-colors'>
                <div className="flex items-center gap-4">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className='text-sm font-semibold text-foreground'>{item.label}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            </Link>
        </SheetClose>
    );
};

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isDrawerOpen, setDrawerOpen] = React.useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const { user: authUser, isUserLoading } = useUser();
    const auth = useAuth();
    const db = useFirestore();
    const { t } = useTranslation();
    const { toast } = useToast();
    // 2./3. girişte bilgi yönlendirmesi mantığı sadece bir kez çalışsın diye guard
    const loginCountHandledRef = useRef(false);

    const translateItems = (items: SideNavItem[]) => items.map(it => ({ ...it, label: t(it.label) }));

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, COLLECTIONS.users, authUser.uid);
    }, [db, authUser]);

    const { data: userData } = useDoc<User>(userDocRef);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Custom claims role — fetched once auth user resolves. Primary signal for super-admin.
    const [claimsRole, setClaimsRole] = useState<string | null>(null);
    useEffect(() => {
        if (!authUser) {
            setClaimsRole(null);
            return;
        }
        let cancelled = false;
        authUser
            .getIdTokenResult()
            .then((res) => {
                if (!cancelled) {
                    const role = (res.claims as { role?: unknown }).role;
                    setClaimsRole(typeof role === 'string' ? role : null);
                }
            })
            .catch(() => {
                if (!cancelled) setClaimsRole(null);
            });
        return () => {
            cancelled = true;
        };
    }, [authUser]);

    // Authorization Flags
    // P0-4b: claim-only super-admin gate (userData.role fallback removed —
    // claims set + rules deployed 2026-05-18). Tokens auto-refresh hourly.
    const isSuperAdmin = useMemo(() => {
        if (!authUser) return false;
        return claimsRole === 'super-admin';
    }, [authUser, claimsRole]);

    const isNgoAdmin = useMemo(() => {
        return isSuperAdmin || userData?.role === 'ngo-admin';
    }, [isSuperAdmin, userData]);

    // Filter Secondary items based on authorization
    const filteredSecondaryItems = useMemo(() => {
        return group4Items.filter(item => {
            if (item.href === '/super-admin') return isSuperAdmin;
            if (item.href === '/admin') return isNgoAdmin;
            return true;
        });
    }, [isSuperAdmin, isNgoAdmin]);

    // Track whether the user was signed in last frame so we can detect
    // session expiration (auth → null transition without an explicit signOut).
    const wasAuthedRef = useRef(false);

    // Auth Guard Logic
    useEffect(() => {
        if (!isUserLoading && !authUser && isMounted) {
            const protectedPaths = [
                '/timeline', '/market', '/volunteering', '/clubs', '/events',
                '/qr-payment', '/emergency', '/leaderboard', '/stories',
                '/invite', '/profile', '/my-donations',
                '/my-applications', '/my-badges', '/messages', '/settings',
                '/ngo-admin', '/super-admin', '/admin', '/library'
            ];

            const isProtected = protectedPaths.some(path => pathname === path || pathname.startsWith(path + '/'));

            if (isProtected) {
                // P0-4b follow-up: if the user just got dropped from authed to unauthed
                // (typical after token revoke / claim refresh), give them a clear
                // "session expired" toast instead of a silent redirect.
                if (wasAuthedRef.current && typeof window !== 'undefined') {
                    const lastShownAt = Number(sessionStorage.getItem('session-expired-toast-at') || '0');
                    if (Date.now() - lastShownAt > 60_000) {
                        toast({
                            title: 'Oturumun sonlandı',
                            description: 'Güvenlik nedeniyle yeniden giriş yapman gerekiyor.',
                        });
                        sessionStorage.setItem('session-expired-toast-at', String(Date.now()));
                    }
                }
                const redirectUrl = `/login/selection?action=login&redirect=${encodeURIComponent(pathname)}`;
                router.push(redirectUrl);
            }
        }
        if (authUser) wasAuthedRef.current = true;
    }, [authUser, isUserLoading, pathname, router, isMounted, toast]);

    // Native app: giriş yapmamış kullanıcıyı direkt login formuna yönlendir
    useEffect(() => {
        if (!isUserLoading && !authUser && isMounted && isNativeApp()) {
            if (pathname === '/') {
                router.push('/login/selection');
            }
        }
    }, [authUser, isUserLoading, pathname, router, isMounted]);

    // Giriş yapmış kullanıcıyı login sayfalarından market'e yönlendir.
    // E-postası doğrulanmamış kullanıcı /login/selection üzerinde verify-sent
    // adımını görebilmeli, bu yüzden redirect'i emailVerified'a koşullu tutuyoruz.
    // Kayıt/başvuru (bireysel VE kurumsal Marka/STK/Kulüp) akışı giriş yapmış
    // kullanıcılar için de erişilebilir olmalı; action=register iken /market'e
    // redirect uygulanmaz. Yeni bir kuruluş kaydı/başvurusu yapacak kullanıcı
    // formdan çıkarılmaz.
    const isRegisterFlow = useMemo(() => {
        if (pathname !== '/login/selection') return false;
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        return params.get('action') === 'register';
    }, [pathname]);

    useEffect(() => {
        if (!isUserLoading && authUser && isMounted) {
            // SEC-DISABLE-ENFORCE — Erişimi engellenmiş kullanıcı (super-admin
            // tarafından disabled). STRICT GÜVENLİK: yalnızca `disabled === true`
            // iken çalışır. `userData` yüklenmemişse `null`/`undefined` → `?.disabled`
            // `undefined` → `undefined === true` `false` → NORMAL KULLANICI ASLA
            // çıkış yapmaz. `disabled:false` veya alan yoksa da `false`.
            const userIsDisabled = (userData as { disabled?: boolean } | null)?.disabled === true;
            if (userIsDisabled) {
                toast({
                    variant: 'destructive',
                    title: 'Erişiminiz Kısıtlandı',
                    description: 'Hesabınız yönetici tarafından devre dışı bırakıldı. Lütfen destek ile iletişime geçin.',
                });
                // Aşağıdaki auth-guard effect'inin (auth→null geçişinde) ek bir
                // "Oturumun sonlandı" toast'u göstermesini bastır — kullanıcı
                // zaten net bir disabled mesajı aldı.
                if (typeof window !== 'undefined') {
                    try {
                        sessionStorage.setItem('session-expired-toast-at', String(Date.now()));
                    } catch {
                        // sessionStorage erişilemedi (private mode) — yoksay.
                    }
                }
                signOut(auth)
                    .catch(() => undefined)
                    .finally(() => {
                        // Public sayfada (örn. '/') olsa bile login'e taşı; path
                        // korumalı değilse aşağıdaki auth-guard redirect etmez.
                        router.replace('/login/selection?action=login');
                    });
                return;
            }
            // E-posta doğrulama bekleyenler /login/selection üzerinde verify-sent
            // adımını görebilmeli — orada yalnızca emailVerified olanları yönlendiriyoruz.
            if (authUser.emailVerified && pathname === '/login/selection' && !isRegisterFlow) {
                router.push('/market');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authUser, isUserLoading, pathname, router, isMounted, isRegisterFlow, userData]);

    // 2./3. girişte kişisel/gönüllülük bilgisi yönlendirmesi (PDF page 25)
    // - İlk login (loginCount yok / 0) → loginCount: 1 yaz, redirect yapma
    // - 2. login (loginCount >= 1) → personalInfo.email veya phone boşsa /settings/profile'a yönlendir
    // - localStorage.profileRedirectShown ile bir kez gösterilir.
    // - Zaten /settings/profile altındaysa redirect yapma (sonsuz döngü guard).
    useEffect(() => {
        if (loginCountHandledRef.current) return;
        if (isUserLoading || !authUser || !isMounted || !userData || !userDocRef) return;

        loginCountHandledRef.current = true;

        // loginCount henüz User tipinde tanımlı değil — runtime'da ekleniyor.
        const userDataAny = userData as unknown as { loginCount?: number };
        const currentCount = typeof userDataAny.loginCount === 'number' ? userDataAny.loginCount : 0;

        if (currentCount === 0) {
            // İlk giriş — sayacı 1'e çek, redirect yapma.
            updateDocumentNonBlocking(userDocRef, { loginCount: 1 });
            return;
        }

        // 2. veya sonraki giriş — sayacı artır
        updateDocumentNonBlocking(userDocRef, { loginCount: currentCount + 1 });

        // Daha önce gösterildiyse tekrar gösterme
        let alreadyShown = false;
        try {
            alreadyShown = typeof window !== 'undefined' && window.localStorage.getItem('profileRedirectShown') === '1';
        } catch {
            // localStorage erişilemedi (Safari private, vb.) — varsayılan false ile devam
        }
        if (alreadyShown) return;

        // /settings/profile içindeyken yönlendirme yapma (sonsuz döngü guard)
        if (pathname.startsWith('/settings/profile')) return;

        const personalEmail = userData.personalInfo?.email || '';
        const personalPhone = userData.personalInfo?.phone || '';
        const profileIncomplete = !personalEmail.trim() || !personalPhone.trim();

        if (profileIncomplete) {
            try { window.localStorage.setItem('profileRedirectShown', '1'); } catch {}
            toast({
                title: 'Bilgileriniz eksik',
                description: 'Lütfen kişisel ve gönüllülük bilgilerinizi tamamlayın.',
            });
            router.push('/settings/profile');
        }
    }, [authUser, isUserLoading, isMounted, userData, userDocRef, pathname, router, toast]);

    // Bireysel kullanıcı onboarding gate'i (yeni kullanıcı yönlendirmesi).
    // Yeni bir bireysel kullanıcı (role 'user', süper-admin/STK-admin DEĞİL)
    // onboarding'i tamamlamadan uygulamaya geçemesin diye STK seçimi adımına
    // yönlendirilir. ESKİ KULLANICILARI ASLA KİLİTLEME:
    //   - onboardingComplete === true → tamamlanmış (açık bayrak)
    //   - onboardingComplete === undefined → yalnızca supportedNgos boş VE
    //     volunteerInfo yoksa eksik say; aksi halde tamamlanmış say.
    // Mevcut kullanıcılar (bayraktan önce kayıt olmuş) en az supportedNgos veya
    // volunteerInfo verisine sahip olduğu için tamamlanmış sayılır.
    useEffect(() => {
        if (isUserLoading || !authUser || !isMounted || !userData) return;
        // Süper-admin / STK-admin asla gate'lenmez.
        if (isSuperAdmin || isNgoAdmin) return;
        // Yalnızca bireysel kullanıcı (role 'user' veya tanımsız) gate'lenir.
        const role = (userData as { role?: string }).role;
        if (role && role !== 'user') return;

        const onboardingComplete = (userData as { onboardingComplete?: boolean }).onboardingComplete;
        if (onboardingComplete === true) return; // açık tamamlanma bayrağı

        // "Yeni gibi görünüyor" kontrolü — şüphede kalırsa GATE ETME.
        const hasSupportedNgos = Array.isArray(userData.supportedNgos) && userData.supportedNgos.length > 0;
        const hasVolunteerInfo = !!(userData as { volunteerInfo?: unknown }).volunteerInfo;
        // Bayrak yok + STK yok + gönüllülük verisi yok → gerçekten yeni kullanıcı.
        const looksGenuinelyNew = onboardingComplete === false || (!hasSupportedNgos && !hasVolunteerInfo);
        if (!looksGenuinelyNew) return; // mevcut kullanıcı — dokunma

        // Redirect-loop guard: onboarding/ayar/auth sayfalarındayken yönlendirme.
        const gateTarget = '/settings/ngo-selection';
        const exemptPrefixes = ['/settings', '/login', '/logout', '/auth', '/onboarding'];
        const isExempt = exemptPrefixes.some(p => pathname === p || pathname.startsWith(p + '/'));
        if (isExempt) return;

        router.push(gateTarget);
    }, [authUser, isUserLoading, isMounted, userData, isSuperAdmin, isNgoAdmin, pathname, router]);

    if (!isMounted) {
        return <div className="min-h-screen bg-background">{children}</div>;
    }

    const isPreviewPage = pathname === '/ngo-admin/website/preview';
    const isSuperAdminPage = pathname.startsWith('/super-admin');

    const publicWebsitePaths = [
        '/',
        '/onboarding',
        '/about',
        '/press',
        '/yatirimci-iliskileri',
        '/careers',
        '/corporate',
        '/feedback',
        '/accessibility',
        '/standards',
        '/sitemap',
        '/bilgi-toplumu-hizmetleri',
        '/campus-advantages',
        '/merchant',
        '/ngo-onboarding',
        '/hangelassociation',
        '/logo-usage',
        '/settings/contracts',
        '/contact',
        '/support/app-support',
        '/auth/action',
        '/imece',
        '/social-impact',
        '/p',
    ];

    const isPublicPage = publicWebsitePaths.some(path => pathname === path || (path !== '/' && pathname.startsWith(path + '/')));

    if (isPreviewPage || isSuperAdminPage || isPublicPage) {
        return <div className="min-h-screen bg-background">{children}</div>;
    }

    const currentUserName = authUser?.displayName || authUser?.email?.split('@')[0] || '';
    const currentUserHandle = authUser?.email ? `@${authUser.email.split('@')[0]}` : '';

    return (
        <div className="relative mx-auto flex min-h-screen w-full flex-col bg-background">
          <SideNav
            mainItems={translateItems(group1Items)}
            navItems={translateItems(group2Items)}
            userItems={translateItems(group3Items)}
            secondaryItems={translateItems(filteredSecondaryItems)}
          />
           <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
              <SheetContent side="left" className="w-full max-w-sm p-0">
                   <SheetHeader>
                       <SheetTitle className="sr-only">Ana Menü</SheetTitle>
                       <SheetDescription className="sr-only">Uygulama ana navigasyon menüsü</SheetDescription>
                   </SheetHeader>
                   <div className="flex h-full flex-col overflow-y-auto bg-secondary/30">
                        <div className="p-4 bg-background border-b sticky top-0 z-10">
                            <div className="flex justify-between items-center mb-6">
                                <Link href="/login" onClick={() => setDrawerOpen(false)}>
                                    <HangelLogo className="text-2xl" />
                                </Link>
                                <SheetClose>
                                    <X className="h-6 w-6 text-muted-foreground" />
                                </SheetClose>
                            </div>
                            <Link href="/profile" className="flex items-center gap-3">
                                <UserAvatar className="h-12 w-12" />
                                <div>
                                    <p className="font-bold">{currentUserName}</p>
                                    <p className="text-sm text-muted-foreground">{currentUserHandle}</p>
                                </div>
                            </Link>
                        </div>
                        <nav className="flex-1 space-y-4 p-4">
                            <ul className="bg-card rounded-xl border overflow-hidden divide-y">
                                {translateItems(group1Items).map((item) => <MobileNavLink key={item.href} item={item} onClick={() => setDrawerOpen(false)} />)}
                            </ul>
                            <ul className="bg-card rounded-xl border overflow-hidden divide-y">
                                {translateItems(group2Items).map((item) => <MobileNavLink key={item.href} item={item} onClick={() => setDrawerOpen(false)} />)}
                            </ul>
                             <ul className="bg-card rounded-xl border overflow-hidden divide-y">
                                {translateItems(group3Items).map((item) => <MobileNavLink key={item.href} item={item} onClick={() => setDrawerOpen(false)} />)}
                            </ul>
                            <ul className="bg-card rounded-xl border overflow-hidden divide-y">
                                {translateItems(filteredSecondaryItems).map((item) => <MobileNavLink key={item.href} item={item} onClick={() => setDrawerOpen(false)} />)}
                            </ul>
                        </nav>
                   </div>
              </SheetContent>
          </Sheet>

          <div className="lg:pl-64 flex flex-col flex-1">
            <AppHeader onMenuClick={() => setDrawerOpen(true)} />
            <VerifyEmailBanner />
            <main className="flex-1 pt-12 pb-24 lg:pb-24">
              <AutoBreadcrumb />
              {children}
            </main>
          </div>
        </div>
    );
}