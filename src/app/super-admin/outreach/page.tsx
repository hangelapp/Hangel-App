'use client';

/**
 * /super-admin/outreach — Outreach / Tanıtım Veritabanı
 *
 * Hangel'e henüz katılmamış kuruluşlara (vakıf, dernek, il sivil toplum
 * müdürlüğü, kargo şirketi, mail hizmet sağlayıcısı) toplu tanıtım maili
 * ve SMS göndermek için kullanılan merkezi panel.
 *
 * Veri kaynakları:
 *   - registryVakiflar (6,680) — T.C. Vakıflar Genel Müdürlüğü
 *   - registryDernekler (100,967) — T.C. Dernekler Dairesi
 *   - outreachContacts — manuel + CSV import edilen diğer kategoriler
 *
 * Server-side cursor-based pagination (/api/super-admin/outreach/list) ile
 * 100K kayıt arasında verimli gezilebilir. "Daha fazla yükle" butonu ile
 * sayfa sayfa eklenir.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Mail, MessageSquare, Phone, MapPin, Upload, Plus,
  Building2, Heart, Truck, Server, Landmark, Loader2, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { useUser } from '@/firebase';
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
}

type TabKey = 'vakiflar' | 'dernekler' | 'outreach';
const SOURCE_MAP: Record<TabKey, string> = {
  vakiflar: 'registryVakiflar',
  dernekler: 'registryDernekler',
  outreach: 'outreachContacts',
};
const PAGE_LIMIT = 100;

const CATEGORY_CARDS = [
  { key: 'vakiflar', label: 'Vakıflar', icon: Landmark, color: 'bg-amber-500', count: 6680 },
  { key: 'dernekler', label: 'Dernekler', icon: Heart, color: 'bg-rose-500', count: 100967 },
  { key: 'sivil-toplum', label: 'Sivil Toplum Müdürlükleri', icon: Building2, color: 'bg-blue-500', count: 0 },
  { key: 'kargo', label: 'Kargo Şirketleri', icon: Truck, color: 'bg-orange-500', count: 0 },
  { key: 'mail-saglayici', label: 'Mail Hizmet Sağlayıcıları', icon: Server, color: 'bg-violet-500', count: 0 },
];

export default function OutreachHubPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabKey>('vakiflar');
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [emailOnly, setEmailOnly] = useState(false);

  const [rows, setRows] = useState<OutreachRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchPage = useCallback(async (nextCursor: string | null, append: boolean) => {
    if (!user) return;
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        source: SOURCE_MAP[activeTab],
        limit: String(PAGE_LIMIT),
      });
      if (nextCursor) params.set('cursor', nextCursor);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (cityFilter !== 'all') params.set('city', cityFilter);
      if (emailOnly && activeTab === 'vakiflar') params.set('emailOnly', 'true');

      const res = await fetch(`/api/super-admin/outreach/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json())?.message || 'Yükleme hatası');
      const data: { rows: OutreachRow[]; nextCursor: string | null } = await res.json();
      setRows((prev) => append ? [...prev, ...data.rows] : data.rows);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
      if (!append) setRows([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, activeTab, searchTerm, cityFilter, emailOnly]);

  // İlk yükleme + filter değişimi
  useEffect(() => {
    setRows([]);
    setCursor(null);
    setSelectedIds(new Set());
    if (user) {
      const t = setTimeout(() => fetchPage(null, false), searchTerm ? 350 : 0);
      return () => clearTimeout(t);
    }
  }, [user, activeTab, searchTerm, cityFilter, emailOnly, fetchPage]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => { if (r.city) set.add(r.city); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
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
    if (selectedIds.size === rows.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(rows.map((r) => r.id)));
  }

  const selectedRows = rows.filter((r) => selectedIds.has(r.id));
  const selectedWithEmail = selectedRows.filter((r) => r.email).length;
  const selectedWithPhone = selectedRows.filter((r) => r.phone).length;

  const sourceCol = SOURCE_MAP[activeTab];
  const idList = Array.from(selectedIds).join(',');
  const emailHref = `/super-admin/outreach/send?source=${sourceCol}&channel=email&ids=${encodeURIComponent(idList)}`;
  const smsHref = `/super-admin/outreach/send?source=${sourceCol}&channel=sms&ids=${encodeURIComponent(idList)}`;

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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
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
            <Building2 className="h-4 w-4 mr-1" /> Diğer (Manuel/CSV)
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-4">
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
                <select
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="all">Tüm iller</option>
                  {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}

              {activeTab === 'vakiflar' && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={emailOnly} onCheckedChange={(v) => setEmailOnly(!!v)} />
                  <span>Sadece email'i olanlar</span>
                </label>
              )}

              <div className="text-xs text-muted-foreground ml-auto">
                {loading ? 'Yükleniyor...' : `${rows.length.toLocaleString('tr-TR')} kayıt yüklü${hasMore ? '+' : ''}`}
              </div>
            </CardContent>
          </Card>

          {selectedIds.size > 0 && (
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
          )}

          {error && (
            <Card className="border-rose-300 bg-rose-50">
              <CardContent className="p-3 text-sm text-rose-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> {error}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/30">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-2 w-10">
                      <Checkbox
                        checked={selectedIds.size > 0 && selectedIds.size === rows.length}
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
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-sm text-muted-foreground">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      Kayıt bulunamadı. {activeTab === 'outreach' && 'Yeni kontak ekle veya CSV içe aktar.'}
                    </td></tr>
                  ) : (
                    rows.map((r) => (
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

          {hasMore && rows.length > 0 && (
            <div className="flex justify-center">
              <Button onClick={() => fetchPage(cursor, true)} disabled={loadingMore} variant="outline">
                {loadingMore && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Daha Fazla Yükle ({PAGE_LIMIT}'er)
              </Button>
            </div>
          )}

          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-3 flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <p>
                <strong>Server-side pagination aktif.</strong> Sayfada her seferinde {PAGE_LIMIT} kayıt yüklenir,
                "Daha Fazla Yükle" ile sonraki sayfa eklenir. Arama ve il filtresi server tarafında uygulanır.
                Email kampanyası butonları seçilen kontakları /send sayfasına aktarır.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
