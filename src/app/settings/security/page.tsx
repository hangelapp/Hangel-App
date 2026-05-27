'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Laptop, Smartphone, Tablet, Loader2, LogOut, Trash2, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';
import { useFirestore, useUser, useCollection, useMemoFirebase, useAuth } from '@/firebase';
import { collection, deleteDoc, doc, orderBy, query, Timestamp } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { COLLECTIONS } from '@/firebase/collections';
import { getSessionId } from '@/lib/session-tracker';
import { Badge } from '@/components/ui/badge';

interface SessionDoc {
    id: string;
    sessionId?: string;
    deviceName?: string;
    browserName?: string;
    osName?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    userAgent?: string;
    lastActiveAt?: Timestamp;
    createdAt?: Timestamp;
}

function formatRelative(ts?: Timestamp): string {
    if (!ts) return '—';
    const d = ts.toDate();
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Şu an';
    if (diffMin < 60) return `${diffMin} dakika önce`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} saat önce`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 30) return `${diffD} gün önce`;
    return d.toLocaleDateString('tr-TR');
}

export default function SecuritySettingsPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();
    const firestore = useFirestore();
    const auth = useAuth();
    const { user: authUser } = useUser();
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [closingSessionId, setClosingSessionId] = useState<string | null>(null);
    const [closingAll, setClosingAll] = useState(false);

    const currentSessionId = useMemo(() => (typeof window !== 'undefined' ? getSessionId() : null), []);

    const sessionsRef = useMemoFirebase(() => {
        if (!firestore || !authUser?.uid) return null;
        return query(
            collection(firestore, COLLECTIONS.users, authUser.uid, 'sessions'),
            orderBy('lastActiveAt', 'desc'),
        );
    }, [firestore, authUser?.uid]);

    const { data: sessions, isLoading: sessionsLoading } = useCollection<SessionDoc>(sessionsRef);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: t('dashboard.settingsSecurity.toastSavedTitle'),
            description: t('dashboard.settingsSecurity.toastSavedDesc'),
        });
    };

    const handleCloseSession = async (s: SessionDoc) => {
        if (!firestore || !authUser?.uid) return;
        setClosingSessionId(s.id);
        try {
            await deleteDoc(doc(firestore, COLLECTIONS.users, authUser.uid, 'sessions', s.id));
            const isCurrent = s.sessionId === currentSessionId;
            if (isCurrent) {
                toast({ title: 'Bu oturum kapatılıyor', description: 'Çıkış yapılıyor...' });
                try {
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('hangel-session-id');
                    }
                    await signOut(auth);
                    router.push('/login/selection?action=login');
                } catch {
                    /* ignore */
                }
            } else {
                toast({
                    title: 'Oturum kapatıldı',
                    description: `${s.browserName || 'Bilinmeyen'} oturumu kapatıldı. Diğer cihazda 1 saat içinde otomatik çıkış olur.`,
                });
            }
        } catch (err) {
            toast({ variant: 'destructive', title: 'Hata', description: err instanceof Error ? err.message.slice(0, 200) : 'Oturum kapatılamadı.' });
        } finally {
            setClosingSessionId(null);
        }
    };

    const handleCloseAllOthers = async () => {
        if (!firestore || !authUser?.uid || !sessions) return;
        setClosingAll(true);
        try {
            const others = sessions.filter(s => s.sessionId !== currentSessionId);
            await Promise.all(
                others.map(s => deleteDoc(doc(firestore, COLLECTIONS.users, authUser.uid, 'sessions', s.id))),
            );
            toast({
                title: 'Diğer oturumlar kapatıldı',
                description: `${others.length} oturum kapatıldı. Diğer cihazlarda 1 saat içinde otomatik çıkış olur.`,
            });
        } catch (err) {
            toast({ variant: 'destructive', title: 'Hata', description: err instanceof Error ? err.message.slice(0, 200) : 'Oturumlar kapatılamadı.' });
        } finally {
            setClosingAll(false);
        }
    };

    const getDeviceIcon = (type: SessionDoc['deviceType']) => {
        if (type === 'tablet') return Tablet;
        if (type === 'mobile') return Smartphone;
        return Laptop;
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsSecurity.heading')}</h1>
                <p className="text-muted-foreground text-sm">{t('dashboard.settingsSecurity.subheading')}</p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('dashboard.settingsSecurity.twoFactorTitle')}</CardTitle>
                        <CardDescription>{t('dashboard.settingsSecurity.twoFactorDesc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <Label htmlFor="2fa-switch">Telefon Numarası ile Doğrulama</Label>
                                <p className="text-xs text-muted-foreground">Giriş yaparken telefonunuza bir kod gönderilir.</p>
                            </div>
                            <Switch id="2fa-switch" checked={twoFactorEnabled} onCheckedChange={(checked) => {
                                setTwoFactorEnabled(checked);
                                toast({ title: t('dashboard.settingsSecurity.toast2faTitle'), description: checked ? t('dashboard.settingsSecurity.toast2faOn') : t('dashboard.settingsSecurity.toast2faOff') });
                            }} />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-primary" /> Açık Oturumlar
                        </CardTitle>
                        <CardDescription>
                            Bu hesaba bağlı tüm cihaz ve tarayıcılar. Aynı cihazda farklı tarayıcılar (örn. Safari + Chrome) ayrı oturum olarak listelenir.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {sessionsLoading ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : !sessions || sessions.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">
                                Henüz oturum kaydı yok. Sayfayı yenile.
                            </p>
                        ) : (
                            sessions.map((s) => {
                                const Icon = getDeviceIcon(s.deviceType);
                                const isCurrent = s.sessionId === currentSessionId;
                                const deviceLabel = `${s.deviceName || 'Cihaz'} · ${s.browserName || ''}`.trim();
                                return (
                                    <div
                                        key={s.id}
                                        className={`flex items-start gap-3 p-3 border rounded-lg ${isCurrent ? 'border-primary/40 bg-primary/5' : ''}`}
                                    >
                                        <Icon className="h-6 w-6 text-muted-foreground shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0 space-y-0.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-sm truncate">{deviceLabel}</p>
                                                {isCurrent && (
                                                    <Badge variant="default" className="text-[10px] bg-primary/15 text-primary border-primary/30">
                                                        Bu cihaz
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {s.osName || '—'} · Son aktif: {formatRelative(s.lastActiveAt)}
                                            </p>
                                            {s.createdAt && (
                                                <p className="text-[10px] text-muted-foreground/70">
                                                    Açılış: {formatRelative(s.createdAt)}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => handleCloseSession(s)}
                                            disabled={closingSessionId === s.id}
                                            aria-label="Bu oturumu kapat"
                                            title="Bu oturumu kapat"
                                        >
                                            {closingSessionId === s.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : isCurrent ? (
                                                <LogOut className="h-4 w-4" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                );
                            })
                        )}

                        {sessions && sessions.length > 1 && (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={handleCloseAllOthers}
                                disabled={closingAll}
                            >
                                {closingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Diğer Tüm Oturumları Kapat
                            </Button>
                        )}

                        <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t">
                            ⓘ Diğer cihazda oturum kapatıldıktan sonra etki gösterme süresi: en geç <strong>1 saat</strong>.
                            Hemen şüpheli bir aktivite varsa şifreni de değiştir.
                        </p>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit">{t('dashboard.settingsSecurity.saveBtn')}</Button>
                </div>
            </form>
        </div>
    );
}
