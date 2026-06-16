'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Loader2, Wallet, AlertTriangle, Settings, Clock } from 'lucide-react';
import { doc } from 'firebase/firestore';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { normalizeQuota, quotaRemaining, type NgoQuota } from '@/lib/messaging-quota';

const SMS_LIMIT = 160;

/** Virgül / satır / boşluk ile ayrılmış alıcıları temizleyip benzersiz listeye çevirir. */
function parseRecipients(raw: string): string[] {
    const parts = raw.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
    return Array.from(new Set(parts));
}

export default function SmsSendingPage() {
    const { toast } = useToast();
    const router = useRouter();
    const db = useFirestore();
    const { user: authUser } = useUser();
    const { id: ngoId } = useActiveEntity();

    const [recipientsRaw, setRecipientsRaw] = useState('');
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
    const insufficient = recipients.length > remaining.sms;

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
        if (!message.trim()) {
            toast({ variant: 'destructive', title: 'Mesaj metni boş olamaz' });
            return;
        }
        if (insufficient) {
            toast({
                variant: 'destructive',
                title: 'Yetersiz SMS kotası',
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
                body: JSON.stringify({ ngoId, channel: 'sms', recipients, message: message.trim() }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 409) {
                    toast({
                        variant: 'destructive',
                        title: 'Yetersiz SMS kotası',
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
                title: 'SMS gönderildi',
                description: `${data.sent} alıcıya gönderildi. Kalan SMS: ${data.remaining?.sms ?? remaining.sms - recipients.length}`,
            });
            setRecipientsRaw('');
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
                    <h1 className="text-2xl font-bold font-headline">SMS Gönderimi</h1>
                    <p className="text-muted-foreground text-sm">Topluluğunuza toplu SMS gönderin.</p>
                </div>
            </div>

            <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Kalan SMS Kotası</p>
                            <p className="text-xl font-black">{remaining.sms}</p>
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
                            {setupStatus === 'pending' ? 'Kurulum onayı bekleniyor' : 'SMS göndermek için önce kurulumu tamamlayın'}
                        </p>
                        <p className="text-xs">
                            {setupStatus === 'pending'
                                ? 'Kurulum talebiniz sağlayıcıya iletildi. Aktivasyon tamamlanınca SMS gönderebilirsiniz.'
                                : 'Gönderici başlığı ve gerekli belgeler için adım adım kurulum sihirbazını tamamlamanız gerekir.'}
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
                    <CardTitle>Yeni SMS</CardTitle>
                    <CardDescription>Alıcı numaralarını virgül veya satır başı ile ayırın.</CardDescription>
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
                            placeholder="05XX XXX XX XX, 05XX XXX XX XX"
                        />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Mesaj</Label>
                            <span className="text-[10px] text-muted-foreground">{message.length}/{SMS_LIMIT}</span>
                        </div>
                        <Textarea
                            rows={5}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Mesajınızı yazın..."
                        />
                    </div>
                    {insufficient && (
                        <div className="flex items-center gap-3 p-3 rounded-xl border border-destructive/40 bg-destructive/10 text-destructive text-xs">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>Yetersiz kota: {recipients.length} alıcı için {remaining.sms} SMS yetmiyor. Kontör alın.</span>
                        </div>
                    )}
                    <Button className="w-full" onClick={handleSend} disabled={isSending || (setupStatus !== null && !setupActive)}>
                        {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Gönder
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
