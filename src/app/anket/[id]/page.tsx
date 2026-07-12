'use client';

/**
 * /anket/[id] — çağrı sonrası memnuniyet anketi (public).
 *
 * Arayan, temsilcinin WhatsApp'tan gönderdiği linkten açar; 1-5 yıldız + isteğe
 * bağlı yorum bırakır. Auth GEREKMEZ; sonuç callSessions/{id}.survey'e yazılır.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';

export default function SurveyPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  const [ngoName, setNgoName] = useState('');
  const [loading, setLoading] = useState(true);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/ngo-admin/call-center/sessions/${id}/survey`);
      const data = await res.json();
      if (res.ok) { setNgoName(data.ngoName || ''); setAlreadyDone(!!data.done); }
      else setError(data?.message || 'Anket bulunamadı.');
    } catch { setError('Anket yüklenemedi.'); } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ngo-admin/call-center/sessions/${id}/survey`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (res.ok) setSubmitted(true);
      else if (res.status === 409) { setAlreadyDone(true); }
      else setError(data?.message || 'Gönderilemedi.');
    } catch { setError('Gönderilemedi.'); } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <Card variant="glass" className="w-full max-w-md rounded-3xl">
        {loading ? (
          <CardContent className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent>
        ) : submitted || alreadyDone ? (
          <CardContent className="py-14 text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <p className="text-lg font-semibold">Teşekkür ederiz! 🧡</p>
            <p className="text-sm text-muted-foreground">Geri bildiriminiz {ngoName ? ngoName + ' ' : ''}için çok değerli.</p>
          </CardContent>
        ) : error ? (
          <CardContent className="py-14 text-center text-sm text-muted-foreground">{error}</CardContent>
        ) : (
          <>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Görüşmemiz nasıldı?</CardTitle>
              <CardDescription>{ngoName || 'Sivil toplum kuruluşu'} — memnuniyetiniz bizim için önemli.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex justify-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(n)}
                    className="p-1 transition-transform hover:scale-110"
                    aria-label={`${n} yıldız`}
                  >
                    <Star className={`h-9 w-9 ${(hover || rating) >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />
                  </button>
                ))}
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Eklemek istediğiniz bir şey var mı? (isteğe bağlı)"
                className="rounded-xl"
                rows={3}
              />
              <Button onClick={submit} disabled={rating < 1 || submitting} className="w-full rounded-xl h-11">
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Gönder
              </Button>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
