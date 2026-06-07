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

const buildInviteText = (link: string) =>
    `Bugün hiçbir ekstra ödeme yapmadan bağış yaptım. Aynısını sen de yapabilirsin. Gel birlikte büyütelim: ${link}`;

export default function InvitePage() {
    const { user: authUser } = useUser();
    const [inviteLink, setInviteLink] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined' && authUser?.uid) {
            // Kayıt akışını başlatan login/selection (referral).
            setInviteLink(`${window.location.origin}/login/selection?ref=${authUser.uid}`);
        }
    }, [authUser?.uid]);

    const inviteMessage = useMemo(() => buildInviteText(inviteLink), [inviteLink]);

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
