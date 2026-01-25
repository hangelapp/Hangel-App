'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { librarySections as initialLibrarySections, type LibrarySection, type LibraryItem } from "@/lib/library";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

// Define a type that includes the section slug for easier manipulation
type ItemWithSection = LibraryItem & { sectionSlug: string };

export default function LibraryPage() {
    const { toast } = useToast();
    const [sections, setSections] = useState<LibrarySection[]>(initialLibrarySections);

    // State for dialogs
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ItemWithSection | null>(null);
    const [deletingItem, setDeletingItem] = useState<ItemWithSection | null>(null);

    const handleAddItem = (newItem: { title: string; content: string; sectionSlug: string; }) => {
        setSections(prevSections =>
            prevSections.map(section => {
                if (section.slug === newItem.sectionSlug) {
                    const newSlug = `${newItem.sectionSlug}-${newItem.title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
                    return {
                        ...section,
                        items: [...section.items, { slug: newSlug, title: newItem.title, content: newItem.content }],
                    };
                }
                return section;
            })
        );
        toast({ title: "İçerik Eklendi", description: `"${newItem.title}" başarıyla kütüphaneye eklendi.` });
        setIsAddDialogOpen(false);
    };

    const handleEditItem = (updatedItem: ItemWithSection) => {
        setSections(prevSections =>
            prevSections.map(section => {
                if (section.slug === updatedItem.sectionSlug) {
                    return {
                        ...section,
                        items: section.items.map(item =>
                            item.slug === updatedItem.slug ? { ...item, title: updatedItem.title, content: updatedItem.content } : item
                        ),
                    };
                }
                return section;
            })
        );
        toast({ title: "İçerik Güncellendi", description: `"${updatedItem.title}" başarıyla güncellendi.` });
        setEditingItem(null);
    };
    
    const handleDeleteItem = () => {
        if (!deletingItem) return;

        setSections(prevSections =>
            prevSections.map(section => {
                if (section.slug === deletingItem.sectionSlug) {
                    return {
                        ...section,
                        items: section.items.filter(item => item.slug !== deletingItem.slug),
                    };
                }
                return section;
            })
        );
        toast({ variant: 'destructive', title: "İçerik Silindi", description: `"${deletingItem.title}" kalıcı olarak silindi.` });
        setDeletingItem(null);
    };
    
    const AddEditDialog = ({ item, open, onOpenChange, onSave }: {
        item?: ItemWithSection | null;
        open: boolean;
        onOpenChange: (open: boolean) => void;
        onSave: (data: any) => void;
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
                        <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>İptal</Button>
                        <Button type="submit" onClick={handleSubmit}>Kaydet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
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
                        Kütüphaneye yeni içerikler ekleyin, mevcutları düzenleyin veya silin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {sections.map(section => (
                            <AccordionItem key={section.slug} value={section.slug} className="border rounded-lg px-4 bg-background">
                                <AccordionTrigger className="hover:no-underline text-left font-bold">{section.title} ({section.items.length})</AccordionTrigger>
                                <AccordionContent className="pt-2">
                                    <div className="space-y-2 border-t pt-4">
                                        {section.items.map(item => ( 
                                            <div key={item.slug} className="p-2 border-b flex justify-between items-center">
                                                <p className="text-sm flex-1 pr-4">{item.title}</p>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => setEditingItem({ ...item, sectionSlug: section.slug })}>Düzenle</Button>
                                                    <Button variant="destructive" size="sm" onClick={() => setDeletingItem({ ...item, sectionSlug: section.slug })}>Sil</Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>
            
            {/* Dialogs */}
            <AddEditDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onSave={handleAddItem}
            />

            <AddEditDialog
                item={editingItem}
                open={!!editingItem}
                onOpenChange={() => setEditingItem(null)}
                onSave={handleEditItem}
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
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction
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
