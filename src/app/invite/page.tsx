'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import {
    Mail,
    Send,
    MessageSquare,
    Copy,
    Star,
    Twitter,
    Linkedin,
    Gift,
    Smartphone,
    Contact,
    ArrowDownUp,
    Loader2,
    Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface PhoneContact {
    id: string;
    name: string;
    phones: string[];
    avatarUrl?: string;
    onPlatform?: boolean;
    impactScore?: number;
    joinDate?: string;
}

async function getCapacitorContacts(): Promise<PhoneContact[]> {
    try {
        const { Contacts, 'PhoneType': PhoneType } = await import('@capacitor-community/contacts') as any;

        const { contacts } = await Contacts.getContacts({
            projection: {
                name: true,
                phones: true,
                image: false,
            },
        });

        return (contacts as any[])
            .filter((c: any) => c.name?.display)
            .map((c: any) => ({
                id: c.contactId || String(Math.random()),
                name: c.name.display,
                phones: (c.phones || []).map((p: any) => p.number).filter(Boolean),
                onPlatform: false,
            }));
    } catch {
        return [];
    }
}

export default function InvitePage() {
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const db = useFirestore();
    const [inviteLink, setInviteLink] = useState('');
    const [sortCriteria, setSortCriteria] = useState('impactScore');

    // Phone contacts state
    const [phoneContacts, setPhoneContacts] = useState<PhoneContact[]>([]);
    const [phoneLoading, setPhoneLoading] = useState(false);
    const [phoneSynced, setPhoneSynced] = useState(false);

    // Firestore users
    const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
    const { data: allUsers } = useCollection(usersRef);

    useEffect(() => {
        if (typeof window !== 'undefined' && authUser?.uid) {
            setInviteLink(`${window.location.origin}/register?ref=${authUser.uid}`);
        }
    }, [authUser?.uid]);

    const copyToClipboard = () => {
        if (!inviteLink) return;
        navigator.clipboard.writeText(inviteLink);
        toast({ title: 'Davet linki kopyalandı!' });
    };

    const handleInvite = async (name: string, phone?: string) => {
        if (phone && inviteLink) {
            const msg = encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`);
            window.open(`sms:${phone}?&body=${msg}`, '_blank');
        }

        // Track invite in Firestore
        if (authUser?.uid) {
            try {
                // Save invite record to 'invites' collection
                await addDoc(collection(db, 'invites'), {
                    senderId: authUser.uid,
                    recipientName: name,
                    recipientPhone: phone || null,
                    sentAt: serverTimestamp(),
                    status: 'sent',
                });

                // Update user's invite count and impact score
                const userRef = doc(db, 'users', authUser.uid);
                await updateDoc(userRef, {
                    inviteCount: increment(1),
                    impactScore: increment(100),
                });
            } catch (error) {
                console.error('Failed to track invite:', error);
            }
        }

        toast({
            title: 'Davet Gönderildi! +100 Puan',
            description: `${name} kişisine davet gönderildi. Sosyal Etki Puanına 100 puan eklendi.`,
        });
    };

    const handlePhoneSync = async () => {
        setPhoneLoading(true);
        try {
            const contacts = await getCapacitorContacts();
            if (contacts.length === 0) {
                toast({
                    variant: 'destructive',
                    title: 'Rehbere erişilemedi',
                    description: 'Uygulama ayarlarından rehber iznini etkinleştirin.',
                });
                return;
            }

            // Firestore'daki kullanıcılarla eşleştir
            const firestorePhones = new Set(
                (allUsers || []).flatMap((u: any) => [u.phoneNumber, u.personalInfo?.phone].filter(Boolean))
            );

            const enriched = contacts.map(c => ({
                ...c,
                onPlatform: c.phones.some(p => firestorePhones.has(p.replace(/\s/g, ''))),
            }));

            setPhoneContacts(enriched);
            setPhoneSynced(true);
            toast({
                title: 'Rehber Senkronize Edildi',
                description: `${enriched.length} kişi yüklendi.`,
            });
        } finally {
            setPhoneLoading(false);
        }
    };

    const shareOptions = [
        { name: 'WhatsApp', icon: MessageSquare, href: `https://wa.me/?text=${encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`)}` },
        { name: 'SMS', icon: Smartphone, href: `sms:?&body=${encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`)}` },
        { name: 'Telegram', icon: Send, href: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent("Seni de hangel'a bekliyorum!")}` },
        { name: 'E-posta', icon: Mail, href: `mailto:?body=${encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`)}` },
        { name: 'X (Twitter)', icon: Twitter, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`)}` },
        { name: 'LinkedIn', icon: Linkedin, href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(inviteLink)}&title=${encodeURIComponent("Seni de hangel'a bekliyorum!")}` },
    ];

    // Firestore users list
    const firestoreContacts = useMemo(() => {
        return (allUsers || []).map((user: any) => ({
            id: user.id,
            name: user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
            phones: [],
            onPlatform: true,
            avatarUrl: user.photoURL || undefined,
            impactScore: user.impactScore || 0,
            joinDate: user.createdAt || new Date().toISOString(),
        }));
    }, [allUsers]);

    const sortedFirestoreContacts = useMemo(() => {
        let sorted = [...firestoreContacts];
        switch (sortCriteria) {
            case 'impactScore': sorted.sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0)); break;
            case 'alphabetical': sorted.sort((a, b) => a.name.localeCompare(b.name, 'tr')); break;
            case 'joinDate': sorted.sort((a, b) => new Date(b.joinDate!).getTime() - new Date(a.joinDate!).getTime()); break;
        }
        return sorted;
    }, [firestoreContacts, sortCriteria]);

    const sortedPhoneContacts = useMemo(() => {
        const onPlatform = phoneContacts.filter(c => c.onPlatform);
        const offPlatform = phoneContacts.filter(c => !c.onPlatform);
        const sorted = [...onPlatform, ...offPlatform];
        if (sortCriteria === 'alphabetical') sorted.sort((a, b) => a.name.localeCompare(b.name, 'tr'));
        return sorted;
    }, [phoneContacts, sortCriteria]);

    const ContactCard = ({ contact }: { contact: PhoneContact }) => (
        <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
            <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={contact.avatarUrl} />
                    <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-medium text-sm">{contact.name}</p>
                    {contact.onPlatform && contact.impactScore ? (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Star className="h-3 w-3 text-primary" />
                            {contact.impactScore.toLocaleString('tr-TR')} Puan
                        </p>
                    ) : contact.phones[0] ? (
                        <p className="text-xs text-muted-foreground">{contact.phones[0]}</p>
                    ) : null}
                </div>
            </div>
            {contact.onPlatform ? (
                <Badge variant="secondary" className="font-normal">hangel'da</Badge>
            ) : (
                <Button size="sm" onClick={() => handleInvite(contact.name, contact.phones[0])}>
                    Davet Et
                </Button>
            )}
        </div>
    );

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
            <div className="text-center space-y-2">
                <div className="inline-block bg-primary/10 p-4 rounded-full">
                    <Gift className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold font-headline">İyiliği Paylaş, Birlikte Büyüyelim</h1>
                <p className="text-muted-foreground max-w-md mx-auto">
                    Arkadaşlarını hangel'a davet et, hem sen hem de onlar kazansın.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Davet Linkin</CardTitle>
                    <CardDescription>Kişisel linkini kopyalayarak veya aşağıdaki butonlarla paylaş.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative flex w-full items-center">
                        <Input
                            value={inviteLink}
                            readOnly
                            className="h-12 pr-12 text-sm text-muted-foreground bg-muted border-dashed"
                        />
                        <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={copyToClipboard}
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9"
                        >
                            <Copy className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {shareOptions.map(option => (
                            <Button key={option.name} asChild variant="outline" className="h-12">
                                <a href={option.href} target="_blank" rel="noopener noreferrer">
                                    <option.icon className="mr-2 h-5 w-5" /> {option.name}
                                </a>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Arkadaşlarını Bul</CardTitle>
                    <CardDescription>Rehberini bağlayarak hangi arkadaşlarının hangel'da olduğunu gör.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="phone" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="phone">
                                <Contact className="mr-2 h-4 w-4" /> Telefon Rehberi
                            </TabsTrigger>
                            <TabsTrigger value="platform">
                                <Users className="mr-2 h-4 w-4" /> Platformdaki Kişiler
                            </TabsTrigger>
                        </TabsList>

                        {/* Telefon Rehberi */}
                        <TabsContent value="phone" className="mt-4">
                            {!phoneSynced ? (
                                <div className="text-center space-y-4 py-6">
                                    <div className="inline-block bg-primary/10 p-4 rounded-full">
                                        <Contact className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">Rehberine Erişim Ver</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Hangel, rehberini yalnızca arkadaşlarını bulmak için kullanır.
                                            Hiçbir kişi bilgisi sunucularımızda saklanmaz.
                                        </p>
                                    </div>
                                    <Button onClick={handlePhoneSync} disabled={phoneLoading} className="w-full">
                                        {phoneLoading
                                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yükleniyor...</>
                                            : <><Contact className="mr-2 h-4 w-4" /> Rehberimi Bağla</>
                                        }
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <p className="text-sm text-muted-foreground">
                                            {phoneContacts.filter(c => c.onPlatform).length} kişi hangel'da •{' '}
                                            {phoneContacts.filter(c => !c.onPlatform).length} kişi davet bekliyor
                                        </p>
                                        <div className="flex gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="outline" size="icon" className="h-9 w-9">
                                                        <ArrowDownUp className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => setSortCriteria('alphabetical')}>Alfabetik (A-Z)</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setSortCriteria('impactScore')}>Etki Puanı</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <Button variant="ghost" size="sm" onClick={() => { setPhoneSynced(false); setPhoneContacts([]); }}>
                                                Yenile
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-3 max-h-80 overflow-y-auto">
                                        {sortedPhoneContacts.length === 0 ? (
                                            <p className="text-center text-muted-foreground text-sm py-8">Rehberinde kişi bulunamadı.</p>
                                        ) : sortedPhoneContacts.map(c => (
                                            <ContactCard key={c.id} contact={c} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* Platformdaki Kişiler */}
                        <TabsContent value="platform" className="mt-4">
                            <div className="space-y-4">
                                <div className="flex justify-end">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="icon" className="h-9 w-9">
                                                <ArrowDownUp className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setSortCriteria('impactScore')}>Etki Puanı (En Yüksek)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortCriteria('alphabetical')}>Alfabetik (A-Z)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setSortCriteria('joinDate')}>Katılım Tarihi</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <div className="space-y-3 max-h-80 overflow-y-auto">
                                    {sortedFirestoreContacts.length === 0 ? (
                                        <p className="text-center text-muted-foreground text-sm py-8">Henüz kimse yok.</p>
                                    ) : sortedFirestoreContacts.map(c => (
                                        <ContactCard key={c.id} contact={c} />
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <Card className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <Star className="h-5 w-5" /> Kazanç Programı
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-amber-900 dark:text-amber-300/80">
                    <div className="flex items-start gap-3">
                        <div className="w-4 h-4 mt-1 rounded-full bg-amber-500 flex-shrink-0" />
                        <p>Davet linkinle üye olan her arkadaşın için <strong>100 Sosyal Etki Puanı</strong> kazanırsın.</p>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-4 h-4 mt-1 rounded-full bg-amber-500 flex-shrink-0" />
                        <p>Arkadaşın ilk bağışını yaptığında ekstra <strong>50 Sosyal Etki Puanı</strong> daha kazanırsın!</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
