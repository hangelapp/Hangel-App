'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc } from 'firebase/firestore';

const DISCOVERY_OPTIONS = ['Sosyal Medya', 'Reklamlar', 'Sivil Toplum Kuruluşu', 'Arkadaşım'];
const DETAIL_REQUIRED = ['Sivil Toplum Kuruluşu', 'Arkadaşım'];

export function RatingPopup() {
    const [open, setOpen] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [dontAskAgain, setDontAskAgain] = useState(false);

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
        if (isUserLoading || typeof window === 'undefined' || !user?.uid) return;

        // Safe localStorage helpers — Safari private mode / quota errors should never crash render
        const safeGet = (k: string): string | null => {
            try { return window.localStorage.getItem(k); } catch { return null; }
        };
        const safeSet = (k: string, v: string): void => {
            try { window.localStorage.setItem(k, v); } catch { /* ignore */ }
        };

        try {
            const discoveryKey = `hangel_discovery_done_${user.uid}`;
            const ratingKey = `hangel_rating_done_${user.uid}`;
            const neverAskKey = `hangel_never_ask_popup_${user.uid}`;
            const visitCountKey = `hangel_visit_count_${user.uid}`;
            const shownAtKey = `hangel_survey_shown_at_${user.uid}`;

            // Check if user has opted out of surveys permanently
            if (safeGet(neverAskKey)) return;

            // Rate limit: don't show again within 24h of a previous appearance
            const lastShownRaw = safeGet(shownAtKey);
            if (lastShownRaw) {
                const lastShown = Number(lastShownRaw);
                if (Number.isFinite(lastShown) && Date.now() - lastShown < 24 * 60 * 60 * 1000) {
                    return;
                }
            }

            const alreadyDiscovered = !!safeGet(discoveryKey);
            const alreadyRated = !!safeGet(ratingKey);

            setDiscoveryDone(alreadyDiscovered);
            setRatingDone(alreadyRated);

            if (alreadyDiscovered && alreadyRated) return;

            const parsed = parseInt(safeGet(visitCountKey) || '0', 10);
            const currentCount = (Number.isFinite(parsed) ? parsed : 0) + 1;
            safeSet(visitCountKey, String(currentCount));

            const creationTime = user.metadata?.creationTime
                ? new Date(user.metadata.creationTime).getTime()
                : 0;
            const isNewUser = creationTime > 0 && Date.now() - creationTime < 10 * 60 * 1000;
            const threshold = isNewUser ? 3 : 2;

            if (currentCount >= threshold) {
                const timer = setTimeout(() => {
                    setOpen(true);
                    safeSet(shownAtKey, String(Date.now()));
                }, 2000);
                return () => clearTimeout(timer);
            }
        } catch (e) {
            console.warn('RatingPopup init failed:', e);
        }
    }, [isUserLoading, user]);

    const safeSetLS = (k: string, v: string) => {
        if (typeof window === 'undefined') return;
        try { window.localStorage.setItem(k, v); } catch { /* ignore */ }
    };

    const handleSubmit = async () => {
        if (!user?.uid) {
            setOpen(false);
            return;
        }

        try {
            if (!discoveryDone && discoverySource && db) {
                try {
                    await addDoc(collection(db, 'surveys'), {
                        type: 'discovery',
                        source: discoverySource,
                        detail: discoveryDetail || '',
                        userId: user.uid,
                        createdAt: new Date().toISOString(),
                    });
                } catch (e) {
                    console.warn('Discovery survey save failed:', e);
                }
                safeSetLS(`hangel_discovery_done_${user.uid}`, 'true');
            }

            if (!ratingDone && rating > 0 && db) {
                try {
                    await addDoc(collection(db, 'ratings'), {
                        rating,
                        comment: comment || '',
                        userId: user.uid,
                        createdAt: new Date().toISOString(),
                    });
                } catch (e) {
                    console.warn('Rating save failed:', e);
                }
                safeSetLS(`hangel_rating_done_${user.uid}`, 'true');
            }

            setSubmitted(true);
            setTimeout(() => setOpen(false), 1500);
        } catch (e) {
            console.warn('RatingPopup submit failed:', e);
            setOpen(false);
        }
    };

    const handleClose = () => {
        try {
            if (user?.uid) {
                if (dontAskAgain) {
                    safeSetLS(`hangel_never_ask_popup_${user.uid}`, 'true');
                } else {
                    if (!discoveryDone && discoverySource) {
                        safeSetLS(`hangel_discovery_done_${user.uid}`, 'true');
                    }
                    if (!ratingDone) {
                        safeSetLS(`hangel_rating_done_${user.uid}`, 'true');
                    }
                }
            }
        } catch (e) {
            console.warn('RatingPopup close failed:', e);
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

                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="dont-ask-again"
                                    checked={dontAskAgain}
                                    onCheckedChange={(checked) => setDontAskAgain(!!checked)}
                                />
                                <Label
                                    htmlFor="dont-ask-again"
                                    className="text-sm font-medium cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Daha sonra sorma
                                </Label>
                            </div>
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
