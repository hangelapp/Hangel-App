'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ArrowLeft, Lock, Shield, Loader2, Laptop, Smartphone, Tablet, LogOut, Trash2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, useCollection, updateDocumentNonBlocking, useAuth } from '@/firebase';
import { collection, deleteDoc, doc, orderBy, query, type Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { getSessionId } from '@/lib/session-tracker';
import { useAutosave } from '@/hooks/use-autosave';
import { AutosaveIndicator } from '@/components/shared/autosave-indicator';

interface SessionDoc {
    id: string;
    sessionId?: string;
    deviceName?: string;
    browserName?: string;
    osName?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    lastActiveAt?: Timestamp;
    createdAt?: Timestamp;
}

function formatRelative(ts: Timestamp | undefined, t: (key: string) => string): string {
    if (!ts) return '—';
    const d = ts.toDate();
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return t('dashboard.settingsPrivacy.timeJustNow');
    if (diffMin < 60) return `${diffMin} ${t('dashboard.settingsPrivacy.timeMinAgo')}`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} ${t('dashboard.settingsPrivacy.timeHourAgo')}`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 30) return `${diffD} ${t('dashboard.settingsPrivacy.timeDayAgo')}`;
    return d.toLocaleDateString('tr-TR');
}

const SettingsItem = ({ children, icon: Icon, label, iconColor, description }: { children: React.ReactNode, icon: React.ElementType, label: string, iconColor: string, description?: string }) => (
    <div className="flex items-center p-4 text-sm sm:text-base border-b last:border-b-0">
        <div className={cn("p-1.5 rounded-lg mr-4", iconColor)}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <div className='flex-1 space-y-0.5'>
            <p className="font-medium">{label}</p>
            {description && <p className='text-xs text-muted-foreground'>{description}</p>}
        </div>
        {children}
    </div>
);

export default function PrivacySettingsPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user: authUser, isUserLoading } = useUser();
    const db = useFirestore();
    const auth = useAuth();
    const [saving, setSaving] = useState(false);
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [closingSessionId, setClosingSessionId] = useState<string | null>(null);
    const [closingAll, setClosingAll] = useState(false);
    const currentSessionId = useMemo(() => (typeof window !== 'undefined' ? getSessionId() : null), []);

    const sessionsRef = useMemoFirebase(() => {
        if (!db || !authUser?.uid) return null;
        return query(collection(db, COLLECTIONS.users, authUser.uid, 'sessions'), orderBy('lastActiveAt', 'desc'));
    }, [db, authUser?.uid]);
    const { data: sessions, isLoading: sessionsLoading } = useCollection<SessionDoc>(sessionsRef);

    const handleCloseSession = async (s: SessionDoc) => {
        if (!db || !authUser?.uid) return;
        setClosingSessionId(s.id);
        try {
            await deleteDoc(doc(db, COLLECTIONS.users, authUser.uid, 'sessions', s.id));
            const isCurrent = s.sessionId === currentSessionId;
            if (isCurrent) {
                toast({ title: t('dashboard.settingsPrivacy.toastClosingCurrentSession') });
                if (typeof window !== 'undefined') localStorage.removeItem('hangel-session-id');
                await signOut(auth).catch(() => {});
                router.push('/login/selection?action=login');
            } else {
                toast({ title: t('dashboard.settingsPrivacy.toastSessionClosed'), description: t('dashboard.settingsPrivacy.toastSessionClosedDesc') });
            }
        } catch (err) {
            toast({ variant: 'destructive', title: t('common.errorTitle'), description: err instanceof Error ? err.message.slice(0, 200) : t('dashboard.settingsPrivacy.sessionCloseFailDesc') });
        } finally {
            setClosingSessionId(null);
        }
    };

    const handleCloseAllOthers = async () => {
        if (!db || !authUser?.uid || !sessions) return;
        setClosingAll(true);
        try {
            const others = sessions.filter(s => s.sessionId !== currentSessionId);
            await Promise.all(others.map(s => deleteDoc(doc(db, COLLECTIONS.users, authUser.uid, 'sessions', s.id))));
            toast({ title: t('dashboard.settingsPrivacy.toastOtherSessionsClosed'), description: `${others.length} ${t('dashboard.settingsPrivacy.sessionsClosedSuffix')}` });
        } catch (err) {
            toast({ variant: 'destructive', title: t('common.errorTitle'), description: err instanceof Error ? err.message.slice(0, 200) : '' });
        } finally {
            setClosingAll(false);
        }
    };

    const getDeviceIcon = (type: SessionDoc['deviceType']) => type === 'tablet' ? Tablet : type === 'mobile' ? Smartphone : Laptop;

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, COLLECTIONS.users, authUser.uid);
    }, [db, authUser]);

    type PrivacySettings = {
        isPrivate?: boolean;
        hideScore?: boolean;
        hideAbout?: boolean;
        hideVolunteer?: boolean;
        hideBadges?: boolean;
        hideCertificates?: boolean;
        hidePosts?: boolean;
        hideDonations?: boolean;
    };
    const { data: userData } = useDoc<{ privacySettings?: PrivacySettings; twoFactorEnabled?: boolean }>(userDocRef);

    const [isPrivate, setIsPrivate] = useState(false);
    const [hideScore, setHideScore] = useState(false);
    const [hideAbout, setHideAbout] = useState(false);
    const [hideVolunteer, setHideVolunteer] = useState(false);
    const [hideBadges, setHideBadges] = useState(false);
    const [hideCertificates, setHideCertificates] = useState(false);
    const [hidePosts, setHidePosts] = useState(false);
    const [hideDonations, setHideDonations] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (!userData) return;
        if (userData.twoFactorEnabled !== undefined) setTwoFactorEnabled(!!userData.twoFactorEnabled);
        const p = userData.privacySettings;
        if (p) {
            setIsPrivate(!!p.isPrivate);
            setHideScore(!!p.hideScore);
            setHideAbout(!!p.hideAbout);
            setHideVolunteer(!!p.hideVolunteer);
            setHideBadges(!!p.hideBadges);
            setHideCertificates(!!p.hideCertificates);
            setHidePosts(!!p.hidePosts);
            setHideDonations(!!p.hideDonations);
        }
        setHydrated(true);
    }, [userData]);

    // Ortak yazım — Kaydet butonu ile aynı alanları sessizce yazar.
    const persist = async () => {
        if (!userDocRef) return;
        const result = await updateDocumentNonBlocking(userDocRef, {
            twoFactorEnabled,
            privacySettings: {
                isPrivate, hideScore, hideAbout, hideVolunteer,
                hideBadges, hideCertificates, hidePosts, hideDonations,
            }
        });
        if (!result.ok) throw result.error;
    };

    // Otomatik kayıt (v2 auto): hydration baseline sonrası herhangi bir anahtar
    // değişince 600 ms sonra sessizce yaz — markDirty bağlamaya gerek yok.
    const { status: autosaveStatus } = useAutosave(persist, [isPrivate, hideScore, hideAbout, hideVolunteer, hideBadges, hideCertificates, hidePosts, hideDonations, twoFactorEnabled], { delayMs: 600, enabled: hydrated, auto: true });

    const handleSave = async () => {
        if (!userDocRef || saving) return;
        setSaving(true);
        const result = await updateDocumentNonBlocking(userDocRef, {
            twoFactorEnabled,
            privacySettings: {
                isPrivate, hideScore, hideAbout, hideVolunteer,
                hideBadges, hideCertificates, hidePosts, hideDonations,
            }
        });
        setSaving(false);
        if (result.ok) {
            toast({ title: t('dashboard.settingsPrivacy.toastSavedTitle'), description: t('dashboard.settingsPrivacy.toastSavedDesc') });
        } else {
            toast({ variant: 'destructive', title: t('common.saveFailedTitle'), description: result.error.message.slice(0, 200) });
        }
    };

    if (isUserLoading) {
        return <div className="flex items-center justify-center min-h-dvh"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsPrivacy.heading')}</h1>
                    <p className="text-muted-foreground text-sm">{t('dashboard.settingsPrivacy.subheading')}</p>
                </div>
                <AutosaveIndicator status={autosaveStatus} />
            </div>

            <Card>
                <CardHeader><CardTitle>{t('dashboard.settingsPrivacy.profileVisibilityTitle')}</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <SettingsItem label={t('dashboard.settingsPrivacy.privateProfileLabel')} description={t('dashboard.settingsPrivacy.privateProfileDesc')} icon={Lock} iconColor="bg-red-500">
                        <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                    </SettingsItem>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('dashboard.settingsPrivacy.dataVisibilityTitle')}</CardTitle>
                    <CardDescription>{t('dashboard.settingsPrivacy.dataVisibilityDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <SettingsItem label={t('dashboard.settingsPrivacy.hideScoreLabel')} description={t('dashboard.settingsPrivacy.hideScoreDesc')} icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hideScore} onCheckedChange={setHideScore} />
                    </SettingsItem>
                    <SettingsItem label={t('dashboard.settingsPrivacy.hideAboutLabel')} description={t('dashboard.settingsPrivacy.hideAboutDesc')} icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hideAbout} onCheckedChange={setHideAbout} />
                    </SettingsItem>
                    <SettingsItem label={t('dashboard.settingsPrivacy.hideVolunteerLabel')} description={t('dashboard.settingsPrivacy.hideVolunteerDesc')} icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hideVolunteer} onCheckedChange={setHideVolunteer} />
                    </SettingsItem>
                    <SettingsItem label={t('dashboard.settingsPrivacy.hideBadgesLabel')} description={t('dashboard.settingsPrivacy.hideBadgesDesc')} icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hideBadges} onCheckedChange={setHideBadges} />
                    </SettingsItem>
                    <SettingsItem label={t('dashboard.settingsPrivacy.hideCertsLabel')} description={t('dashboard.settingsPrivacy.hideCertsDesc')} icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hideCertificates} onCheckedChange={setHideCertificates} />
                    </SettingsItem>
                    <SettingsItem label={t('dashboard.settingsPrivacy.hidePostsLabel')} description={t('dashboard.settingsPrivacy.hidePostsDesc')} icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hidePosts} onCheckedChange={setHidePosts} />
                    </SettingsItem>
                    <SettingsItem label={t('dashboard.settingsPrivacy.hideDonationsLabel')} description={t('dashboard.settingsPrivacy.hideDonationsDesc')} icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hideDonations} onCheckedChange={setHideDonations} />
                    </SettingsItem>
                </CardContent>
            </Card>

            {/* GÜVENLİK BÖLÜMÜ — eski /settings/security içeriği buraya taşındı. */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('dashboard.settingsPrivacy.twoFaTitle')}</CardTitle>
                    <CardDescription>{t('dashboard.settingsPrivacy.twoFaDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between gap-3 p-4 border rounded-lg">
                        <div className="min-w-0">
                            <Label htmlFor="2fa-switch">{t('dashboard.settingsPrivacy.twoFaPhoneLabel')}</Label>
                            <p className="text-xs text-muted-foreground">{t('dashboard.settingsPrivacy.twoFaPhoneDesc')}</p>
                        </div>
                        <Switch
                            className="shrink-0"
                            id="2fa-switch"
                            checked={twoFactorEnabled}
                            onCheckedChange={(c) => {
                                setTwoFactorEnabled(c);
                                toast({ title: t('dashboard.settingsPrivacy.twoFaToastTitle'), description: c ? t('dashboard.settingsPrivacy.twoFaToastOn') : t('dashboard.settingsPrivacy.twoFaToastOff') });
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Passkey kartı: native derlemeye webcredentials entitlement girene kadar
                kaldırıldı (arka uç + bileşen hazır, tek satırla geri açılır). */}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> {t('dashboard.settingsPrivacy.sessionsTitle')}</CardTitle>
                    <CardDescription>{t('dashboard.settingsPrivacy.sessionsDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {sessionsLoading ? (
                        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : !sessions || sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">{t('dashboard.settingsPrivacy.sessionsEmpty')}</p>
                    ) : (
                        sessions.map((s) => {
                            const Icon = getDeviceIcon(s.deviceType);
                            const isCurrent = s.sessionId === currentSessionId;
                            const deviceLabel = `${s.deviceName || t('dashboard.settingsPrivacy.deviceFallback')} · ${s.browserName || ''}`.trim();
                            return (
                                <div key={s.id} className={`flex items-start gap-3 p-3 border rounded-lg ${isCurrent ? 'border-primary/40 bg-primary/5' : ''}`}>
                                    <Icon className="h-6 w-6 text-muted-foreground shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-sm truncate">{deviceLabel}</p>
                                            {isCurrent && <Badge variant="default" className="text-[10px] bg-primary/15 text-primary border-primary/30">{t('dashboard.settingsPrivacy.thisDeviceBadge')}</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{s.osName || '—'} · {t('dashboard.settingsPrivacy.lastActiveLabel')}: {formatRelative(s.lastActiveAt, t)}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleCloseSession(s)}
                                        disabled={closingSessionId === s.id}
                                        aria-label={t('dashboard.settingsPrivacy.closeSessionAria')}
                                        title={t('dashboard.settingsPrivacy.closeSessionAria')}
                                    >
                                        {closingSessionId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isCurrent ? <LogOut className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </div>
                            );
                        })
                    )}
                    {sessions && sessions.length > 1 && (
                        <Button type="button" variant="outline" className="w-full" onClick={handleCloseAllOthers} disabled={closingAll}>
                            {closingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {t('dashboard.settingsPrivacy.closeAllOthersBtn')}
                        </Button>
                    )}
                    <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t">
                        {t('dashboard.settingsPrivacy.sessionsNote')}
                    </p>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('dashboard.settingsPrivacy.saveBtn')}
                </Button>
            </div>
        </div>
    );
}
