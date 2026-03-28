'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';

export function RatingPopup() {
    const [open, setOpen] = useState(false);
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const { user, isUserLoading } = useUser();
    const db = useFirestore();

    useEffect(() => {
        if (isUserLoading) return;
        if (typeof window === 'undefined') return;

        // Sadece giriş yapmış kullanıcılara göster
        if (!user) return;

        const ratingDoneKey = `hangel_rating_done_${user.uid}`;
        const visitCountKey = `hangel_visit_count_${user.uid}`;

        const alreadyRated = localStorage.getItem(ratingDoneKey);
        if (alreadyRated) return;

        const currentCount = parseInt(localStorage.getItem(visitCountKey) || '0', 10) + 1;
        localStorage.setItem(visitCountKey, String(currentCount));

        // Yeni kullanıcı: hesap 10 dakikadan kısa süre önce oluşturulduysa
        const creationTime = user.metadata?.creationTime ? new Date(user.metadata.creationTime).getTime() : 0;
        const isNewUser = creationTime > 0 && (Date.now() - creationTime) < 10 * 60 * 1000;

        // Yeni kayıt: 3. girişte, Eski kullanıcı: 2. girişte
        const threshold = isNewUser ? 3 : 2;

        if (currentCount >= threshold) {
            const timer = setTimeout(() => setOpen(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [isUserLoading, user]);

    const handleSubmit = async () => {
        if (!db || rating === 0 || !user) return;

        addDocumentNonBlocking(collection(db, 'ratings'), {
            rating,
            comment,
            userId: user.uid,
            createdAt: new Date().toISOString(),
        });

        localStorage.setItem(`hangel_rating_done_${user.uid}`, 'true');
        setSubmitted(true);
        setTimeout(() => setOpen(false), 1500);
    };

    const handleClose = () => {
        if (user) localStorage.setItem(`hangel_rating_done_${user.uid}`, 'true');
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
            <DialogContent className="sm:max-w-md rounded-3xl">
                {!submitted ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold">Bizi Değerlendirin</DialogTitle>
                            <DialogDescription>
                                Hangel hakkındaki deneyiminizi paylaşın. Görüşleriniz platformu geliştirmemize yardımcı oluyor.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex justify-center gap-2 py-4">
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

                        <div className="flex gap-3 mt-2">
                            <Button variant="ghost" className="flex-1 rounded-xl" onClick={handleClose}>
                                Daha Sonra
                            </Button>
                            <Button
                                className="flex-1 rounded-xl"
                                onClick={handleSubmit}
                                disabled={rating === 0}
                            >
                                Gönder
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-8 space-y-3">
                        <div className="text-5xl">🙏</div>
                        <p className="text-xl font-bold">Teşekkürler!</p>
                        <p className="text-muted-foreground text-sm">Değerlendirmeniz kaydedildi.</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
