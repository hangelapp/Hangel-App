'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Search, ClipboardCheck, Smartphone, Laptop, Tablet, Download,
  ScrollText, Clock, ShieldCheck, Globe,
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, type Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

interface ApprovalRecord {
  id: string;
  userId?: string;
  userName?: string;
  userType?: string;
  contractSlug?: string;
  contractTitle?: string;
  version?: string;
  approvedAt?: Timestamp;
  ip?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  os?: string;
  browser?: string;
  lang?: string;
  country?: string | null;
  method?: string;
  decision?: 'approved' | 'rejected';
  scrollCompleted?: boolean;
  readSeconds?: number;
  hash?: string;
  snapshotId?: string;
}

const DEVICE_ICON: Record<string, React.ElementType> = { mobile: Smartphone, tablet: Tablet, desktop: Laptop };

function fmtDate(ts?: Timestamp): string {
  if (!ts) return '—';
  try { return ts.toDate().toLocaleString('tr-TR'); } catch { return '—'; }
}

export function ApprovalsTab() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState('all');

  const approvalsQuery = useMemoFirebase(
    () => query(collection(db, COLLECTIONS.contractApprovals), orderBy('approvedAt', 'desc')),
    [db],
  );
  const { data: records, isLoading } = useCollection<ApprovalRecord>(approvalsQuery);

  const contractOptions = useMemo(() => {
    const set = new Map<string, string>();
    (records || []).forEach(r => { if (r.contractSlug) set.set(r.contractSlug, r.contractTitle || r.contractSlug); });
    return Array.from(set.entries());
  }, [records]);

  const filtered = useMemo(() => {
    let list = records || [];
    if (contractFilter !== 'all') list = list.filter(r => r.contractSlug === contractFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(r => (r.userName || '').toLowerCase().includes(q) || (r.contractTitle || '').toLowerCase().includes(q) || (r.ip || '').includes(q));
    }
    return list;
  }, [records, searchTerm, contractFilter]);

  const handleExport = () => {
    const headers = ['Kullanıcı', 'Tip', 'Sözleşme', 'Sürüm', 'Tarih', 'IP', 'Cihaz', 'OS', 'Tarayıcı', 'Dil', 'Ülke', 'Yöntem', 'Scroll', 'Süre(sn)', 'Hash'];
    const rows = filtered.map(r => [
      r.userName || '', r.userType || '', r.contractTitle || '', r.version || '',
      fmtDate(r.approvedAt), r.ip || '', r.device || '', r.os || '', r.browser || '',
      r.lang || '', r.country || '', r.method || '', r.scrollCompleted ? 'Evet' : 'Hayır',
      String(r.readSeconds ?? ''), r.hash || '',
    ]);
    const csv = [headers, ...rows].map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `onay-kayitlari-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-primary" /> Kullanıcı Onay Kayıtları
          <Badge variant="secondary" className="ml-2 text-[10px]">{filtered.length} kayıt</Badge>
        </CardTitle>
        <div className="flex items-center gap-3 flex-wrap pt-2">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Kullanıcı / sözleşme / IP ara..." className="pl-10 h-10" />
          </div>
          <Select value={contractFilter} onValueChange={setContractFilter}>
            <SelectTrigger className="w-52 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Sözleşmeler</SelectItem>
              {contractOptions.map(([slug, title]) => <SelectItem key={slug} value={slug}>{title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0} className="gap-1.5">
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Henüz onay kaydı yok.</p>
            <p className="text-xs mt-1">Kullanıcılar sözleşme/politika onayladığında KVKK ispatı için burada listelenecek (IP, cihaz, scroll, süre, hash).</p>
          </div>
        ) : (
          <div className="divide-y border-t">
            {filtered.map(r => {
              const DeviceIcon = DEVICE_ICON[r.device || 'desktop'] || Laptop;
              return (
                <div key={r.id} className="p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm">{r.userName || 'Kullanıcı'}</span>
                        <Badge variant="outline" className="text-[9px]">{r.userType || 'user'}</Badge>
                        <Badge className={`text-[9px] border-none ${r.decision === 'rejected' ? 'bg-red-600' : 'bg-green-600'}`}>
                          {r.decision === 'rejected' ? 'Reddetti / Kapattı' : 'Onayladı'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">→ {r.contractTitle}</span>
                        {r.version && <Badge variant="secondary" className="text-[9px]">v{r.version}</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{fmtDate(r.approvedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[10px] text-muted-foreground">
                      {r.scrollCompleted
                        ? <span className="inline-flex items-center gap-1 text-emerald-600"><ScrollText className="h-3 w-3" /> Okudu</span>
                        : <span className="inline-flex items-center gap-1 text-amber-600"><ScrollText className="h-3 w-3" /> Scroll yok</span>}
                      {typeof r.readSeconds === 'number' && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {r.readSeconds}sn</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><DeviceIcon className="h-3 w-3" /> {r.os} · {r.browser}</span>
                    {r.ip && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" /> {r.ip}</span>}
                    {r.country && <span>📍 {r.country}</span>}
                    {r.lang && <span>🗣 {r.lang}</span>}
                    {r.hash && <span className="inline-flex items-center gap-1 font-mono" title={r.hash}><ShieldCheck className="h-3 w-3" /> {r.hash.slice(0, 12)}…</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
