'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Loader2, Wallet, Plus, Search } from 'lucide-react';
import { messagingFetch } from '@/lib/messaging/client';

interface WalletRow {
  id: string;
  ngoId?: string;
  balance?: number;
  reserved?: number;
  currency?: string;
  freeQuotaUsed?: { sms?: number; email?: number; whatsapp?: number };
  lowBalanceThreshold?: number;
}

export default function NgoWalletsPage() {
  const { toast } = useToast();
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const refresh = async () => {
    try {
      const result = await messagingFetch<{ wallets: WalletRow[] }>('/api/admin/messaging/ngo-wallets');
      setWallets(result.wallets);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return wallets;
    const s = search.toLowerCase();
    return wallets.filter((w) => (w.id ?? '').toLowerCase().includes(s));
  }, [wallets, search]);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-5xl space-y-6">
      <Link href="/super-admin/messaging" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Toplu SMS & E-Posta
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">NGO Cüzdanları</h1>
        <p className="text-muted-foreground text-sm mt-1">Tüm NGO bakiyeleri + manuel top-up / düzeltme.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="NGO ID ara…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Henüz cüzdan yok.</p>
            </div>
          ) : (
            <ul className="divide-y text-sm">
              {filtered.map((w) => (
                <li key={w.id} className="py-3">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-xs truncate">{w.id}</div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                        <Badge variant="outline">{(w.balance ?? 0).toLocaleString('tr-TR')} TRY</Badge>
                        <span>· Reserved: {(w.reserved ?? 0).toLocaleString('tr-TR')}</span>
                      </div>
                    </div>
                    <AdjustDialog ngoId={w.id} onDone={refresh} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdjustDialog({ ngoId, onDone }: { ngoId: string; onDone: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState<'topup' | 'adjust'>('topup');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await messagingFetch('/api/admin/messaging/ngo-wallets', {
        method: 'POST',
        body: JSON.stringify({ ngoId, action, amount: Number(amount), notes }),
      });
      toast({ title: 'Uygulandı' });
      setOpen(false);
      setAmount('');
      setNotes('');
      onDone();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Ayarla
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cüzdan İşlemi</DialogTitle>
          <DialogDescription>NGO: <code className="text-xs">{ngoId}</code></DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>İşlem</Label>
            <Select value={action} onValueChange={(v) => setAction(v as 'topup' | 'adjust')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="topup">Top-up (bakiye ekle)</SelectItem>
                <SelectItem value="adjust">Düzeltme (+/- delta)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tutar (TRY)</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Not</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Sebep, referans no..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
          <Button onClick={handleSubmit} disabled={submitting || !amount}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Uygula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
