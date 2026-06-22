'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Search, UserCog, CheckCircle, XCircle, X } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { BRAND_ROLE_OPTIONS, type BrandRole } from '@/lib/ngo-admin/roles';

import {
    normalizePhone,
    type BrandItem,
    type SimpleUser,
} from './types';

interface TransferBrandAdminDialogProps {
    brand: BrandItem;
    allUsers: SimpleUser[] | null;
    onAssign: (brandId: string, userId: string, userName: string, role: BrandRole) => Promise<void>;
    onNeedUsers: () => void;
}

// Kanonik /api/ngo-admin/users/managers route'unun döndürdüğü yetkili satırı.
interface CanonicalManagerRow {
    userId: string;
    name: string;
    avatarUrl?: string | null;
    role: string;
    since: number;
    invitationId?: string;
    isPrimary: boolean;
    isOwner: boolean;
}

export const TransferBrandAdminDialog = ({ brand, allUsers, onAssign, onNeedUsers }: TransferBrandAdminDialogProps) => {
    const { user: authUser } = useUser();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<BrandRole>('Genel Yönetici');
    const [submitting, setSubmitting] = useState(false);
    const [roleEdits, setRoleEdits] = useState<Record<string, BrandRole>>({});
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [removingId, setRemovingId] = useState<string | null>(null);

    // Yetkili listesi KANONİK kaynaktan: /ngo-admin/users ile birebir aynı route
    // (managedBrandId üyeleri + adminUserId sahibi + kabul edilmiş davetlerin birleşimi).
    const [managerRows, setManagerRows] = useState<CanonicalManagerRow[]>([]);
    const [managersLoading, setManagersLoading] = useState(false);

    const fetchManagers = useCallback(async () => {
        if (!authUser || !open) return;
        setManagersLoading(true);
        try {
            const token = await authUser.getIdToken();
            const params = new URLSearchParams({ orgId: brand.id, kind: 'brand' });
            const res = await fetch(`/api/ngo-admin/users/managers?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`list ${res.status}`);
            const data = (await res.json()) as { managers?: CanonicalManagerRow[] };
            setManagerRows(Array.isArray(data.managers) ? data.managers : []);
        } catch {
            setManagerRows([]);
        } finally {
            setManagersLoading(false);
        }
    }, [authUser, open, brand.id]);

    useEffect(() => { void fetchManagers(); }, [fetchManagers]);

    // Kanonik route'a (set-role / remove) süper-admin token'ı ile çağrı.
    const callCanonical = useCallback(async (path: string, payload: Record<string, unknown>) => {
        if (!authUser) throw new Error('Oturum bulunamadı.');
        const token = await authUser.getIdToken();
        const res = await fetch(path, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, orgId: brand.id, kind: 'brand' }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as { message?: string })?.message || `Hata (${res.status})`);
        return data;
    }, [authUser, brand.id]);

    const handleChangeRole = useCallback(async (userId: string, newRole: BrandRole, name: string) => {
        setUpdatingId(userId);
        try {
            await callCanonical('/api/ngo-admin/users/set-role', { targetUserId: userId, role: newRole });
            setRoleEdits(prev => { const n = { ...prev }; delete n[userId]; return n; });
            toast({ title: 'Rol Güncellendi', description: `${name} kullanıcısının rolü "${newRole}" olarak güncellendi.` });
            await fetchManagers();
        } catch (e) {
            toast({ variant: 'destructive', title: 'Rol güncellenemedi', description: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' });
        } finally {
            setUpdatingId(null);
        }
    }, [callCanonical, fetchManagers, toast]);

    const handleRemove = useCallback(async (userId: string, name: string) => {
        setRemovingId(userId);
        try {
            await callCanonical('/api/ngo-admin/users/remove', { targetUserId: userId });
            toast({ title: 'Yetki Kaldırıldı', description: `${name} için yetkilendirme iptal edildi.` });
            await fetchManagers();
        } catch (e) {
            toast({ variant: 'destructive', title: 'Yetki kaldırılamadı', description: e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.' });
        } finally {
            setRemovingId(null);
        }
    }, [callCanonical, fetchManagers, toast]);

    const isEmailSearch = searchTerm.includes('@');
    const normalizedSearch = isEmailSearch ? searchTerm.trim().toLowerCase() : normalizePhone(searchTerm);

    const matchedUser = useMemo(() => {
        if (!allUsers) return null;
        if (isEmailSearch) {
            if (normalizedSearch.length < 3) return null;
            return allUsers.find(u => {
                const email = (u.personalInfo?.email || (u as { email?: string }).email || '').toLowerCase();
                return email && email.includes(normalizedSearch);
            }) || null;
        }
        if (normalizedSearch.length < 3) return null;
        return allUsers.find(u => {
            const cands = ([u.personalInfo?.phone, u.phoneNumber, u.phone].filter(Boolean) as string[]).map(normalizePhone);
            return cands.some(c => c.endsWith(normalizedSearch) || normalizedSearch.endsWith(c));
        }) || null;
    }, [allUsers, normalizedSearch, isEmailSearch]);

    const handleAssign = async () => {
        if (!matchedUser) return;
        setSubmitting(true);
        try {
            await onAssign(brand.id, matchedUser.id, matchedUser.name || matchedUser.displayName || 'Üye', selectedRole);
            setSearchTerm('');
            setSelectedRole('Genel Yönetici');
            await fetchManagers();
        } finally {
            setSubmitting(false);
        }
    };

    // Diyalog açıldığında kullanıcı listesini tembel yükle (Firestore okuma optimizasyonu).
    return (
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) onNeedUsers(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4">
                    <UserCog className="mr-2 h-4 w-4" /> Yetkili
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="font-bold">Yetkili Kişi Yönetimi</DialogTitle>
                    <DialogDescription>
                        <strong>{brand.name}</strong> markası için telefon veya e-posta ile kullanıcı bulup rol atayın.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    {/* Markanın tüm yetkilileri (rolleriyle) — kanonik route'tan, /ngo-admin/users ile birebir aynı liste */}
                    {managersLoading && managerRows.length === 0 ? (
                        <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yetkililer yükleniyor...
                        </div>
                    ) : managerRows.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mevcut Yetkililer ({managerRows.length})</p>
                            <div className="space-y-1.5 rounded-2xl border border-border bg-muted/20 p-2">
                                {managerRows.map(row => {
                                    const currentRole = (row.role || 'Genel Yönetici') as BrandRole;
                                    const editedRole = roleEdits[row.userId] ?? currentRole;
                                    const isKnownRole = (BRAND_ROLE_OPTIONS as readonly string[]).includes(editedRole);
                                    const isUpdatingThis = updatingId === row.userId;
                                    const isRemovingThis = removingId === row.userId;
                                    return (
                                        <div key={row.userId} className="flex items-center gap-2 p-2 rounded-xl bg-card flex-wrap">
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarImage src={row.avatarUrl || undefined} />
                                                <AvatarFallback className="text-xs font-bold">{row.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-[140px]">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-bold text-sm truncate">{row.name}</p>
                                                    {row.isOwner && (
                                                        <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 bg-amber-100 text-amber-800 border-amber-300/50">Sahip</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <Select
                                                value={isKnownRole ? editedRole : undefined}
                                                onValueChange={(v) => setRoleEdits(prev => ({ ...prev, [row.userId]: v as BrandRole }))}>
                                                <SelectTrigger className="h-8 w-auto min-w-[150px] text-xs font-bold rounded-lg" aria-label="Rol değiştir">
                                                    <SelectValue placeholder={currentRole} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {BRAND_ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-2.5 text-xs font-bold rounded-lg"
                                                disabled={isUpdatingThis || editedRole === currentRole}
                                                onClick={() => { void handleChangeRole(row.userId, editedRole, row.name); }}>
                                                {isUpdatingThis ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                                                Güncelle
                                            </Button>
                                            {/* Super-admin paneli — sahip dahil herkes kaldırılabilir. */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                                                aria-label="Yetkiyi Kaldır"
                                                disabled={isRemovingThis}
                                                onClick={() => { void handleRemove(row.userId, row.name); }}>
                                                {isRemovingThis ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Telefon veya E-posta</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="5XX XXX XX XX veya ornek@mail.com"
                                className="pl-10 rounded-xl"
                                autoFocus
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isEmailSearch ? 'E-posta ile aranıyor.' : 'Telefonla aranıyor. E-posta için "@" karakteri içeren değer girin.'}
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Rol</Label>
                        <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as BrandRole)}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {BRAND_ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    {normalizedSearch.length >= 3 && matchedUser && (
                        <div className="flex items-center gap-3 p-3 border-2 border-green-500/30 bg-green-500/5 rounded-2xl">
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
                                    {matchedUser.personalInfo?.email || ''}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Üyeler henüz yüklenmediyse "bulunamadı" yerine yükleniyor göster. */}
                    {normalizedSearch.length >= 3 && !allUsers && (
                        <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Üyeler yükleniyor...</span>
                        </div>
                    )}

                    {normalizedSearch.length >= 3 && allUsers && !matchedUser && (
                        <div className="flex items-center gap-2 p-3 border border-destructive/30 bg-destructive/5 rounded-2xl text-sm text-destructive">
                            <XCircle className="h-4 w-4" />
                            <span>{isEmailSearch ? 'Bu e-posta ile kayıtlı üye bulunamadı.' : 'Bu telefon numarasıyla kayıtlı üye bulunamadı.'}</span>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Atanan kullanıcı seçili rol ile yetkilendirilir ve bu marka için yönetim panelini kullanabilir.
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" className="rounded-xl font-bold" onClick={() => setOpen(false)}>İptal</Button>
                    <Button className="rounded-xl font-bold" disabled={!matchedUser || submitting} onClick={handleAssign}>
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yetki Ata
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
