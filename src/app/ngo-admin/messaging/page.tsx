'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Wallet, Mail, MessageSquare, MessageCircle, FileText, Filter, ChevronRight, AlertTriangle } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { messagingFetch } from '@/lib/messaging/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface MeData {
  ngoId: string;
  wallet: { balance: number; reserved: number; currency: string; lowBalanceThreshold: number };
  freeQuota: { sms: number; email: number; whatsapp: number };
}

interface CampaignRow {
  id: string;
  name?: string;
  channel?: 'sms' | 'email' | 'whatsapp';
  status?: string;
  stats?: { queued?: number; sent?: number; failed?: number };
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  scheduled: 'bg-amber-200 text-amber-800',
  sending: 'bg-violet-200 text-violet-800',
  completed: 'bg-emerald-200 text-emerald-800',
  failed: 'bg-rose-200 text-rose-800',
};

export default function NgoMessagingHub() {
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const [me, setMe] = useState<MeData | null>(null);
  const [loading, setLoading] = useState(true);

  const db = useFirestore();
  const ngoId = me?.ngoId;
  const campsQuery = useMemoFirebase(
    () => (ngoId ? query(collection(db, 'campaigns'), where('ngoId', '==', ngoId), orderBy('createdAt', 'desc'), limit(5)) : null),
    [db, ngoId]
  );
  const { data: campaigns } = useCollection<CampaignRow>(campsQuery);

  useEffect(() => {
    if (isUserLoading || !user) return;
    (async () => {
      try {
        const data = await messagingFetch<MeData>('/api/ngo-admin/messaging/me');
        setMe(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast({ variant: 'destructive', title: 'Hata', description: message });
      } finally {
        setLoading(false);
      }
    })();
  }, [user, isUserLoading, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-sm text-muted-foreground">NGO admin yetkin yok veya managedNgoId atanmamış.</p>
      </div>
    );
  }

  const balance = me.wallet.balance;
  const lowBalance = balance < me.wallet.lowBalanceThreshold;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Toplu Mesajlar</h1>
        <p className="text-muted-foreground text-sm mt-1">Destekçi, gönüllü ve ekibine SMS / e-posta / WhatsApp gönder.</p>
      </div>

      <Card className={cn('border-2', lowBalance && 'border-amber-400 bg-amber-50/40')}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-base">Cüzdan</CardTitle>
          </div>
          <Link href="/ngo-admin/messaging/wallet">
            <Button variant="outline" size="sm">Detay <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{balance.toLocaleString('tr-TR')} {me.wallet.currency}</span>
            {me.wallet.reserved > 0 && (
              <span className="text-sm text-muted-foreground">
                ({me.wallet.reserved.toLocaleString('tr-TR')} bekleyen kampanyada)
              </span>
            )}
          </div>
          {lowBalance && (
            <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Düşük bakiye eşiğine yaklaştın. Kontör satın al.
            </p>
          )}
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-muted-foreground">
            <div>SMS: {me.freeQuota.sms} ücretsiz/ay</div>
            <div>E-posta: {me.freeQuota.email} ücretsiz/ay</div>
            <div>WA: {me.freeQuota.whatsapp} ücretsiz/ay</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <QuickCTA href="/ngo-admin/messaging/campaigns/new?channel=sms" icon={MessageSquare} color="bg-blue-500" label="SMS Gönder" />
        <QuickCTA href="/ngo-admin/messaging/campaigns/new?channel=email" icon={Mail} color="bg-violet-500" label="E-posta Gönder" />
        <QuickCTA href="/ngo-admin/messaging/campaigns/new?channel=whatsapp" icon={MessageCircle} color="bg-emerald-600" label="WhatsApp Gönder" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <NavCard href="/ngo-admin/messaging/campaigns" icon={Send} label="Kampanyalar" />
        <NavCard href="/ngo-admin/messaging/templates" icon={FileText} label="Şablonlar" />
        <NavCard href="/ngo-admin/messaging/segments" icon={Filter} label="Segmentler" />
        <NavCard href="/ngo-admin/messaging/senders" icon={Wallet} label="Sender'lar" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Son Kampanyalar</CardTitle>
        </CardHeader>
        <CardContent>
          {!campaigns || campaigns.length === 0 ? (
            <p className="text-sm text-muted-foreground">Henüz kampanya yok.</p>
          ) : (
            <ul className="divide-y">
              {campaigns.map((c) => (
                <li key={c.id}>
                  <Link href={`/ngo-admin/messaging/campaigns/${c.id}`} className="flex items-center gap-3 py-2 hover:bg-muted/40 px-2 -mx-2 rounded">
                    {c.channel === 'email' ? <Mail className="h-4 w-4 text-muted-foreground" /> : c.channel === 'whatsapp' ? <MessageCircle className="h-4 w-4 text-muted-foreground" /> : <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                    <span className="flex-1 truncate text-sm">{c.name ?? c.id}</span>
                    <span className="text-xs text-muted-foreground">{c.stats?.sent ?? 0}/{c.stats?.queued ?? 0}</span>
                    <Badge className={cn('text-xs', STATUS_BADGE[c.status ?? 'draft'] ?? STATUS_BADGE.draft)}>{c.status}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function QuickCTA({ href, icon: Icon, color, label }: { href: string; icon: React.ElementType; color: string; label: string }) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="flex flex-col items-center justify-center gap-2 py-6">
          <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', color)}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm font-medium">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

function NavCard({ href, icon: Icon, label }: { href: string; icon: React.ElementType; label: string }) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="flex items-center gap-2 py-4">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}
