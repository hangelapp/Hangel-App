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

function formatRelative(ts?: Timestamp): string {
    if (!ts) return '—';
    const d = ts.toDate();
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Şu an';
    if (diffMin < 60) return `${diffMin} dakika önce`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} saat önce`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 30) return `${diffD} gün önce`;
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
                toast({ title: 'Bu oturum kapatılıyor' });
                if (typeof window !== 'undefined') localStorage.removeItem('hangel-session-id');
                await signOut(auth).catch(() => {});
                router.push('/login/selection?action=login');
            } else {
                toast({ title: 'Oturum kapatıldı', description: 'Diğer cihazda 1 saat içinde otomatik çıkış olur.' });
            }
        } catch (err) {
            toast({ variant: 'destructive', title: 'Hata', description: err instanceof Error ? err.message.slice(0, 200) : 'Oturum kapatılamadı.' });
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
            toast({ title: 'Diğer oturumlar kapatıldı', description: `${others.length} oturum kapatıldı.` });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Hata', description: err instanceof Error ? err.message.slice(0, 200) : '' });
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
    const { data: userData } = useDoc<{ privacySettings?: PrivacySettings }>(userDocRef);

    const [isPrivate, setIsPrivate] = useState(false);
    const [hideScore, setHideScore] = useState(false);
    const [hideAbout, setHideAbout] = useState(false);
    const [hideVolunteer, setHideVolunteer] = useState(false);
    const [hideBadges, setHideBadges] = useState(false);
    const [hideCertificates, setHideCertificates] = useState(false);
    const [hidePosts, setHidePosts] = useState(false);
    const [hideDonations, setHideDonations] = useState(false);

    useEffect(() => {
        const p = userData?.privacySettings;
        if (!p) return;
        setIsPrivate(!!p.isPrivate);
        setHideScore(!!p.hideScore);
        setHideAbout(!!p.hideAbout);
        setHideVolunteer(!!p.hideVolunteer);
        setHideBadges(!!p.hideBadges);
        setHideCertificates(!!p.hideCertificates);
        setHidePosts(!!p.hidePosts);
        setHideDonations(!!p.hideDonations);
    }, [userData]);

    const handleSave = async () => {
        if (!userDocRef || saving) return;
        setSaving(true);
        const result = await updateDocumentNonBlocking(userDocRef, {
            privacySettings: {
                isPrivate, hideScore, hideAbout, hideVolunteer,
                hideBadges, hideCertificates, hidePosts, hideDonations,
            }
        });
        setSaving(false);
        if (result.ok) {
            toast({ title: t('dashboard.settingsPrivacy.toastSavedTitle'), description: t('dashboard.settingsPrivacy.toastSavedDesc') });
        } else {
            toast({ variant: 'destructive', title: 'Kayıt başarısız', description: result.error.message.slice(0, 200) });
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
            <div>
                <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsPrivacy.heading')}</h1>
                <p className="text-muted-foreground text-sm">{t('dashboard.settingsPrivacy.subheading')}</p>
            </div>

            <Card>
                <CardHeader><CardTitle>{t('dashboard.settingsPrivacy.profileVisibilityTitle')}</CardTitle></CardHeader>
                <CardContent className="p-0">
                    <SettingsItem label="Özel Profil" description="Etkinleştirilirse, profilinizi sadece onayladığınız takipçiler görebilir." icon={Lock} iconColor="bg-red-500">
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
                    <SettingsItem label="Etki Puanımı Gizle" description="Sosyal etki puanınız ve istatistikleriniz profilinizde görünmez." icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hideScore} onCheckedChange={setHideScore} />
                    </SettingsItem>
                    <SettingsItem label="Hakkında Bilgilerimi Gizle" description="Kişisel ve iletişim bilgileriniz profilinizde görünmez." icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hideAbout} onCheckedChange={setHideAbout} />
                    </SettingsItem>
                    <SettingsItem label="Gönüllülük Bilgilerimi Gizle" description="Gönüllülük yetkinlikleriniz ve geçmişiniz profilinizde görünmez." icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hideVolunteer} onCheckedChange={setHideVolunteer} />
                    </SettingsItem>
                    <SettingsItem label="Rozetlerimi Gizle" description="Kazandığınız rozetler profilinizde görünmez." icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hideBadges} onCheckedChange={setHideBadges} />
                    </SettingsItem>
                    <SettingsItem label="Sertifikalarımı Gizle" description="Kazandığınız sertifikalar profilinizde görünmez." icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hideCertificates} onCheckedChange={setHideCertificates} />
                    </SettingsItem>
                    <SettingsItem label="Gönderilerimi Gizle" description="Paylaştığınız gönderiler profilinizde görünmez." icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hidePosts} onCheckedChange={setHidePosts} />
                    </SettingsItem>
                    <SettingsItem label="Bağış Aktivitelerimi Gizle" description="Bağış ve işlem geçmişiniz profilinizde görünmez." icon={Shield} iconColor="bg-green-500">
                        <Switch checked={hideDonations} onCheckedChange={setHideDonations} />
                    </SettingsItem>
                </CardContent>
            </Card>

            {/* GÜVENLİK BÖLÜMÜ — eski /settings/security içeriği buraya taşındı. */}
            <Card>
                <CardHeader>
                    <CardTitle>İki Faktörlü Doğrulama</CardTitle>
                    <CardDescription>Hesabınızı korumak için ek güvenlik katmanı.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <Label htmlFor="2fa-switch">Telefon Numarası ile Doğrulama</Label>
                            <p className="text-xs text-muted-foreground">Giriş yaparken telefonunuza bir kod gönderilir.</p>
                        </div>
                        <Switch
                            id="2fa-switch"
                            checked={twoFactorEnabled}
                            onCheckedChange={(c) => {
                                setTwoFactorEnabled(c);
                                toast({ title: '2FA güncellendi', description: c ? 'Açıldı.' : 'Kapatıldı.' });
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Açık Oturumlar</CardTitle>
                    <CardDescription>Bu hesaba bağlı cihaz ve tarayıcılar. Aynı cihazda farklı tarayıcılar ayrı oturum olarak listelenir.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {sessionsLoading ? (
                        <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : !sessions || sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">Henüz oturum kaydı yok.</p>
                    ) : (
                        sessions.map((s) => {
                            const Icon = getDeviceIcon(s.deviceType);
                            const isCurrent = s.sessionId === currentSessionId;
                            const deviceLabel = `${s.deviceName || 'Cihaz'} · ${s.browserName || ''}`.trim();
                            return (
                                <div key={s.id} className={`flex items-start gap-3 p-3 border rounded-lg ${isCurrent ? 'border-primary/40 bg-primary/5' : ''}`}>
                                    <Icon className="h-6 w-6 text-muted-foreground shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0 space-y-0.5">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-bold text-sm truncate">{deviceLabel}</p>
                                            {isCurrent && <Badge variant="default" className="text-[10px] bg-primary/15 text-primary border-primary/30">Bu cihaz</Badge>}
                                        </div>
                                        <p className="text-xs text-muted-foreground">{s.osName || '—'} · Son aktif: {formatRelative(s.lastActiveAt)}</p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleCloseSession(s)}
                                        disabled={closingSessionId === s.id}
                                        aria-label="Oturum kapat"
                                        title="Oturumu kapat"
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
                            Diğer Tüm Oturumları Kapat
                        </Button>
                    )}
                    <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t">
                        ⓘ Diğer cihazda oturum kapatıldıktan sonra etki gösterme süresi: en geç <strong>1 saat</strong>.
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
