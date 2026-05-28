'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, Bell, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, getDocs, query, where, doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

interface ContractLite { id: string; slug?: string; title?: string; version?: string; }

// Hedef grup → users sorgu filtresi eşlemesi
const TARGET_QUERIES: Record<string, { field: string; op: '==' | 'array-contains' | '!='; value: unknown } | 'all'> = {
  'Tüm kullanıcılar': 'all',
  'STK yöneticileri': { field: 'role', op: '==', value: 'ngo-admin' },
  'Süper adminler': { field: 'role', op: '==', value: 'super-admin' },
  'Gönüllüler': { field: 'role', op: '==', value: 'volunteer' },
};

const PUBLISHABLE_GROUPS = Object.keys(TARGET_QUERIES);

export function PublishTab() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user: authUser } = useUser();

  const contractsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.contracts), [db]);
  const { data: contracts } = useCollection<ContractLite>(contractsQuery);

  const [selectedContract, setSelectedContract] = useState('');
  const [targetGroups, setTargetGroups] = useState<string[]>(['Tüm kullanıcılar']);
  const [channel, setChannel] = useState<'notification' | 'silent'>('notification');
  const [sending, setSending] = useState(false);

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
    setSending(true);
    try {
      // Hedef kullanıcıları topla
      const targetUids = new Set<string>();
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
