'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Search, ClipboardCheck, Smartphone, Laptop, Tablet,
  ScrollText, Clock, ShieldCheck, Globe, Users,
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
const USER_TYPE_LABEL: Record<string, string> = {
  user: 'Kullanıcı', 'ngo-admin': 'STK', 'brand-admin': 'Marka', 'club-admin': 'Kulüp', 'super-admin': 'Süper Admin', admin: 'Yönetici',
};
const TYPE_MATCH: Record<string, (t?: string) => boolean> = {
  all: () => true,
  ngo: t => t === 'ngo-admin',
  brand: t => t === 'brand-admin',
  club: t => t === 'club-admin',
  user: t => !t || t === 'user',
};

function fmtDate(ts?: Timestamp): string {
  if (!ts) return '—';
  try { return ts.toDate().toLocaleString('tr-TR'); } catch { return '—'; }
}

export function ApprovalsTab() {
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

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
    if (typeFilter !== 'all') list = list.filter(r => (TYPE_MATCH[typeFilter] || TYPE_MATCH.all)(r.userType));
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(r => (r.userName || '').toLowerCase().includes(q) || (r.contractTitle || '').toLowerCase().includes(q) || (r.ip || '').includes(q));
    }
    return list;
  }, [records, searchTerm, contractFilter, typeFilter]);

  // Kullanıcı/kurum bazlı gruplama — yeni onaylar (realtime) ilgili gruba eklenir.
  const groupedByUser = useMemo(() => {
    const m = new Map<string, { userName: string; userType: string; records: ApprovalRecord[] }>();
    filtered.forEach(r => {
      const key = r.userId || r.userName || r.id;
      if (!m.has(key)) m.set(key, { userName: r.userName || 'Kullanıcı', userType: r.userType || 'user', records: [] });
      m.get(key)!.records.push(r);
    });
    return Array.from(m.entries()).map(([key, v]) => ({ key, ...v }));
  }, [filtered]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap"><ClipboardCheck className="h-5 w-5 text-primary" /> Kullanıcı Onay Kayıtları
          <Badge variant="secondary" className="text-[10px]">{groupedByUser.length} kişi · {filtered.length} kayıt</Badge>
        </CardTitle>
        <div className="flex items-center gap-3 flex-wrap pt-2">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Kullanıcı / sözleşme / IP ara..." className="pl-10 h-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="user">Kullanıcı</SelectItem>
              <SelectItem value="ngo">STK</SelectItem>
              <SelectItem value="brand">Marka</SelectItem>
              <SelectItem value="club">Kulüp</SelectItem>
            </SelectContent>
          </Select>
          <Select value={contractFilter} onValueChange={setContractFilter}>
            <SelectTrigger className="w-52 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Sözleşmeler</SelectItem>
              {contractOptions.map(([slug, title]) => <SelectItem key={slug} value={slug}>{title}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : groupedByUser.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <ClipboardCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Henüz onay kaydı yok.</p>
            <p className="text-xs mt-1">Kullanıcılar sözleşme/politika onayladığında KVKK ispatı için burada kullanıcı bazlı listelenir (IP, cihaz, scroll, süre, hash).</p>
          </div>
        ) : (
          <div className="border-t">
            {groupedByUser.map(g => (
              <div key={g.key} className="border-b">
                <div className="flex items-center gap-2 p-3 bg-muted/40 flex-wrap">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-bold text-sm min-w-0 break-words">{g.userName}</span>
                  <Badge variant="outline" className="text-[9px]">{USER_TYPE_LABEL[g.userType] || g.userType}</Badge>
                  <Badge variant="secondary" className="text-[9px] ml-auto">{g.records.length} onay</Badge>
                </div>
                <div className="divide-y">
                  {g.records.map(r => {
                    const DeviceIcon = DEVICE_ICON[r.device || 'desktop'] || Laptop;
                    return (
                      <div key={r.id} className="p-3 pl-9 space-y-1.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-[9px] border-none ${r.decision === 'rejected' ? 'bg-red-600' : 'bg-green-600'}`}>
                                {r.decision === 'rejected' ? 'Reddetti / Kapattı' : 'Onayladı'}
                              </Badge>
                              <span className="text-sm font-medium">{r.contractTitle}</span>
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
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
