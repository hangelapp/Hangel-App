'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, limit, orderBy, query } from 'firebase/firestore';
import { ArrowLeft, History, Loader2 } from 'lucide-react';

interface AuditRow {
  id: string;
  at?: { toDate?: () => Date };
  actorUid?: string;
  actorEmail?: string | null;
  action?: string;
  payload?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

const ACTION_COLOR: Record<string, string> = {
  'campaign.created': 'bg-violet-100 text-violet-800',
  'campaign.scheduled': 'bg-amber-100 text-amber-800',
  'campaign.enqueued': 'bg-blue-100 text-blue-800',
  'campaign.sent': 'bg-emerald-100 text-emerald-800',
  'campaign.cancelled': 'bg-gray-200 text-gray-800',
  'template.created': 'bg-sky-100 text-sky-800',
  'template.updated': 'bg-sky-100 text-sky-800',
  'segment.created': 'bg-emerald-100 text-emerald-800',
  'provider.updated': 'bg-amber-100 text-amber-800',
  'consent.imported': 'bg-fuchsia-100 text-fuchsia-800',
  'consent.exported': 'bg-fuchsia-100 text-fuchsia-800',
  unsubscribe: 'bg-rose-100 text-rose-800',
};

function fmt(d?: { toDate?: () => Date }) {
  if (!d?.toDate) return '—';
  try {
    return d.toDate().toLocaleString('tr-TR');
  } catch {
    return '—';
  }
}

export default function AuditLogPage() {
  const db = useFirestore();
  const q = useMemoFirebase(
    () => query(collection(db, 'messagingAuditLogs'), orderBy('at', 'desc'), limit(200)),
    [db]
  );
  const { data, isLoading } = useCollection<AuditRow>(q);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((r) => {
      if (actionFilter !== 'all' && r.action !== actionFilter) return false;
      if (search.trim()) {
        const s = search.toLowerCase();
        if (
          !(r.actorEmail ?? '').toLowerCase().includes(s) &&
          !(r.actorUid ?? '').toLowerCase().includes(s) &&
          !(r.action ?? '').toLowerCase().includes(s)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [data, actionFilter, search]);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
      <Link
        href="/super-admin/messaging"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Toplu SMS & E-Posta
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kim, ne zaman, ne aksiyon aldı — son 200 kayıt.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-3 pb-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-rose-500" />
            <CardTitle className="text-base">Kayıtlar</CardTitle>
          </div>
          <div className="flex flex-1 gap-2 sm:max-w-md sm:ml-auto">
            <Input
              placeholder="Aktör, action…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm action'lar</SelectItem>
                {Object.keys(ACTION_COLOR).map((a) => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
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
            <p className="text-sm text-muted-foreground text-center py-8">Kayıt yok.</p>
          ) : (
            <ul className="divide-y text-sm">
              {filtered.map((r) => (
                <li key={r.id} className="py-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-xs ${ACTION_COLOR[r.action ?? ''] ?? 'bg-gray-100 text-gray-700'}`}>
                      {r.action ?? '—'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{fmt(r.at)}</span>
                    <span className="text-xs ml-auto truncate max-w-[200px]">
                      {r.actorEmail ?? r.actorUid ?? 'anon'}
                    </span>
                  </div>
                  {r.payload && Object.keys(r.payload).length > 0 && (
                    <pre className="text-xs text-muted-foreground mt-1 bg-muted/30 rounded p-2 overflow-x-auto">
                      {JSON.stringify(r.payload, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
