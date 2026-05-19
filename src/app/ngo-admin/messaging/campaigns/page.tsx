'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, orderBy, query, where, getDoc, doc } from 'firebase/firestore';
import { ArrowLeft, Plus, Send, Mail, MessageSquare, MessageCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { COLLECTIONS } from '@/firebase/collections';

interface CampaignRow {
  id: string;
  name?: string;
  channel?: string;
  status?: string;
  createdAt?: { toDate?: () => Date };
  stats?: { queued?: number; sent?: number; failed?: number };
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  scheduled: 'bg-amber-200 text-amber-800',
  sending: 'bg-violet-200 text-violet-800',
  completed: 'bg-emerald-200 text-emerald-800',
  failed: 'bg-rose-200 text-rose-800',
};

export default function NgoCampaignsListPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [ngoId, setNgoId] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading || !user) return;
    (async () => {
      const snap = await getDoc(doc(db, COLLECTIONS.users, user.uid));
      if (snap.exists()) {
        const data = snap.data() as { managedNgoId?: string };
        if (data.managedNgoId) setNgoId(data.managedNgoId);
      }
    })();
  }, [user, isUserLoading, db]);

  const q = useMemoFirebase(
    () =>
      ngoId
        ? query(collection(db, COLLECTIONS.campaigns), where('ngoId', '==', ngoId), orderBy('createdAt', 'desc'))
        : null,
    [db, ngoId]
  );
  const { data, isLoading } = useCollection<CampaignRow>(q);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
      <Link href="/ngo-admin/messaging" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Toplu Mesajlar
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Kampanyalar</h1>
          <p className="text-muted-foreground text-sm mt-1">NGO'nun gönderdiği toplu mesajlar.</p>
        </div>
        <Link href="/ngo-admin/messaging/campaigns/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Yeni Kampanya
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader />
        <CardContent>
          {isLoading || !ngoId ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Henüz kampanya yok.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {data.map((c) => (
                <li key={c.id}>
                  <Link href={`/ngo-admin/messaging/campaigns/${c.id}`} className="flex items-center gap-3 py-3 px-2 -mx-2 rounded hover:bg-muted/40">
                    {c.channel === 'email' ? <Mail className="h-5 w-5 text-muted-foreground" /> : c.channel === 'whatsapp' ? <MessageCircle className="h-5 w-5 text-muted-foreground" /> : <MessageSquare className="h-5 w-5 text-muted-foreground" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{c.name ?? c.id}</div>
                      <div className="text-xs text-muted-foreground">{c.stats?.sent ?? 0}/{c.stats?.queued ?? 0}</div>
                    </div>
                    <Badge className={cn('text-xs', STATUS_BADGE[c.status ?? 'draft'])}>{c.status}</Badge>
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
