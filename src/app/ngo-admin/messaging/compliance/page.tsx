'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useUser, useMemoFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArrowLeft, Shield, AlertTriangle, CheckCircle, TrendingDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustDoc {
  sent7d?: number;
  bounces7d?: number;
  complaints7d?: number;
  optOuts7d?: number;
  bounceRate?: number;
  complaintRate?: number;
  optOutRate?: number;
  score?: number;
  throttleMultiplier?: number;
  lastComputedAt?: { toDate?: () => Date };
}

function levelFor(score: number): { label: string; color: string; icon: React.ElementType } {
  if (score >= 80) return { label: 'Mükemmel', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle };
  if (score >= 60) return { label: 'İyi', color: 'bg-sky-100 text-sky-800', icon: Shield };
  if (score >= 40) return { label: 'Dikkat', color: 'bg-amber-100 text-amber-800', icon: AlertTriangle };
  return { label: 'Risk', color: 'bg-rose-100 text-rose-800', icon: TrendingDown };
}

export default function CompliancePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [ngoId, setNgoId] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading || !user) return;
    (async () => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data() as { managedNgoId?: string };
        if (data.managedNgoId) setNgoId(data.managedNgoId);
      }
    })();
  }, [user, isUserLoading, db]);

  const trustRef = useMemoFirebase(
    () => (ngoId ? doc(db, 'ngoTrustScores', ngoId) : null),
    [db, ngoId]
  );
  const { data, isLoading } = useDoc<TrustDoc>(trustRef);

  if (isLoading || !ngoId) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const score = data?.score ?? 100;
  const level = levelFor(score);
  const Icon = level.icon;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-4">
      <Link href="/ngo-admin/messaging" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Toplu Mesajlar
      </Link>

      <div>
        <h1 className="text-2xl font-bold font-headline">Compliance & Trust</h1>
        <p className="text-muted-foreground text-sm mt-1">Son 7 günün metrikleri ve sistemdeki güven skorun.</p>
      </div>

      <Card className={cn('border-2', score >= 60 ? 'border-emerald-200' : score >= 40 ? 'border-amber-300' : 'border-rose-300')}>
        <CardHeader className="flex flex-row items-center gap-2">
          <Icon className="h-6 w-6 text-muted-foreground" />
          <CardTitle className="text-lg">Trust Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold">{score}</span>
            <Badge className={cn('text-sm', level.color)}>{level.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Throttle çarpanı: <strong>×{data?.throttleMultiplier ?? 1.0}</strong>
            {(data?.throttleMultiplier ?? 1.0) < 1.0 && (
              <span className="ml-1 text-amber-700">(gönderim hızı düşürülmüş)</span>
            )}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="Gönderildi (7g)" value={data?.sent7d ?? 0} />
        <Stat label="Bounce" value={data?.bounces7d ?? 0} pct={data?.bounceRate} accent="amber" />
        <Stat label="Şikayet" value={data?.complaints7d ?? 0} pct={data?.complaintRate} accent="rose" />
        <Stat label="Opt-out" value={data?.optOuts7d ?? 0} pct={data?.optOutRate} />
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6 space-y-2 text-xs text-muted-foreground">
          <p><strong>Skor nasıl hesaplanır?</strong> Son 7 gün üzerinden bounce, şikayet ve opt-out oranlarına göre 100'den aşağı düşer.</p>
          <p>Score &lt; 60 olursa sistemin gönderim hızı NGO için otomatik düşürülür. Bu kalıcı bir ceza değil — pratiğin düzelirse skor zamanla geri yükselir.</p>
          <p>KVKK uyumluluğu için: pazarlama mesajlarını sadece izinli kullanıcılara gönder, içerik kalitesini koru, şikayet alındığında derhal ilgili gruptan çıkar.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label, value, pct, accent,
}: { label: string; value: number; pct?: number; accent?: 'amber' | 'rose' }) {
  const cls = accent === 'amber' ? 'text-amber-700' : accent === 'rose' ? 'text-rose-700' : '';
  return (
    <div className="p-3 rounded border bg-card text-center">
      <p className={cn('text-xl font-bold', cls)}>{value.toLocaleString('tr-TR')}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {typeof pct === 'number' && pct > 0 && (
        <p className="text-xs text-muted-foreground mt-0.5">%{(pct * 100).toFixed(2)}</p>
      )}
    </div>
  );
}
