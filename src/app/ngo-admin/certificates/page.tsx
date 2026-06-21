'use client';

/**
 * Sertifikalarımız — aktif kurumun KAZANDIĞI ve VERDİĞİ sertifikalar.
 *
 * Kök `certificates` koleksiyonunun client okuma kuralı olmadığı için veri
 * Admin SDK üzerinden GET /api/ngo-admin/certificates ile çekilir (orgId + kind
 * aktif kurum context'inden gelir; route yetki doğrular).
 *
 * - Kazandığımız: super-admin'in bu kuruma verdiği sertifikalar.
 * - Verdiğimiz: kurumun etkinlik/akışlardan kişilere verdiği sertifikalar.
 * Her kartta başlık + tarih + mono kod + /c/{code} doğrulama linki.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, FileText, Loader2, ShieldCheck, Calendar } from 'lucide-react';
import { useUser } from '@/firebase';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';

interface CertRow {
  id: string;
  title?: string;
  eventName?: string;
  code?: string;
  date?: string;
  ngoName?: string;
  orgName?: string;
  type?: string;
  role?: string;
  description?: string;
}

function certTitle(c: CertRow): string {
  return c.title || c.eventName || 'Sertifika';
}

function CertCard({ c, accent }: { c: CertRow; accent: 'earned' | 'issued' }) {
  return (
    <Card className="rounded-2xl border-black/5 shadow-sm overflow-hidden">
      <CardContent className="p-5 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div
            className={
              accent === 'earned'
                ? 'h-10 w-10 shrink-0 rounded-xl bg-[#f34723]/10 flex items-center justify-center'
                : 'h-10 w-10 shrink-0 rounded-xl bg-muted flex items-center justify-center'
            }
          >
            {accent === 'earned' ? (
              <Award className="h-5 w-5 text-[#f34723]" />
            ) : (
              <FileText className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm leading-tight">{certTitle(c)}</h3>
            {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{c.description}</p>}
            {c.ngoName && accent === 'issued' && (
              <p className="text-[11px] text-muted-foreground mt-1 truncate">{c.ngoName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
          {c.date && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {c.date}
            </span>
          )}
        </div>

        {c.code && (
          <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2">
            <span className="font-mono text-xs font-bold tracking-wider truncate">{c.code}</span>
            <Link
              href={`/c/${encodeURIComponent(c.code)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#f34723] hover:underline shrink-0"
            >
              <ShieldCheck className="h-3.5 w-3.5" /> Doğrula
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="rounded-[2rem] border-black/5 shadow-xl">
      <CardContent className="p-16 text-center text-muted-foreground">
        <Award className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="italic">{message}</p>
      </CardContent>
    </Card>
  );
}

export default function OrgCertificatesPage() {
  const { user } = useUser();
  const { id: orgId, kind, isLoading: entityLoading } = useActiveEntity();

  const [earned, setEarned] = useState<CertRow[]>([]);
  const [issued, setIssued] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (entityLoading) return;
    if (!user || !orgId || !kind) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch(
          `/api/ngo-admin/certificates?orgId=${encodeURIComponent(orgId)}&kind=${encodeURIComponent(kind)}`,
          { headers: { Authorization: `Bearer ${idToken}` } },
        );
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; earned?: CertRow[]; issued?: CertRow[]; message?: string }
          | null;
        if (cancelled) return;
        if (!res.ok || !data?.ok) {
          setError(data?.message ?? 'Sertifikalar yüklenemedi.');
          setEarned([]);
          setIssued([]);
        } else {
          setEarned(data.earned ?? []);
          setIssued(data.issued ?? []);
        }
      } catch {
        if (!cancelled) setError('Sertifikalar yüklenemedi.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, orgId, kind, entityLoading]);

  if (entityLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Sertifikalar Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f] flex items-center gap-2">
          <Award className="h-7 w-7 text-[#f34723]" /> Sertifikalarımız
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Kurumunuzun hangel'den kazandığı sertifikalar ve kurumunuzun gönüllülere/katılımcılara verdiği sertifikalar.
        </p>
      </div>

      {error && (
        <Card className="rounded-2xl border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm font-medium text-destructive">{error}</CardContent>
        </Card>
      )}

      <Tabs defaultValue="earned" className="w-full">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="earned" className="rounded-xl font-bold">
            Kazandığımız ({earned.length})
          </TabsTrigger>
          <TabsTrigger value="issued" className="rounded-xl font-bold">
            Verdiğimiz ({issued.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="earned" className="mt-4">
          {earned.length === 0 ? (
            <EmptyState message="Henüz kurumunuza verilmiş bir sertifika yok." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {earned.map((c) => (
                <CertCard key={c.id} c={c} accent="earned" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="issued" className="mt-4">
          {issued.length === 0 ? (
            <EmptyState message="Kurumunuz henüz kimseye sertifika vermedi." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {issued.map((c) => (
                <CertCard key={c.id} c={c} accent="issued" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
