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
import {
  Search, Mail, MessageSquare, MessageCircle, Phone, MapPin, Upload, Plus,
  Building2, Heart, Trophy, Server, Landmark, Loader2, AlertCircle, CheckCircle2,
  ChevronDown, X, FileSpreadsheet, UserMinus,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { SearchableSelect } from '@/components/shared/searchable-select';
import { neighborhoodsData } from '@/lib/data';
import { OutreachDashboard } from './_components/OutreachDashboard';

interface OutreachRow {
  id: string;
  name: string;
  shortName?: string;
  type?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  phone?: string;
  phone2?: string;
  email?: string;
  etebligat?: string;
  website?: string;
  address?: string;
  status?: string;
  faaliyetAlani?: string;
  detayliFaaliyetAlani?: string;
  kutukNo?: string;
  kurulusTarihi?: string;
  isKamuYarari?: boolean;
  kamuYariNo?: string;
  kamuYariTarihi?: string;
  platforms?: string[];
  // Spor Kulübü için: kayıtlı olduğu federasyonlar (TFF, TBF, TVF vs.)
  federations?: string[];
}

// Vakıf/dernek detayında "Kayıtlı Olduğu Platformlar" multi-select seçenekleri.
const PLATFORMS = [
  'Afet Platformu',
  'Açık Açık',
  'Tüsev',
  'Adım Adım',
  'Ability Pool',
  'HelpSteps',
  'Candid',
  'Goodstack',
  'GlobalGiving',
  'Fonzip',
  'Global Compact',
  'Idealist',
  'gonulluyuzbiz.gov.tr',
  'TGSP',
] as const;

// Spor Kulübü detayında "Kayıtlı Olduğu Federasyonlar" multi-select.
// Kaynak: outreachContacts/Federasyon (faaliyetAlani='Spor') — 62 federasyon.
// federation-scrape pipeline'ı (workflow) bu listeyi doldurur, kullanıcı UI'dan
// düzeltebilir.
const FEDERATIONS: readonly string[] = [
  'Türkiye Atletizm Federasyonu',
  'Türkiye Atıcılık ve Avcılık Federasyonu',
  'Türkiye Badminton Federasyonu',
  'Türkiye Basketbol Federasyonu',
  'Türkiye Bedensel Engelliler Spor Federasyonu',
  'Türkiye Beyzbol Softbol Korumalı Futbol ve Ragbi Federasyonu',
  'Türkiye Bilardo Federasyonu',
  'Türkiye Binicilik Federasyonu',
  'Türkiye Bisiklet Federasyonu',
  'Türkiye Bocce Bowling ve Dart Federasyonu',
  'Türkiye Boks Federasyonu',
  'Türkiye Briç Federasyonu',
  'Türkiye Buz Hokeyi Federasyonu',
  'Türkiye Buz Pateni Federasyonu',
  'Türkiye Cimnastik Federasyonu',
  'Türkiye Curling Federasyonu',
  'Türkiye Dans Sporları Federasyonu',
  'Türkiye Dağcılık Federasyonu',
  'Türkiye E-Spor Federasyonu',
  'Türkiye Eskrim Federasyonu',
  'Türkiye Futbol Federasyonu',
  'Türkiye Geleneksel Atlı Spor Dalları Federasyonu',
  'Türkiye Geleneksel Güreşler Federasyonu',
  'Türkiye Geleneksel Spor Dalları Federasyonu',
  'Türkiye Geleneksel Türk Okçuluk Federasyonu',
  'Türkiye Gelişmekte Olan Spor Branşları Federasyonu',
  'Türkiye Golf Federasyonu',
  'Türkiye Görme Engelliler Spor Federasyonu',
  'Türkiye Halk Oyunları Federasyonu',
  'Türkiye Halter Federasyonu',
  'Türkiye Hava Sporları Federasyonu',
  'Türkiye Hentbol Federasyonu',
  'Türkiye Herkes İçin Spor Federasyonu',
  'Türkiye Hokey Federasyonu',
  'Türkiye İzcilik Federasyonu',
  'Türkiye İşitme Engelliler Spor Federasyonu',
  'Türkiye Judo Federasyonu',
  'Türkiye Kano Federasyonu',
  'Türkiye Karate Federasyonu',
  'Türkiye Kayak Federasyonu',
  'Türkiye Kaykay Federasyonu',
  'Türkiye Kick Boks Federasyonu',
  'Türkiye Kürek Federasyonu',
  'Türkiye Masa Tenisi Federasyonu',
  'Türkiye Modern Pentatlon Federasyonu',
  'Türkiye Motosiklet Federasyonu',
  'Türkiye Muay Thai Federasyonu',
  'Türkiye Oryantiring Federasyonu',
  'Türkiye Otomobil Sporları Federasyonu',
  'Türkiye Satranç Federasyonu',
  'Türkiye Sualtı Sporları Federasyonu',
  'Türkiye Sutopu Federasyonu',
  'Türkiye Taekwondo Federasyonu',
  'Türkiye Tenis Federasyonu',
  'Türkiye Triatlon Federasyonu',
  'Türkiye Voleybol Federasyonu',
  'Türkiye Vücut Geliştirme Fitness ve Bilek Güreşi Federasyonu',
  'Türkiye Wushu Kung Fu Federasyonu',
  'Türkiye Yelken Federasyonu',
  'Türkiye Yüzme Federasyonu',
  'Türkiye Özel Sporcular Spor Federasyonu',
  'Türkiye Üniversite Sporları Federasyonu',
] as const;

type TabKey = 'vakiflar' | 'dernekler' | 'outreach';
const SOURCE_MAP: Record<TabKey, string> = {
  vakiflar: 'registryVakiflar',
  dernekler: 'registryDernekler',
  outreach: 'outreachContacts',
};
const PAGE_SIZE_OPTIONS = [100, 250, 500, 1000] as const;
type PageSize = typeof PAGE_SIZE_OPTIONS[number];

// Spor branşları — Spor Kulüpleri filter dropdown'ı için.
// Kaynak: TSGM resmi federasyon kategorileri + popüler diğer branşlar.
const SPOR_FAALIYET_ALANLARI: readonly string[] = [
  'Futbol', 'Basketbol', 'Voleybol', 'Hentbol', 'Tenis', 'Masa Tenisi', 'Badminton',
  'Atletizm', 'Yüzme', 'Sutopu', 'Kürek', 'Kano',
  'Güreş', 'Judo', 'Karate', 'Taekwondo', 'Boks', 'Kick Boks', 'Wushu', 'Muay Thai',
  'Halter', 'Cimnastik', 'Vücut Geliştirme & Fitness',
  'Bisiklet', 'Yelken', 'Kayak', 'Buz Pateni', 'Buz Hokeyi', 'Snowboard',
  'Okçuluk', 'Atıcılık', 'Binicilik', 'Modern Pentatlon', 'Triatlon',
  'Eskrim', 'Bocce/Bowling/Dart', 'Bilardo', 'Golf', 'Satranç', 'Briç',
  'Dağcılık', 'Sualtı Sporları', 'Hava Sporları', 'Otomobil Sporları', 'Motosiklet',
  'Beyzbol/Softbol', 'Korumalı Futbol/Ragbi', 'Çim Hokeyi', 'Hokey',
  'Dans Sporları', 'Halk Oyunları', 'Geleneksel Spor Dalları (Yağlı Güreş)',
  'İzcilik', 'Kaykay', 'E-Spor',
  'Bedensel Engelliler', 'Görme Engelliler', 'İşitme Engelliler', 'Özel Sporcular',
  'Üniversite Sporları', 'Okul Sporları',
  'Herkes İçin Spor', 'Spor Kulübü (Çok Branşlı)',
] as const;

// Kategori kartları: tıklayınca ilgili tab'a/filtreye geçiş.
// `targetTab` + `typeFilter` her kart için aksiyon tanımlar.
const CATEGORY_CARDS: Array<{
  key: string;
  label: string;
  icon: React.ElementType;
  color: string;
  count: number;
  targetTab: TabKey;
  typeFilter?: string;
}> = [
  { key: 'vakiflar',     label: 'Vakıflar',                       icon: Landmark,  color: 'bg-amber-500',  count: 6680,    targetTab: 'vakiflar' },
  { key: 'dernekler',    label: 'Dernekler',                      icon: Heart,     color: 'bg-rose-500',   count: 100967,  targetTab: 'dernekler' },
  { key: 'sivil-toplum', label: 'Sivil Toplum Müdürlükleri',      icon: Building2, color: 'bg-blue-500',   count: 81,      targetTab: 'outreach', typeFilter: 'SivilToplumMüdürlüğü' },
  { key: 'federasyonlar', label: 'Federasyonlar',                 icon: Landmark,  color: 'bg-emerald-500', count: 98,      targetTab: 'outreach', typeFilter: 'Federasyon' },
  { key: 'spor',         label: 'Spor Kulüpleri',                 icon: Trophy,    color: 'bg-orange-500', count: 5266,    targetTab: 'outreach', typeFilter: 'SporKulübü' },
  { key: 'genc-spor-mudurluk', label: 'Gençlik ve Spor İl ve İlçe Müdürlükleri', icon: Server, color: 'bg-violet-500', count: 81, targetTab: 'outreach', typeFilter: 'GencSporMudurlugu,GencSporIlceMudurlugu' },
];

// Export sütunları — sekmeye göre. Excel (.xlsx) çıktısında kullanılır.
function exportColumns(tab: TabKey): Array<{ key: keyof OutreachRow | 'siraNo'; label: string }> {
  if (tab === 'vakiflar') {
    return [
      { key: 'siraNo', label: 'Sıra No' },
      { key: 'name', label: 'Vakıf Adı' },
      { key: 'shortName', label: 'Kısa Ad' },
      { key: 'faaliyetAlani', label: 'Faaliyet Alanı' },
      { key: 'address', label: 'Adres' },
      { key: 'city', label: 'İl' },
      { key: 'district', label: 'İlçe' },
      { key: 'neighborhood', label: 'Mahalle' },
      { key: 'phone', label: 'Telefon-1' },
      { key: 'phone2', label: 'Telefon-2' },
      { key: 'etebligat', label: 'E-Tebligat' },
      { key: 'email', label: 'E-Posta' },
      { key: 'website', label: 'Web Sitesi' },
      { key: 'kutukNo', label: 'Kütük No' },
    ];
  }
  if (tab === 'dernekler') {
    return [
      { key: 'siraNo', label: 'Sıra No' },
      { key: 'name', label: 'Derneğin Adı' },
      { key: 'shortName', label: 'Kısa Adı' },
      { key: 'faaliyetAlani', label: 'Faaliyet Alanı' },
      { key: 'detayliFaaliyetAlani', label: 'Detaylı Faaliyet Alanı' },
      { key: 'kutukNo', label: 'Kütük No' },
      { key: 'kurulusTarihi', label: 'Kuruluş Tarihi' },
      { key: 'phone', label: 'Telefon-1' },
      { key: 'phone2', label: 'Telefon-2' },
      { key: 'email', label: 'E-Posta' },
      { key: 'website', label: 'Web Sitesi' },
      { key: 'address', label: 'Adres' },
      { key: 'city', label: 'İl' },
      { key: 'district', label: 'İlçe' },
      { key: 'neighborhood', label: 'Mahalle' },
    ];
  }
  return [
    { key: 'siraNo', label: 'Sıra No' },
    { key: 'name', label: 'Ad' },
    { key: 'shortName', label: 'Kısa Ad' },
    { key: 'type', label: 'Tür' },
    { key: 'faaliyetAlani', label: 'Faaliyet Alanı' },
    { key: 'address', label: 'Adres' },
    { key: 'city', label: 'İl' },
    { key: 'district', label: 'İlçe' },
    { key: 'neighborhood', label: 'Mahalle' },
    { key: 'phone', label: 'Telefon-1' },
    { key: 'phone2', label: 'Telefon-2' },
    { key: 'etebligat', label: 'E-Tebligat' },
    { key: 'email', label: 'E-Posta' },
    { key: 'website', label: 'Web Sitesi' },
    { key: 'status', label: 'Durum' },
  ];
}

// Excel (.xlsx) dışa aktar — SheetJS. Türkçe karakter + çok sütun güvenli.
// Dinamik import: xlsx (~900KB) sayfa bundle'ına girmez, sadece indirme anında yüklenir.
async function exportRowsToXlsx(rows: OutreachRow[], tab: TabKey, filename: string) {
  const XLSX = await import('xlsx');
  const cols = exportColumns(tab);
  const aoa: (string | number)[][] = [cols.map((c) => c.label)];
  rows.forEach((r, idx) => {
    aoa.push(cols.map((c) => {
      if (c.key === 'siraNo') return idx + 1;
      const v = (r as unknown as Record<string, unknown>)[c.key as string];
      if (Array.isArray(v)) return v.join(', ');
      if (typeof v === 'boolean') return v ? 'Evet' : 'Hayır';
      return v == null ? '' : String(v);
    }));
  });
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = cols.map((c) => ({ wch: Math.min(45, Math.max(10, c.label.length + 6)) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Outreach');
  XLSX.writeFile(wb, filename);
}

function DetailField({ label, value, onChange, wide }: { label: string; value?: string; onChange: (v: string) => void; wide?: boolean }) {
  return (
    <div className={cn('space-y-1', wide && 'sm:col-span-2 lg:col-span-3')}>
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      <Input value={value || ''} onChange={(e) => onChange(e.target.value)} className="h-9" />
    </div>
  );
}

// Vakıf/dernek detayında kayıtlı olunan sivil toplum platformlarını çoklu seçim.
// Spor Kulübü detayında "Kayıtlı Olduğu Federasyonlar" multi-select (62 federasyon).
// PlatformsField pattern'i kopya — emerald border ile ayırt edilir, 2-4 kolon grid.
function FederationsField({ value, onChange }: { value?: string[]; onChange: (v: string[]) => void }) {
  const selected = new Set(value || []);
  return (
    <div className="space-y-2 sm:col-span-2 lg:col-span-3 rounded-md border border-emerald-200 bg-emerald-50/40 p-3">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        Kayıtlı Olduğu Federasyonlar
        {selected.size > 0 && <span className="ml-2 text-emerald-700">({selected.size} seçili)</span>}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-64 overflow-y-auto">
        {FEDERATIONS.map((f) => {
          const checked = selected.has(f);
          return (
            <label key={f} className="flex items-center gap-2 text-xs cursor-pointer">
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => {
                  const next = new Set(selected);
                  if (v) next.add(f);
                  else next.delete(f);
                  onChange(Array.from(next));
                }}
              />
              <span className="truncate" title={f}>{f.replace(/^Türkiye /, '')}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function PlatformsField({ value, onChange }: { value?: string[]; onChange: (v: string[]) => void }) {
  const selected = new Set(value || []);
  return (
    <div className="space-y-2 sm:col-span-2 lg:col-span-3 rounded-md border border-blue-200 bg-blue-50/40 p-3">
      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Kayıtlı Olduğu Platformlar</label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {PLATFORMS.map((p) => {
          const checked = selected.has(p);
          return (
            <label key={p} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={checked}
                onCheckedChange={(v) => {
                  const next = new Set(selected);
                  if (v) next.add(p);
                  else next.delete(p);
                  onChange(Array.from(next));
                }}
              />
              <span>{p}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export default function OutreachHubPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<TabKey>('vakiflar');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState<PageSize>(100);
  const [showUnsubscribed, setShowUnsubscribed] = useState(false);
  const [faaliyetAlaniFilter, setFaaliyetAlaniFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [kamuYarariOnly, setKamuYarariOnly] = useState(false);
  // İl / İlçe / Mahalle süzgeçleri — client-side (yüklü satırlarda; kütükte il/ilçe
  // alanı her kaynakta yok, İstanbul "(Avrupa/Anadolu)" sonekli — bu yüzden adres
  // metni + alanlar üzerinde diakritik duyarsız eşleşme ile tutarlı süzme).
  const [ilFilter, setIlFilter] = useState('');
  const [ilceFilter, setIlceFilter] = useState('');
  const [mahalleFilter, setMahalleFilter] = useState('');
  const [emailOnly, setEmailOnly] = useState(false);
  const [phoneOnly, setPhoneOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editData, setEditData] = useState<(OutreachRow & { neighborhood?: string }) | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [rows, setRows] = useState<OutreachRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchPage = useCallback(async (nextCursor: string | null, append: boolean) => {
    if (!user) return { rows: [] as OutreachRow[], nextCursor: null as string | null };
    if (append) setLoadingMore(true); else setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        source: SOURCE_MAP[activeTab],
        limit: String(pageSize),
      });
      if (nextCursor) params.set('cursor', nextCursor);
      if (searchTerm.trim()) params.set('search', searchTerm.trim());
      if (emailOnly) params.set('emailOnly', 'true');
      if (phoneOnly) params.set('phoneOnly', 'true');
      if (showUnsubscribed) params.set('showUnsubscribed', 'true');
      if (kamuYarariOnly && activeTab === 'dernekler') params.set('kamuYarariOnly', 'true');
      // İl filtresi server-side. Dernekler için `il` alanı backfill ile dolduruldu
      // (kütükNo plate code → neighborhoodsData key formatında, ör. "Tekirdağ").
      if (ilFilter && (activeTab === 'vakiflar' || activeTab === 'dernekler')) {
        params.set('city', ilFilter);
      }

      const res = await fetch(`/api/super-admin/outreach/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // 410 CURSOR_INVALID — sıfırla ve baştan yükle
      if (res.status === 410) {
        setCursor(null);
        setHasMore(true);
        setRows([]);
        // Re-fetch otomatik tetiklenmesi için cursor temizleyip dön
        return { rows: [], nextCursor: null };
      }
      if (!res.ok) throw new Error((await res.json())?.message || 'Yükleme hatası');
      const data: { rows: OutreachRow[]; nextCursor: string | null } = await res.json();
      setRows((prev) => append ? [...prev, ...data.rows] : data.rows);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
      if (!append) setRows([]);
      return { rows: [], nextCursor: null };
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user, activeTab, searchTerm, emailOnly, phoneOnly, pageSize, showUnsubscribed, kamuYarariOnly, ilFilter]);

  // "Tümünü Yükle" — loop ile son sayfaya kadar fetch et.
  // hasMore false olunca durur. Max 1000 sayfa güvenlik limiti (= 1M kayıt).
  const [loadAllProgress, setLoadAllProgress] = useState<{ loaded: number; total?: number } | null>(null);
  const loadAllRef = React.useRef(false);
  const loadAll = useCallback(async () => {
    if (loadAllRef.current) return;
    loadAllRef.current = true;
    setLoadAllProgress({ loaded: rows.length });
    let currentCursor = cursor;
    let totalLoaded = rows.length;
    try {
      for (let i = 0; i < 1000 && currentCursor; i++) {
        const r = await fetchPage(currentCursor, true);
        if (!r || r.rows.length === 0) break;
        totalLoaded += r.rows.length;
        currentCursor = r.nextCursor;
        setLoadAllProgress({ loaded: totalLoaded });
        if (!currentCursor) break;
      }
    } finally {
      loadAllRef.current = false;
      setLoadAllProgress(null);
    }
  }, [cursor, rows.length, fetchPage]);

  // İlk yükleme + filter değişimi — hasMore ve cursor TAM reset edilir.
  useEffect(() => {
    setRows([]);
    setCursor(null);
    setHasMore(true);  // pageSize/filter değişince hasMore kalıntısını sıfırla
    setSelectedIds(new Set());
    if (user) {
      const t = setTimeout(() => fetchPage(null, false), searchTerm ? 350 : 0);
      return () => clearTimeout(t);
    }
  }, [user, activeTab, searchTerm, emailOnly, pageSize, showUnsubscribed, kamuYarariOnly, ilFilter, fetchPage]);

  // Cascading süzgeç seçenekleri (tüm Türkiye — neighborhoodsData)
  const ilOptions = useMemo(() => {
    const base = Object.keys(neighborhoodsData).sort((a, b) => a.localeCompare(b, 'tr'));
    // Vakıf/dernek kütüğü İstanbul'u "İstanbul (Avrupa)" / "İstanbul (Anadolu)" olarak
    // tutuyor (il alanı böyle). İl filtresi tam-eşleşme olduğu için, bu varyantlar
    // seçenek olarak sunulmazsa "İstanbul" seçimi neredeyse hiç kayıt getirmiyor.
    return base.flatMap((il) => (il === 'İstanbul' ? ['İstanbul (Avrupa)', 'İstanbul (Anadolu)', 'İstanbul'] : [il]));
  }, []);
  const ilceOptions = useMemo(
    () => (ilFilter && neighborhoodsData[ilFilter] ? Object.keys(neighborhoodsData[ilFilter]).sort((a, b) => a.localeCompare(b, 'tr')) : []),
    [ilFilter],
  );
  const mahalleOptions = useMemo(
    () => (ilFilter && ilceFilter && neighborhoodsData[ilFilter]?.[ilceFilter] ? neighborhoodsData[ilFilter][ilceFilter].slice().sort((a, b) => a.localeCompare(b, 'tr')) : []),
    [ilFilter, ilceFilter],
  );

  // İl/İlçe/Mahalle client-side süzme (yüklü satırlarda). İl ismi kütükte farklı
  // formatta olabildiği (İstanbul "(Avrupa)") için alanlar + adres metninde
  // diakritik duyarsız includes ile eşleşir.
  // Yüklü satırlardaki benzersiz Faaliyet Alanı değerleri (vakıf/dernek süzgeci için).
  const faaliyetAlaniOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => { if (r.faaliyetAlani) set.add(r.faaliyetAlani); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [rows]);

  const norm = (s: string) => (s || '').toLocaleLowerCase('tr');
  const filteredRows = useMemo(() => {
    const ilQ = norm(ilFilter), ilceQ = norm(ilceFilter), mahQ = norm(mahalleFilter);
    const tQ = typeFilter;
    const fQ = faaliyetAlaniFilter;
    const pQ = platformFilter;
    if (!ilQ && !ilceQ && !mahQ && !tQ && !fQ && !pQ) return rows;
    return rows.filter((r) => {
      if (tQ && !tQ.split(',').includes(r.type || '')) return false;
      if (fQ && (r.faaliyetAlani || '') !== fQ) return false;
      if (pQ && !(r.platforms || []).includes(pQ)) return false;
      const city = norm(r.city || ''), dist = norm(r.district || ''), addr = norm(r.address || '');
      const nb = norm(r.neighborhood || '');
      if (ilQ && !(city.includes(ilQ) || addr.includes(ilQ))) return false;
      if (ilceQ && !(dist === ilceQ || dist.includes(ilceQ) || addr.includes(ilceQ))) return false;
      if (mahQ && !(addr.includes(mahQ) || nb.includes(mahQ))) return false;
      return true;
    });
  }, [rows, ilFilter, ilceFilter, mahalleFilter, typeFilter, faaliyetAlaniFilter, platformFilter]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filteredRows.length && filteredRows.length > 0) setSelectedIds(new Set());
    else setSelectedIds(new Set(filteredRows.map((r) => r.id)));
  }

  function openDetail(r: OutreachRow) {
    if (expandedId === r.id) { setExpandedId(null); setEditData(null); }
    else { setExpandedId(r.id); setEditData({ ...r }); }
  }

  async function saveDetail() {
    if (!user || !editData) return;
    setSavingId(editData.id);
    setError(null);
    try {
      const token = await user.getIdToken();
      const {
        id, name, shortName, city, district, neighborhood,
        phone, phone2, email, etebligat, website, address, type, status,
        faaliyetAlani, detayliFaaliyetAlani, kutukNo, kurulusTarihi,
        isKamuYarari, kamuYariNo, kamuYariTarihi, platforms, federations,
      } = editData;
      const patch = {
        name, shortName, city, district, neighborhood,
        phone, phone2, email, etebligat, website, address, type, status,
        faaliyetAlani, detayliFaaliyetAlani, kutukNo, kurulusTarihi,
        isKamuYarari, kamuYariNo, kamuYariTarihi, platforms, federations,
      };
      const res = await fetch('/api/super-admin/outreach/update', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: SOURCE_MAP[activeTab], id, patch }),
      });
      if (!res.ok) throw new Error((await res.json())?.message || 'Kaydedilemedi');
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, name: name || r.name } : r)));
      setExpandedId(null); setEditData(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Kaydetme hatası');
    } finally {
      setSavingId(null);
    }
  }

  const selectedRows = rows.filter((r) => selectedIds.has(r.id));
  const selectedWithEmail = selectedRows.filter((r) => r.email).length;
  const selectedWithPhone = selectedRows.filter((r) => r.phone).length;

  const sourceCol = SOURCE_MAP[activeTab];
  const idList = Array.from(selectedIds).join(',');
  const emailHref = `/super-admin/outreach/send?source=${sourceCol}&channel=email&ids=${encodeURIComponent(idList)}`;
  const smsHref = `/super-admin/outreach/send?source=${sourceCol}&channel=sms&ids=${encodeURIComponent(idList)}`;
  const whatsappHref = `/super-admin/outreach/send?source=${sourceCol}&channel=whatsapp&ids=${encodeURIComponent(idList)}`;

  // "Listeden Çıkar / Geri Al" — status alanını flip eder ve API'ye gönderir.
  async function toggleUnsubscribe(r: OutreachRow) {
    if (!user) return;
    const willUnsub = r.status !== 'unsubscribed';
    const newStatus = willUnsub ? 'unsubscribed' : 'active';
    setSavingId(r.id);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/super-admin/outreach/update', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: SOURCE_MAP[activeTab], id: r.id, patch: { status: newStatus } }),
      });
      if (!res.ok) throw new Error((await res.json())?.message || 'Güncelleme başarısız');
      // Görünüm: aktif listede iken unsub yapılırsa satır gizlenir; tersi de geçerli.
      setRows((prev) => prev.map((row) => row.id === r.id ? { ...row, status: newStatus } : row));
      if (editData?.id === r.id) setEditData({ ...editData, status: newStatus });
      if (showUnsubscribed !== (newStatus === 'unsubscribed')) {
        setRows((prev) => prev.filter((row) => row.id !== r.id));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setSavingId(null);
    }
  }

  async function handleExport() {
    // Seçili varsa onları, yoksa görünür satırların tümünü Excel (.xlsx) indir.
    const exportRows = selectedIds.size > 0 ? filteredRows.filter((r) => selectedIds.has(r.id)) : filteredRows;
    if (exportRows.length === 0) return;
    const ts = new Date().toISOString().slice(0, 10);
    try {
      await exportRowsToXlsx(exportRows, activeTab, `hangel-outreach-${activeTab}-${ts}.xlsx`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Excel oluşturulamadı');
    }
  }

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
          <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredRows.length === 0} title="Excel (.xlsx) indir">
            <FileSpreadsheet className="h-4 w-4 mr-1" />
            İndir ({selectedIds.size > 0 ? `${selectedIds.size} seçili` : `${filteredRows.length} kayıt`})
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/super-admin/outreach/import"><Upload className="h-4 w-4 mr-1" /> CSV İçe Aktar</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/super-admin/outreach/new"><Plus className="h-4 w-4 mr-1" /> Yeni Kontak</Link>
          </Button>
        </div>
      </div>


      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {CATEGORY_CARDS.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeTab === cat.targetTab && (cat.typeFilter ? typeFilter === cat.typeFilter : !typeFilter || cat.targetTab !== 'outreach');
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setActiveTab(cat.targetTab);
                setTypeFilter(cat.typeFilter || '');
                setFaaliyetAlaniFilter('');  // kategori değişince faaliyet/branş filtresi sıfırla
                setPlatformFilter('');
              }}
              className={cn(
                'text-left rounded-xl border bg-card transition-all hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary',
                isActive && 'ring-2 ring-primary border-primary shadow-md',
              )}
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', cat.color)}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground truncate">{cat.label}</p>
                </div>
                <p className="text-2xl font-black tabular-nums">{cat.count.toLocaleString('tr-TR')}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{cat.count > 0 ? 'kayıt' : 'henüz eklenmedi'}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Dashboard — analytics özet (kategori kartlarından sonra, listenin hemen üstünde) */}
      <OutreachDashboard user={user} />

      <div>
        <div className="space-y-4 mt-4">
          {/* Search'te il adı tespit edilirse otomatik öneri kartı.
              Örnek: "Tekirdağ" yazınca → "Tekirdağ ili dernekleri" filtreye dönüştür. */}
          {(() => {
            const sl = searchTerm.trim().toLocaleLowerCase('tr');
            if (sl.length < 3) return null;
            const ilMatch = ilOptions.find((il) => il.toLocaleLowerCase('tr') === sl);
            if (!ilMatch || ilFilter === ilMatch) return null;
            return (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="p-2.5 flex items-center justify-between gap-2 text-xs">
                  <span>
                    💡 <strong>&quot;{searchTerm}&quot;</strong> bir il adı — bu ildeki TÜM kayıtları görmek için il filtresine dönüştür.
                  </span>
                  <Button
                    size="sm"
                    variant="default"
                    className="h-7 text-xs"
                    onClick={() => {
                      setIlFilter(ilMatch);
                      setIlceFilter('');
                      setMahalleFilter('');
                      setSearchTerm('');
                    }}
                  >
                    {ilMatch} İlini Filtrele
                  </Button>
                </CardContent>
              </Card>
            );
          })()}
          <Card>
            <CardContent className="p-4 flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ad ile ara (il bazlı arama için İl dropdown'unu kullan)"
                  className="pl-9"
                />
              </div>
              {/* 4'lü ikon süzgeç grubu — Telefon var, Email var, Listeden Çıkan, Kamu Yararı */}
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant={phoneOnly ? 'default' : 'outline'}
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setPhoneOnly((v) => !v)}
                  aria-label="Sadece telefonu olanlar"
                  title="📞 Sadece telefonu olanlar"
                >
                  <Phone className="h-4 w-4" />
                </Button>
                <Button
                  variant={emailOnly ? 'default' : 'outline'}
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setEmailOnly((v) => !v)}
                  aria-label="Sadece e-postası olanlar"
                  title="📧 Sadece e-postası olanlar"
                >
                  <Mail className="h-4 w-4" />
                </Button>
                <Button
                  variant={showUnsubscribed ? 'default' : 'outline'}
                  size="icon"
                  className="h-10 w-10"
                  onClick={() => setShowUnsubscribed((v) => !v)}
                  aria-label={showUnsubscribed ? 'Aktif kayıtlara dön' : 'Listeden çıkanları göster'}
                  title={showUnsubscribed ? '🚫 Listeden çıkanları gösteriyorsun — aktif listeye dön' : '🚫 Listeden çıkanlar'}
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
                {activeTab === 'dernekler' && (
                  <Button
                    variant={kamuYarariOnly ? 'default' : 'outline'}
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setKamuYarariOnly((v) => !v)}
                    aria-label="Kamu Yararına çalışan dernekler"
                    title="🏛 Kamu Yararına çalışan dernekler (326 kayıt)"
                  >
                    <Landmark className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Spor Kulüpleri için Faaliyet Alanı (branş) filtresi */}
              {typeFilter === 'SporKulübü' && (
                <div className="w-48">
                  <SearchableSelect
                    options={SPOR_FAALIYET_ALANLARI.slice()}
                    value={faaliyetAlaniFilter}
                    placeholder="Faaliyet Alanı"
                    searchPlaceholder="Branş ara..."
                    onValueChange={setFaaliyetAlaniFilter}
                    triggerClassName="h-10 rounded-md border bg-background px-3"
                  />
                </div>
              )}

              {/* Federasyonlar için Faaliyet Alanı (Spor/STK/Mesleki) filtresi */}
              {typeFilter === 'Federasyon' && (
                <div className="w-48">
                  <SearchableSelect
                    options={['Spor', 'STK', 'Mesleki']}
                    value={faaliyetAlaniFilter}
                    placeholder="Faaliyet Alanı"
                    searchPlaceholder="Kategori ara..."
                    onValueChange={setFaaliyetAlaniFilter}
                    triggerClassName="h-10 rounded-md border bg-background px-3"
                  />
                </div>
              )}

              {/* Faaliyet Alanı süzgeci — vakıf/dernek (yüklü kayıtlardaki benzersiz değerler) */}
              {(activeTab === 'vakiflar' || activeTab === 'dernekler') && faaliyetAlaniOptions.length > 0 && (
                <div className="w-48">
                  <SearchableSelect
                    options={faaliyetAlaniOptions}
                    value={faaliyetAlaniFilter}
                    placeholder="Faaliyet Alanı"
                    searchPlaceholder="Faaliyet alanı ara..."
                    onValueChange={setFaaliyetAlaniFilter}
                    triggerClassName="h-10 rounded-md border bg-background px-3"
                  />
                </div>
              )}

              {/* Platform süzgeci — kayıtlı olunan sivil toplum platformuna göre */}
              <div className="w-44">
                <SearchableSelect
                  options={[...PLATFORMS]}
                  value={platformFilter}
                  placeholder="Platform"
                  searchPlaceholder="Platform ara..."
                  onValueChange={setPlatformFilter}
                  triggerClassName="h-10 rounded-md border bg-background px-3"
                />
              </div>


              <div className="w-36">
                <SearchableSelect options={ilOptions} value={ilFilter} placeholder="İl" searchPlaceholder="İl ara..."
                  onValueChange={(v) => { setIlFilter(v); setIlceFilter(''); setMahalleFilter(''); }}
                  triggerClassName="h-10 rounded-md border bg-background px-3" />
              </div>
              <div className="w-36">
                <SearchableSelect options={ilceOptions} value={ilceFilter} placeholder="İlçe" searchPlaceholder="İlçe ara..."
                  disabled={!ilFilter}
                  onValueChange={(v) => { setIlceFilter(v); setMahalleFilter(''); }}
                  triggerClassName="h-10 rounded-md border bg-background px-3" />
              </div>
              <div className="w-36">
                <SearchableSelect options={mahalleOptions} value={mahalleFilter} placeholder="Mahalle" searchPlaceholder="Mahalle ara..."
                  disabled={!ilceFilter}
                  onValueChange={setMahalleFilter}
                  triggerClassName="h-10 rounded-md border bg-background px-3" />
              </div>
              {(ilFilter || ilceFilter || mahalleFilter || faaliyetAlaniFilter || platformFilter) && (
                <Button variant="ghost" size="sm" onClick={() => { setIlFilter(''); setIlceFilter(''); setMahalleFilter(''); setFaaliyetAlaniFilter(''); setPlatformFilter(''); }}>
                  <X className="h-4 w-4 mr-1" /> Temizle
                </Button>
              )}

              {activeTab === 'vakiflar' && (
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={emailOnly} onCheckedChange={(v) => setEmailOnly(!!v)} />
                  <span>Sadece email'i olanlar</span>
                </label>
              )}

              <div className="text-xs text-muted-foreground ml-auto">
                {loading ? 'Yükleniyor...' : (ilFilter || ilceFilter || mahalleFilter)
                  ? `${filteredRows.length.toLocaleString('tr-TR')} / ${rows.length.toLocaleString('tr-TR')} kayıt (süzülü)`
                  : `${rows.length.toLocaleString('tr-TR')} kayıt yüklü${hasMore ? '+' : ''}`}
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
                  <Button asChild size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50" disabled={selectedWithPhone === 0}>
                    <Link href={whatsappHref}><MessageCircle className="h-4 w-4 mr-1" /> WhatsApp Gönder ({selectedWithPhone})</Link>
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
                        checked={filteredRows.length > 0 && selectedIds.size === filteredRows.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-3 py-2">Ad</th>
                    <th className="px-3 py-2 hidden md:table-cell">İl / İlçe</th>
                    <th className="px-3 py-2 hidden lg:table-cell">Telefon</th>
                    <th className="px-3 py-2 hidden lg:table-cell">Email</th>
                    <th className="px-3 py-2 hidden xl:table-cell">Adres</th>
                    <th className="px-3 py-2 w-20 text-right">Detay</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-12"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></td></tr>
                  ) : filteredRows.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-sm text-muted-foreground">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      {rows.length === 0
                        ? <>Kayıt bulunamadı. {activeTab === 'outreach' && 'Yeni kontak ekle veya CSV içe aktar.'}</>
                        : 'Süzgece uyan kayıt yok.'}
                    </td></tr>
                  ) : (
                    filteredRows.map((r) => (
                      <React.Fragment key={r.id}>
                        <tr className="border-b hover:bg-muted/20 transition-colors">
                          <td className="px-3 py-2">
                            <Checkbox checked={selectedIds.has(r.id)} onCheckedChange={() => toggleSelect(r.id)} />
                          </td>
                          <td className="px-3 py-2 max-w-[300px]">
                            <p className="font-medium break-words">{r.name}</p>
                            {r.type && <p className="text-[10px] text-muted-foreground">{r.type}</p>}
                          </td>
                          <td className="px-3 py-2 hidden md:table-cell text-xs">
                            {r.city && <p className="font-medium">{r.city}</p>}
                            {r.district && <p className="text-muted-foreground">{r.district}</p>}
                          </td>
                          <td className="px-3 py-2 hidden lg:table-cell text-xs font-mono">
                            {r.phone ? (
                              <span className="flex items-center gap-1 group">
                                <Phone className="h-3 w-3" />
                                {r.phone}
                                {/* Click-to-call placeholder — santral aktif olunca buradan arama başlar */}
                                <Link
                                  href={`/super-admin/call-center?dial=${encodeURIComponent(r.phone)}&contactId=${r.id}`}
                                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity h-5 w-5 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700"
                                  title="📞 Panelden ara (yakında)"
                                  aria-label="Numarayi ara"
                                >
                                  <Phone className="h-2.5 w-2.5" />
                                </Link>
                              </span>
                            ) : <span className="text-muted-foreground/50">—</span>}
                          </td>
                          <td className="px-3 py-2 hidden lg:table-cell text-xs">
                            {r.email ? <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span> : <span className="text-muted-foreground/50">—</span>}
                          </td>
                          <td className="px-3 py-2 hidden xl:table-cell max-w-[250px]">
                            {r.address && <span className="flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3 mt-0.5 shrink-0" /><span className="truncate">{r.address}</span></span>}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => openDetail(r)}>
                              Detay <ChevronDown className={cn('h-3.5 w-3.5 ml-1 transition-transform', expandedId === r.id && 'rotate-180')} />
                            </Button>
                          </td>
                        </tr>
                        {expandedId === r.id && editData && (
                          <tr className="bg-muted/20 border-b">
                            <td colSpan={7} className="px-4 py-4 space-y-3">
                              {/* Sıra No + status badge + Kamu Yararı */}
                              <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2 flex-wrap">
                                <span>Sıra No: <span className="font-mono">#{filteredRows.indexOf(r) + 1}</span></span>
                                {activeTab !== 'outreach' && r.kutukNo && <span>Kütük No: <span className="font-mono">{r.kutukNo}</span></span>}
                                {r.isKamuYarari && (
                                  <Badge className="text-[9px] bg-emerald-600 hover:bg-emerald-700">
                                    🏛 KAMU YARARINA ÇALIŞAN DERNEK
                                    {r.kamuYariNo && ` · ${r.kamuYariNo}`}
                                    {r.kamuYariTarihi && ` · ${r.kamuYariTarihi}`}
                                  </Badge>
                                )}
                                {r.status === 'unsubscribed' && (
                                  <Badge variant="destructive" className="text-[9px]">
                                    LİSTEDEN ÇIKMIŞ — mail/sms gönderilmez
                                  </Badge>
                                )}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {/* Vakıf detayı */}
                                {activeTab === 'vakiflar' && (
                                  <>
                                    <DetailField label="Vakıf Adı" value={editData.name} onChange={(v) => setEditData({ ...editData, name: v })} wide />
                                    <DetailField label="Vakfın Kısa Adı" value={editData.shortName} onChange={(v) => setEditData({ ...editData, shortName: v })} />
                                    <DetailField label="Faaliyet Alanı" value={editData.faaliyetAlani} onChange={(v) => setEditData({ ...editData, faaliyetAlani: v })} wide />
                                    <DetailField label="Adres" value={editData.address} onChange={(v) => setEditData({ ...editData, address: v })} wide />
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-medium text-muted-foreground">İl</label>
                                      <SearchableSelect options={ilOptions} value={editData.city || ''} placeholder="İl seç..." searchPlaceholder="İl ara..." onValueChange={(v) => setEditData({ ...editData, city: v, district: '', neighborhood: '' })} triggerClassName="h-9 rounded-md border bg-background px-3" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-medium text-muted-foreground">İlçe</label>
                                      <SearchableSelect options={editData.city && neighborhoodsData[editData.city] ? Object.keys(neighborhoodsData[editData.city]).sort((a, b) => a.localeCompare(b, 'tr')) : []} value={editData.district || ''} placeholder="İlçe seç..." searchPlaceholder="İlçe ara..." disabled={!editData.city} onValueChange={(v) => setEditData({ ...editData, district: v, neighborhood: '' })} triggerClassName="h-9 rounded-md border bg-background px-3" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-medium text-muted-foreground">Mahalle</label>
                                      <SearchableSelect options={editData.city && editData.district && neighborhoodsData[editData.city]?.[editData.district] ? neighborhoodsData[editData.city][editData.district].slice().sort((a, b) => a.localeCompare(b, 'tr')) : []} value={editData.neighborhood || ''} placeholder="Mahalle seç..." searchPlaceholder="Mahalle ara..." disabled={!editData.district} onValueChange={(v) => setEditData({ ...editData, neighborhood: v })} triggerClassName="h-9 rounded-md border bg-background px-3" />
                                    </div>
                                    <DetailField label="Telefon-1" value={editData.phone} onChange={(v) => setEditData({ ...editData, phone: v })} />
                                    <DetailField label="Telefon-2" value={editData.phone2} onChange={(v) => setEditData({ ...editData, phone2: v })} />
                                    <DetailField label="E-Tebligat Adresi" value={editData.etebligat} onChange={(v) => setEditData({ ...editData, etebligat: v })} />
                                    <DetailField label="E-Posta" value={editData.email} onChange={(v) => setEditData({ ...editData, email: v })} />
                                    <DetailField label="Web Sitesi" value={editData.website} onChange={(v) => setEditData({ ...editData, website: v })} wide />
                                    <PlatformsField value={editData.platforms} onChange={(v) => setEditData({ ...editData, platforms: v })} />
                                  </>
                                )}
                                {/* Dernek detayı */}
                                {activeTab === 'dernekler' && (
                                  <>
                                    <DetailField label="Derneğin Adı" value={editData.name} onChange={(v) => setEditData({ ...editData, name: v })} wide />
                                    <DetailField label="Kısa Adı" value={editData.shortName} onChange={(v) => setEditData({ ...editData, shortName: v })} />
                                    <DetailField label="Faaliyet Alanı" value={editData.faaliyetAlani} onChange={(v) => setEditData({ ...editData, faaliyetAlani: v })} wide />
                                    <DetailField label="Detaylı Faaliyet Alanı" value={editData.detayliFaaliyetAlani} onChange={(v) => setEditData({ ...editData, detayliFaaliyetAlani: v })} wide />
                                    <DetailField label="Kütük No" value={editData.kutukNo} onChange={(v) => setEditData({ ...editData, kutukNo: v })} />
                                    <DetailField label="Kuruluş Tarihi" value={editData.kurulusTarihi} onChange={(v) => setEditData({ ...editData, kurulusTarihi: v })} />
                                    <DetailField label="Web Sitesi" value={editData.website} onChange={(v) => setEditData({ ...editData, website: v })} />
                                    <DetailField label="Telefon-1" value={editData.phone} onChange={(v) => setEditData({ ...editData, phone: v })} />
                                    <DetailField label="Telefon-2" value={editData.phone2} onChange={(v) => setEditData({ ...editData, phone2: v })} />
                                    <DetailField label="E-Posta" value={editData.email} onChange={(v) => setEditData({ ...editData, email: v })} />
                                    <DetailField label="E-Tebligat" value={editData.etebligat} onChange={(v) => setEditData({ ...editData, etebligat: v })} />
                                    <DetailField label="Adres" value={editData.address} onChange={(v) => setEditData({ ...editData, address: v })} wide />
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-medium text-muted-foreground">İl</label>
                                      <SearchableSelect options={ilOptions} value={editData.city || ''} placeholder="İl seç..." searchPlaceholder="İl ara..." onValueChange={(v) => setEditData({ ...editData, city: v, district: '', neighborhood: '' })} triggerClassName="h-9 rounded-md border bg-background px-3" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-medium text-muted-foreground">İlçe</label>
                                      <SearchableSelect options={editData.city && neighborhoodsData[editData.city] ? Object.keys(neighborhoodsData[editData.city]).sort((a, b) => a.localeCompare(b, 'tr')) : []} value={editData.district || ''} placeholder="İlçe seç..." searchPlaceholder="İlçe ara..." disabled={!editData.city} onValueChange={(v) => setEditData({ ...editData, district: v, neighborhood: '' })} triggerClassName="h-9 rounded-md border bg-background px-3" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-medium text-muted-foreground">Mahalle</label>
                                      <SearchableSelect options={editData.city && editData.district && neighborhoodsData[editData.city]?.[editData.district] ? neighborhoodsData[editData.city][editData.district].slice().sort((a, b) => a.localeCompare(b, 'tr')) : []} value={editData.neighborhood || ''} placeholder="Mahalle seç..." searchPlaceholder="Mahalle ara..." disabled={!editData.district} onValueChange={(v) => setEditData({ ...editData, neighborhood: v })} triggerClassName="h-9 rounded-md border bg-background px-3" />
                                    </div>
                                    {/* Kamu Yararı (editable) — siviltoplum.gov.tr PDF listesinden seed edilir; manuel düzeltme için açık */}
                                    <div className="space-y-1 sm:col-span-2 lg:col-span-3 rounded-md border border-emerald-200 bg-emerald-50/40 p-3">
                                      <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                                        <Checkbox
                                          checked={!!editData.isKamuYarari}
                                          onCheckedChange={(v) => setEditData({ ...editData, isKamuYarari: !!v })}
                                        />
                                        <span>🏛 Kamu Yararına Çalışan Dernek</span>
                                      </label>
                                      {editData.isKamuYarari && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                          <DetailField label="Kamu Yararı No" value={editData.kamuYariNo} onChange={(v) => setEditData({ ...editData, kamuYariNo: v })} />
                                          <DetailField label="Kamu Yararı Tarihi" value={editData.kamuYariTarihi} onChange={(v) => setEditData({ ...editData, kamuYariTarihi: v })} />
                                        </div>
                                      )}
                                    </div>
                                    <PlatformsField value={editData.platforms} onChange={(v) => setEditData({ ...editData, platforms: v })} />
                                  </>
                                )}
                                {/* Outreach (manuel) — tüm alanlar */}
                                {activeTab === 'outreach' && (
                                  <>
                                    <DetailField label="Ad" value={editData.name} onChange={(v) => setEditData({ ...editData, name: v })} wide />
                                    <DetailField label="Kısa Ad" value={editData.shortName} onChange={(v) => setEditData({ ...editData, shortName: v })} />
                                    <DetailField label="Tür" value={editData.type} onChange={(v) => setEditData({ ...editData, type: v })} />
                                    {editData.type === 'SporKulübü' ? (
                                      <div className="space-y-1 sm:col-span-2 lg:col-span-3">
                                        <label className="text-[11px] font-medium text-muted-foreground">Faaliyet Alanı (Branş)</label>
                                        <SearchableSelect
                                          options={SPOR_FAALIYET_ALANLARI.slice()}
                                          value={editData.faaliyetAlani || ''}
                                          placeholder="Branş seç..."
                                          searchPlaceholder="Ara..."
                                          onValueChange={(v) => setEditData({ ...editData, faaliyetAlani: v })}
                                          triggerClassName="h-9 rounded-md border bg-background px-3"
                                        />
                                      </div>
                                    ) : (
                                      <DetailField label="Faaliyet Alanı" value={editData.faaliyetAlani} onChange={(v) => setEditData({ ...editData, faaliyetAlani: v })} wide />
                                    )}
                                    <DetailField label="Adres" value={editData.address} onChange={(v) => setEditData({ ...editData, address: v })} wide />
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-medium text-muted-foreground">İl</label>
                                      <SearchableSelect options={ilOptions} value={editData.city || ''} placeholder="İl seç..." searchPlaceholder="İl ara..." onValueChange={(v) => setEditData({ ...editData, city: v, district: '', neighborhood: '' })} triggerClassName="h-9 rounded-md border bg-background px-3" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-medium text-muted-foreground">İlçe</label>
                                      <SearchableSelect options={editData.city && neighborhoodsData[editData.city] ? Object.keys(neighborhoodsData[editData.city]).sort((a, b) => a.localeCompare(b, 'tr')) : []} value={editData.district || ''} placeholder="İlçe seç..." searchPlaceholder="İlçe ara..." disabled={!editData.city} onValueChange={(v) => setEditData({ ...editData, district: v, neighborhood: '' })} triggerClassName="h-9 rounded-md border bg-background px-3" />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[11px] font-medium text-muted-foreground">Mahalle</label>
                                      <SearchableSelect options={editData.city && editData.district && neighborhoodsData[editData.city]?.[editData.district] ? neighborhoodsData[editData.city][editData.district].slice().sort((a, b) => a.localeCompare(b, 'tr')) : []} value={editData.neighborhood || ''} placeholder="Mahalle seç..." searchPlaceholder="Mahalle ara..." disabled={!editData.district} onValueChange={(v) => setEditData({ ...editData, neighborhood: v })} triggerClassName="h-9 rounded-md border bg-background px-3" />
                                    </div>
                                    <DetailField label="Telefon-1" value={editData.phone} onChange={(v) => setEditData({ ...editData, phone: v })} />
                                    <DetailField label="Telefon-2" value={editData.phone2} onChange={(v) => setEditData({ ...editData, phone2: v })} />
                                    <DetailField label="E-Posta" value={editData.email} onChange={(v) => setEditData({ ...editData, email: v })} />
                                    <DetailField label="E-Tebligat" value={editData.etebligat} onChange={(v) => setEditData({ ...editData, etebligat: v })} />
                                    <DetailField label="Web Sitesi" value={editData.website} onChange={(v) => setEditData({ ...editData, website: v })} />
                                    <DetailField label="Durum" value={editData.status} onChange={(v) => setEditData({ ...editData, status: v })} />
                                    {/* Spor Kulübü ise federasyon multi-select. Bir kulüp birden çok federasyona kayıtlı olabilir. */}
                                    {editData.type === 'SporKulübü' && (
                                      <FederationsField value={editData.federations} onChange={(v) => setEditData({ ...editData, federations: v })} />
                                    )}
                                  </>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                                <Button
                                  variant={r.status === 'unsubscribed' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => toggleUnsubscribe(r)}
                                  disabled={savingId === r.id}
                                  className={r.status === 'unsubscribed' ? '' : 'border-rose-300 text-rose-700 hover:bg-rose-50'}
                                >
                                  <UserMinus className="h-4 w-4 mr-1" />
                                  {r.status === 'unsubscribed' ? 'Listeye Geri Al' : 'Listeden Çıkar'}
                                </Button>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => { setExpandedId(null); setEditData(null); }}>İptal</Button>
                                  <Button size="sm" onClick={saveDetail} disabled={savingId === r.id}>
                                    {savingId === r.id ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Kaydediliyor</> : 'Kaydet'}
                                  </Button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <label className="text-muted-foreground font-medium">Sayfa boyutu:</label>
              {PAGE_SIZE_OPTIONS.map((opt) => (
                <Button
                  key={opt}
                  size="sm"
                  variant={pageSize === opt ? 'default' : 'outline'}
                  className="h-8 px-3 tabular-nums"
                  onClick={() => setPageSize(opt)}
                >
                  {opt}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredRows.length === 0} title="Excel (.xlsx) indir">
                <FileSpreadsheet className="h-4 w-4 mr-1" />
                İndir ({selectedIds.size > 0 ? `${selectedIds.size} seçili` : `${filteredRows.length} kayıt`})
              </Button>
              {hasMore && rows.length > 0 && (
                <>
                  <Button onClick={() => fetchPage(cursor, true)} disabled={loadingMore || !!loadAllProgress} variant="outline" size="sm">
                    {loadingMore && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Daha Fazla Yükle ({pageSize}'er)
                  </Button>
                  <Button onClick={loadAll} disabled={loadingMore || !!loadAllProgress} variant="default" size="sm" title="Tüm kalan kayıtları batch'ler halinde yükle">
                    {loadAllProgress
                      ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yükleniyor... {loadAllProgress.loaded.toLocaleString('tr-TR')}</>
                      : 'Tümünü Yükle'}
                  </Button>
                </>
              )}
            </div>
          </div>
          {/* Büyük dataset uyarısı: vakıflar 6.680, dernekler 100.967 — "Tümünü Yükle" zaman alır */}
          {hasMore && rows.length > 0 && activeTab === 'dernekler' && !loadAllProgress && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-2 flex items-center gap-2 text-[11px] text-amber-800">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Dernekler toplamı 100.967 — "Tümünü Yükle" 5-15 dakika ve ~100 MB veri çekebilir. İl filtresiyle daraltmak daha hızlı.</span>
              </CardContent>
            </Card>
          )}

          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-3 flex items-center gap-2 text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <p>
                <strong>Server-side pagination aktif.</strong> Sayfada her seferinde {pageSize} kayıt yüklenir,
                "Daha Fazla Yükle" ile sonraki sayfa eklenir. Arama ve il filtresi server tarafında uygulanır.
                Email kampanyası butonları seçilen kontakları /send sayfasına aktarır.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
