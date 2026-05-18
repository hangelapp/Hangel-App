'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { Plus, Send, Mail, MessageSquare, Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CampaignRow {
  id: string;
  name?: string;
  channel?: 'sms' | 'email';
  useCase?: string;
  status?: string;
  createdAt?: { toDate?: () => Date } | null;
  stats?: { queued?: number; sent?: number; failed?: number };
  recipients?: { afterConsentFilter?: number };
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  scheduled: 'bg-amber-200 text-amber-800',
  enqueuing: 'bg-blue-200 text-blue-800',
  sending: 'bg-violet-200 text-violet-800',
  completed: 'bg-emerald-200 text-emerald-800',
  failed: 'bg-rose-200 text-rose-800',
  cancelled: 'bg-gray-300 text-gray-700',
};

export default function CampaignsListPage() {
  const db = useFirestore();
  const q = useMemoFirebase(
    () => query(collection(db, 'campaigns'), orderBy('createdAt', 'desc')),
    [db]
  );
  const { data, isLoading } = useCollection<CampaignRow>(q);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (channelFilter !== 'all' && c.channel !== channelFilter) return false;
      if (search.trim() && !(c.name ?? '').toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data, statusFilter, channelFilter, search]);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Kampanyalar</h1>
          <p className="text-muted-foreground mt-1 text-sm">Yeni kampanya oluştur, gönderim durumunu izle.</p>
        </div>
        <Link href="/super-admin/messaging/campaigns/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Yeni Kampanya
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Kampanya ara…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm durumlar</SelectItem>
                <SelectItem value="draft">Taslak</SelectItem>
                <SelectItem value="scheduled">Zamanlandı</SelectItem>
                <SelectItem value="sending">Gönderiliyor</SelectItem>
                <SelectItem value="completed">Tamamlandı</SelectItem>
                <SelectItem value="failed">Başarısız</SelectItem>
              </SelectContent>
            </Select>
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm kanallar</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">E-posta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Henüz kampanya yok.</p>
            </div>
          ) : (
            <ul className="divide-y">
              {filtered.map((c) => (
                <li key={c.id}>
                  <Link href={`/super-admin/messaging/campaigns/${c.id}`} className="flex items-center gap-3 py-3 px-2 -mx-2 rounded hover:bg-muted/40">
                    {c.channel === 'email' ? (
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">{c.name ?? c.id}</span>
                        {c.useCase && <Badge variant="outline" className="text-xs">{c.useCase}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(c.recipients?.afterConsentFilter ?? c.stats?.queued ?? 0).toLocaleString('tr-TR')} alıcı ·{' '}
                        {c.stats?.sent ?? 0} gönderildi · {c.stats?.failed ?? 0} hata
                      </p>
                    </div>
                    <Badge className={cn('text-xs', STATUS_BADGE[c.status ?? 'draft'] ?? STATUS_BADGE.draft)}>
                      {c.status ?? 'taslak'}
                    </Badge>
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
