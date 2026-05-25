'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, UserPlus, ShieldCheck, Info, CheckCircle, XCircle, Loader2, Search } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { countryPhoneCodes } from '@/lib/data';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { COLLECTIONS } from '@/firebase/collections';
import { AdminList } from '@/app/ngo-admin/users/_components/admin-list';

const roles = [
    { id: 'Genel Yönetici', label: 'Genel Yönetici', description: 'Tüm yetkilere sahiptir. Profil, finans, gönüllü ve içerik yönetimini tam yetkiyle gerçekleştirebilir.' },
    { id: 'Finans Yöneticisi', label: 'Finans Yöneticisi', description: 'Sadece bağış takibi, finansal raporlar ve şeffaflık endeksi belgelerini yönetebilir.' },
    { id: 'Gönüllü Yöneticisi', label: 'Gönüllü Yöneticisi', description: 'Gönüllülük ilanları oluşturabilir, başvuruları değerlendirebilir ve gönüllü istatistiklerini görebilir.' },
    { id: 'Mini Blog Yöneticisi', label: 'Mini Blog Yöneticisi', description: 'Gönderi paylaşabilir, web sitesi ayarlarını düzenleyebilir ve içerik stratejisini yönetebilir.' },
];

const normalizePhone = (raw: string): string => raw.replace(/[^0-9]/g, '');

interface UserInfo {
  id: string;
  name?: string;
  displayName?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  phoneNumber?: string;
  phone?: string;
  personalInfo?: {
    phone?: string;
    email?: string;
  };
}

export default function NewUserPage() {
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const db = useFirestore();
    const { user: authUser } = useUser();

    const [phoneCode, setPhoneCode] = useState('90');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('Genel Yönetici');
    const [isSending, setIsSending] = useState(false);

    const ngoId = searchParams.get('id') || authUser?.uid || null;

    // Tüm üyeleri çek (telefon eşleştirmesi için)
    const usersQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.users) : null), [db]);
    const { data: allUsers, isLoading: usersLoading } = useCollection<UserInfo>(usersQuery);

    const normalizedSearch = normalizePhone(phone);
    const matchedUser = useMemo(() => {
        if (!allUsers || normalizedSearch.length < 3) return null;
        return allUsers.find(u => {
            const candidates = ([
                u.personalInfo?.phone,
                u.phoneNumber,
                u.phone,
            ].filter(Boolean) as string[]).map(normalizePhone);
            return candidates.some(c => c.endsWith(normalizedSearch) || normalizedSearch.endsWith(c));
        }) || null;
    }, [allUsers, normalizedSearch]);

    const selectedRoleInfo = roles.find(r => r.id === role);
    const canSend = !!matchedUser && !isSending && matchedUser.id !== authUser?.uid;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!ngoId) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Kuruluş bilgisi alınamadı.' });
            return;
        }
        if (!matchedUser) {
            toast({
                variant: 'destructive',
                title: 'Üye bulunamadı',
                description: 'Bu telefon numarasıyla kayıtlı bir hangel üyesi bulunmadı. Davet sadece mevcut üyelere gönderilebilir.',
            });
            return;
        }
        if (matchedUser.id === authUser?.uid) {
            toast({ variant: 'destructive', title: 'Geçersiz', description: 'Kendinize davet gönderemezsiniz.' });
            return;
        }

        setIsSending(true);
        try {
            // Kuruluş türünü ve adını bul (NGO / Brand / Student Club)
            let entityName = 'Kuruluş';
            let entityKind: 'STK' | 'Marka' | 'Öğrenci Kulübü' | 'Kuruluş' = 'Kuruluş';
            let entityKindAccusative = 'kuruluşu'; // "...yönetmek üzere"

            try {
                const ngoSnap = await getDoc(doc(db, COLLECTIONS.ngos, ngoId));
                if (ngoSnap.exists()) {
                    entityName = (ngoSnap.data() as { name?: string }).name || 'STK';
                    entityKind = 'STK';
                    entityKindAccusative = "STK'yı";
                } else {
                    const brandSnap = await getDoc(doc(db, COLLECTIONS.brands, ngoId));
                    if (brandSnap.exists()) {
                        entityName = (brandSnap.data() as { name?: string }).name || 'Marka';
                        entityKind = 'Marka';
                        entityKindAccusative = 'markayı';
                    } else {
                        const clubSnap = await getDoc(doc(db, COLLECTIONS.studentClubs, ngoId));
                        if (clubSnap.exists()) {
                            entityName = (clubSnap.data() as { name?: string }).name || 'Öğrenci Kulübü';
                            entityKind = 'Öğrenci Kulübü';
                            entityKindAccusative = 'öğrenci kulübünü';
                        }
                    }
                }
            } catch {}

            // Rol kısa ad eşlemesi (mesaj için)
            const roleShort: Record<string, string> = {
                'Genel Yönetici': 'genel yönetici',
                'Finans Yöneticisi': 'Finans Yöneticisi',
                'Gönüllü Yöneticisi': 'Gönüllü Yöneticisi',
                'Mini Blog Yöneticisi': 'İçerik Yöneticisi',
            };
            const rolePhrase = roleShort[role] || role;

            const invitationMessage = `Sizi ${entityName} ${entityKindAccusative} ${rolePhrase} olarak yönetmek üzere davet edildiniz.`;

            // 1. Davet kaydı
            const invitationRef = await addDoc(collection(db, COLLECTIONS.userInvitations), {
                ngoId,
                entityKind,
                entityName,
                inviteeUserId: matchedUser.id,
                inviteeName: matchedUser.name || matchedUser.displayName || '',
                inviteePhone: normalizedSearch,
                inviteeEmail: matchedUser.personalInfo?.email || null,
                role,
                status: 'pending',
                invitedBy: authUser?.uid || null,
                invitedAt: serverTimestamp(),
                message: invitationMessage,
            });

            // 2. Uygulama içi bildirim
            try {
                await addDoc(collection(db, COLLECTIONS.notifications), {
                    userId: matchedUser.id,
                    type: 'invitation',
                    title: `🤝 ${entityName} Yetkili Daveti`,
                    body: invitationMessage,
                    data: {
                        invitationId: invitationRef.id,
                        ngoId,
                        entityName,
                        entityKind,
                        role,
                    },
                    read: false,
                    createdAt: serverTimestamp(),
                    createdBy: authUser?.uid || null,
                });
            } catch (notifErr) {
                console.warn('Bildirim oluşturulamadı (rules?):', notifErr);
            }

            // 3. Mail kuyruğu (sunucu tarafı/Cloud Function tarafından işlenecek)
            const inviteeEmail = matchedUser.personalInfo?.email;
            if (inviteeEmail) {
                try {
                    await addDoc(collection(db, COLLECTIONS.mailQueue), {
                        to: inviteeEmail,
                        toName: matchedUser.name || '',
                        subject: `${entityName} - Yetkili Daveti`,
                        body: invitationMessage,
                        template: 'invitation',
                        templateData: {
                            recipientName: matchedUser.name || 'Sayın üye',
                            entityName,
                            entityKind,
                            role: rolePhrase,
                            invitationId: invitationRef.id,
                        },
                        status: 'pending',
                        createdAt: serverTimestamp(),
                        createdBy: authUser?.uid || null,
                    });
                } catch (mailErr) {
                    console.warn('Mail kuyruğu yazılamadı:', mailErr);
                }
            }

            toast({
                title: 'Davet Gönderildi',
                description: `${matchedUser.name || 'Üye'} kişisine bildirim ve e-posta gönderildi.`,
            });
            router.push('/ngo-admin/users');
        } catch (err) {
            console.error('Invitation failed:', err);
            const e = err as { code?: string; message?: string };
            toast({
                variant: 'destructive',
                title: 'Davet gönderilemedi',
                description: e?.code === 'permission-denied'
                    ? 'Bu işlem için yeterli yetkiniz yok.'
                    : (e?.message || 'Bilinmeyen bir hata oluştu.'),
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in-0">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-bold font-headline">Yetkili Yönetimi</h1>
            </div>

            <AdminList />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Yetkili Davet Formu
                    </CardTitle>
                    <CardDescription>
                        Sadece mevcut hangel üyelerine yetki daveti gönderebilirsiniz. Davet edilecek kişinin telefon numarasını girin; eşleşen üyenin bilgileri otomatik gelir.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form id="add-user-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefon Numarası</Label>
                            <div className="flex gap-2">
                                <div className="w-[100px] shrink-0">
                                    <Select value={phoneCode} onValueChange={setPhoneCode}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {[...new Set(countryPhoneCodes)].map(code => (
                                                <SelectItem key={code} value={code}>+{code}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="5XX XXX XX XX"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">En az 3 hane girin. Eşleşen üye otomatik bulunur.</p>
                        </div>

                        {/* Eşleşme durumu */}
                        {usersLoading && normalizedSearch.length >= 3 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border rounded-lg">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Üye listesi yükleniyor...
                            </div>
                        )}

                        {!usersLoading && normalizedSearch.length >= 3 && matchedUser && (
                            <div className="flex items-center gap-3 p-3 border-2 border-green-500/30 bg-green-500/5 rounded-lg">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={matchedUser.avatarUrl} />
                                    <AvatarFallback>{(matchedUser.name || 'U').charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-sm">{matchedUser.name || matchedUser.displayName || 'Üye'}</p>
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {matchedUser.personalInfo?.email || matchedUser.email || ''}
                                        {matchedUser.username && ` • ${matchedUser.username}`}
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-100 px-2 py-1 rounded">
                                    Üye
                                </span>
                            </div>
                        )}

                        {!usersLoading && normalizedSearch.length >= 3 && !matchedUser && (
                            <Alert variant="destructive">
                                <XCircle className="h-4 w-4" />
                                <AlertTitle>Üye bulunamadı</AlertTitle>
                                <AlertDescription>
                                    Bu telefon numarasıyla kayıtlı bir hangel üyesi yok. Davet gönderebilmek için kişinin önce platforma kayıt olması gerekir.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="role">Verilecek Rol</Label>
                            <Select value={role} onValueChange={setRole}>
                                <SelectTrigger id="role"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedRoleInfo && (
                            <Alert className="bg-primary/5 border-primary/20">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                                <AlertTitle className="text-sm font-bold">Yetki Kapsamı: {selectedRoleInfo.label}</AlertTitle>
                                <AlertDescription className="text-xs text-muted-foreground mt-1">
                                    {selectedRoleInfo.description}
                                </AlertDescription>
                            </Alert>
                        )}
                    </form>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 border-t pt-6 bg-muted/10">
                    <Button variant="outline" onClick={() => router.back()}>İptal</Button>
                    <Button type="submit" form="add-user-form" disabled={!canSend}>
                        {isSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gönderiliyor...</> : 'Davet Gönder'}
                    </Button>
                </CardFooter>
            </Card>

            <div className="p-4 bg-muted/30 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                    Davet edilen üyeye uygulama içi bildirim gönderilir. Kullanıcı daveti onayladığında ilgili rol kuruluşunuzda aktif hale gelir.
                </p>
            </div>
        </div>
    );
}
