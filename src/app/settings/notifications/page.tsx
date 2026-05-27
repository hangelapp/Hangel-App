'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Bell, Mail, MessageSquare, Loader2, BellRing, BellOff, Shield, Megaphone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { requestPushPermission, registerForPushToken } from '@/lib/fcm';

const notificationGroups = [
    {
        title: 'Gönüllülük ve Başvurular',
        description: 'Gönüllülük ilanları ve başvurularınızla ilgili bildirimler.',
        items: [
            { id: 'app-status', label: 'Başvuru durumu değiştiğinde' },
            { id: 'new-opportunity', label: 'İlgi alanlarıma uygun yeni ilanlar' },
            { id: 'event-reminder', label: 'Katılacağım etkinlikler için hatırlatma' },
        ],
    },
    {
        title: 'Bağış ve Etki',
        description: 'Yaptığınız bağışlar ve kazandığınız puanlarla ilgili bildirimler.',
        items: [
            { id: 'donation-success', label: "Bağış STK'ya ulaştığında" },
            { id: 'new-badge', label: 'Yeni rozet kazanıldığında' },
            { id: 'impact-report', label: 'Aylık etki raporu hazır olduğunda' },
        ],
    },
    {
        title: 'Platform ve Topluluk',
        description: 'Duyurular, bültenler ve sosyal bildirimler.',
        items: [
            { id: 'announcements', label: 'Platform duyuruları ve güncellemeler' },
            { id: 'newsletter', label: 'Haftalık hangel bülteni' },
            { id: 'social', label: 'Sosyal etkileşimler (beğeni, yorum vb.)' },
        ],
    },
];

type NotificationSettings = { [key: string]: boolean };

const defaultSettings: NotificationSettings = {
    'app-status-push': true, 'app-status-email': true, 'app-status-sms': false,
    'new-opportunity-push': true, 'new-opportunity-email': false, 'new-opportunity-sms': false,
    'event-reminder-push': true, 'event-reminder-email': true, 'event-reminder-sms': true,
    'donation-success-push': true, 'donation-success-email': true, 'donation-success-sms': false,
    'new-badge-push': true, 'new-badge-email': false, 'new-badge-sms': false,
    'impact-report-push': false, 'impact-report-email': true, 'impact-report-sms': false,
    'announcements-push': true, 'announcements-email': true, 'announcements-sms': false,
    'newsletter-push': false, 'newsletter-email': true, 'newsletter-sms': false,
    'social-push': true, 'social-email': false, 'social-sms': false,
};

export default function NotificationSettingsPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user: authUser, isUserLoading } = useUser();
    const db = useFirestore();

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, COLLECTIONS.users, authUser.uid);
    }, [db, authUser]);

    const { data: userData } = useDoc<{ notificationSettings?: NotificationSettings }>(userDocRef);
    const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (userData?.notificationSettings) {
            setSettings({ ...defaultSettings, ...userData.notificationSettings });
        }
    }, [userData]);

    const handleToggle = (id: string) => {
        setSettings(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleSave = async () => {
        if (!userDocRef || saving) return;
        setSaving(true);
        const result = await updateDocumentNonBlocking(userDocRef, { notificationSettings: settings });
        setSaving(false);
        if (result.ok) {
            toast({ title: t('dashboard.settingsNotifications.toastSavedTitle'), description: t('dashboard.settingsNotifications.toastSavedDesc') });
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
                <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsNotifications.heading')}</h1>
                <p className="text-muted-foreground text-sm">{t('dashboard.settingsNotifications.subheading')}</p>
            </div>

            <PushPermissionCard authUid={authUser?.uid} />

            <div className="space-y-8">
                {notificationGroups.map((group) => (
                    <Card key={group.title}>
                        <CardHeader>
                            <CardTitle>{group.title}</CardTitle>
                            <CardDescription>{group.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-end gap-4 pr-4">
                                    <span title="Anlık Bildirim"><Bell className="h-5 w-5 text-muted-foreground" /></span>
                                    <span title="E-posta"><Mail className="h-5 w-5 text-muted-foreground" /></span>
                                    <span title="SMS"><MessageSquare className="h-5 w-5 text-muted-foreground" /></span>
                                </div>
                                {group.items.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <label className="font-medium text-sm flex-1">{item.label}</label>
                                        <div className="flex items-center gap-4">
                                            <Switch checked={!!settings[`${item.id}-push`]} onCheckedChange={() => handleToggle(`${item.id}-push`)} />
                                            <Switch checked={!!settings[`${item.id}-email`]} onCheckedChange={() => handleToggle(`${item.id}-email`)} />
                                            <Switch checked={!!settings[`${item.id}-sms`]} onCheckedChange={() => handleToggle(`${item.id}-sms`)} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {/* Pazarlama İzinleri — eski /settings/marketing-consent içeriği buraya taşındı. */}
            <MarketingConsentCard />

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('dashboard.settingsNotifications.saveBtn')}
                </Button>
            </div>
        </div>
    );
}

/**
 * KVKK + İYS uyumlu pazarlama izinleri. Önceden /settings/marketing-consent
 * ayrı sayfaydı; tek "Bildirim Ayarları" altında topluyoruz.
 */
function MarketingConsentCard() {
    const { user } = useUser();
    const db = useFirestore();
    const { toast } = useToast();
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!user || !db) return;
        (async () => {
            try {
                const snap = await getDoc(doc(db, COLLECTIONS.userMarketingConsent, user.uid));
                if (snap.exists()) {
                    const d = snap.data() as { email?: { enabled?: boolean }; sms?: { enabled?: boolean } };
                    setEmailEnabled(d.email?.enabled ?? false);
                    setSmsEnabled(d.sms?.enabled ?? false);
                }
            } catch { /* noop */ } finally {
                setLoading(false);
            }
        })();
    }, [user, db]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            await setDoc(doc(db, COLLECTIONS.userMarketingConsent, user.uid), {
                email: { enabled: emailEnabled, source: 'user', updatedAt: serverTimestamp() },
                sms: { enabled: smsEnabled, source: 'user', updatedAt: serverTimestamp() },
                channelAddresses: { email: user.email ?? null },
                updatedAt: serverTimestamp(),
            }, { merge: true });
            toast({ title: 'Pazarlama izinleri kaydedildi' });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Kayıt başarısız', description: err instanceof Error ? err.message.slice(0, 200) : '' });
        } finally {
            setSaving(false);
        }
    };

    if (!user) return null;
    if (loading) {
        return (
            <Card>
                <CardContent className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> Pazarlama İzinleri (SMS & E-Posta)</CardTitle>
                <CardDescription>Hangel duyuru, kampanya ve özel teklif iletilerini almak ister misin? İstediğin zaman değiştirebilirsin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-blue-100 flex items-center justify-center">
                            <Mail className="h-4 w-4 text-blue-700" />
                        </div>
                        <div>
                            <Label className="text-sm font-medium">E-posta ile Pazarlama</Label>
                            <p className="text-xs text-muted-foreground">Kampanya, etkinlik, blog güncellemeleri.</p>
                        </div>
                    </div>
                    <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-md bg-emerald-100 flex items-center justify-center">
                            <MessageSquare className="h-4 w-4 text-emerald-700" />
                        </div>
                        <div>
                            <Label className="text-sm font-medium">SMS ile Pazarlama</Label>
                            <p className="text-xs text-muted-foreground">Acil durum & özel teklif bildirimleri.</p>
                        </div>
                    </div>
                    <Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full" variant="outline">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Pazarlama İzinlerini Kaydet
                </Button>
                <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t flex items-start gap-1.5">
                    <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                        <strong>KVKK ve İYS:</strong> İzinlerini istediğin zaman buradan veya gelen mesajdaki
                        &quot;Aboneliği iptal et&quot; bağlantısıyla geri çekebilirsin. İzinler İleti Yönetim Sistemi (İYS) ile senkron tutulur.
                    </span>
                </p>
            </CardContent>
        </Card>
    );
}

/**
 * P-FCM permission CTA: lets the signed-in user grant browser push permission
 * and registers an FCM token (saved under users/{uid}/fcmTokens/{token}). SSR-safe.
 */
function PushPermissionCard({ authUid }: { authUid: string | undefined }) {
    const { toast } = useToast();
    const [permission, setPermission] = useState<NotificationPermission | 'unsupported' | 'loading'>('loading');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof Notification === 'undefined') {
            setPermission('unsupported');
            return;
        }
        setPermission(Notification.permission);
    }, []);

    const handleEnable = async () => {
        if (!authUid) {
            toast({ variant: 'destructive', title: 'Giriş gerekli', description: 'Anlık bildirim için giriş yapmalısınız.' });
            return;
        }
        setBusy(true);
        try {
            const next = await requestPushPermission();
            setPermission(next);
            if (next === 'granted') {
                const tok = await registerForPushToken(authUid);
                if (tok) {
                    toast({ title: 'Anlık bildirim açıldı', description: 'Cihazın artık bildirim alabilir.' });
                } else {
                    toast({ variant: 'destructive', title: 'Token alınamadı', description: 'Bildirim izni verildi ama token kaydedilemedi. Tarayıcıyı yenileyip tekrar dene.' });
                }
            } else if (next === 'denied') {
                toast({ variant: 'destructive', title: 'İzin reddedildi', description: 'Tarayıcı ayarlarından sonradan da açabilirsin.' });
            }
        } catch (e) {
            console.error('[push] permission flow failed', e);
            toast({ variant: 'destructive', title: 'Hata', description: 'Bildirim izni alınamadı.' });
        } finally {
            setBusy(false);
        }
    };

    if (permission === 'loading' || permission === 'unsupported') return null;

    const granted = permission === 'granted';
    const denied = permission === 'denied';

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    {granted ? <BellRing className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
                    Anlık (Push) Bildirim İzni
                </CardTitle>
                <CardDescription>
                    {granted
                        ? 'Cihazın aktif olarak anlık bildirim alabilir.'
                        : denied
                        ? 'Bildirim izni reddedildi. Tarayıcı ayarlarından da açabilirsin.'
                        : 'Acil kan ihtiyacı, gönüllülük eşleşmesi ve mesaj bildirimlerini cihazınla anında almak için izin ver.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end">
                <Button onClick={handleEnable} disabled={busy || granted || denied}>
                    {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {granted ? 'Aktif' : denied ? 'Reddedildi' : 'Bildirimleri Aç'}
                </Button>
            </CardContent>
        </Card>
    );
}
