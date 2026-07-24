'use client';

/**
 * /ngo-admin/whatsapp-business/numbers
 *
 * STK'nın WhatsApp Business (WABA) numaralarının yönetim sayfası.
 *
 * Kart-grid: her numara için
 *   - büyük telefon numarası (E.164)
 *   - displayName + displayNameStatus rozeti (Onay Bekliyor / Onaylı / Reddedildi)
 *   - quality rating rozeti (Yüksek / Orta / Düşük / Bilinmiyor)
 *   - "Ayrıntı" + "Pasif" aksiyon butonları
 * Üstte "+ Yeni Numara Bağla" butonu — /numbers/new wizard'ına yönlendirir.
 *
 * Veriyi GET /api/ngo-admin/whatsapp-business/numbers'tan çeker (Bearer auth).
 * Pasif al = DELETE /api/ngo-admin/whatsapp-business/numbers/[id] (soft delete).
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Phone,
  PauseCircle,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldQuestion,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import { cn } from '@/lib/utils';

const HANGEL_ORANGE = '#f34723';

interface WabaNumber {
  id: string;
  phoneNumber: string;
  wabaPhoneNumberId: string;
  wabaAccountId: string;
  displayName: string;
  displayNameStatus: string;
  qualityRating: string | null;
  monthlyTier: string | null;
  status: string;
  verifiedAt: string | null;
  createdAt: string | null;
}

function DisplayNameBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
        <CheckCircle2 className="h-3 w-3" /> Onaylı
      </Badge>
    );
  }
  if (status === 'rejected') {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 gap-1">
        <XCircle className="h-3 w-3" /> Reddedildi
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200 gap-1">
      <Clock className="h-3 w-3" /> Onay Bekliyor
    </Badge>
  );
}

function QualityBadge({ quality }: { quality: string | null }) {
  if (!quality || quality === 'UNKNOWN') {
    return (
      <Badge variant="outline" className="gap-1 text-muted-foreground">
        <ShieldQuestion className="h-3 w-3" /> Kalite: Bilinmiyor
      </Badge>
    );
  }
  const map: Record<string, { label: string; className: string }> = {
    GREEN: { label: 'Yüksek', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    YELLOW: { label: 'Orta', className: 'bg-amber-100 text-amber-800 border-amber-200' },
    RED: { label: 'Düşük', className: 'bg-red-100 text-red-700 border-red-200' },
  };
  const entry = map[quality.toUpperCase()] ?? { label: quality, className: '' };
  return (
    <Badge variant="outline" className={cn('gap-1', entry.className)}>
      Kalite: {entry.label}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'paused') {
    return (
      <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 gap-1">
        <PauseCircle className="h-3 w-3" /> Pasif
      </Badge>
    );
  }
  if (status === 'suspended') {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 gap-1">
        <AlertCircle className="h-3 w-3" /> Askıda
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
      <CheckCircle2 className="h-3 w-3" /> Aktif
    </Badge>
  );
}

export default function WhatsAppBusinessNumbersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, isUserLoading } = useUser();
  const { id: ngoId, isLoading: entityLoading, withEntityHeaders } = useActiveEntity();

  const [numbers, setNumbers] = useState<WabaNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [pauseTarget, setPauseTarget] = useState<WabaNumber | null>(null);
  const [pausing, setPausing] = useState(false);

  const fetchNumbers = useCallback(async () => {
    if (!authUser) return;
    setLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/ngo-admin/whatsapp-business/numbers', withEntityHeaders({
        headers: { Authorization: `Bearer ${token}` },
      }));
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { message?: string } | null;
        toast({
          variant: 'destructive',
          title: 'Numaralar yüklenemedi',
          description: data?.message,
        });
        return;
      }
      const data = (await res.json()) as { numbers: WabaNumber[] };
      setNumbers(data.numbers ?? []);
    } finally {
      setLoading(false);
    }
  }, [authUser, toast, withEntityHeaders]);

  useEffect(() => {
    fetchNumbers();
  }, [fetchNumbers]);

  async function handlePause() {
    if (!pauseTarget || !authUser) return;
    setPausing(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/ngo-admin/whatsapp-business/numbers/${pauseTarget.id}`, withEntityHeaders({
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }));
      if (!res.ok) {
        const data = await res.json().catch(() => null) as { message?: string } | null;
        toast({
          variant: 'destructive',
          title: 'Pasif alma başarısız',
          description: data?.message,
        });
        return;
      }
      toast({ title: 'Numara pasif alındı', description: pauseTarget.phoneNumber });
      setPauseTarget(null);
      await fetchNumbers();
    } finally {
      setPausing(false);
    }
  }

  const sortedNumbers = useMemo(() => {
    return [...numbers].sort((a, b) => {
      // Aktif olanlar üstte, pasifler altta.
      if (a.status !== b.status) {
        if (a.status === 'active') return -1;
        if (b.status === 'active') return 1;
      }
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });
  }, [numbers]);

  if (isUserLoading || entityLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!authUser || !ngoId) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <p className="text-sm text-muted-foreground">
          WABA numaralarını yönetebilmek için bir STK yöneticisi olarak oturum açmalısınız.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-4">
      <Link
        href="/ngo-admin"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Yönetim Paneli
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline flex items-center gap-2">
            <MessageCircle className="h-6 w-6" style={{ color: HANGEL_ORANGE }} />
            whatsapp business numaraları
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            STK'nızın bağlı WhatsApp Business numaralarını yönetin. Her numarayla ayrı şablonlar,
            konuşmalar ve gönderim kotaları tanımlayabilirsiniz.
          </p>
        </div>
        <Button
          onClick={() => router.push('/ngo-admin/whatsapp-business/numbers/new')}
          className="gap-2 text-white"
          style={{ backgroundColor: HANGEL_ORANGE }}
        >
          <Plus className="h-4 w-4" /> Yeni Numara Bağla
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : sortedNumbers.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <MessageCircle className="h-10 w-10 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-base font-semibold">Henüz bağlı numara yok</p>
              <p className="text-sm text-muted-foreground">
                Toplu WhatsApp gönderimi ve müşteri görüşmelerine başlamak için Meta Business
                Manager üzerinden bir WABA numarası bağlayın.
              </p>
            </div>
            <Button
              onClick={() => router.push('/ngo-admin/whatsapp-business/numbers/new')}
              className="gap-2 text-white"
              style={{ backgroundColor: HANGEL_ORANGE }}
            >
              <Plus className="h-4 w-4" /> İlk Numarayı Bağla
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedNumbers.map((n) => {
            const isPaused = n.status === 'paused';
            return (
              <Card
                key={n.id}
                className={cn(
                  'transition',
                  isPaused && 'opacity-70',
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-xl font-bold flex items-center gap-2 break-all">
                        <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {n.phoneNumber || '—'}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground break-words">
                        {n.displayName || 'İsim atanmamış'}
                      </p>
                    </div>
                    <StatusBadge status={n.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <DisplayNameBadge status={n.displayNameStatus} />
                    <QualityBadge quality={n.qualityRating} />
                    {n.monthlyTier && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Aylık tier: {n.monthlyTier}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p className="break-all">
                      <span className="font-medium">Phone Number ID:</span>{' '}
                      <span className="font-mono">{n.wabaPhoneNumberId}</span>
                    </p>
                    <p className="break-all">
                      <span className="font-medium">WABA ID:</span>{' '}
                      <span className="font-mono">{n.wabaAccountId}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-muted-foreground"
                      disabled={isPaused}
                      onClick={() => setPauseTarget(n)}
                    >
                      <PauseCircle className="h-3.5 w-3.5" />
                      {isPaused ? 'Pasif' : 'Pasif Al'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!pauseTarget} onOpenChange={(open) => !open && !pausing && setPauseTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Numarayı pasif al</DialogTitle>
            <DialogDescription>
              {pauseTarget?.phoneNumber} numarası pasif alınacak. Gönderim ve gelen mesajlar
              durdurulur; bağlantı bilgileriniz korunur, daha sonra tekrar aktif edebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setPauseTarget(null)}
              disabled={pausing}
            >
              Vazgeç
            </Button>
            <Button
              onClick={handlePause}
              disabled={pausing}
              className="text-white"
              style={{ backgroundColor: HANGEL_ORANGE }}
            >
              {pausing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PauseCircle className="mr-2 h-4 w-4" />}
              Pasif Al
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
