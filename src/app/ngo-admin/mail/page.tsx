'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Loader2, Wallet, AlertTriangle, Settings, Clock } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { normalizeQuota, quotaRemaining, type NgoQuota } from '@/lib/messaging-quota';

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

    const setupActive = setupStatus === 'active';

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
