'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Bell, Users, Search, Phone, X, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, getDocs, query, where, doc, writeBatch, serverTimestamp, orderBy, limit, documentId } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

interface ContractLite { id: string; slug?: string; title?: string; version?: string; }

// Hedef grup → users sorgu filtresi eşlemesi
const TARGET_QUERIES: Record<string, { field: string; op: '==' | 'array-contains' | '!='; value: unknown } | 'all'> = {
  'Tüm kullanıcılar': 'all',
  'STK yöneticileri': { field: 'role', op: '==', value: 'ngo-admin' },
  'Süper adminler': { field: 'role', op: '==', value: 'super-admin' },
  'Gönüllüler': { field: 'role', op: '==', value: 'volunteer' },
};

const TEST_GROUP = 'Test (tek kullanıcı)';
const PUBLISHABLE_GROUPS = [...Object.keys(TARGET_QUERIES), TEST_GROUP];

interface UserLite { id: string; name?: string; displayName?: string; phoneNumber?: string; personalInfo?: { phone?: string; email?: string } }
const onlyDigits = (s?: string) => (s || '').replace(/\D/g, '');

export function PublishTab() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user: authUser } = useUser();

  const contractsQuery = useMemoFirebase(() => query(collection(db, COLLECTIONS.contracts), orderBy(documentId()), limit(200)), [db]);
  const { data: contracts } = useCollection<ContractLite>(contractsQuery);

  const [selectedContract, setSelectedContract] = useState('');
  const [targetGroups, setTargetGroups] = useState<string[]>(['Tüm kullanıcılar']);
  const [channel, setChannel] = useState<'notification' | 'silent'>('notification');
  const [sending, setSending] = useState(false);

  // Test modu: telefonla tek kullanıcı bul + seç
  const [testSearch, setTestSearch] = useState('');
  const [testUser, setTestUser] = useState<UserLite | null>(null);
  const testMode = targetGroups.includes(TEST_GROUP);
  // Sadece test önizleme listesi için sınırlı; gerçek bildirim fan-out'u aşağıda getDocs ile sınırsız çalışır.
  const usersQuery = useMemoFirebase(() => (testMode ? query(collection(db, COLLECTIONS.users), orderBy(documentId()), limit(200)) : null), [db, testMode]);
  const { data: usersData } = useCollection<UserLite>(usersQuery);
  const matchedTestUsers = useMemo(() => {
    const q = onlyDigits(testSearch);
    if (q.length < 4) return [];
    return (usersData || []).filter(u => {
      const phones = [onlyDigits(u.personalInfo?.phone), onlyDigits(u.phoneNumber)];
      return phones.some(p => p && p.includes(q));
    }).slice(0, 6);
  }, [usersData, testSearch]);

  const contract = useMemo(() => (contracts || []).find(c => (c.slug || c.id) === selectedContract), [contracts, selectedContract]);
  const toggleGroup = (g: string) => setTargetGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  const handlePublish = async () => {
    if (!selectedContract || !contract) {
      toast({ variant: 'destructive', title: 'Sözleşme seç', description: 'Yayınlanacak sözleşme/politika seçin.' });
      return;
    }
    if (targetGroups.length === 0) {
      toast({ variant: 'destructive', title: 'Hedef kitle seç', description: 'En az bir kullanıcı grubu seçin.' });
      return;
    }
    if (testMode && !testUser) {
      toast({ variant: 'destructive', title: 'Test kullanıcısı seç', description: 'Telefonla arayıp bir kullanıcı seçin.' });
      return;
    }
    setSending(true);
    try {
      // Hedef kullanıcıları topla
      const targetUids = new Set<string>();
      if (testMode && testUser) {
        // Test modu: yalnızca seçilen tek kullanıcıya gönder (diğer gruplar yok sayılır)
        targetUids.add(testUser.id);
      } else {
        const usesAll = targetGroups.some(g => TARGET_QUERIES[g] === 'all');
        if (usesAll) {
          const snap = await getDocs(collection(db, COLLECTIONS.users));
          snap.forEach(d => targetUids.add(d.id));
        } else {
          for (const g of targetGroups) {
            const qDef = TARGET_QUERIES[g];
            if (!qDef || qDef === 'all') continue;
            const snap = await getDocs(query(collection(db, COLLECTIONS.users), where(qDef.field, qDef.op, qDef.value)));
            snap.forEach(d => targetUids.add(d.id));
          }
        }
      }

      const uids = Array.from(targetUids);
      if (uids.length === 0) {
        toast({ variant: 'destructive', title: 'Kullanıcı bulunamadı', description: 'Seçilen gruplarda kullanıcı yok.' });
        return;
      }

      // Sessiz yayında bildirim atma — sadece kayıt (burada no-op, ileride contracts doc'a publishedAt yazılır)
      if (channel === 'silent') {
        toast({ title: 'Sessiz yayın', description: `${uids.length} kullanıcı hedeflendi, bildirim gönderilmedi.` });
        return;
      }

      // Batched bildirim (Cloud Function otomatik push atar — pushSent yok)
      const title = '📋 Güncellenen sözleşme';
      const body = `"${contract.title}" güncellendi (v${contract.version || '1.0'}). Lütfen gözden geçir.`;
      let batch = writeBatch(db);
      let count = 0;
      let total = 0;
      for (const uid of uids) {
        const ref = doc(collection(db, COLLECTIONS.notifications));
        batch.set(ref, {
          userId: uid,
          type: 'contract-update',
          title,
          body,
          data: { contractSlug: selectedContract, version: contract.version || '1.0', link: `/settings/contracts/${selectedContract}` },
          read: false,
          createdAt: serverTimestamp(),
          createdBy: authUser?.uid || 'super-admin',
        });
        count += 1; total += 1;
        if (count >= 450) { await batch.commit(); batch = writeBatch(db); count = 0; }
      }
      if (count > 0) await batch.commit();

      toast({ title: '✅ Yayınlandı', description: `${total} kullanıcıya bildirim gönderildi. Push otomatik gidiyor.` });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      toast({ variant: 'destructive', title: 'Yayınlanamadı', description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : (e instanceof Error ? e.message : 'Hata') });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Yayın & Bildirim Gönderimi</CardTitle>
        <CardDescription>Güncellenen sözleşme/politikayı seçili kullanıcı gruplarına bildir.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 max-w-2xl">
        <div className="space-y-2">
          <Label>Sözleşme / Politika</Label>
          <Select value={selectedContract} onValueChange={setSelectedContract}>
            <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {(contracts || []).map(c => (
                <SelectItem key={c.slug || c.id} value={c.slug || c.id}>
                  {c.title} {c.version ? `(v${c.version})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Users className="h-4 w-4" /> Hedef Kitle</Label>
          <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
            {PUBLISHABLE_GROUPS.map(g => (
              <label key={g} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={targetGroups.includes(g)} onCheckedChange={() => toggleGroup(g)} />
                <span>{g}</span>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">Not: STK üyeleri, marka, kulüp gibi gruplar için faz 2'de eşleştirme genişletilecek.</p>

          {testMode && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <Label className="text-xs flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Test kullanıcısını telefonla ara</Label>
              {testUser ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2">
                  <div className="min-w-0 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold break-words">{testUser.name || testUser.displayName || 'Kullanıcı'}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{testUser.personalInfo?.phone || testUser.phoneNumber || testUser.id}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => { setTestUser(null); setTestSearch(''); }}><X className="h-4 w-4" /></Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={testSearch} onChange={e => setTestSearch(e.target.value)} placeholder="Telefon numarası (en az 4 hane)" className="pl-10 h-10" />
                  </div>
                  {testSearch.replace(/\D/g, '').length >= 4 && (
                    <div className="rounded-lg border divide-y max-h-52 overflow-y-auto">
                      {matchedTestUsers.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic p-3">Eşleşen kullanıcı bulunamadı.</p>
                      ) : matchedTestUsers.map(u => (
                        <button key={u.id} type="button" onClick={() => setTestUser(u)} className="w-full text-left p-2.5 hover:bg-accent flex items-center justify-between gap-2">
                          <span className="text-sm font-medium break-words">{u.name || u.displayName || 'Kullanıcı'}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">{u.personalInfo?.phone || u.phoneNumber}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <p className="text-[10px] text-muted-foreground">Test seçiliyken bildirim yalnızca bu kullanıcıya gider.</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-1.5"><Bell className="h-4 w-4" /> Yayın Tipi</Label>
          <Select value={channel} onValueChange={(v) => setChannel(v as 'notification' | 'silent')}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="notification">Bildirim gönder (uygulama içi + push)</SelectItem>
              <SelectItem value="silent">Sessiz yayın (bildirim yok)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {contract && (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-bold">{contract.title} <Badge variant="outline" className="text-[9px] ml-1">v{contract.version || '1.0'}</Badge></p>
            <p className="text-xs text-muted-foreground mt-1">
              Bildirim metni: &quot;{contract.title}&quot; güncellendi. Hedef: {targetGroups.join(', ')}.
            </p>
          </div>
        )}

        <Button onClick={handlePublish} disabled={sending || !selectedContract} className="w-full h-11 rounded-xl font-bold">
          {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Yayınla ve Bildir
        </Button>
      </CardContent>
    </Card>
  );
}
