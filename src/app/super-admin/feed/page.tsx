'use client';
/**
 * Ürün Feed & Listeleme Yönetimi (super-admin).
 *
 * 1) Feed ingest: marka feed'lerini (GelirOrtakları Go Feed) listeler, "Ürünleri
 *    Çek" ile canonical `products` koleksiyonuna ingest eder.
 * 2) Marka listeleme modu: her marka için 'Sadece marka' / 'Sadece ürün' /
 *    'Marka + ürün' seçimi + toplu "Tümünü marka / Tümünü ürün listele".
 */
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Download, Library, Package, RefreshCw, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { LISTING_MODE_LABELS, DEFAULT_LISTING_MODE, type ListingMode, type ProductFeed } from '@/lib/feed/types';

interface BrandRow {
  id: string;
  name?: string;
  logoUrl?: string;
  listingMode?: ListingMode;
  status?: string;
}

export default function FeedAdminPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [feeds, setFeeds] = useState<ProductFeed[] | null>(null);
  const [loadingFeeds, setLoadingFeeds] = useState(false);
  const [ingesting, setIngesting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [savingMode, setSavingMode] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const brandsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.brands), [db]);
  const { data: brands, isLoading: brandsLoading } = useCollection<BrandRow>(brandsQuery);

  const authedFetch = async (init: RequestInit) => {
    if (!user) throw new Error('Oturum yok.');
    const token = await user.getIdToken();
    return fetch('/api/feed/ingest', { ...init, headers: { ...(init.headers || {}), Authorization: `Bearer ${token}` } });
  };

  const loadFeeds = async () => {
    setLoadingFeeds(true);
    try {
      const res = await authedFetch({ method: 'GET' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || `HTTP ${res.status}`);
      setFeeds(payload.feeds || []);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Feed listesi alınamadı', description: e instanceof Error ? e.message : 'Hata' });
    } finally {
      setLoadingFeeds(false);
    }
  };

  const ingest = async (f: ProductFeed) => {
    setIngesting(f.feedId);
    try {
      const res = await authedFetch({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedId: f.feedId, offerId: f.offerId, name: f.name, type: f.type, limit: 500 }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || `HTTP ${res.status}`);
      toast({ title: `${f.name} ürünleri çekildi`, description: `${payload.ingested} ürün ürün kütüphanesine eklendi.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Ingest başarısız', description: e instanceof Error ? e.message : 'Hata' });
    } finally {
      setIngesting(null);
    }
  };

  const setBrandMode = async (brandId: string, mode: ListingMode) => {
    setSavingMode(brandId);
    try {
      await setDoc(doc(db, COLLECTIONS.brands, brandId), { listingMode: mode }, { merge: true });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: e instanceof Error ? e.message : 'Hata' });
    } finally {
      setSavingMode(null);
    }
  };

  const setAllModes = async (mode: ListingMode) => {
    if (!brands || brands.length === 0) return;
    setBulkBusy(true);
    try {
      let i = 0;
      for (; i < brands.length; i += 450) {
        const batch = writeBatch(db);
        for (const b of brands.slice(i, i + 450)) {
          batch.set(doc(db, COLLECTIONS.brands, b.id), { listingMode: mode }, { merge: true });
        }
        await batch.commit();
      }
      toast({ title: 'Toplu güncellendi', description: `${brands.length} marka → "${LISTING_MODE_LABELS[mode]}".` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Toplu güncelleme başarısız', description: e instanceof Error ? e.message : 'Hata' });
    } finally {
      setBulkBusy(false);
    }
  };

  const filteredBrands = useMemo(() => {
    const list = (brands || []).filter((b) => b.name && b.status !== 'Silindi');
    const q = search.trim().toLowerCase();
    const matched = q ? list.filter((b) => (b.name || '').toLowerCase().includes(q)) : list;
    return matched.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
  }, [brands, search]);

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f] flex items-center gap-2">
          <Library className="h-7 w-7 text-primary" /> Ürün Feed & Listeleme
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Marka feed&apos;lerinden ürünleri ürün kütüphanesine çek; markaların marka/ürün listeleme modunu yönet.
        </p>
      </div>

      {/* 1) Feed ingest */}
      <Card className="rounded-[2rem] border-black/5 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Ürün Feed&apos;leri (GelirOrtakları Go Feed)</CardTitle>
              <CardDescription>Onaylı markaların ürün feed&apos;leri. &quot;Ürünleri Çek&quot; ile kütüphaneye ingest edilir.</CardDescription>
            </div>
            <Button onClick={loadFeeds} disabled={loadingFeeds} className="rounded-xl font-bold">
              {loadingFeeds ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Feed&apos;leri Yükle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {feeds === null ? (
            <p className="text-sm text-muted-foreground italic py-4">&quot;Feed&apos;leri Yükle&quot; ile başla.</p>
          ) : feeds.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-4">Feed bulunamadı.</p>
          ) : (
            <div className="divide-y border-t border-black/5">
              {feeds.map((f) => (
                <div key={f.feedId} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold truncate">{f.name}</p>
                    <p className="text-xs text-muted-foreground">feedId {f.feedId} · offerId {f.offerId} · <Badge variant="outline" className="text-[9px] uppercase">{f.type}</Badge></p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl font-bold shrink-0" onClick={() => ingest(f)} disabled={ingesting === f.feedId}>
                    {ingesting === f.feedId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Ürünleri Çek
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2) Marka listeleme modu */}
      <Card className="rounded-[2rem] border-black/5 shadow-xl">
        <CardHeader>
          <CardTitle>Marka Listeleme Modu ({filteredBrands.length})</CardTitle>
          <CardDescription>Her markanın hangel&apos;da nasıl görüneceği: sadece marka, sadece ürün, ya da her ikisi.</CardDescription>
          <div className="flex items-center gap-2 flex-wrap pt-2">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Marka ara..." className="pl-9 h-10 rounded-xl" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="rounded-xl font-bold" disabled={bulkBusy} onClick={() => setAllModes('brand')}>Tümünü marka listele</Button>
              <Button size="sm" variant="outline" className="rounded-xl font-bold" disabled={bulkBusy} onClick={() => setAllModes('product')}>Tümünü ürün listele</Button>
              <Button size="sm" variant="outline" className="rounded-xl font-bold" disabled={bulkBusy} onClick={() => setAllModes('both')}>Tümünü her ikisi</Button>
              {bulkBusy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {brandsLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <div className="divide-y border-t border-black/5 max-h-[60vh] overflow-y-auto">
              {filteredBrands.map((b) => (
                <div key={b.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <p className="font-medium truncate min-w-0">{b.name}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    {savingMode === b.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    <Select value={b.listingMode || DEFAULT_LISTING_MODE} onValueChange={(v) => setBrandMode(b.id, v as ListingMode)}>
                      <SelectTrigger className="h-9 w-40 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brand">{LISTING_MODE_LABELS.brand}</SelectItem>
                        <SelectItem value="product">{LISTING_MODE_LABELS.product}</SelectItem>
                        <SelectItem value="both">{LISTING_MODE_LABELS.both}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
              {filteredBrands.length === 0 && <p className="p-12 text-center text-muted-foreground italic">Marka bulunamadı.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
