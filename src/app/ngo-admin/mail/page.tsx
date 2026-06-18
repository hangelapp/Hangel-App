'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Loader2, Wallet, AlertTriangle, Settings, Clock } from 'lucide-react';
import { collection, doc, orderBy, query, where } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { normalizeQuota, quotaRemaining, type NgoQuota } from '@/lib/messaging-quota';
import { Lock, Link2, Send, CheckCircle2 } from 'lucide-react';

/** Workspace SMTP bağlantı durumu — credential/secret ASLA dönmez. */
interface MailConnection {
    configured: boolean;
    gateOpen: boolean;
    connected: boolean;
    fromEmail?: string;
}

interface WorkspaceSegmentRow {
    id: string;
    name?: string;
    channel?: string;
    ngoId?: string;
}

/** Virgül / satır / boşluk ile ayrılmış alıcıları temizleyip benzersiz listeye çevirir. */
function parseRecipients(raw: string): string[] {
    const parts = raw.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    return Array.from(new Set(parts));
}

export default function MailManagementPage() {
    const { toast } = useToast();
    const router = useRouter();
    const db = useFirestore();
    const { user: authUser } = useUser();
    const { id: ngoId } = useActiveEntity();

    const [recipientsRaw, setRecipientsRaw] = useState('');
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    // Kurulum durumu — 'active' değilse gönderim gate'lenir.
    const [setupStatus, setSetupStatus] = useState<'not_started' | 'pending' | 'active' | null>(null);

    // Workspace toplu mail — bağlantı durumu + kimlik formu + gönderim formu.
    const [connection, setConnection] = useState<MailConnection | null>(null);
    const [wsFromEmail, setWsFromEmail] = useState('');
    const [wsFromName, setWsFromName] = useState('');
    const [wsSmtpHost, setWsSmtpHost] = useState('smtp.gmail.com');
    const [wsSmtpPort, setWsSmtpPort] = useState('587');
    const [wsSmtpUser, setWsSmtpUser] = useState('');
    const [wsSmtpPassword, setWsSmtpPassword] = useState('');
    const [wsConnecting, setWsConnecting] = useState(false);
    const [wsDisconnecting, setWsDisconnecting] = useState(false);
    const [wsSubject, setWsSubject] = useState('');
    const [wsMessage, setWsMessage] = useState('');
    const [wsSegmentId, setWsSegmentId] = useState('__all');
    const [wsSending, setWsSending] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function loadSetup() {
            if (!authUser) return;
            try {
                const token = await authUser.getIdToken();
                const res = await fetch('/api/ngo-admin/messaging/setup', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) return;
                const data = (await res.json()) as { setup?: { status?: 'not_started' | 'pending' | 'active' } };
                if (!cancelled) setSetupStatus(data.setup?.status ?? 'not_started');
            } catch {
                // sessizce geç — gate uyarısı gösterilmez, form bozulmaz
            }
        }
        loadSetup();
        return () => { cancelled = true; };
    }, [authUser]);

    const refreshConnection = useCallback(async () => {
        if (!authUser) return;
        try {
            const token = await authUser.getIdToken();
            const res = await fetch('/api/ngo-admin/mail/connection', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = (await res.json()) as MailConnection;
            setConnection({
                configured: !!data.configured,
                gateOpen: !!data.gateOpen,
                connected: !!data.connected,
                fromEmail: typeof data.fromEmail === 'string' ? data.fromEmail : undefined,
            });
        } catch {
            // sessizce geç — Workspace bloğu gizli kalır, mevcut form bozulmaz
        }
    }, [authUser]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            await refreshConnection();
            if (cancelled) return;
        })();
        return () => { cancelled = true; };
    }, [refreshConnection]);

    const setupActive = setupStatus === 'active';

    // Workspace gönderim — NGO-scoped alıcı segmentleri.
    const wsSegmentsQuery = useMemoFirebase(
        () =>
            db && ngoId
                ? query(
                      collection(db, COLLECTIONS.ngoRecipientSegments),
                      where('ngoId', '==', ngoId),
                      orderBy('updatedAt', 'desc'),
                  )
                : null,
        [db, ngoId],
    );
    const { data: wsSegments } = useCollection<WorkspaceSegmentRow>(wsSegmentsQuery);
    const wsMailSegments = useMemo(
        () => (wsSegments ?? []).filter((s) => !s.channel || s.channel === 'email' || s.channel === 'both'),
        [wsSegments],
    );

    const handleWsConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!wsFromEmail.trim() || !wsSmtpHost.trim() || !wsSmtpUser.trim() || !wsSmtpPassword.trim()) {
            toast({ variant: 'destructive', title: 'Tüm bağlantı alanlarını doldurun' });
            return;
        }
        setWsConnecting(true);
        try {
            const token = await authUser?.getIdToken();
            const res = await fetch('/api/ngo-admin/mail/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    fromEmail: wsFromEmail.trim(),
                    fromName: wsFromName.trim(),
                    smtpHost: wsSmtpHost.trim(),
                    smtpPort: Number(wsSmtpPort) || 587,
                    smtpUser: wsSmtpUser.trim(),
                    smtpPassword: wsSmtpPassword,
                }),
            });
            if (!res.ok) {
                toast({ variant: 'destructive', title: 'Bağlanamadı', description: 'Bilgileri kontrol edip tekrar deneyin.' });
                return;
            }
            setWsSmtpPassword('');
            await refreshConnection();
            toast({ title: 'Workspace bağlandı', description: 'Artık Workspace üzerinden toplu mail gönderebilirsiniz.' });
        } catch {
            toast({ variant: 'destructive', title: 'Bağlanamadı', description: 'Bağlantı hatası.' });
        } finally {
            setWsConnecting(false);
        }
    };

    const handleWsDisconnect = async () => {
        setWsDisconnecting(true);
        try {
            const token = await authUser?.getIdToken();
            const res = await fetch('/api/ngo-admin/mail/disconnect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                toast({ variant: 'destructive', title: 'Bağlantı kaldırılamadı' });
                return;
            }
            await refreshConnection();
            toast({ title: 'Bağlantı kaldırıldı' });
        } catch {
            toast({ variant: 'destructive', title: 'Bağlantı kaldırılamadı', description: 'Bağlantı hatası.' });
        } finally {
            setWsDisconnecting(false);
        }
    };

    const handleWsSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ngoId) {
            toast({ variant: 'destructive', title: 'Aktif kurum bulunamadı' });
            return;
        }
        if (!wsSubject.trim()) {
            toast({ variant: 'destructive', title: 'Konu boş olamaz' });
            return;
        }
        if (!wsMessage.trim()) {
            toast({ variant: 'destructive', title: 'Mesaj metni boş olamaz' });
            return;
        }
        setWsSending(true);
        try {
            const token = await authUser?.getIdToken();
            const res = await fetch('/api/ngo-admin/mail/campaign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    name: wsSubject.trim(),
                    subject: wsSubject.trim(),
                    body: wsMessage.trim(),
                    spec: {
                        channel: 'email',
                        useCase: 'marketing',
                        segmentIds: wsSegmentId !== '__all' ? [wsSegmentId] : undefined,
                    },
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                if (res.status === 409 && data?.errorCode === 'NOT_CONNECTED') {
                    toast({ variant: 'destructive', title: 'Workspace bağlı değil', description: 'Önce Workspace hesabınızı bağlayın.' });
                    await refreshConnection();
                } else if (res.status === 402) {
                    toast({ variant: 'destructive', title: 'Yetersiz bakiye', description: 'Daha fazla kontör satın alın.' });
                } else {
                    toast({ variant: 'destructive', title: 'Gönderim başarısız', description: typeof data?.message === 'string' ? data.message : undefined });
                }
                return;
            }
            toast({ title: 'Workspace toplu mail kuyruğa alındı', description: `${data.queued ?? ''} alıcı kuyruğa eklendi.` });
            setWsSubject('');
            setWsMessage('');
        } catch {
            toast({ variant: 'destructive', title: 'Gönderim başarısız', description: 'Bağlantı hatası.' });
        } finally {
            setWsSending(false);
        }
    };

    const walletRef = useMemoFirebase(
        () => (db && ngoId ? doc(db, COLLECTIONS.ngoMessagingWallets, ngoId) : null),
        [db, ngoId],
    );
    const { data: walletRaw } = useDoc<NgoQuota>(walletRef);
    const remaining = useMemo(() => quotaRemaining(normalizeQuota(walletRaw)), [walletRaw]);

    const recipients = useMemo(() => parseRecipients(recipientsRaw), [recipientsRaw]);
    const insufficient = recipients.length > remaining.mail;

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ngoId) {
            toast({ variant: 'destructive', title: 'Aktif kurum bulunamadı' });
            return;
        }
        if (recipients.length === 0) {
            toast({ variant: 'destructive', title: 'En az bir alıcı girin' });
            return;
        }
        if (!subject.trim()) {
            toast({ variant: 'destructive', title: 'Konu boş olamaz' });
            return;
        }
        if (!message.trim()) {
            toast({ variant: 'destructive', title: 'Mesaj metni boş olamaz' });
            return;
        }
        if (insufficient) {
            toast({
                variant: 'destructive',
                title: 'Yetersiz mail kotası',
                description: 'Daha fazla kontör satın alın.',
            });
            return;
        }
        setIsSending(true);
        try {
            const token = await authUser?.getIdToken();
            const res = await fetch('/api/ngo-admin/messaging/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ngoId, channel: 'mail', recipients, message: message.trim(), subject: subject.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 409) {
                    toast({
                        variant: 'destructive',
                        title: 'Yetersiz mail kotası',
                        description: 'Daha fazla kontör satın alın.',
                    });
                } else {
                    toast({
                        variant: 'destructive',
                        title: 'Gönderim başarısız',
                        description: typeof data?.message === 'string' ? data.message : undefined,
                    });
                }
                return;
            }
            toast({
                title: 'Mail gönderildi',
                description: `${data.sent} alıcıya gönderildi. Kalan mail: ${data.remaining?.mail ?? remaining.mail - recipients.length}`,
            });
            setRecipientsRaw('');
            setSubject('');
            setMessage('');
        } catch {
            toast({ variant: 'destructive', title: 'Gönderim başarısız', description: 'Bağlantı hatası.' });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-3xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Mail Gönderimi</h1>
                    <p className="text-muted-foreground text-sm">Topluluğunuza toplu e-posta gönderin.</p>
                </div>
            </div>

            <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Kalan Mail Kotası</p>
                            <p className="text-xl font-black">{remaining.mail}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => router.push('/ngo-admin/messaging-packages')}>
                        Kontör Al
                    </Button>
                </CardContent>
            </Card>

            {connection?.gateOpen === false && (
                <Card className="border-muted bg-muted/30">
                    <CardContent className="p-4 flex items-start gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-muted flex items-center justify-center">
                            <Lock className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold">Workspace Toplu Mail</p>
                            <p className="text-xs text-muted-foreground">
                                Bu özellik kurumunuz için henüz açılmadı.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {connection?.gateOpen === true && !connection.connected && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Link2 className="h-5 w-5 text-primary" />
                            Workspace Hesabını Bağla
                        </CardTitle>
                        <CardDescription>
                            Kurumunuzun Google Workspace adresinden toplu mail gönderin. Şifre olarak Google App Password kullanın.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={handleWsConnect}>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label>Gönderen E-posta</Label>
                                    <Input value={wsFromEmail} onChange={(e) => setWsFromEmail(e.target.value)} placeholder="info@kurumunuz.org" type="email" />
                                    <p className="text-xs text-muted-foreground">Kurumunuzun Google Workspace e-posta adresi — mailler bu adresten gönderilir.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Görünen Ad</Label>
                                    <Input value={wsFromName} onChange={(e) => setWsFromName(e.target.value)} placeholder="Kurumunuzun Adı" />
                                    <p className="text-xs text-muted-foreground">Alıcıların gelen kutusunda gördüğü gönderen adı (ör. kurumunuzun adı).</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>SMTP Sunucu</Label>
                                    <Input value={wsSmtpHost} onChange={(e) => setWsSmtpHost(e.target.value)} placeholder="smtp.gmail.com" />
                                    <p className="text-xs text-muted-foreground">Google Workspace için her zaman <span className="font-medium">smtp.gmail.com</span> — değiştirmeyin.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>SMTP Port</Label>
                                    <Input value={wsSmtpPort} onChange={(e) => setWsSmtpPort(e.target.value)} placeholder="587" inputMode="numeric" />
                                    <p className="text-xs text-muted-foreground"><span className="font-medium">587</span> (TLS, önerilir). Alternatif: 465 (SSL).</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>SMTP Kullanıcı</Label>
                                    <Input value={wsSmtpUser} onChange={(e) => setWsSmtpUser(e.target.value)} placeholder="info@kurumunuz.org" />
                                    <p className="text-xs text-muted-foreground">Genelde gönderen e-posta ile aynı adresi yazın.</p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>App Password</Label>
                                    <Input value={wsSmtpPassword} onChange={(e) => setWsSmtpPassword(e.target.value)} placeholder="16 haneli Google App Password" type="password" autoComplete="new-password" />
                                    <p className="text-xs text-muted-foreground">
                                        Google hesap şifreniz DEĞİL. Önce hesabınızda <span className="font-medium">2 Adımlı Doğrulama</span>ʼyı açın, sonra{' '}
                                        <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline underline-offset-2">
                                            myaccount.google.com/apppasswords
                                        </a>{' '}
                                        adresinden bir uygulama şifresi üretip (16 hane) buraya yapıştırın.
                                    </p>
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={wsConnecting}>
                                {wsConnecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
                                Bağla
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {connection?.gateOpen === true && connection.connected && (
                <Card className="border-primary/30">
                    <CardHeader>
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <CardTitle className="flex items-center gap-2">
                                <Send className="h-5 w-5 text-primary" />
                                Workspace Toplu Mail Gönder
                            </CardTitle>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Bağlı {connection.fromEmail ?? ''}
                                </span>
                                <Button variant="outline" size="sm" onClick={handleWsDisconnect} disabled={wsDisconnecting}>
                                    {wsDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Bağlantıyı Kaldır'}
                                </Button>
                            </div>
                        </div>
                        <CardDescription>
                            Kurumunuzun Workspace adresinden topluluğunuza mail gönderin. Gönderim hızı dakikada 1 maildir.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form className="space-y-4" onSubmit={handleWsSend}>
                            <div className="space-y-2">
                                <Label>Alıcı Kaynağı</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={wsSegmentId}
                                    onChange={(e) => setWsSegmentId(e.target.value)}
                                >
                                    <option value="__all">Tüm topluluk üyeleri</option>
                                    {wsMailSegments.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name ?? s.id}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Konu</Label>
                                <Input value={wsSubject} onChange={(e) => setWsSubject(e.target.value)} placeholder="E-posta konusu" />
                            </div>
                            <div className="space-y-2">
                                <Label>Mesaj</Label>
                                <Textarea rows={8} value={wsMessage} onChange={(e) => setWsMessage(e.target.value)} placeholder="Mesajınızı yazın..." />
                            </div>
                            <Button type="submit" className="w-full" disabled={wsSending}>
                                {wsSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                Workspace Toplu Mail Gönder
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {setupStatus !== null && !setupActive && (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-300 bg-amber-50/60 text-amber-800">
                    {setupStatus === 'pending' ? <Clock className="h-5 w-5 shrink-0 mt-0.5" /> : <Settings className="h-5 w-5 shrink-0 mt-0.5" />}
                    <div className="flex-1 space-y-2">
                        <p className="text-sm font-semibold">
                            {setupStatus === 'pending' ? 'Kurulum onayı bekleniyor' : 'Mail göndermek için önce kurulumu tamamlayın'}
                        </p>
                        <p className="text-xs">
                            {setupStatus === 'pending'
                                ? 'Kurulum talebiniz sağlayıcıya iletildi. Aktivasyon tamamlanınca mail gönderebilirsiniz.'
                                : 'Gönderen bilgileri ve gerekli belgeler için adım adım kurulum sihirbazını tamamlamanız gerekir.'}
                        </p>
                        {setupStatus !== 'pending' && (
                            <Button variant="outline" size="sm" onClick={() => router.push('/ngo-admin/messaging/setup')}>
                                Kuruluma Git
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Yeni Mail</CardTitle>
                    <CardDescription>Alıcı e-postalarını virgül veya satır başı ile ayırın.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Alıcılar</Label>
                            <span className="text-[10px] text-muted-foreground">{recipients.length} alıcı</span>
                        </div>
                        <Textarea
                            rows={4}
                            value={recipientsRaw}
                            onChange={(e) => setRecipientsRaw(e.target.value)}
                            placeholder="ornek@eposta.com, ornek2@eposta.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Konu</Label>
                        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="E-posta konusu" />
                    </div>
                    <div className="space-y-2">
                        <Label>Mesaj</Label>
                        <Textarea
                            rows={8}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Mesajınızı yazın..."
                        />
                    </div>
                    {insufficient && (
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>Yetersiz kota: {recipients.length} alıcı için {remaining.mail} mail yetmiyor. Kontör alın.</span>
                        </div>
                    )}
                    <Button className="w-full" onClick={handleSend} disabled={isSending || (setupStatus !== null && !setupActive)}>
                        {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                        Gönder
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
