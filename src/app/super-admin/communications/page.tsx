'use client';

import React, { useState, useMemo } from 'react';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Send, Bell, History, MessageSquare, User, Building, School, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import {
    collection, doc, writeBatch, addDoc, serverTimestamp, query, orderBy, limit,
} from 'firebase/firestore';

type TargetGroup = 'all' | 'all-ngos' | 'all-clubs' | 'all-brands' | 'all-ngo-admins';

const TARGET_LABELS: Record<TargetGroup, string> = {
    'all': 'Tüm Kullanıcılar',
    'all-ngos': "Tüm STK Adminleri",
    'all-clubs': 'Tüm Kulüp Adminleri',
    'all-brands': 'Tüm Marka Adminleri',
    'all-ngo-admins': 'Tüm Kuruluş Adminleri (STK + Marka + Kulüp)',
};

export default function CommunicationsPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const { user: authUser } = useUser();

    // Tüm kullanıcılar (broadcast hedef + DM seçici için)
    const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
    const { data: allUsers, isLoading: usersLoading } = useCollection<any>(usersQuery);

    // Geçmiş bildirimler — Trafik İzleme
    const sentNotifsQuery = useMemoFirebase(() =>
        query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(100)),
        [db]);
    const { data: sentNotifs } = useCollection<any>(sentNotifsQuery);

    // Broadcast state
    const [target, setTarget] = useState<TargetGroup | ''>('');
    const [bcTitle, setBcTitle] = useState('');
    const [bcBody, setBcBody] = useState('');
    const [bcSending, setBcSending] = useState(false);

    // DM state
    const [recipientType, setRecipientType] = useState<'user' | 'ngo' | 'club' | ''>('');
    const [entitySearchTerm, setEntitySearchTerm] = useState('');
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [dmSubject, setDmSubject] = useState('');
    const [dmBody, setDmBody] = useState('');
    const [dmSending, setDmSending] = useState(false);

    // İzleme arama
    const [logSearchTerm, setLogSearchTerm] = useState('');

    // Hedef gruba göre kullanıcıları filtrele (broadcast)
    const targetUsers = useMemo(() => {
        if (!allUsers || !target) return [];
        switch (target) {
            case 'all':
                return allUsers;
            case 'all-ngos':
                return allUsers.filter(u => u.role === 'ngo-admin' && u.managedNgoId);
            case 'all-clubs':
                return allUsers.filter(u => u.managedClubId);
            case 'all-brands':
                return allUsers.filter(u => u.managedBrandId);
            case 'all-ngo-admins':
                return allUsers.filter(u =>
                    u.role === 'ngo-admin' || u.managedNgoId || u.managedClubId || u.managedBrandId,
                );
            default:
                return [];
        }
    }, [allUsers, target]);

    // DM için arama sonuçları
    const filteredEntities = useMemo(() => {
        const q = entitySearchTerm.toLowerCase();
        if (recipientType === 'user') {
            return (allUsers || []).filter(u =>
                (u.name || '').toLowerCase().includes(q) ||
                (u.username || '').toLowerCase().includes(q) ||
                (u.personalInfo?.email || '').toLowerCase().includes(q) ||
                (u.personalInfo?.phone || '').includes(entitySearchTerm),
            ).slice(0, 50).map(u => ({
                id: u.id,
                name: u.name || u.username || 'Kullanıcı',
                sub: u.username || u.personalInfo?.email || '',
                phone: u.personalInfo?.phone || '',
                avatar: u.avatarUrl,
                icon: User,
            }));
        }
        if (recipientType === 'ngo') {
            return (allUsers || []).filter(u =>
                (u.role === 'ngo-admin' || u.managedNgoId) &&
                ((u.name || '').toLowerCase().includes(q)),
            ).slice(0, 50).map(u => ({
                id: u.id,
                name: u.name || 'STK Admin',
                sub: 'STK Yöneticisi',
                phone: '',
                avatar: u.avatarUrl,
                icon: Building,
            }));
        }
        if (recipientType === 'club') {
            return (allUsers || []).filter(u =>
                u.managedClubId && (u.name || '').toLowerCase().includes(q),
            ).slice(0, 50).map(u => ({
                id: u.id,
                name: u.name || 'Kulüp Admin',
                sub: 'Kulüp Yöneticisi',
                phone: '',
                avatar: u.avatarUrl,
                icon: School,
            }));
        }
        return [];
    }, [recipientType, entitySearchTerm, allUsers]);

    const handleBroadcast = async () => {
        if (!target) {
            toast({ variant: 'destructive', title: 'Hedef seç', description: 'Hedef grup seçin.' });
            return;
        }
        if (!bcTitle.trim() || !bcBody.trim()) {
            toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'Başlık ve mesaj gerekli.' });
            return;
        }
        if (targetUsers.length === 0) {
            toast({ variant: 'destructive', title: 'Hedef boş', description: 'Bu hedef grupta hiç kullanıcı yok.' });
            return;
        }

        setBcSending(true);
        try {
            // Batched write — Firestore 500/batch limiti, biz 450 kullanıyoruz
            const batches: any[] = [];
            let current = writeBatch(db);
            let count = 0;
            for (const u of targetUsers) {
                const notifRef = doc(collection(db, 'notifications'));
                current.set(notifRef, {
                    userId: u.id,
                    type: 'broadcast',
                    title: bcTitle.trim(),
                    body: bcBody.trim(),
                    data: { target },
                    read: false,
                    createdAt: serverTimestamp(),
                    createdBy: authUser?.uid || 'super-admin',
                });
                count += 1;
                if (count >= 450) {
                    batches.push(current);
                    current = writeBatch(db);
                    count = 0;
                }
            }
            if (count > 0) batches.push(current);
            await Promise.all(batches.map(b => b.commit()));

            toast({
                title: '✅ Duyuru Gönderildi',
                description: `${targetUsers.length} kullanıcıya bildirim ulaştırıldı.`,
            });
            setBcTitle('');
            setBcBody('');
            setTarget('');
        } catch (e: any) {
            console.error('Broadcast failed:', e);
            toast({
                variant: 'destructive',
                title: 'Gönderilemedi',
                description: e?.code === 'permission-denied'
                    ? 'Super-admin yetkisi gerekli.'
                    : (e?.message || 'Hata.'),
            });
        } finally {
            setBcSending(false);
        }
    };

    const handleSendDM = async () => {
        if (!selectedEntityId) {
            toast({ variant: 'destructive', title: 'Alıcı seç', description: 'Bir alıcı seçin.' });
            return;
        }
        if (!dmSubject.trim() || !dmBody.trim()) {
            toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'Konu ve mesaj gerekli.' });
            return;
        }

        setDmSending(true);
        try {
            await addDoc(collection(db, 'notifications'), {
                userId: selectedEntityId,
                type: 'dm',
                title: dmSubject.trim(),
                body: dmBody.trim(),
                data: { recipientType },
                read: false,
                createdAt: serverTimestamp(),
                createdBy: authUser?.uid || 'super-admin',
            });
            toast({ title: '✅ Mesaj Gönderildi', description: 'Alıcıya bildirim ulaştırıldı.' });
            setDmSubject('');
            setDmBody('');
            setSelectedEntityId(null);
            setEntitySearchTerm('');
        } catch (e: any) {
            console.error('DM failed:', e);
            toast({
                variant: 'destructive',
                title: 'Gönderilemedi',
                description: e?.code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : (e?.message || 'Hata.'),
            });
        } finally {
            setDmSending(false);
        }
    };

    // İzleme tablosu
    const filteredLog = useMemo(() => {
        const q = logSearchTerm.toLowerCase();
        return (sentNotifs || []).filter((n: any) =>
            (n.title || '').toLowerCase().includes(q) ||
            (n.body || '').toLowerCase().includes(q) ||
            (n.type || '').toLowerCase().includes(q),
        );
    }, [sentNotifs, logSearchTerm]);

    return (
        <div className="space-y-6 animate-in fade-in-0">
            <div>
                <h1 className="text-2xl font-bold font-headline">İletişim Merkezi</h1>
                <p className="text-muted-foreground text-sm">
                    Direkt mesaj, toplu bildirim ve duyuru gönderimlerinizi yönetin. Bildirimler kullanıcının
                    /notifications sayfasında ve header zil ikonunda anlık görünür.
                </p>
            </div>

            <Tabs defaultValue="broadcast">
                <TabsList className="grid w-full grid-cols-3 max-w-2xl">
                    <TabsTrigger value="broadcast"><Bell className="mr-2 h-4 w-4" /> Toplu Bildirim</TabsTrigger>
                    <TabsTrigger value="dm"><MessageSquare className="mr-2 h-4 w-4" /> Direkt Mesaj</TabsTrigger>
                    <TabsTrigger value="monitor"><History className="mr-2 h-4 w-4" /> Trafik İzleme</TabsTrigger>
                </TabsList>

                {/* TOPLU BİLDİRİM */}
                <TabsContent value="broadcast" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Yeni Toplu Duyuru Oluştur</CardTitle>
                                <CardDescription>
                                    Seçilen hedef gruptaki tüm kullanıcılara anlık in-app bildirim gönderir.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Hedef Grup</Label>
                                    <Select value={target} onValueChange={(v: TargetGroup) => setTarget(v)}>
                                        <SelectTrigger><SelectValue placeholder="Grup seçiniz..." /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(TARGET_LABELS).map(([k, v]) => (
                                                <SelectItem key={k} value={k}>{v}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {target && (
                                        <p className="text-xs text-muted-foreground">
                                            {usersLoading
                                                ? 'Eşleşen kullanıcı sayısı hesaplanıyor...'
                                                : <>
                                                    <strong>{targetUsers.length}</strong> kullanıcıya gönderilecek
                                                </>}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Duyuru Başlığı</Label>
                                    <Input
                                        placeholder="Önemli Bilgilendirme"
                                        value={bcTitle}
                                        onChange={e => setBcTitle(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mesaj İçeriği</Label>
                                    <Textarea
                                        rows={6}
                                        placeholder="Duyuru detaylarını buraya yazın..."
                                        value={bcBody}
                                        onChange={e => setBcBody(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end gap-2">
                                <Button
                                    onClick={handleBroadcast}
                                    disabled={bcSending || !target || !bcTitle.trim() || !bcBody.trim() || targetUsers.length === 0}
                                >
                                    {bcSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Duyuruyu Yayınla ({targetUsers.length})
                                </Button>
                            </CardFooter>
                        </Card>
                        <div className="space-y-6">
                            <Card className="bg-muted/30">
                                <CardHeader>
                                    <CardTitle className="text-sm">Erişim İstatistikleri</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-xs">
                                    <div className="flex justify-between">
                                        <span>Toplam Kullanıcı</span>
                                        <span className="font-bold">{(allUsers?.length || 0).toLocaleString('tr-TR')}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>STK Yöneticisi</span>
                                        <span className="font-bold">{(allUsers || []).filter(u => u.managedNgoId).length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Kulüp Yöneticisi</span>
                                        <span className="font-bold">{(allUsers || []).filter(u => u.managedClubId).length}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Marka Yöneticisi</span>
                                        <span className="font-bold">{(allUsers || []).filter(u => u.managedBrandId).length}</span>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="border-amber-200 bg-amber-50/40">
                                <CardContent className="p-4 text-xs space-y-1">
                                    <p className="font-bold text-amber-900">⚡ Anlık Yansıma</p>
                                    <p className="text-amber-800 leading-relaxed">
                                        Bildirimler Firestore'a yazılır yazılmaz kullanıcının zil ikonunda
                                        sayaç artar ve /notifications sayfasında görünür. SMS/e-posta
                                        gönderimi için ayrıca Cloud Function gerekir.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* DİREKT MESAJ */}
                <TabsContent value="dm" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bireysel Direkt Mesaj</CardTitle>
                            <CardDescription>
                                Belirli bir kullanıcıya, STK / kulüp / marka yöneticisine direkt bildirim gönderin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Alıcı Türü</Label>
                                    <Select
                                        value={recipientType}
                                        onValueChange={(v: any) => {
                                            setRecipientType(v);
                                            setSelectedEntityId(null);
                                            setEntitySearchTerm('');
                                        }}
                                    >
                                        <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">Kullanıcı</SelectItem>
                                            <SelectItem value="ngo">STK Yöneticisi</SelectItem>
                                            <SelectItem value="club">Kulüp Yöneticisi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {recipientType && (
                                    <div className="space-y-2 p-3 border rounded-xl bg-muted/20">
                                        <Label>Alıcı Ara</Label>
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder={recipientType === 'user' ? 'İsim, e-posta, telefon...' : 'İsim ile ara...'}
                                                className="pl-8"
                                                value={entitySearchTerm}
                                                onChange={(e) => setEntitySearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                            {filteredEntities.length > 0 ? filteredEntities.map(entity => {
                                                const Icon = entity.icon;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={entity.id}
                                                        onClick={() => setSelectedEntityId(entity.id)}
                                                        className={cn(
                                                            'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border text-left',
                                                            selectedEntityId === entity.id
                                                                ? 'bg-primary/10 border-primary'
                                                                : 'hover:bg-accent border-transparent',
                                                        )}
                                                    >
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={entity.avatar} />
                                                            <AvatarFallback>{(entity.name || '?')[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{entity.name}</p>
                                                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                                                                <Icon className="h-2.5 w-2.5" />
                                                                {entity.sub} {entity.phone && `• ${entity.phone}`}
                                                            </p>
                                                        </div>
                                                        {selectedEntityId === entity.id && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                                                    </button>
                                                );
                                            }) : (
                                                <p className="text-center py-4 text-xs text-muted-foreground">
                                                    Eşleşen alıcı bulunamadı.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Mesaj Konusu</Label>
                                    <Input
                                        placeholder="Resmi Bilgilendirme"
                                        value={dmSubject}
                                        onChange={e => setDmSubject(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mesaj İçeriği</Label>
                                    <Textarea
                                        rows={5}
                                        placeholder="İletmek istediğiniz mesajı yazın..."
                                        value={dmBody}
                                        onChange={e => setDmBody(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    disabled={dmSending || !selectedEntityId || !dmSubject.trim() || !dmBody.trim()}
                                    onClick={handleSendDM}
                                >
                                    {dmSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    Mesajı Gönder
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TRAFİK İZLEME */}
                <TabsContent value="monitor" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bildirim Trafiği</CardTitle>
                            <CardDescription>Son 100 bildirim — tip, başlık, alıcı, tarih.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Başlık, mesaj veya tip ile ara..."
                                    className="pl-10 h-10"
                                    value={logSearchTerm}
                                    onChange={(e) => setLogSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="border rounded-xl overflow-hidden divide-y">
                                {filteredLog.length === 0 ? (
                                    <div className="py-12 text-center text-muted-foreground">
                                        <Bell className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                        <p>Bildirim yok.</p>
                                    </div>
                                ) : filteredLog.slice(0, 50).map((n: any) => (
                                    <div key={n.id} className="p-3 flex items-start justify-between gap-3 hover:bg-muted/30">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold text-sm truncate">{n.title}</p>
                                                <Badge variant="outline" className="text-[9px] uppercase">{n.type || 'mesaj'}</Badge>
                                                {n.read && <Badge variant="secondary" className="text-[9px]">okundu</Badge>}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{n.body}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                {n.userId?.slice(0, 8)}… · {n.createdAt?.toDate
                                                    ? n.createdAt.toDate().toLocaleString('tr-TR')
                                                    : '—'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
