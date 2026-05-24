'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { ArrowLeft, Lock, Shield, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';

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
    const [saving, setSaving] = useState(false);

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
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('dashboard.settingsPrivacy.saveBtn')}
                </Button>
            </div>
        </div>
    );
}
