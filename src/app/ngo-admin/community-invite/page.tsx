'use client';

/**
 * /ngo-admin/community-invite — Kurumsal "Topluluğunu Davet Et".
 *
 * "Profil QR Kodu" sayfasının altındaki davet sayfası. Davet mantığı kullanıcı
 * tarafındaki /invite ile AYNI paylaşılan <InviteHub> bileşeninden gelir; fark
 * sadece context: davet linki yeni kullanıcıyı aktif kuruma bağlar
 * (ref=kind:id), metin/konu kuruma göre, davet kaydı { kind:'community', entityId }.
 */

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { InviteHub } from '@/components/invite/invite-hub';
import { Card, CardContent } from '@/components/ui/card';

type EntityKind = 'ngo' | 'brand' | 'club';
interface EntityDoc { id: string; name?: string; shortLink?: string }

const KIND_LABEL: Record<EntityKind, string> = { ngo: 'Kurumunuz', brand: 'Markanız', club: 'Kulübünüz' };

export default function CommunityInvitePage() {
    const { id: entityId, kind: entityKind, isLoading } = useActiveEntity();
    const { data: activeDoc } = useActiveEntityDoc<EntityDoc>();
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') setOrigin(window.location.origin);
    }, []);

    const entityName = activeDoc?.name || (entityKind ? KIND_LABEL[entityKind as EntityKind] : 'Topluluğunuz');

    // Yeni kullanıcıyı kayıt akışında aktif kuruma bağlayan davet linki
    // (login/selection bu ref'i okuyup supportedNgos/joinedClubs/followedBrands yazar).
    const inviteLink = useMemo(() => {
        if (!origin || !entityId || !entityKind) return '';
        const ref = encodeURIComponent(`${entityKind}:${entityId}`);
        return `${origin}/login/selection?action=register&ref=${ref}`;
    }, [origin, entityId, entityKind]);

    const inviteMessage = useMemo(
        () => inviteLink
            ? `${entityName} hangel'da! Topluluğumuza katıl, birlikte daha fazla iyilik yapalım: ${inviteLink}`
            : '',
        [entityName, inviteLink],
    );

    if (isLoading) {
        return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!entityId || !entityKind) {
        return (
            <div className="p-4 sm:p-6">
                <Card>
                    <CardContent className="py-12 text-center space-y-2">
                        <Users className="h-10 w-10 text-muted-foreground mx-auto" />
                        <p className="font-semibold">Aktif kurum bulunamadı</p>
                        <p className="text-sm text-muted-foreground">Topluluğunu davet etmek için üstteki kurum seçiciden bir kurum seçin.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <InviteHub
            inviteLink={inviteLink}
            inviteMessage={inviteMessage}
            heroTitle="Topluluğunu Davet Et"
            heroSubtitle={`${entityName} topluluğunu büyüt — rehberinden, e-postandan veya WhatsApp ile davet gönder.`}
            shareSubject={`${entityName} seni hangel'a davet ediyor`}
            recordExtra={{ kind: 'community', entityId, entityKind }}
            heroIcon={Users}
        />
    );
}
