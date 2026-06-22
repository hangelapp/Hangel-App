'use client';

/**
 * /invite — Kullanıcı "Arkadaşını Davet Et".
 *
 * Davet mantığı paylaşılan <InviteHub> bileşeninde (src/components/invite/invite-hub.tsx);
 * kurumsal /ngo-admin/community-invite sayfası da AYNI bileşeni kullanır.
 * Davet akışıyla ilgili değişiklikler InviteHub'da yapılır → iki sayfayı da kapsar.
 */

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/firebase';
import { InviteHub } from '@/components/invite/invite-hub';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';

const buildInviteText = (link: string) =>
    `Bugün hiçbir ekstra ödeme yapmadan bağış yaptım. Aynısını sen de yapabilirsin. Gel birlikte büyütelim: ${link}`;

export default function InvitePage() {
    const router = useRouter();
    const { user: authUser, isUserLoading } = useUser();
    const [inviteLink, setInviteLink] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined' && authUser?.uid) {
            // Kayıt akışını başlatan login/selection (referral).
            setInviteLink(`${window.location.origin}/login/selection?ref=${authUser.uid}`);
        }
    }, [authUser?.uid]);

    const inviteMessage = useMemo(() => buildInviteText(inviteLink), [inviteLink]);

    if (isUserLoading) {
        return (
            <div className="flex items-center justify-center min-h-dvh">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Giriş yapılmadan davet linki üretilemez → boş input + sonsuz "hazırlanıyor"
    // yerine net bir giriş çağrısı göster.
    if (!authUser) {
        return (
            <div className="min-h-dvh bg-background flex items-center justify-center px-4">
                <div className="w-full max-w-sm text-center space-y-5 animate-in fade-in-0 duration-300">
                    <span className="inline-flex h-[76px] w-[76px] items-center justify-center rounded-[24px] bg-gradient-to-br from-primary to-[#ff7a55] shadow-[0_10px_30px_-8px_rgba(243,71,35,0.5)]">
                        <Gift className="h-9 w-9 text-white" strokeWidth={1.8} />
                    </span>
                    <div className="space-y-2">
                        <h1 className="text-[24px] font-bold tracking-tight text-foreground leading-tight">Arkadaşlarını davet et</h1>
                        <p className="text-[15px] text-muted-foreground leading-relaxed">
                            Kişisel davet linkini oluşturmak için önce hangel hesabına giriş yap. Birlikte umudu büyütelim.
                        </p>
                    </div>
                    <Button
                        onClick={() => router.push('/login/selection')}
                        className="w-full h-12 rounded-2xl text-[15px] font-semibold shadow-sm active:scale-[0.98] transition"
                    >
                        <LogIn className="mr-2 h-[18px] w-[18px]" /> Giriş Yap
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <InviteHub
            inviteLink={inviteLink}
            inviteMessage={inviteMessage}
            heroTitle="İyiliği Paylaş, Birlikte Büyüyelim"
            heroSubtitle="Arkadaşlarını hangel'a davet et, hem sen hem de onlar kazansın."
            recordExtra={{ kind: 'friend' }}
        />
    );
}
