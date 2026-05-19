'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, orderBy, query, where, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Wallet, Loader2, Plus } from 'lucide-react';
import { messagingFetch } from '@/lib/messaging/client';
import { cn } from '@/lib/utils';
import { COLLECTIONS } from '@/firebase/collections';

interface Tx {
  id: string;
  type?: string;
  amount?: number;
  balanceAfter?: number;
  channel?: string | null;
  campaignId?: string | null;
  notes?: string | null;
  createdAt?: { toDate?: () => Date };
}

interface MeData {
  wallet: { balance: number; reserved: number; currency: string };
}

export default function NgoWalletPage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);
  const db = useFirestore();
  const [ngoId, setNgoId] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading || !user) return;
    (async () => {
      try {
        const data = await messagingFetch<{ ngoId: string; wallet: MeData['wallet'] }>(
          '/api/ngo-admin/messaging/me'
        );
        setMe({ wallet: data.wallet });
        setNgoId(data.ngoId);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast({ variant: 'destructive', title: 'Hata', description: message });
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isUserLoading, toast]);

  const txQuery = useMemoFirebase(
    () =>
      ngoId
        ? query(collection(db, COLLECTIONS.messagingTransactions), where('ngoId', '==', ngoId), orderBy('createdAt', 'desc'), limit(100))
        : null,
    [db, ngoId]
  );
  const { data: transactions } = useCollection<Tx>(txQuery);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!me) return null;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-3xl space-y-4">
      <Link href="/ngo-admin/messaging" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Toplu Mesajlar
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">Cüzdan</CardTitle>
          </div>
          <Link href="/ngo-admin/messaging/wallet/topup">
            <Button><Plus className="h-4 w-4 mr-2" /> Kontör Yükle</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">{me.wallet.balance.toLocaleString('tr-TR')} {me.wallet.currency}</div>
          {me.wallet.reserved > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {me.wallet.reserved.toLocaleString('tr-TR')} {me.wallet.currency} bekleyen kampanyalarda rezerve
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hareketler</CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz hareket yok.</p>
          ) : (
            <ul className="divide-y text-sm">
              {transactions.map((t) => (
                <li key={t.id} className="py-2 flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">{t.type}</Badge>
                  <span className="flex-1 truncate text-xs text-muted-foreground">
                    {t.channel && <span>{t.channel} · </span>}
                    {t.campaignId && <span>kampanya: {t.campaignId.slice(0, 8)}... · </span>}
                    {t.notes ?? ''}
                  </span>
                  <span className={cn('font-mono text-sm', (t.amount ?? 0) > 0 ? 'text-emerald-700' : 'text-rose-700')}>
                    {(t.amount ?? 0) > 0 ? '+' : ''}{(t.amount ?? 0).toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
