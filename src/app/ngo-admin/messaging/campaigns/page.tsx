'use client';

/**
 * NGO admin kampanyalar listesi.
 *
 * - Mevcut kullanıcının `managedNgoId` üzerinden scope edilir.
 * - NGO admin değilse `/market`'e yönlendirilir.
 * - Kolonlar: name, channel, status, sent count, sent at, view link.
 * - Hiç kampanya yoksa `EmptyState` gösterilir.
 *
 * NOT: Campaign dokümanları `ngoId` (legacy field) ile yazılır (bkz.
 * `src/app/api/ngo-admin/messaging/campaigns/route.ts`). Spec'te `scopedNgoId`
 * geçse de storage adı `ngoId`.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, orderBy, query, where, limit, getDoc, doc } from 'firebase/firestore';
import {
  ArrowLeft, Plus, Send, Mail, MessageSquare, MessageCircle, Loader2, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { COLLECTIONS } from '@/firebase/collections';

interface CampaignRow {
  id: string;
  name?: string;
  channel?: 'sms' | 'email' | 'whatsapp';
  status?: string;
  createdAt?: { toDate?: () => Date };
  completedAt?: { toDate?: () => Date };
  stats?: { queued?: number; sent?: number; failed?: number; delivered?: number };
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  scheduled: 'bg-amber-200 text-amber-800',
  queued: 'bg-blue-200 text-blue-800',
  sending: 'bg-violet-200 text-violet-800',
  completed: 'bg-emerald-200 text-emerald-800',
  failed: 'bg-rose-200 text-rose-800',
};

function formatDate(ts?: { toDate?: () => Date }): string {
  if (!ts?.toDate) return '—';
  try {
    return ts.toDate().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return '—';
  }
}

function ChannelIcon({ channel }: { channel?: string }) {
  if (channel === 'email') return <Mail className="h-4 w-4 text-muted-foreground" />;
  if (channel === 'whatsapp') return <MessageCircle className="h-4 w-4 text-muted-foreground" />;
  return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
}

export default function NgoCampaignsListPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const db = useFirestore();
  const [ngoId, setNgoId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.replace('/market');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, COLLECTIONS.users, user.uid));
        if (cancelled) return;
        const data = snap.exists() ? (snap.data() as { managedNgoId?: string; role?: string }) : null;
        if (!data?.managedNgoId) {
          router.replace('/market');
          return;
        }
        setNgoId(data.managedNgoId);
      } finally {
        if (!cancelled) setResolving(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, isUserLoading, db, router]);

  const q = useMemoFirebase(
    () =>
      ngoId
        ? query(
            collection(db, COLLECTIONS.campaigns),
            where('ngoId', '==', ngoId),
            orderBy('createdAt', 'desc'),
            limit(50)
          )
        : null,
    [db, ngoId]
  );
  const { data, isLoading } = useCollection<CampaignRow>(q);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
      <Link
        href="/ngo-admin/messaging"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Toplu Mesajlar
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Kampanyalar</h1>
          <p className="text-muted-foreground text-sm mt-1">
            NGO'nun gönderdiği toplu mesajlar.
          </p>
        </div>
        <Link href="/ngo-admin/messaging/campaigns/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Yeni Kampanya
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {resolving || isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !data || data.length === 0 ? (
            <EmptyState
              icon={Send}
              title="Henüz kampanya yok"
              description="İlk toplu mesajını oluşturmak için aşağıdaki butona tıkla."
              action={{ label: 'Yeni Kampanya', href: '/ngo-admin/messaging/campaigns/new' }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Kampanya</th>
                    <th className="text-left px-4 py-2 font-medium">Kanal</th>
                    <th className="text-left px-4 py-2 font-medium">Durum</th>
                    <th className="text-right px-4 py-2 font-medium">Gönderildi</th>
                    <th className="text-left px-4 py-2 font-medium">Tarih</th>
                    <th className="px-4 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((c) => {
                    const sent = c.stats?.sent ?? 0;
                    const queued = c.stats?.queued ?? 0;
                    const sentAt = c.completedAt ?? c.createdAt;
                    return (
                      <tr key={c.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <Link
                            href={`/ngo-admin/messaging/campaigns/${c.id}`}
                            className="font-medium hover:underline"
                          >
                            {c.name ?? c.id}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5">
                            <ChannelIcon channel={c.channel} />
                            <span className="uppercase text-xs">{c.channel ?? '—'}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={cn('text-xs', STATUS_BADGE[c.status ?? 'draft'])}>
                            {c.status ?? 'draft'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs">
                          {sent.toLocaleString('tr-TR')}
                          {queued > 0 && (
                            <span className="text-muted-foreground"> / {queued.toLocaleString('tr-TR')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(sentAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/ngo-admin/messaging/campaigns/${c.id}`}
                            aria-label="Detay"
                            className="text-muted-foreground hover:text-foreground inline-flex"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
