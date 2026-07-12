'use client';

import React, { useState } from 'react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Images, Loader2, Trash2, ExternalLink, Copy, Check } from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import type { EventPhoto } from '@/lib/types';

// Firestore Timestamp benzeri değeri okunur tarihe çevir (createdAt: unknown).
function formatUploadTime(value: unknown): string {
    if (!value) return '';
    try {
        const v = value as { toDate?: () => Date; seconds?: number };
        const date =
            typeof v.toDate === 'function'
                ? v.toDate()
                : typeof v.seconds === 'number'
                    ? new Date(v.seconds * 1000)
                    : typeof value === 'number'
                        ? new Date(value)
                        : null;
        if (!date || Number.isNaN(date.getTime())) return '';
        return date.toLocaleString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return '';
    }
}

/**
 * Admin "Fotoğraflar" paneli — bir etkinliğin foto galerisini (events/{eventId}/photos)
 * salt-okunur listeler: her fotoğrafın küçük görseli + KİM yükledi (uploaderName /
 * uploaderUid) + yüklenme zamanı. Super-admin / organizatör bir fotoğrafı silebilir.
 * Ayrıca public foto-galerisi linkini (/events/{eventId}?photos=1) gösterir/kopyalar —
 * bu paramla detay sayfası foto dialogunu açar (başka bir ajans bağlar).
 */
export function EventPhotosAdmin({
    eventId,
    canDelete = true,
    className,
    scope = 'events',
}: {
    /** Kapsanan belgenin id'si — scope 'events' ise etkinlik, 'volunteering' ise gönüllülük id'si. */
    eventId: string;
    canDelete?: boolean;
    className?: string;
    /** Foto galerisinin bağlı olduğu koleksiyon: etkinlik mi gönüllülük mü. Varsayılan 'events'. */
    scope?: 'events' | 'volunteering';
}) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Kapsam-türevli değerler: Firestore yolu ve public link bunlardan gelir.
    const parentCol = scope === 'volunteering' ? COLLECTIONS.volunteering : COLLECTIONS.events;
    const publicPath = scope === 'volunteering' ? 'volunteering' : 'events';

    const photosQuery = useMemoFirebase(
        () =>
            firestore && open
                ? query(
                    collection(firestore, parentCol, eventId, COLLECTIONS.eventPhotos),
                    orderBy('createdAt', 'desc'),
                )
                : null,
        [firestore, parentCol, eventId, open],
    );
    const { data: photos, isLoading } = useCollection<EventPhoto>(photosQuery);

    const publicUrl =
        typeof window !== 'undefined'
            ? `${window.location.origin}/${publicPath}/${eventId}?photos=1`
            : `/${publicPath}/${eventId}?photos=1`;

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(publicUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            toast({ variant: 'destructive', title: 'Kopyalanamadı', description: 'Bağlantı kopyalanamadı.' });
        }
    };

    const handleDelete = async (photoId: string) => {
        if (!firestore) return;
        setDeletingId(photoId);
        try {
            await deleteDoc(doc(firestore, parentCol, eventId, COLLECTIONS.eventPhotos, photoId));
            toast({ title: 'Fotoğraf silindi' });
        } catch (e) {
            toast({
                variant: 'destructive',
                title: 'Silinemedi',
                description: e instanceof Error ? e.message : 'Fotoğraf silinemedi.',
            });
        } finally {
            setDeletingId(null);
        }
    };

    const count = photos?.length || 0;

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className={className ?? 'rounded-xl w-full sm:w-auto'}
                onClick={() => setOpen(true)}
            >
                <Images className="h-4 w-4 mr-1.5" /> Fotoğraflar
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Etkinlik Fotoğrafları</DialogTitle>
                        <DialogDescription className="text-xs">
                            Katılımcıların yüklediği fotoğraflar — kim yükledi ve ne zaman.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Public foto galerisi linki + QR — katılımcıların yükleyip görebileceği sayfa */}
                    <div className="rounded-xl border bg-muted/40 p-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Herkese açık foto galerisi bağlantısı</p>
                        <div className="flex items-center gap-2">
                            <code className="flex-1 min-w-0 truncate rounded-lg bg-background border px-2.5 py-1.5 text-xs">
                                {publicUrl}
                            </code>
                            <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={copyLink}>
                                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            </Button>
                            <Button asChild type="button" variant="outline" size="sm" className="shrink-0">
                                <a href={publicUrl} target="_blank" rel="noopener noreferrer" aria-label="Galeriyi aç">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </Button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="py-12 flex justify-center items-center text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Yükleniyor…
                        </div>
                    ) : count === 0 ? (
                        <p className="py-10 text-center text-sm text-muted-foreground">
                            Bu etkinlik için henüz fotoğraf yüklenmemiş.
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs text-muted-foreground">{count} fotoğraf</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {photos?.map((p) => {
                                    const uploader = p.uploaderName || p.uploaderUid || 'Bilinmiyor';
                                    const when = formatUploadTime(p.createdAt);
                                    return (
                                        <div key={p.id} className="rounded-xl border bg-card overflow-hidden flex flex-col">
                                            <div className="relative aspect-square bg-muted">
                                                {p.url ? (
                                                    <NextImage
                                                        src={p.thumbUrl || p.url}
                                                        alt={`${uploader} tarafından yüklenen fotoğraf`}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                        sizes="(max-width: 640px) 50vw, 33vw"
                                                    />
                                                ) : null}
                                            </div>
                                            <div className="p-2 space-y-1">
                                                <p className="text-xs font-medium break-words leading-tight" title={p.uploaderUid}>
                                                    {uploader}
                                                </p>
                                                {when ? <p className="text-[11px] text-muted-foreground">{when}</p> : null}
                                                {canDelete && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-destructive hover:text-destructive"
                                                        disabled={deletingId === p.id}
                                                        onClick={() => handleDelete(p.id)}
                                                    >
                                                        {deletingId === p.id ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Sil
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
