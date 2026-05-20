'use client';

import React, { useMemo, useState } from 'react';
import { collection, query, where } from 'firebase/firestore';
import { Loader2, Search, UserCog, CheckCircle, XCircle, X } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';

import {
    BRAND_ROLE_OPTIONS,
    normalizePhone,
    type BrandItem,
    type BrandInvitation,
    type BrandRole,
    type SimpleUser,
} from './types';

interface TransferBrandAdminDialogProps {
    brand: BrandItem;
    allUsers: SimpleUser[] | null;
    onAssign: (brandId: string, userId: string, userName: string, role: BrandRole) => Promise<void>;
    onRevoke: (invitationId: string, inviteeName: string) => Promise<void>;
    onUpdateRole: (invitationId: string, inviteeUserId: string, newRole: BrandRole) => Promise<void>;
}

export const TransferBrandAdminDialog = ({ brand, allUsers, onAssign, onRevoke, onUpdateRole }: TransferBrandAdminDialogProps) => {
    const db = useFirestore();
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<BrandRole>('Genel Yönetici');
    const [submitting, setSubmitting] = useState(false);
    const [roleEdits, setRoleEdits] = useState<Record<string, BrandRole>>({});
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const handleUpdateRole = async (invitationId: string, inviteeUserId: string, newRole: BrandRole) => {
        setUpdatingId(invitationId);
        try {
            await onUpdateRole(invitationId, inviteeUserId, newRole);
        } finally {
            setUpdatingId(null);
        }
    };

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

    // Daha önce yetkilendirilenleri listele
    const invitationsQuery = useMemoFirebase(
        () => open ? query(collection(db, COLLECTIONS.userInvitations), where('brandId', '==', brand.id)) : null,
        [db, brand.id, open],
    );
    const { data: invitations } = useCollection<BrandInvitation>(invitationsQuery);

    const activeInvitations = useMemo(
        () => (invitations || []).filter(i => i.status !== 'revoked'),
        [invitations],
    );

    const handleAssign = async () => {
        if (!matchedUser) return;
        setSubmitting(true);
        try {
            await onAssign(brand.id, matchedUser.id, matchedUser.name || matchedUser.displayName || 'Üye', selectedRole);
            setOpen(false);
            setSearchTerm('');
            setSelectedRole('Genel Yönetici');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (raw: BrandInvitation['invitedAt']): string => {
        if (!raw) return '';
        try {
            let d: Date | null = null;
            if (raw instanceof Date) d = raw;
            else if (typeof (raw as { toDate?: () => Date }).toDate === 'function') d = (raw as { toDate: () => Date }).toDate();
            if (!d) return '';
            return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch { return ''; }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                    {/* Daha önce yetkilendirilenler */}
                    {activeInvitations.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mevcut Yetkililer</p>
                            <div className="space-y-1.5 rounded-2xl border border-black/5 bg-muted/20 p-2">
                                {activeInvitations.map(inv => {
                                    const userInfo = (allUsers || []).find(u => u.id === inv.inviteeUserId);
                                    const displayName = inv.inviteeName || userInfo?.name || userInfo?.displayName || 'Üye';
                                    const currentRole: BrandRole = (BRAND_ROLE_OPTIONS as readonly string[]).includes(inv.role || '')
                                        ? (inv.role as BrandRole)
                                        : 'Genel Yönetici';
                                    const editedRole = roleEdits[inv.id] ?? currentRole;
                                    const isRowUpdating = updatingId === inv.id;
                                    return (
                                        <div key={inv.id} className="flex items-center gap-2 p-2 rounded-xl bg-white">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={userInfo?.avatarUrl} />
                                                <AvatarFallback className="text-xs font-bold">{displayName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <p className="font-bold text-sm truncate">{displayName}</p>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <Select
                                                        value={editedRole}
                                                        onValueChange={(v) => setRoleEdits(prev => ({ ...prev, [inv.id]: v as BrandRole }))}>
                                                        <SelectTrigger className="h-7 w-auto rounded-lg text-[11px] font-bold"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {BRAND_ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 px-2.5 rounded-lg font-bold text-[11px]"
                                                        disabled={isRowUpdating || editedRole === currentRole}
                                                        onClick={() => { void handleUpdateRole(inv.id, inv.inviteeUserId || '', editedRole); }}>
                                                        {isRowUpdating && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                                        Güncelle
                                                    </Button>
                                                    {inv.invitedAt && (
                                                        <span className="text-[10px] text-muted-foreground">{formatDate(inv.invitedAt)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
                                                aria-label="Yetkiyi Kaldır"
                                                onClick={() => onRevoke(inv.id, displayName)}>
                                                <X className="h-4 w-4" />
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

                    {normalizedSearch.length >= 3 && !matchedUser && (
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
