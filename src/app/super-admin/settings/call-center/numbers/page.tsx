'use client';

/**
 * /super-admin/settings/call-center/numbers
 *
 * Sanal santral numara havuzu yönetimi (super-admin).
 *
 * - Provider seç (santralProviders) — sağlayıcı bazlı filtreleme.
 * - Havuzdaki numaralar tablosu (status, atanmış STK, ücret).
 * - Yeni numara ekleme formu (provider + E.164 numara + opsiyonel etiket/ücret).
 *
 * KVKK: bu sayfa kurumsal envanteri yönetir, kişisel veri tutmaz. Yine de
 * her mutasyon arka uçta callAuditLog'a düşer.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/firebase';
import { ArrowLeft, Phone, Plus, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

interface ProviderRow {
  id: string;
  name: string;
  displayName?: string;
  status: string;
  hasWebhookSecret: boolean;
}

interface NumberRow {
  id: string;
  providerId: string;
  number: string;
  status: string;
  assignedToNgoId?: string | null;
  assignedAt?: string | null;
  label?: string | null;
  monthlyCost?: number | null;
  createdAt?: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  reserved: 'bg-amber-100 text-amber-800 border-amber-300',
  assigned: 'bg-blue-100 text-blue-800 border-blue-300',
  suspended: 'bg-zinc-100 text-zinc-700 border-zinc-300',
  released: 'bg-rose-100 text-rose-700 border-rose-300',
};

export default function CallCenterNumbersPage() {
  const { user: authUser } = useUser();
  const { toast } = useToast();

  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState<string>('all');

  const [numbers, setNumbers] = useState<NumberRow[]>([]);
  const [numbersLoading, setNumbersLoading] = useState(false);

  // Yeni numara formu
  const [formProviderId, setFormProviderId] = useState<string>('');
  const [formNumber, setFormNumber] = useState<string>('');
  const [formLabel, setFormLabel] = useState<string>('');
  const [formMonthlyCost, setFormMonthlyCost] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const loadProviders = useCallback(async () => {
    if (!authUser) return;
    setProvidersLoading(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/super-admin/santral/providers', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Sağlayıcılar alınamadı.');
      setProviders(Array.isArray(data.providers) ? data.providers : []);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Sağlayıcı listesi alınamadı',
        description: e instanceof Error ? e.message : '',
      });
    } finally {
      setProvidersLoading(false);
    }
  }, [authUser, toast]);

  const loadNumbers = useCallback(async () => {
    if (!authUser) return;
    setNumbersLoading(true);
    try {
      const token = await authUser.getIdToken();
      const url = new URL('/api/super-admin/santral/numbers', window.location.origin);
      if (selectedProviderId !== 'all') url.searchParams.set('providerId', selectedProviderId);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Numaralar alınamadı.');
      setNumbers(Array.isArray(data.numbers) ? data.numbers : []);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Numara havuzu alınamadı',
        description: e instanceof Error ? e.message : '',
      });
    } finally {
      setNumbersLoading(false);
    }
  }, [authUser, selectedProviderId, toast]);

  useEffect(() => {
    if (authUser) {
      void loadProviders();
    }
  }, [authUser, loadProviders]);

  useEffect(() => {
    if (authUser) {
      void loadNumbers();
    }
  }, [authUser, selectedProviderId, loadNumbers]);

  const providerName = useCallback(
    (providerId: string): string => {
      const p = providers.find((x) => x.id === providerId);
      return p?.displayName || p?.name || providerId;
    },
    [providers],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    if (!formProviderId || !formNumber.trim()) {
      toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'Sağlayıcı ve numara zorunlu.' });
      return;
    }
    setSubmitting(true);
    try {
      const token = await authUser.getIdToken();
      const payload: Record<string, unknown> = {
        providerId: formProviderId,
        number: formNumber.trim(),
      };
      if (formLabel.trim()) payload.label = formLabel.trim();
      if (formMonthlyCost.trim()) {
        const cost = Number(formMonthlyCost.replace(',', '.'));
        if (!Number.isFinite(cost) || cost < 0) {
          throw new Error('Aylık ücret pozitif sayı olmalı.');
        }
        payload.monthlyCost = cost;
      }
      const res = await fetch('/api/super-admin/santral/numbers', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Numara eklenemedi.');
      toast({ title: 'Numara eklendi', description: `ID: ${data.numberId}` });
      setFormNumber('');
      setFormLabel('');
      setFormMonthlyCost('');
      await loadNumbers();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Ekleme başarısız',
        description: err instanceof Error ? err.message : '',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const stats = useMemo(() => {
    const total = numbers.length;
    const available = numbers.filter((n) => n.status === 'available').length;
    const assigned = numbers.filter((n) => n.status === 'assigned').length;
    const monthlyTotal = numbers.reduce((acc, n) => acc + (typeof n.monthlyCost === 'number' ? n.monthlyCost : 0), 0);
    return { total, available, assigned, monthlyTotal };
  }, [numbers]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 p-4 md:p-6">
      <Link href="/super-admin/settings/call-center" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4 mr-1" /> Call Center Ayarları
      </Link>

      <div>
        <h1 className="text-3xl font-black tracking-tighter">Santral Numara Havuzu</h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">
          Sağlayıcılardan satın alınan numaralar buradan tutulur. STK aktivasyonunda havuzdan
          atanır. Her ekleme/güncelleme audit log'a düşer.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Toplam Numara" value={stats.total.toString()} />
        <StatCard label="Boşta" value={stats.available.toString()} accent="emerald" />
        <StatCard label="Atanmış" value={stats.assigned.toString()} accent="blue" />
        <StatCard label="Aylık Maliyet" value={`${stats.monthlyTotal.toFixed(2)} ₺`} accent="amber" />
      </div>

      {/* Provider filter */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4" /> Sağlayıcı Filtresi
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => { void loadNumbers(); }} disabled={numbersLoading}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${numbersLoading ? 'animate-spin' : ''}`} /> Yenile
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder="Sağlayıcı seç" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm sağlayıcılar</SelectItem>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.displayName || p.name}
                  {p.status !== 'active' ? ` (${p.status})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {providersLoading && (
            <p className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Sağlayıcılar yükleniyor...
            </p>
          )}
          {!providersLoading && providers.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Henüz tanımlı sağlayıcı yok. Önce <code>/api/super-admin/santral/providers</code> üzerinden bir sağlayıcı ekle.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Yeni numara formu */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Yeni Numara Ekle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="prov">Sağlayıcı *</Label>
              <Select value={formProviderId} onValueChange={setFormProviderId}>
                <SelectTrigger id="prov">
                  <SelectValue placeholder="Sağlayıcı seç" />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.displayName || p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="num">Numara (E.164) *</Label>
              <Input
                id="num"
                placeholder="+902121234567"
                value={formNumber}
                onChange={(e) => setFormNumber(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lbl">Etiket (opsiyonel)</Label>
              <Input
                id="lbl"
                placeholder="Örn: İstanbul ana hat"
                value={formLabel}
                onChange={(e) => setFormLabel(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cost">Aylık ücret ₺ (opsiyonel)</Label>
              <Input
                id="cost"
                type="text"
                inputMode="decimal"
                placeholder="50"
                value={formMonthlyCost}
                onChange={(e) => setFormMonthlyCost(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={submitting || providers.length === 0}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Havuza Ekle
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tablo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Havuz ({numbers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {numbersLoading ? (
            <div className="py-8 flex justify-center text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> Yükleniyor...
            </div>
          ) : numbers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Bu filtrede numara yok. Yukarıdan ekleyebilirsin.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Numara</TableHead>
                    <TableHead>Sağlayıcı</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>Etiket</TableHead>
                    <TableHead>Atanan STK</TableHead>
                    <TableHead className="text-right">Aylık ₺</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {numbers.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="font-mono text-xs">{n.number}</TableCell>
                      <TableCell className="text-xs">{providerName(n.providerId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[n.status] ?? ''}`}>
                          {n.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{n.label || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{n.assignedToNgoId || '—'}</TableCell>
                      <TableCell className="text-xs text-right">
                        {typeof n.monthlyCost === 'number' ? n.monthlyCost.toFixed(2) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="p-4 text-xs text-emerald-900 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> KVKK & Audit
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Numara havuzu STK iletişimi için kurumsal envanter — kişisel veri değildir.</li>
            <li>Her ekleme/atama/değişiklik <code>callAuditLog</code> koleksiyonuna düşer (actor + IP + timestamp).</li>
            <li>Recording dosyalarına bu ekrandan erişim YOKtur; gerekirse ayrı super-admin route'undan erişilir.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'emerald' | 'blue' | 'amber';
}) {
  const accentClass =
    accent === 'emerald'
      ? 'text-emerald-700'
      : accent === 'blue'
      ? 'text-blue-700'
      : accent === 'amber'
      ? 'text-amber-700'
      : 'text-foreground';
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-2xl font-black tracking-tight mt-1 ${accentClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
