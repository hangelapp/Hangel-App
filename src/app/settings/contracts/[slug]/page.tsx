'use client';

import { contractsData } from '@/lib/contracts';
import { notFound, useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2, CheckCircle2, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo, useState, useEffect, useRef } from 'react';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/firebase/collections';

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const db = useFirestore();

  // Önce Firestore'dan dene (super-admin tarafından düzenlenmiş içerik)
  const contractDocRef = useMemoFirebase(() => {
    if (!db || !slug) return null;
    return doc(db, COLLECTIONS.contracts, slug);
  }, [db, slug]);
  const { data: firestoreContract, isLoading } = useDoc<{ slug: string; title: string; content: string }>(contractDocRef);

  // Firestore'da yoksa kod içi varsayılan içerik
  const contract = useMemo(() => {
    if (firestoreContract && firestoreContract.content) return firestoreContract;
    return contractsData.find(c => c.slug === slug) || null;
  }, [firestoreContract, slug]);

  // --- "Okudum, Onaylıyorum" (KVKK ispat kaydı → super-admin Onay Kayıtları) ---
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const version = (firestoreContract as { version?: string } | null)?.version || '1.0';
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  // PERF: readSeconds ref'te tut, render trigger etme (sadece submit'te okunur).
  // Önceki setInterval(setReadSeconds, 1000) her saniye re-render ediyordu —
  // contracts sayfası uzun text ile yavaşlıyordu.
  const readSecondsRef = useRef(0);
  const scrolledRef = useRef(false);

  useEffect(() => {
    const t = setInterval(() => { readSecondsRef.current += 1; }, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 120) scrolledRef.current = true;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (slug && typeof window !== 'undefined') {
      try { if (localStorage.getItem(`contract-approved-${slug}-v${version}`)) setApproved(true); } catch { /* noop */ }
    }
  }, [slug, version]);

  const handleApprove = async () => {
    if (!authUser) { toast({ variant: 'destructive', title: 'Giriş gerekli', description: 'Onaylamak için giriş yapın.' }); return; }
    setApproving(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/contracts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          contractSlug: slug,
          contractTitle: contract?.title || slug,
          version,
          scrollCompleted: scrolledRef.current,
          readSeconds: readSecondsRef.current,
          method: 'button',
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.ok) {
        toast({ variant: 'destructive', title: 'Onaylanamadı', description: 'Lütfen tekrar deneyin.' });
        return;
      }
      setApproved(true);
      try { localStorage.setItem(`contract-approved-${slug}-v${version}`, new Date().toISOString()); } catch { /* noop */ }
      toast({ title: '✅ Onaylandı', description: 'Okuduğunuz ve onayladığınız kaydedildi.' });
    } catch {
      toast({ variant: 'destructive', title: 'Onaylanamadı', description: 'Bağlantı hatası.' });
    } finally {
      setApproving(false);
    }
  };

  // App settings sayfaları tasarımı: standart p-4 + Card. PublicFooter kaldırıldı
  // (settings layout zaten footer + max-w sağlar).
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contract) {
    notFound();
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label="Geri">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold font-headline">{contract.title}</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <article
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(contract.content) }}
          />
        </CardContent>
      </Card>

      {/* Okudum, Onaylıyorum — KVKK ispat kaydı (super-admin Onay Kayıtları'na düşer) */}
      <Card className={approved ? 'border-green-500/50 bg-green-50/40 dark:bg-green-900/10' : 'border-primary/30'}>
        <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          {approved ? (
            <div className="flex items-center gap-2 text-green-700 font-medium text-sm dark:text-green-300">
              <CheckCircle2 className="h-5 w-5 shrink-0" /> Bu metni okudunuz ve onayladınız. Teşekkürler.
            </div>
          ) : (
            <>
              <div className="flex-1 text-sm text-muted-foreground inline-flex items-center gap-2">
                <ScrollText className="h-4 w-4 shrink-0" />
                Metni okuduysanız onaylayın. (Onay; tarih, cihaz ve okuma süresiyle birlikte kayıt altına alınır.)
              </div>
              <Button onClick={handleApprove} disabled={approving} className="shrink-0">
                {approving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Okudum, Onaylıyorum
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
