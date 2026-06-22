'use client';

import { contractsData } from '@/lib/contracts';
import { notFound, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, ScrollText, ChevronLeft, ChevronRight, FileClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo, useState, useEffect, useRef } from 'react';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { looksLikeHtml, renderMarkdownToSafeHtml } from '@/lib/contracts/markdown';
import { useToast } from '@/hooks/use-toast';
import { COLLECTIONS } from '@/firebase/collections';
import { ContractTOC } from './_components/contract-toc';
import { ContractActions } from './_components/contract-actions';
import { ContractBanner } from './_components/contract-banner';

interface FirestoreContract {
  slug: string;
  title: string;
  content: string;
  version?: string;
  effectiveDate?: string | null;
  lastUpdated?: string | null;
  status?: 'published' | 'draft' | 'archived';
  jurisdictionLabel?: string;
}

interface ContractCompliance {
  percent?: number;
}

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const db = useFirestore();

  // Firestore — super-admin tarafından düzenlenmiş içerik (varsa öncelik).
  const contractDocRef = useMemoFirebase(() => {
    if (!db || !slug) return null;
    return doc(db, COLLECTIONS.contracts, slug);
  }, [db, slug]);
  const { data: firestoreContract, isLoading } = useDoc<FirestoreContract>(contractDocRef);

  // Compliance (opsiyonel, yoksa rozet gizlenir).
  const complianceDocRef = useMemoFirebase(() => {
    if (!db || !slug) return null;
    return doc(db, 'contractCompliance', slug);
  }, [db, slug]);
  const { data: complianceDoc } = useDoc<ContractCompliance>(complianceDocRef);

  // Code-içi fallback. Firestore doc'u varsa (içerik boş bile olsa) onu
  // kullan — başlık + banner + empty-state göster. 112 sözleşmenin çoğu
  // master-sync ile yazıldı, slug'lar `contractsData` ile birebir uyuşmuyor;
  // önce Firestore mevcudiyetine bakıp aksi halde lokal seed'e düş.
  const contract = useMemo(() => {
    if (firestoreContract) {
      if (firestoreContract.content) return firestoreContract;
      // Doc var ama content henüz yazılmadı — seed fallback'ı dene, yoksa
      // yine de Firestore meta'sıyla (title vb.) banner'ı göstermek için
      // bu objeyi döndür.
      const seed = contractsData.find(c => c.slug === slug);
      return seed ?? firestoreContract;
    }
    return contractsData.find(c => c.slug === slug) || null;
  }, [firestoreContract, slug]);

  // Prev/Next — kod içi master listeden derive et.
  const { prev, next } = useMemo(() => {
    const idx = contractsData.findIndex(c => c.slug === slug);
    if (idx === -1) return { prev: null, next: null };
    return {
      prev: idx > 0 ? contractsData[idx - 1] : null,
      next: idx < contractsData.length - 1 ? contractsData[idx + 1] : null,
    };
  }, [slug]);

  // Firestore'da (master-sync ile) `content` raw markdown olarak duruyor; eski
  // `contractsData` fallback'i ise HTML. Markdown gelirse önce HTML'e çevir,
  // sonra her durumda sanitize edip render et — aksi halde markdown sentaksı
  // (#, |, **) plain text olarak görünüp sayfa "boş" izlenimi veriyordu.
  const sanitizedHtml = useMemo(() => {
    const raw = contract?.content;
    if (!raw) return '';
    const html = looksLikeHtml(raw) ? raw : renderMarkdownToSafeHtml(raw);
    return sanitizeHtml(html);
  }, [contract?.content]);

  const articleRef = useRef<HTMLElement | null>(null);

  // --- "Okudum, Onaylıyorum" KVKK ispat kaydı ---
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const version = firestoreContract?.version || '1.0';
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
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
      toast({ title: 'Onaylandı', description: 'Okuduğunuz ve onayladığınız kaydedildi.' });
    } catch {
      toast({ variant: 'destructive', title: 'Onaylanamadı', description: 'Bağlantı hatası.' });
    } finally {
      setApproving(false);
    }
  };

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in-0 max-w-7xl mx-auto contract-page">
      {/* Top bar — back + actions */}
      <div className="flex items-center justify-between gap-2 print:hidden">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <ContractActions title={contract.title} shareText={`hangel — ${contract.title}`} />
      </div>

      <ContractBanner
        title={contract.title}
        eyebrow="hangel · sözleşme"
        jurisdiction={firestoreContract?.jurisdictionLabel || 'Türkiye (KVKK)'}
        version={version}
        effectiveDate={firestoreContract?.effectiveDate ?? null}
        lastUpdated={firestoreContract?.lastUpdated ?? null}
        status={firestoreContract?.status || 'published'}
        compliancePercent={complianceDoc?.percent ?? null}
      />

      {/* Body grid: sidebar TOC + article */}
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <ContractTOC html={sanitizedHtml} articleRef={articleRef} />

        <div className="space-y-6 min-w-0">
          <div className="glass rounded-3xl p-5 sm:p-8 shadow-glass-soft print:shadow-none print:rounded-none print:p-0 print:bg-white">
            {sanitizedHtml ? (
              <article
                ref={articleRef}
                className="prose prose-sm sm:prose-base dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-headline prose-a:text-primary prose-code:before:content-none prose-code:after:content-none prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-pre:rounded-xl prose-table:text-sm prose-th:bg-muted/50"
                dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
              />
            ) : (
              // Doc Firestore'da var ama content boş — admin metni eklemeden
              // yayına aldığında 404 yerine açıklayıcı durum göster.
              <div className="text-center py-12 space-y-2">
                <FileClock className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Bu sözleşmenin içeriği henüz yüklenmedi. Hukuk ekibi en kısa sürede yayınlayacaktır.
                </p>
              </div>
            )}
          </div>

          {/* Okudum, Onaylıyorum — KVKK ispat kaydı */}
          <div
            className={`glass-thin rounded-2xl p-4 sm:p-5 print:hidden ${
              approved ? 'ring-1 ring-emerald-400/40' : 'ring-1 ring-primary/20'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              {approved ? (
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-medium text-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0" /> Bu metni okudunuz ve onayladınız. Teşekkürler.
                </div>
              ) : (
                <>
                  <div className="flex-1 text-sm text-muted-foreground inline-flex items-start gap-2">
                    <ScrollText className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      Metni okuduysanız onaylayın. Onay; tarih, cihaz ve okuma süresiyle birlikte kayıt altına alınır.
                    </span>
                  </div>
                  <Button onClick={handleApprove} disabled={approving} className="shrink-0">
                    {approving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Okudum, Onaylıyorum
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Prev / Next nav */}
          {(prev || next) && (
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-3 print:hidden">
              {prev ? (
                <Link
                  href={`/settings/contracts/${prev.slug}`}
                  className="glass-thin rounded-2xl p-4 flex items-center gap-3 hover:bg-accent/40 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Önceki</div>
                    <div className="text-sm font-medium truncate">{prev.title}</div>
                  </div>
                </Link>
              ) : <div />}
              {next ? (
                <Link
                  href={`/settings/contracts/${next.slug}`}
                  className="glass-thin rounded-2xl p-4 flex items-center justify-end gap-3 text-right hover:bg-accent/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Sonraki</div>
                    <div className="text-sm font-medium truncate">{next.title}</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-primary shrink-0" />
                </Link>
              ) : <div />}
            </nav>
          )}

          {/* Footer — draft/last-update.
              "Sürüm geçmişi" linki kaldırıldı: /settings/contracts/[slug]/history
              rotası yok (404 olurdu). Geçmiş sayfası eklenince geri getirilebilir. */}
          <footer className="text-xs text-muted-foreground flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
            <span className="inline-flex items-center gap-1.5">
              <FileClock className="h-3.5 w-3.5" />
              {firestoreContract?.status === 'draft'
                ? 'Bu metin taslak aşamasındadır — yayın öncesi son inceleme bekleniyor.'
                : 'Bu metin yayınlanmış sürümdür.'}
            </span>
            {firestoreContract?.lastUpdated && (
              <span>· Son güncelleme: {firestoreContract.lastUpdated}</span>
            )}
          </footer>
        </div>
      </div>

      {/* Print-only header — A4 friendly. */}
      <div className="hidden print:block print:fixed print:top-0 print:left-0 print:right-0 print:text-[10px] print:text-gray-500 print:px-6 print:py-2 print:border-b">
        hangel · {contract.title} · v{version}
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 18mm 16mm; }
          html, body { background: #ffffff !important; }
          .contract-page { max-width: 100% !important; padding: 0 !important; }
          .prose { color: #111 !important; }
          .prose a { color: #111 !important; text-decoration: underline; }
          .prose pre, .prose code { background: #f4f4f5 !important; color: #111 !important; }
          .prose h1, .prose h2, .prose h3 { break-after: avoid; page-break-after: avoid; }
          .prose img, .prose table, .prose pre { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
