'use client';

import React from 'react';
import Link from 'next/link';
import { Edit3, Eye, Power, PowerOff, Trash2 } from 'lucide-react';

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { BrandEditDialog } from './brand-edit-dialog';
import { TransferBrandAdminDialog } from './transfer-brand-admin-dialog';
import type { BrandItem, BrandRole, EditFormData, SimpleUser } from './types';

interface BrandListRowProps {
    brand: BrandItem;
    editingBrand: BrandItem | null;
    editFormData: EditFormData;
    onEditFormDataChange: (next: EditFormData) => void;
    logoUploading: boolean;
    allUsers: SimpleUser[] | null;
    onStartEdit: (brand: BrandItem) => void;
    onCancelEdit: () => void;
    onSaveEdit: () => void | Promise<void>;
    onLogoFile: (file: File, kind: 'logo' | 'cover') => void | Promise<void>;
    onToggleStatus: (id: string, currentStatus: string) => void;
    onRemove: (id: string, name: string) => void;
    onAssignBrandAdmin: (brandId: string, userId: string, userName: string, role: BrandRole) => Promise<void>;
    onRevokeBrandAdmin: (invitationId: string, inviteeName: string) => Promise<void>;
    onUpdateBrandAdminRole: (invitationId: string, inviteeUserId: string, newRole: BrandRole) => Promise<void>;
}

export const BrandListRow = ({
    brand,
    editingBrand,
    editFormData,
    onEditFormDataChange,
    logoUploading,
    allUsers,
    onStartEdit,
    onCancelEdit,
    onSaveEdit,
    onLogoFile,
    onToggleStatus,
    onRemove,
    onAssignBrandAdmin,
    onRevokeBrandAdmin,
    onUpdateBrandAdminRole,
}: BrandListRowProps) => {
    const isPassive = brand.status === 'Pasif';
    const isPending = brand.status === 'Beklemede';
    const isRejected = brand.status === 'Reddedildi';
    const isApproved = brand.source === 'brands' && brand.status === 'Aktif';

    return (
        <div className={cn("p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-muted/30 transition-colors", (isPassive || isRejected) && "opacity-60 grayscale")}>
            <div className="flex items-center gap-5 flex-1">
                <Avatar className="h-14 w-14 border-2 border-white shadow-lg bg-white">
                    <AvatarImage src={brand.logoUrl} alt={brand.name} className="object-contain p-1" />
                    <AvatarFallback className="font-black text-xl">{brand.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-lg text-[#1d1d1f] tracking-tight">{brand.name}</p>
                        {isApproved && <Badge className="bg-green-600 text-white text-[9px] font-black uppercase">YAYINDA</Badge>}
                        {isPending && <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase">ONAY BEKLİYOR</Badge>}
                        {isPassive && <Badge variant="secondary" className="text-[9px] font-black uppercase">PASİF</Badge>}
                        {isRejected && <Badge variant="destructive" className="text-[9px] font-black uppercase">REDDEDİLDİ</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                        {brand.donationRate ? <span className="flex items-center gap-1">%{brand.donationRate} Bağış</span> : null}
                        {brand.type && <><span>•</span> <span className="capitalize">{brand.type}</span></>}
                        {brand.category && <><span>•</span> <span>{brand.category}</span></>}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap" onClick={e => e.stopPropagation()}>
                {brand.source === 'brands' && (
                    <>
                        <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4" asChild>
                            <Link href={`/market/${brand.slug}`}>
                                <Eye className="mr-2 h-4 w-4" /> Profili Gör
                            </Link>
                        </Button>
                    </>
                )}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4" onClick={() => onStartEdit(brand)}>
                            <Edit3 className="mr-2 h-4 w-4" /> Düzelt
                        </Button>
                    </DialogTrigger>
                    {editingBrand?.id === brand.id && (
                        <BrandEditDialog
                            brand={brand}
                            editFormData={editFormData}
                            onEditFormDataChange={onEditFormDataChange}
                            logoUploading={logoUploading}
                            onLogoFile={onLogoFile}
                            onSave={onSaveEdit}
                            onCancel={onCancelEdit}
                        />
                    )}
                </Dialog>
                {brand.source === 'brands' && (
                    <>
                        <TransferBrandAdminDialog brand={brand} allUsers={allUsers} onAssign={onAssignBrandAdmin} onRevoke={onRevokeBrandAdmin} onUpdateRole={onUpdateBrandAdminRole} />
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl font-bold h-10 px-4"
                            onClick={() => onToggleStatus(brand.id, brand.status || 'Aktif')}
                        >
                            {isPassive ? <><Power className="mr-2 h-4 w-4" /> Aktif</> : <><PowerOff className="mr-2 h-4 w-4" /> Pasife</>}
                        </Button>
                    </>
                )}
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl" aria-label="Sil">
                            <Trash2 className="h-5 w-5" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-[2.5rem]">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold">{brand.name} markasını silmek istiyor musunuz?</AlertDialogTitle>
                            <AlertDialogDescription className="text-base font-medium">
                                Bu işlem geri alınamaz. Marka ve ilişkili tüm veriler platformdan kalıcı olarak silinecektir.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-2xl font-bold">Vazgeç</AlertDialogCancel>
                            <AlertDialogAction
                                className={cn(buttonVariants({ variant: "destructive" }), "rounded-2xl font-bold")}
                                onClick={() => onRemove(brand.id, brand.name)}
                            >
                                Evet, Kalıcı Olarak Sil
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
};
