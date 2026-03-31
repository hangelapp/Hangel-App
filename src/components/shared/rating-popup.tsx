'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Star } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

const DISCOVERY_OPTIONS = ['Sosyal Medya', 'Reklamlar', 'Sivil Toplum Kuruluşu', 'Arkadaşım'];
const DETAIL_REQUIRED = ['Sivil Toplum Kuruluşu', 'Arkadaşım'];

export function RatingPopup() {
    const [open, setOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    // Discovery survey state
    const [discoverySource, setDiscoverySource] = useState('');
    const [discoveryDetail, setDiscoveryDetail] = useState('');
    const [discoveryDone, setDiscoveryDone] = useState(false);

    // Rating state
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [ratingDone, setRatingDone] = useState(false);

    const { user, isUserLoading } = useUser();
    const db = useFirestore();

    useEffect(() => {
        if (isUserLoading || typeof window === 'undefined' || !user) return;

        const discoveryKey = `hangel_discovery_done_${user.uid}`;
        const ratingKey = `hangel_rating_done_${user.uid}`;
        const visitCountKey = `hangel_visit_count_${user.uid}`;

        const alreadyDiscovered = !!localStorage.getItem(discoveryKey);
        const alreadyRated = !!localStorage.getItem(ratingKey);

        setDiscoveryDone(alreadyDiscovered);
        setRatingDone(alreadyRated);

        if (alreadyDiscovered && alreadyRated) return;

        const currentCount = parseInt(localStorage.getItem(visitCountKey) || '0', 10) + 1;
        localStorage.setItem(visitCountKey, String(currentCount));

        const creationTime = user.metadata?.creationTime
            ? new Date(user.metadata.creationTime).getTime()
            : 0;
        const isNewUser = creationTime > 0 && Date.now() - creationTime < 10 * 60 * 1000;
        const threshold = isNewUser ? 3 : 2;

        if (currentCount >= threshold) {
            const timer = setTimeout(() => setOpen(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [isUserLoading, user]);

    const handleSubmit = async () => {
        if (!user || !db) return;

        if (!discoveryDone && discoverySource) {
            try {
                await addDoc(collection(db, 'surveys'), {
                    type: 'discovery',
                    source: discoverySource,
                    detail: discoveryDetail,
                    userId: user.uid,
                    createdAt: new Date().toISOString(),
                });
            } catch (e) {
                console.error('Discovery survey save failed:', e);
            }
            localStorage.setItem(`hangel_discovery_done_${user.uid}`, 'true');
        }

        if (!ratingDone && rating > 0) {
            try {
                await addDoc(collection(db, 'ratings'), {
                    rating,
                    comment,
                    userId: user.uid,
                    createdAt: new Date().toISOString(),
                });
            } catch (e) {
                console.error('Rating save failed:', e);
            }
            localStorage.setItem(`hangel_rating_done_${user.uid}`, 'true');
        }

        setSubmitted(true);
        setTimeout(() => setOpen(false), 1500);
    };

    const handleClose = () => {
        if (user) {
            if (!discoveryDone && discoverySource) {
                localStorage.setItem(`hangel_discovery_done_${user.uid}`, 'true');
            }
            if (!ratingDone) {
                localStorage.setItem(`hangel_rating_done_${user.uid}`, 'true');
            }
        }
        setOpen(false);
    };

    const canSubmit = (!discoveryDone ? !!discoverySource : true) && (!ratingDone ? rating > 0 : true);
    const showDiscovery = !discoveryDone;
    const showRating = !ratingDone;

    if (!showDiscovery && !showRating) return null;

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
            <DialogContent className="sm:max-w-md rounded-3xl">
                {!submitted ? (
                    <div className="space-y-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Merhaba!</DialogTitle>
                            <DialogDescription>
                                Sizi daha iyi tanımak için birkaç soru sormak istiyoruz.
                            </DialogDescription>
                        </DialogHeader>

                        {showDiscovery && (
                            <div className="space-y-3">
                                <p className="font-semibold text-sm">hangel'i nereden duydunuz?</p>
                                <div className="grid grid-cols-2 gap-2">
                                    {DISCOVERY_OPTIONS.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => {
                                                setDiscoverySource(opt);
                                                setDiscoveryDetail('');
                                            }}
                                            className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                                                discoverySource === opt
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'border-border hover:bg-accent'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {discoverySource && DETAIL_REQUIRED.includes(discoverySource) && (
                                    <Input
                                        className="rounded-xl"
                                        placeholder={
                                            discoverySource === 'Sivil Toplum Kuruluşu'
                                                ? 'Hangi STK?'
                                                : 'Arkadaşınızın adı?'
                                        }
                                        value={discoveryDetail}
                                        onChange={(e) => setDiscoveryDetail(e.target.value)}
                                    />
                                )}
                            </div>
                        )}

                        {showRating && (
                            <div className="space-y-3">
                                {showDiscovery && <div className="border-t pt-4" />}
                                <p className="font-semibold text-sm">hangel'i nasıl değerlendirirsiniz?</p>
                                <p className="text-xs text-muted-foreground">
                                    Görüşleriniz platformu geliştirmemize yardımcı oluyor.
                                </p>
                                <div className="flex justify-center gap-2 py-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHovered(star)}
                                            onMouseLeave={() => setHovered(0)}
                                            className="transition-transform hover:scale-110"
                                        >
                                            <Star
                                                className={`h-9 w-9 ${
                                                    star <= (hovered || rating)
                                                        ? 'fill-yellow-400 text-yellow-400'
                                                        : 'text-muted-foreground'
                                                }`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <Textarea
                                    placeholder="Yorumunuzu buraya yazabilirsiniz... (isteğe bağlı)"
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    className="rounded-xl resize-none"
                                    rows={3}
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button variant="ghost" className="flex-1 rounded-xl" onClick={handleClose}>
                                Daha Sonra
                            </Button>
                            <Button
                                className="flex-1 rounded-xl"
                                onClick={handleSubmit}
                                disabled={!canSubmit}
                            >
                                Gönder
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 space-y-3">
                        <div className="text-5xl">🙏</div>
                        <p className="text-xl font-bold">Teşekkürler!</p>
                        <p className="text-muted-foreground text-sm">Yanıtlarınız kaydedildi.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
