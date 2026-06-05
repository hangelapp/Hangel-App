'use client';

/**
 * /super-admin/outreach — Outreach / Tanıtım Veritabanı
 *
 * Hangel'e henüz katılmamış kuruluşlara (vakıf, dernek, il sivil toplum
 * müdürlüğü, kargo şirketi, mail hizmet sağlayıcısı) toplu tanıtım maili
 * ve SMS göndermek için kullanılan merkezi panel.
 *
 * Veri kaynakları:
 *   - registryVakiflar (6,680) — T.C. Vakıflar Genel Müdürlüğü, %88 emaili dolu
 *   - registryDernekler (100,967) — T.C. Dernekler Dairesi, email yok
 *   - outreachContacts — manuel eklenen diğer kategoriler
 *
 * Bulk send mevcut /super-admin/messaging/campaigns infra'sına bağlanır:
 *   "Kampanyaya Ekle" → selected ID'ler query param ile new campaign sayfasına.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Mail, MessageSquare, Phone, MapPin, Upload, Plus,
  Building2, Heart, Truck, Server, Landmark, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, orderBy } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { cn } from '@/lib/utils';

interface OutreachRow {
  id: string;
  name: string;
  type?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  status?: string;
  lastContactedAt?: { toDate?: () => Date } | null;
  source: 'registryVakiflar' | 'registryDernekler' | 'outreachContacts';
}

interface VakifDoc {
  id: string;
  name?: string;
  il?: string;
  ilce?: string;
  telefon1?: string;
  telefon2?: string;
  ePosta?: string;
  adres?: string;
  type?: string;
}

interface DernekDoc {
  id: string;
  name?: string;
  adres?: string;
  webSite?: string;
  faaliyetAlani?: string;
  kutukNo?: string;
}

interface OutreachContactDoc {
  id: string;
  name?: string;
  type?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  status?: string;
}

const PAGE_LIMIT = 100;

function normalizeVakif(v: VakifDoc): OutreachRow {
  return {
    id: v.id,
    name: v.name || '',
    type: 'Vakıf',
    city: v.il,
    district: v.ilce,
    phone: v.telefon1 || v.telefon2,
    email: v.ePosta,
    address: v.adres,
    source: 'registryVakiflar',
  };
}

function normalizeDernek(d: DernekDoc): OutreachRow {
  return {
    id: d.id,
    name: d.name || '',
    type: 'Dernek',
    address: d.adres,
    website: d.webSite,
    source: 'registryDernekler',
  };
}

function normalizeOutreach(o: OutreachContactDoc): OutreachRow {
  return {
    id: o.id,
    name: o.name || '',
    type: o.type,
    city: o.city,
    district: o.district,
    phone: o.phone,
    email: o.email,
    website: o.website,
    address: o.address,
    status: o.status,
    source: 'outreachContacts',
  };
}

const CATEGORY_CARDS = [
  { key: 'vakiflar', label: 'Vakıflar', icon: Landmark, color: 'bg-amber-500', count: 6680 },
  { key: 'dernekler', label: 'Dernekler', icon: Heart, color: 'bg-rose-500', count: 100967 },
  { key: 'sivil-toplum', label: 'Sivil Toplum Müdürlükleri', icon: Building2, color: 'bg-blue-500', count: 0 },
  { key: 'kargo', label: 'Kargo Şirketleri', icon: Truck, color: 'bg-orange-500', count: 0 },
  { key: 'mail-saglayici', label: 'Mail Hizmet Sağlayıcıları', icon: Server, color: 'bg-violet-500', count: 0 },
];

export default function OutreachHubPage() {
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState<'vakiflar' | 'dernekler' | 'outreach'>('vakiflar');
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [emailOnly, setEmailOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- Vakıflar query (registryVakiflar) ---
  const vakifQuery = useMemoFirebase(() => {
    if (activeTab !== 'vakiflar') return null;
    const base = collection(db, COLLECTIONS.registryVakiflar);
    if (emailOnly) return query(base, where('ePosta', '!=', ''), limit(PAGE_LIMIT));
    return query(base, orderBy('nameLower'), limit(PAGE_LIMIT));
  }, [db, activeTab, emailOnly]);
  const { data: vakifData, isLoading: vakifLoading } = useCollection<VakifDoc>(vakifQuery);

  // --- Dernekler query (registryDernekler) ---
  const dernekQuery = useMemoFirebase(() => {
    if (activeTab !== 'dernekler') return null;
    return query(collection(db, COLLECTIONS.registryDernekler), limit(PAGE_LIMIT));
  }, [db, activeTab]);
  const { data: dernekData, isLoading: dernekLoading } = useCollection<DernekDoc>(dernekQuery);

  // --- Manuel outreachContacts ---
  const outreachQuery = useMemoFirebase(() => {
    if (activeTab !== 'outreach') return null;
    return query(collection(db, COLLECTIONS.outreachContacts), limit(PAGE_LIMIT));
  }, [db, activeTab]);
  const { data: outreachData, isLoading: outreachLoading } = useCollection<OutreachContactDoc>(outreachQuery);

  const rows: OutreachRow[] = useMemo(() => {
    if (activeTab === 'vakiflar') return (vakifData || []).map(normalizeVakif);
    if (activeTab === 'dernekler') return (dernekData || []).map(normalizeDernek);
    return (outreachData || []).map(normalizeOutreach);
  }, [activeTab, vakifData, dernekData, outreachData]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return rows.filter((r) => {
      if (term && !r.name.toLowerCase().includes(term) && !(r.address || '').toLowerCase().includes(term)) return false;
      if (cityFilter !== 'all' && r.city !== cityFilter) return false;
      return true;
    });
  }, [rows, searchTerm, cityFilter]);

  const isLoading = vakifLoading || dernekLoading || outreachLoading;

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => { if (r.city) set.add(r.city); });
    return Array.from(set).sort();
  }, [rows]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map((r) => r.id)));
    }
  }

  const selectedRows = filteredRows.filter((r) => selectedIds.has(r.id));
  const selectedWithEmail = selectedRows.filter((r) => r.email).length;
  const selectedWithPhone = selectedRows.filter((r) => r.phone).length;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Outreach / Tanıtım Veritabanı</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Hangel'i tanıştırmak için kullandığımız harici kuruluş kontak veritabanı.
            Resmi kütüklerden + manuel ekleme ile derler, toplu mail / SMS atarız.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/super-admin/outreach/import"><Upload className="h-4 w-4 mr-1" /> CSV İçe Aktar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/super-admin/outreach/new"><Plus className="h-4 w-4 mr-1" /> Yeni Kontak</Link>
          </Button>
        </div>
      </div>

      {/* Kategori özet kartları */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {CATEGORY_CARDS.map((cat) => {
          const Icon = cat.icon;
          return (
            <Card key={cat.key} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', cat.color)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground truncate">{cat.label}</p>
                </div>
                <p className="text-2xl font-black tabular-nums">{cat.count.toLocaleString('tr-TR')}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{cat.count > 0 ? 'kayıt' : 'henüz eklenmedi'}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Veri kaynağı tab'ları */}
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'vakiflar' | 'dernekler' | 'outreach'); setSelectedIds(new Set()); }}>
        <TabsList>
          <TabsTrigger value="vakiflar">
            <Landmark className="h-4 w-4 mr-1" /> Vakıflar
            <Badge variant="secondary" className="ml-2 text-[10px]">6.680</Badge>
          </TabsTrigger>
          <TabsTrigger value="dernekler">
            <Heart className="h-4 w-4 mr-1" /> Dernekler
            <Badge variant="secondary" className="ml-2 text-[10px]">100.967</Badge>
          </TabsTrigger>
          <TabsTrigger value="outreach">
            <Building2 className="h-4 w-4 mr-1" /> Diğer (Manuel)
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
          {/* Filter bar */}
          <Card>
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ad veya adres ile ara..."
                  className="pl-9"
                />
              </div>

              {cityOptions.length > 0 && (
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Tüm iller" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm iller</SelectItem>
                    {cityOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {activeTab === 'vakiflar' && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={emailOnly} onCheckedChange={(v) => setEmailOnly(!!v)} />
                  <span>Sadece email'i olanlar</span>
                </label>
              )}

              <div className="text-xs text-muted-foreground ml-auto">
                {isLoading ? 'Yükleniyor...' : `${filteredRows.length} kayıt`}
                {' · ilk ' + PAGE_LIMIT + ' gösteriliyor'}
              </div>
            </CardContent>
          </Card>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (() => {
            const sourceCol = activeTab === 'vakiflar' ? 'registryVakiflar'
              : activeTab === 'dernekler' ? 'registryDernekler'
              : 'outreachContacts';
            const idList = Array.from(selectedIds).join(',');
            const emailHref = `/super-admin/outreach/send?source=${sourceCol}&channel=email&ids=${encodeURIComponent(idList)}`;
            const smsHref = `/super-admin/outreach/send?source=${sourceCol}&channel=sms&ids=${encodeURIComponent(idList)}`;
            return (
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="p-3 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-sm">
                    <span className="font-bold">{selectedIds.size} seçili</span>
                    <span className="text-muted-foreground ml-3">
                      📧 {selectedWithEmail} email · 📱 {selectedWithPhone} telefon
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>Temizle</Button>
                    <Button asChild size="sm" disabled={selectedWithEmail === 0}>
                      <Link href={emailHref}><Mail className="h-4 w-4 mr-1" /> Email Gönder ({selectedWithEmail})</Link>
                    </Button>
                    <Button asChild size="sm" disabled={selectedWithPhone === 0}>
                      <Link href={smsHref}><MessageSquare className="h-4 w-4 mr-1" /> SMS Gönder ({selectedWithPhone})</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          {/* Tablo */}
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 w-10">
                      <Checkbox
                        checked={selectedIds.size > 0 && selectedIds.size === filteredRows.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-3 py-2">Ad</th>
                    <th className="px-3 py-2 hidden md:table-cell">İl / İlçe</th>
                    <th className="px-3 py-2 hidden lg:table-cell">Telefon</th>
                    <th className="px-3 py-2 hidden lg:table-cell">Email</th>
                    <th className="px-3 py-2 hidden xl:table-cell">Adres</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={6} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
                  ) : filteredRows.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      Kayıt bulunamadı. {activeTab === 'outreach' && 'Yeni kontak ekleyerek başlayabilirsin.'}
                    </td></tr>
                  ) : (
                    filteredRows.map((r) => (
                      <tr key={r.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-2">
                          <Checkbox
                            checked={selectedIds.has(r.id)}
                            onCheckedChange={() => toggleSelect(r.id)}
                          />
                        </td>
                        <td className="px-3 py-2 max-w-[300px]">
                          <p className="font-medium truncate">{r.name}</p>
                          {r.type && <p className="text-[10px] text-muted-foreground">{r.type}</p>}
                        </td>
                        <td className="px-3 py-2 hidden md:table-cell text-xs">
                          {r.city && <p className="font-medium">{r.city}</p>}
                          {r.district && <p className="text-muted-foreground">{r.district}</p>}
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell text-xs font-mono">
                          {r.phone ? <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span> : <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="px-3 py-2 hidden lg:table-cell text-xs">
                          {r.email ? <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span> : <span className="text-muted-foreground/50">—</span>}
                        </td>
                        <td className="px-3 py-2 hidden xl:table-cell max-w-[250px]">
                          {r.address && <span className="flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3 mt-0.5 shrink-0" /><span className="truncate">{r.address}</span></span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Sayfalama notu */}
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-3 flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
              <p>
                <strong>MVP:</strong> şu an her tab'da ilk {PAGE_LIMIT} kayıt gösteriliyor.
                Tam liste için server-side pagination ve "Tümünü seç (X bin)" ekleyeceğiz.
                Bulk send butonları henüz <strong>messaging campaign sistemine bağlanmadı</strong> —
                bir sonraki adımda /super-admin/messaging/campaigns/new'e selected ID'leri query param ile aktaracağız.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
