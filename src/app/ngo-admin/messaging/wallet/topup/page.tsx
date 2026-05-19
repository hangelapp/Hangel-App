'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Coins, Loader2, ShoppingCart } from 'lucide-react';
import { messagingFetch } from '@/lib/messaging/client';
import { cn } from '@/lib/utils';
import { COLLECTIONS } from '@/firebase/collections';

interface Package {
  id: string;
  name?: string;
  amount?: number;
  units?: number;
  bonus?: number;
  description?: string;
  active?: boolean;
}

export default function TopupPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [submitting, setSubmitting] = useState<string | null>(null);

  const q = useMemoFirebase(
    () => query(collection(db, COLLECTIONS.messagingPackages), where('active', '==', true)),
    [db]
  );
  const { data, isLoading } = useCollection<Package>(q);

  const handleBuy = async (pkg: Package) => {
    if (!pkg.id || !pkg.amount) return;
    setSubmitting(pkg.id);
    try {
      const result = await messagingFetch<{ orderId: string; redirectUrl: string }>(
        '/api/ngo-admin/messaging/wallet/topup',
        {
          method: 'POST',
          body: JSON.stringify({ packageId: pkg.id, amount: pkg.amount }),
        }
      );
      // eslint-disable-next-line react-hooks/immutability -- intentional external navigation, no React state involved
      window.location.href = result.redirectUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
      setSubmitting(null);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-4">
      <Link href="/ngo-admin/messaging/wallet" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Cüzdan
      </Link>

      <div>
        <h1 className="text-2xl font-bold font-headline">Kontör Yükle</h1>
        <p className="text-muted-foreground text-sm mt-1">Bir paket seç. Ödeme N-Kolay üzerinden 3D Secure ile yapılır.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Şu an satışta paket yok. Süper admin'le iletişime geç.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.map((pkg) => (
            <Card key={pkg.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-amber-500" />
                  <CardTitle className="text-base">{pkg.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="text-3xl font-bold">{(pkg.amount ?? 0).toLocaleString('tr-TR')} TRY</div>
                <p className="text-xs text-muted-foreground mt-1">KDV dahil</p>
                {pkg.bonus && pkg.bonus > 0 && (
                  <Badge className="mt-2 bg-emerald-100 text-emerald-800 self-start">+%{pkg.bonus} bonus</Badge>
                )}
                {pkg.description && (
                  <p className="text-xs text-muted-foreground mt-3">{pkg.description}</p>
                )}
                <Button
                  onClick={() => handleBuy(pkg)}
                  disabled={submitting === pkg.id || submitting !== null}
                  className={cn('mt-auto', submitting === pkg.id && 'opacity-50')}
                >
                  {submitting === pkg.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  Satın Al
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="pt-6 text-xs text-muted-foreground space-y-1">
          <p>• Ödeme başarılı olduğunda kontör cüzdanına otomatik yüklenir.</p>
          <p>• E-arşiv fatura e-postanıza gönderilir.</p>
          <p>• İptal/iade için süper admin ile iletişime geçin.</p>
        </CardContent>
      </Card>
    </div>
  );
}
