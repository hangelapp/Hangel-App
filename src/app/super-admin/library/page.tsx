'use client';

import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { librarySections as staticSections, type LibrarySection, type LibraryItem } from "@/lib/library";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { collection, doc, setDoc } from 'firebase/firestore';

// Define a type that includes the section slug for easier manipulation
type ItemWithSection = LibraryItem & { sectionSlug: string };

type AddEditPayload = { title: string; content: string; sectionSlug: string; slug?: string };

// Statik (kod içi) içerikler vs. Firestore'da kalıcı (düzenlenebilir) içerikler ayrımı için.
type EditableItem = LibraryItem & { sectionSlug: string; persisted: boolean };

// Firestore'a yazılacak bölüm dokümanının gövdesi. Public /library sayfası bu şekli okur:
// { slug, title, description, icon, items: [{ slug, title, content }] }
const firestoreErrorDescription = (e: unknown): string => {
  const code = (e as { code?: string } | null)?.code;
  if (code === 'permission-denied') return 'Süper admin yetkisi gerekli.';
  return e instanceof Error ? e.message : 'Bilinmeyen hata';
};

const AddEditDialog = ({ item, open, onOpenChange, onSave, sections, toast, saving }: {
    item?: ItemWithSection | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: AddEditPayload) => void;
    sections: LibrarySection[];
    toast: ReturnType<typeof useToast>['toast'];
    saving: boolean;
}) => {
    const [title, setTitle] = useState(item?.title || '');
    const [content, setContent] = useState(item?.content || '');
    const [sectionSlug, setSectionSlug] = useState(item?.sectionSlug || '');

    React.useEffect(() => {
        if (open) {
            if (item) {

                setTitle(item.title);
                setContent(item.content);
                setSectionSlug(item.sectionSlug);
            } else {
                setTitle('');
                setContent('');
                setSectionSlug('');
            }
        }
    }, [item, open]);

    const handleSubmit = () => {
        if (!title || !content || !sectionSlug) {
            toast({ variant: 'destructive', title: 'Eksik Bilgi', description: 'Lütfen tüm alanları doldurun.' });
            return;
        }
        onSave({ title, content, sectionSlug, slug: item?.slug });
    };

    return (
         <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{item ? 'İçeriği Düzenle' : 'Yeni İçerik Ekle'}</DialogTitle>
                    <DialogDescription>
                        {item ? 'Mevcut içeriği düzenleyin.' : 'Kütüphaneye yeni bir içerik ekleyin.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="section" className="text-right">Kategori</Label>
                        <Select value={sectionSlug} onValueChange={setSectionSlug} disabled={!!item}>
                            <SelectTrigger id="section" className="col-span-3">
                                <SelectValue placeholder="Bir kategori seçin..." />
                            </SelectTrigger>
                            <SelectContent>
                                {sections.map(sec => <SelectItem key={sec.slug} value={sec.slug}>{sec.title}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="title" className="text-right">Başlık</Label>
                        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="content" className="text-right pt-2">İçerik (HTML)</Label>
                        <Textarea id="content" value={content} onChange={e => setContent(e.target.value)} className="col-span-3" rows={10} />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>İptal</Button>
                    <Button type="submit" onClick={handleSubmit} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function LibraryPage() {
    const { toast } = useToast();
    const db = useFirestore();

    const libQuery = useMemoFirebase(() => collection(db, COLLECTIONS.library), [db]);
    const { data: libData, isLoading } = useCollection<LibrarySection>(libQuery);

    // State for dialogs
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ItemWithSection | null>(null);
    const [deletingItem, setDeletingItem] = useState<ItemWithSection | null>(null);
    const [saving, setSaving] = useState(false);

    // Firestore bölüm dokümanlarını slug -> doc olarak indeksle.
    const firestoreMap = useMemo(
        () => new Map((libData ?? []).map(s => [s.slug, s])),
        [libData]
    );

    // Görüntüleme için statik + Firestore birleşimi (public /library sayfasıyla aynı mantık).
    // Statik item'lar salt-okunur; sadece Firestore'da kalıcı item'lar düzenlenebilir/silinebilir.
    const sections = useMemo<(LibrarySection & { editableItems: EditableItem[] })[]>(() => {
        const merged = staticSections.map(staticSec => {
            const fsSec = firestoreMap.get(staticSec.slug);
            const staticItems: EditableItem[] = staticSec.items.map(i => ({ ...i, sectionSlug: staticSec.slug, persisted: false }));
            const staticSlugs = new Set(staticSec.items.map(i => i.slug));
            const extraItems: EditableItem[] = (fsSec?.items ?? [])
                .filter(i => !staticSlugs.has(i.slug))
                .map(i => ({ ...i, sectionSlug: staticSec.slug, persisted: true }));
            return {
                ...staticSec,
                items: [...staticSec.items, ...extraItems],
                editableItems: [...staticItems, ...extraItems],
            };
        });

        const staticSlugs = new Set(staticSections.map(s => s.slug));
        const extraSections = (libData ?? [])
            .filter(s => !staticSlugs.has(s.slug))
            .map(s => ({
                ...s,
                items: s.items ?? [],
                editableItems: (s.items ?? []).map(i => ({ ...i, sectionSlug: s.slug, persisted: true })),
            }));

        return [...merged, ...extraSections];
    }, [firestoreMap, libData]);

    // Bir bölümün Firestore'da kalıcı tutulan (statik olmayan) item'larını döndürür.
    // Public sayfa statik item'ları zaten statik kaynaktan render ettiği için
    // statik item'ları Firestore'a yazmıyoruz; yalnızca süper admin tarafından eklenenler yazılır.
    const persistedItemsFor = (sectionSlug: string): LibraryItem[] => {
        const sec = sections.find(s => s.slug === sectionSlug);
        if (!sec) return [];
        return sec.editableItems.filter(i => i.persisted).map(({ slug, title, content }) => ({ slug, title, content }));
    };

    // Bölüm dokümanının kalıcı item listesini hesaplanan değerle değiştirip Firestore'a yazar.
    const writeSection = async (sectionSlug: string, nextItems: LibraryItem[]) => {
        const staticSec = staticSections.find(s => s.slug === sectionSlug);
        const fsSec = firestoreMap.get(sectionSlug);
        const meta = staticSec ?? fsSec;
        await setDoc(
            doc(db, COLLECTIONS.library, sectionSlug),
            {
                slug: sectionSlug,
                title: meta?.title ?? sectionSlug,
                description: meta?.description ?? '',
                icon: meta?.icon ?? 'Library',
                items: nextItems,
            },
            { merge: true },
        );
    };

    const handleAddItem = async (newItem: AddEditPayload) => {
        setSaving(true);
        try {
            const newSlug = `${newItem.sectionSlug}-${newItem.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
            const nextItems = [
                ...persistedItemsFor(newItem.sectionSlug),
                { slug: newSlug, title: newItem.title, content: newItem.content },
            ];
            await writeSection(newItem.sectionSlug, nextItems);
            toast({ title: "İçerik Eklendi", description: `"${newItem.title}" başarıyla kütüphaneye eklendi.` });
            setIsAddDialogOpen(false);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Eklenemedi', description: firestoreErrorDescription(e) });
        } finally {
            setSaving(false);
        }
    };

    const handleEditItem = async (updatedItem: ItemWithSection) => {
        setSaving(true);
        try {
            const nextItems = persistedItemsFor(updatedItem.sectionSlug).map(item =>
                item.slug === updatedItem.slug
                    ? { slug: item.slug, title: updatedItem.title, content: updatedItem.content }
                    : item
            );
            await writeSection(updatedItem.sectionSlug, nextItems);
            toast({ title: "İçerik Güncellendi", description: `"${updatedItem.title}" başarıyla güncellendi.` });
            setEditingItem(null);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Güncellenemedi', description: firestoreErrorDescription(e) });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteItem = async () => {
        if (!deletingItem) return;
        setSaving(true);
        try {
            const nextItems = persistedItemsFor(deletingItem.sectionSlug).filter(item => item.slug !== deletingItem.slug);
            await writeSection(deletingItem.sectionSlug, nextItems);
            toast({ variant: 'destructive', title: "İçerik Silindi", description: `"${deletingItem.title}" kalıcı olarak silindi.` });
            setDeletingItem(null);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Silinemedi', description: firestoreErrorDescription(e) });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-lg font-semibold md:text-2xl">Kütüphane Yönetimi</h1>
                <Button onClick={() => setIsAddDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4"/>Yeni İçerik Ekle</Button>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Kütüphane İçerikleri</CardTitle>
                    <CardDescription>
                        Kütüphaneye yeni içerikler ekleyin, mevcutları düzenleyin veya silin. Değişiklikler kaydedilir ve herkese açık kütüphane sayfasında görünür. Statik içerikler kod içinde tanımlıdır ve buradan düzenlenemez.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Yükleniyor...
                        </div>
                    ) : (
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {sections.map(section => (
                            <AccordionItem key={section.slug} value={section.slug} className="border rounded-lg px-4 bg-background">
                                <AccordionTrigger className="hover:no-underline text-left font-bold">{section.title} ({section.editableItems.length})</AccordionTrigger>
                                <AccordionContent className="pt-2">
                                    <div className="space-y-2 border-t pt-4">
                                        {section.editableItems.map(item => (
                                            <div key={item.slug} className="p-2 border-b flex justify-between items-center">
                                                <p className="text-sm flex-1 pr-4 flex items-center gap-2">
                                                    {item.title}
                                                    {item.persisted
                                                        ? <Badge variant="secondary">Düzenlenebilir</Badge>
                                                        : <Badge variant="outline">Statik</Badge>}
                                                </p>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" disabled={!item.persisted} onClick={() => setEditingItem({ slug: item.slug, title: item.title, content: item.content, sectionSlug: section.slug })}>Düzenle</Button>
                                                    <Button variant="destructive" size="sm" disabled={!item.persisted} onClick={() => setDeletingItem({ slug: item.slug, title: item.title, content: item.content, sectionSlug: section.slug })}>Sil</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <AddEditDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSave={handleAddItem}
                sections={sections}
                toast={toast}
                saving={saving}
            />

            <AddEditDialog
                item={editingItem}
                open={!!editingItem}
                onOpenChange={() => setEditingItem(null)}
                onSave={(payload) => {
                    if (editingItem && payload.slug) {
                        handleEditItem({ ...editingItem, title: payload.title, content: payload.content, sectionSlug: payload.sectionSlug });
                    }
                }}
                sections={sections}
                toast={toast}
                saving={saving}
            />

            <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>İçeriği Silmek İstediğinizden Emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            "{deletingItem?.title}" başlıklı içerik kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={saving}>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={saving}
                            className={cn(buttonVariants({ variant: "destructive" }))}
                            onClick={handleDeleteItem}>
                            Evet, Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
