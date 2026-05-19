'use client';

import React, { useMemo, useState } from 'react';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    HandCoins, Plus, Pencil, Trash2, Loader2, Search, Calendar, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
    collection, doc, addDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { COLLECTIONS } from '@/firebase/collections';

type Fund = {
    id: string;
    name: string;
    provider: string;
    status: 'Açık' | 'Kapandı';
    deadline: string;
    areas: string[];
    description: string;
    budget: string;
    requirements: string;
    url: string;
    updatedAt?: unknown;
};

type FundFormData = Omit<Fund, 'id' | 'updatedAt'>;

const emptyForm: FundFormData = {
    name: '',
    provider: '',
    status: 'Açık',
    deadline: '',
    areas: [],
    description: '',
    budget: '',
    requirements: '',
    url: '',
};

const FundEditor = ({
    initial, onSave, trigger,
}: {
    initial?: Fund;
    onSave: (data: FundFormData, id?: string) => Promise<void>;
    trigger: React.ReactNode;
}) => {
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<FundFormData>(initial || emptyForm);
    const [areaInput, setAreaInput] = useState('');
    const [saving, setSaving] = useState(false);

    const handleOpen = (o: boolean) => {
        setOpen(o);
        if (o) {
            setData(initial || emptyForm);
            setAreaInput((initial?.areas || []).join(', '));
        }
    };

    const handleSave = async () => {
        if (!data.name.trim() || !data.provider.trim()) return;
        const areas = areaInput.split(',').map(a => a.trim()).filter(Boolean);
        setSaving(true);
        try {
            await onSave({ ...data, areas }, initial?.id);
            setOpen(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle>{initial ? 'Fonu Düzenle' : 'Yeni Fon Ekle'}</DialogTitle>
                    <DialogDescription>
                        STK'ların başvurabileceği hibe programları ve fon kaynakları.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fon Adı *</Label>
                            <Input value={data.name} onChange={e => setData({ ...data, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Fon Sağlayıcı *</Label>
                            <Input value={data.provider} onChange={e => setData({ ...data, provider: e.target.value })} placeholder="Avrupa Birliği, Sabancı Vakfı vb." />
                        </div>
                        <div className="space-y-2">
                            <Label>Durum</Label>
                            <Select value={data.status} onValueChange={(v) => setData({ ...data, status: v as 'Açık' | 'Kapandı' })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Açık">Açık</SelectItem>
                                    <SelectItem value="Kapandı">Kapandı</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Son Başvuru Tarihi</Label>
                            <Input type="date" value={data.deadline} onChange={e => setData({ ...data, deadline: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Bütçe Aralığı</Label>
                            <Input value={data.budget} onChange={e => setData({ ...data, budget: e.target.value })} placeholder="60.000 € - 150.000 €" />
                        </div>
                        <div className="space-y-2">
                            <Label>Web URL</Label>
                            <Input type="url" value={data.url} onChange={e => setData({ ...data, url: e.target.value })} placeholder="https://..." />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Faaliyet Alanları (virgülle ayrılmış)</Label>
                        <Input
                            value={areaInput}
                            onChange={e => setAreaInput(e.target.value)}
                            placeholder="Eğitim, Sağlık, Çevre"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Örnek: <code>İnsan Hakları, Çevre, Gençlik</code>
                        </p>
                    </div>
                    <div className="space-y-2">
                        <Label>Açıklama</Label>
                        <Textarea
                            value={data.description}
                            onChange={e => setData({ ...data, description: e.target.value })}
                            rows={4}
                            placeholder="Fonun amacı, kapsamı ve odak noktaları..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Başvuru Şartları</Label>
                        <Textarea
                            value={data.requirements}
                            onChange={e => setData({ ...data, requirements: e.target.value })}
                            rows={3}
                            placeholder="En az 3 yıldır aktif olan dernek ve vakıflar..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
                    <Button onClick={handleSave} disabled={saving || !data.name.trim() || !data.provider.trim()}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {initial ? 'Kaydet' : 'Fon Oluştur'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function FundsAdminPage() {
    const db = useFirestore();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Açık' | 'Kapandı'>('all');

    const fundsQuery = useMemoFirebase(
        () => (db ? query(collection(db, COLLECTIONS.funds), orderBy('deadline', 'asc')) : null),
        [db],
    );
    const { data: funds, isLoading } = useCollection<Fund>(fundsQuery);

    const filtered = useMemo(() => {
        let list = funds || [];
        if (statusFilter !== 'all') list = list.filter(f => f.status === statusFilter);
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(f =>
                f.name.toLowerCase().includes(q) ||
                f.provider.toLowerCase().includes(q) ||
                (f.areas || []).some(a => a.toLowerCase().includes(q)),
            );
        }
        return list;
    }, [funds, searchTerm, statusFilter]);

    const stats = useMemo(() => ({
        total: (funds || []).length,
        open: (funds || []).filter(f => f.status === 'Açık').length,
        closed: (funds || []).filter(f => f.status === 'Kapandı').length,
    }), [funds]);

    const handleSave = async (data: FundFormData, id?: string) => {
        try {
            if (id) {
                await updateDoc(doc(db, COLLECTIONS.funds, id), { ...data, updatedAt: serverTimestamp() });
                toast({ title: 'Kaydedildi', description: `"${data.name}" güncellendi.` });
            } else {
                await addDoc(collection(db, COLLECTIONS.funds), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
                toast({ title: 'Oluşturuldu', description: `"${data.name}" yayına alındı.` });
            }
        } catch (e) {
            const code = (e as { code?: string } | null)?.code;
            const message = e instanceof Error ? e.message : 'Hata.';
            toast({
                variant: 'destructive',
                title: 'Hata',
                description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : message,
            });
            throw e;
        }
    };

    const handleDelete = async (fund: Fund) => {
        try {
            await deleteDoc(doc(db, COLLECTIONS.funds, fund.id));
            toast({ variant: 'destructive', title: 'Silindi', description: `"${fund.name}" kaldırıldı.` });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Silinemedi.';
            toast({ variant: 'destructive', title: 'Silinemedi', description: message });
        }
    };

    const fmtDate = (s: string) => {
        if (!s) return '—';
        try { return format(new Date(s), 'd MMM yyyy', { locale: tr }); } catch { return s; }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in-0">
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Fon Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">
                        STK'ların başvurabileceği hibe programları ve fon kaynaklarını yönetin.
                        Buradaki içerik <code>/ngo-admin/funds</code> sayfasında görüntülenir.
                    </p>
                </div>
                <FundEditor
                    onSave={handleSave}
                    trigger={<Button className="rounded-xl"><Plus className="h-4 w-4 mr-2" /> Yeni Fon Ekle</Button>}
                />
            </div>

            {/* Stat kartları */}
            <div className="grid grid-cols-3 gap-3">
                <Card className="rounded-2xl">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black">{stats.total}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Toplam Fon</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-green-300/50">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black text-green-600">{stats.open}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Açık</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black text-muted-foreground">{stats.closed}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Kapandı</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtre & arama */}
            <Card className="rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Fon adı, sağlayıcı, alan..."
                            className="pl-10 h-10 rounded-xl"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'Açık' | 'Kapandı')}>
                        <SelectTrigger className="h-10 w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tüm Durumlar</SelectItem>
                            <SelectItem value="Açık">Açık</SelectItem>
                            <SelectItem value="Kapandı">Kapandı</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground ml-auto">
                        <strong>{filtered.length}</strong> fon gösteriliyor
                    </p>
                </CardContent>
            </Card>

            {/* Fon listesi */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground border rounded-2xl">
                        <HandCoins className="h-10 w-10 mx-auto opacity-30 mb-2" />
                        <p>Henüz fon eklenmemiş.</p>
                        <p className="text-xs mt-1">"Yeni Fon Ekle" butonu ile başla.</p>
                    </div>
                ) : filtered.map(fund => (
                    <Card key={fund.id} className="rounded-2xl">
                        <CardHeader>
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <CardTitle className="text-base">{fund.name}</CardTitle>
                                        <Badge className={fund.status === 'Açık' ? 'bg-green-600 text-[10px]' : 'text-[10px]'} variant={fund.status === 'Açık' ? 'default' : 'secondary'}>
                                            {fund.status}
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs">
                                        {fund.provider} · {fund.budget || 'Bütçe belirtilmemiş'}
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <FundEditor
                                        initial={fund}
                                        onSave={handleSave}
                                        trigger={
                                            <Button variant="outline" size="sm" className="rounded-xl">
                                                <Pencil className="h-3.5 w-3.5 mr-1" /> Düzenle
                                            </Button>
                                        }
                                    />
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl" aria-label="Sil">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Fonu sil?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    "{fund.name}" kalıcı olarak silinecek.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className={cn(buttonVariants({ variant: 'destructive' }))}
                                                    onClick={() => handleDelete(fund)}
                                                >
                                                    Evet, Sil
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p className="text-muted-foreground line-clamp-2">{fund.description}</p>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Son: {fmtDate(fund.deadline)}</span>
                                {fund.areas?.length > 0 && (
                                    <div className="flex items-center gap-1 flex-wrap">
                                        {fund.areas.map(a => (
                                            <Badge key={a} variant="outline" className="text-[10px]">{a}</Badge>
                                        ))}
                                    </div>
                                )}
                                {fund.url && (
                                    <Link href={fund.url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-primary hover:underline">
                                        Web sitesi <ExternalLink className="h-3 w-3" />
                                    </Link>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
