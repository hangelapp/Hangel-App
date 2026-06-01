'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, Search, BookText, Scale, Link2, ExternalLink, ScanSearch, Sparkles, Info, CheckCircle2, BookOpen, FileText, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { contractsData as seedContracts } from '@/lib/contracts';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type RiskLevel = 'dusuk' | 'orta' | 'yuksek' | 'kritik';
type ComplianceStatus = 'uyumlu' | 'inceleniyor' | 'eksik' | 'riskli' | 'aksiyon-gerekli';

interface Legislation {
  id: string;
  name: string;
  number?: string;
  country?: string;
  category?: string;
  riskLevel?: RiskLevel;
  complianceStatus?: ComplianceStatus;
  hangelSubject?: string;     // hangel konusu / mini çıkarım
  affectedModules?: string[]; // bağış, gönüllülük, etkinlik, AI, mesajlaşma
  articleText?: string;       // resmi madde metni
  interpretation?: string;    // hukuki yorum / risk analizi / operasyon önerisi
  relatedPolicies?: string;
  relatedContracts?: string[]; // ilişkili sözleşme/politika slug'ları
  links?: string;             // Resmi Gazete / Danıştay / içtihat linkleri (satır satır)
  updatedAt?: unknown;
}

interface ScanCandidate {
  source: 'baseline' | 'ai';
  status: 'new' | 'updated';
  id: string;
  name: string;
  number?: string;
  country?: string;
  category?: string;
  riskLevel?: RiskLevel;
  complianceStatus?: ComplianceStatus;
  hangelSubject?: string;
  affectedModules?: string[];
  articleText?: string;
  interpretation?: string;
  links?: string;
  reason?: string;
}

const RISK_META: Record<RiskLevel, { label: string; cls: string }> = {
  dusuk: { label: 'Düşük', cls: 'bg-emerald-100 text-emerald-700' },
  orta: { label: 'Orta', cls: 'bg-amber-100 text-amber-800' },
  yuksek: { label: 'Yüksek', cls: 'bg-orange-100 text-orange-800' },
  kritik: { label: 'Kritik', cls: 'bg-red-600 text-white' },
};

const COMPLIANCE_META: Record<ComplianceStatus, { label: string; cls: string }> = {
  uyumlu: { label: 'Uyumlu', cls: 'bg-green-600 text-white' },
  inceleniyor: { label: 'İnceleniyor', cls: 'bg-blue-100 text-blue-700' },
  eksik: { label: 'Eksik', cls: 'bg-amber-100 text-amber-800' },
  riskli: { label: 'Riskli', cls: 'bg-orange-100 text-orange-800' },
  'aksiyon-gerekli': { label: 'Aksiyon Gerekli', cls: 'bg-red-600 text-white' },
};

const MODULES = ['Bağış', 'Gönüllülük', 'Etkinlik', 'AI Araçları', 'Mesajlaşma', 'Kan İlanı', 'Üyelik', 'Ödeme'];
const CATEGORIES = ['KVKK', 'Dernekler Kanunu', 'Yardım Toplama', 'Elektronik Ticaret', 'Vergi', 'İş Hukuku', 'Çocuk Koruma', 'Diğer'];

// Çok yargılı: AB ve her ülke için ayrı yapılandırma. Liste gerektikçe genişletilir.
const COUNTRIES: { code: string; label: string }[] = [
  { code: 'TR', label: '🇹🇷 Türkiye' },
  { code: 'EU', label: '🇪🇺 Avrupa Birliği' },
  { code: 'INT', label: '🌍 Uluslararası' },
  { code: 'DE', label: '🇩🇪 Almanya' },
  { code: 'FR', label: '🇫🇷 Fransa' },
  { code: 'NL', label: '🇳🇱 Hollanda' },
  { code: 'GB', label: '🇬🇧 Birleşik Krallık' },
  { code: 'US', label: '🇺🇸 ABD' },
];
const countryLabel = (code?: string) => COUNTRIES.find(c => c.code === code)?.label || code || '🇹🇷 Türkiye';

const slugify = (s: string) =>
  s.toLowerCase().replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function LegislationEditDialog({ item, onSave }: { item?: Legislation; onSave: (l: Legislation) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const isNew = !item;
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [country, setCountry] = useState('TR');
  const [category, setCategory] = useState('');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('orta');
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus>('inceleniyor');
  const [hangelSubject, setHangelSubject] = useState('');
  const [affectedModules, setAffectedModules] = useState<string[]>([]);
  const [articleText, setArticleText] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [links, setLinks] = useState('');
  const [saving, setSaving] = useState(false);

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) {
      setName(item?.name || ''); setNumber(item?.number || ''); setCountry(item?.country || 'TR'); setCategory(item?.category || '');
      setRiskLevel(item?.riskLevel || 'orta'); setComplianceStatus(item?.complianceStatus || 'inceleniyor');
      setHangelSubject(item?.hangelSubject || ''); setAffectedModules(item?.affectedModules || []);
      setArticleText(item?.articleText || ''); setInterpretation(item?.interpretation || ''); setLinks(item?.links || '');
    }
  };
  const toggleModule = (m: string) => setAffectedModules(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const id = item?.id || slugify(name);
      await onSave({ id, name: name.trim(), number: number.trim(), country, category, riskLevel, complianceStatus, hangelSubject: hangelSubject.trim(), affectedModules, articleText: articleText.trim(), interpretation: interpretation.trim(), links: links.trim() });
      setOpen(false);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {isNew ? <Button className="gap-2"><Plus className="h-4 w-4" /> Yeni Mevzuat</Button>
          : <Button variant="outline" size="sm" className="gap-1.5"><Pencil className="h-4 w-4" /> Düzenle</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? 'Yeni Mevzuat Ekle' : `Düzenle: ${item?.name}`}</DialogTitle>
          <DialogDescription>Kanun bilgisi + hangel konusu + risk + hukuki yorum.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Kanun Adı *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Yardım Toplama Kanunu" /></div>
            <div className="space-y-2"><Label>Kanun No</Label><Input value={number} onChange={e => setNumber(e.target.value)} placeholder="2860" /></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-2"><Label className="text-xs">Ülke / Yargı Bölgesi</Label>
              <Select value={country} onValueChange={setCountry}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-xs">Kategori</Label>
              <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-xs">Risk</Label>
              <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as RiskLevel)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(RISK_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label className="text-xs">Uyum Durumu</Label>
              <Select value={complianceStatus} onValueChange={(v) => setComplianceStatus(v as ComplianceStatus)}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(COMPLIANCE_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label className="text-xs">Etkilenen Modüller</Label>
            <div className="flex flex-wrap gap-1.5">
              {MODULES.map(m => (
                <button key={m} type="button" onClick={() => toggleModule(m)}
                  className={cn('px-2.5 py-1 rounded-full text-xs border transition-colors', affectedModules.includes(m) ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent')}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2"><Label className="text-xs">hangel Konusu / Mini Çıkarım</Label>
            <Textarea value={hangelSubject} onChange={e => setHangelSubject(e.target.value)} placeholder="hangel doğrudan bağış toplamadığı durumda dijital aracılık modeli kapsamında değerlendirilir." className="min-h-[60px]" /></div>
          <div className="space-y-2"><Label className="text-xs">Resmi Madde Metni</Label>
            <Textarea value={articleText} onChange={e => setArticleText(e.target.value)} placeholder="Kanun maddesinin resmi metni..." className="min-h-[80px]" /></div>
          <div className="space-y-2"><Label className="text-xs">Hukuki Yorum / Risk Analizi / Operasyon Önerisi</Label>
            <Textarea value={interpretation} onChange={e => setInterpretation(e.target.value)} placeholder="Hukuki yorum + risk + operasyon önerisi..." className="min-h-[80px]" /></div>
          <div className="space-y-2"><Label className="text-xs">İlgili Linkler (Resmi Gazete, Danıştay, içtihat — her satıra bir link)</Label>
            <Textarea value={links} onChange={e => setLinks(e.target.value)} placeholder="https://resmigazete.gov.tr/...&#10;https://..." className="min-h-[60px] font-mono text-xs" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
          <Button onClick={handleSave} disabled={saving || !name.trim()}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isNew ? 'Oluştur' : 'Kaydet'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Madde detayı: orijinal metni oku + ilgili sözleşme/politikaları ilişkilendir.
function LegislationDetailDialog({ item, contractOptions, onSaveRelated }: {
  item: Legislation;
  contractOptions: { slug: string; title: string }[];
  onSaveRelated: (legId: string, slugs: string[]) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [related, setRelated] = useState<string[]>(item.relatedContracts || []);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');

  const handleOpen = (o: boolean) => { setOpen(o); if (o) { setRelated(item.relatedContracts || []); setQ(''); } };
  const toggle = (slug: string) => setRelated(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]);
  const save = async () => { setSaving(true); try { await onSaveRelated(item.id, related); setOpen(false); } finally { setSaving(false); } };
  const visible = q.trim() ? contractOptions.filter(c => c.title.toLowerCase().includes(q.toLowerCase())) : contractOptions;

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5"><BookOpen className="h-4 w-4" /> Maddeyi Oku</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Scale className="h-5 w-5 text-primary" /> {item.name}{item.number ? ` (No: ${item.number})` : ''}</DialogTitle>
          <DialogDescription>Resmî madde metni, hukuki yorum ve ilişkili sözleşme/politikalar.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Resmî Madde Metni</p>
            {item.articleText ? (
              <p className="text-sm whitespace-pre-wrap leading-relaxed bg-muted/30 border rounded-lg p-3">{item.articleText}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Bu mevzuat için madde metni henüz girilmemiş. &quot;Düzenle&quot; ile ekleyebilirsiniz.</p>
            )}
          </div>
          {item.interpretation && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Hukuki Yorum / Risk</p>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.interpretation}</p>
            </div>
          )}
          {item.links && (
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Resmî Kaynaklar</p>
              <div className="flex flex-col gap-1">
                {item.links.split('\n').filter(Boolean).map((url, i) => (
                  <a key={i} href={url.trim()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline break-all">
                    <Link2 className="h-3 w-3 shrink-0" /> {url.trim()} <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="border-t pt-3">
            <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> İlişkili Sözleşme / Politikalar</p>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Sözleşme/politika ara..." className="pl-9 h-9" />
            </div>
            <div className="rounded-lg border divide-y max-h-56 overflow-y-auto">
              {visible.length === 0 ? (
                <p className="text-xs text-muted-foreground italic p-3">Sözleşme/politika bulunamadı.</p>
              ) : visible.map(c => (
                <label key={c.slug} className="flex items-center gap-2 p-2.5 hover:bg-accent cursor-pointer">
                  <Checkbox checked={related.includes(c.slug)} onCheckedChange={() => toggle(c.slug)} />
                  <span className="text-sm truncate">{c.title}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Kapat</Button>
          <Button onClick={save} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}İlişkileri Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function LegislationTab() {
  const { toast } = useToast();
  const db = useFirestore();
  const { user: authUser } = useUser();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');

  // Tarama (AI + baseline) durumu
  const [scanOpen, setScanOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [candidates, setCandidates] = useState<ScanCandidate[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const legQuery = useMemoFirebase(() => collection(db, COLLECTIONS.legislations), [db]);
  const { data: legislations, isLoading } = useCollection<Legislation>(legQuery);

  // İlişkilendirme için sözleşme/politika listesi (firestore + varsayılan seed birleşik)
  const contractsRef = useMemoFirebase(() => collection(db, COLLECTIONS.contracts), [db]);
  const { data: fsContracts } = useCollection<{ id: string; slug?: string; title?: string }>(contractsRef);
  const contractOptions = useMemo(() => {
    const map = new Map<string, string>();
    seedContracts.forEach(s => map.set(s.slug, s.title));
    (fsContracts || []).forEach(c => { const slug = c.slug || c.id; if (slug) map.set(slug, c.title || slug); });
    return Array.from(map.entries()).map(([slug, title]) => ({ slug, title }));
  }, [fsContracts]);

  const handleSaveRelated = async (legId: string, slugs: string[]) => {
    try {
      await setDoc(doc(db, COLLECTIONS.legislations, legId), { relatedContracts: slugs, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: 'Kaydedildi', description: 'İlişkili sözleşme/politikalar güncellendi.' });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : (e instanceof Error ? e.message : 'Hata') });
    }
  };

  const filtered = useMemo(() => {
    let list = legislations || [];
    if (countryFilter !== 'all') list = list.filter(l => (l.country || 'TR') === countryFilter);
    if (riskFilter !== 'all') list = list.filter(l => l.riskLevel === riskFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(l => l.name.toLowerCase().includes(q) || (l.number || '').includes(q) || (l.category || '').toLowerCase().includes(q));
    }
    return list;
  }, [legislations, searchTerm, riskFilter, countryFilter]);

  // Ülke bazlı sayımlar — "her AB ve ülke için ayrı yapılandırma" görünürlüğü.
  const countryCounts = useMemo(() => {
    const m = new Map<string, number>();
    (legislations || []).forEach(l => { const c = l.country || 'TR'; m.set(c, (m.get(c) || 0) + 1); });
    return m;
  }, [legislations]);

  const handleSave = async (l: Legislation) => {
    try {
      await setDoc(doc(db, COLLECTIONS.legislations, l.id), { ...l, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: 'Kaydedildi', description: `"${l.name}" mevzuatı güncellendi.` });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : (e instanceof Error ? e.message : 'Hata') });
      throw e;
    }
  };
  const handleDelete = async (l: Legislation) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.legislations, l.id));
      toast({ variant: 'destructive', title: 'Silindi', description: `"${l.name}" kaldırıldı.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Silinemedi', description: e instanceof Error ? e.message : 'Hata' });
    }
  };

  const handleScan = async () => {
    if (!authUser) {
      toast({ variant: 'destructive', title: 'Oturum bulunamadı', description: 'Lütfen yeniden giriş yapın.' });
      return;
    }
    setScanning(true);
    setScanOpen(true);
    setCandidates([]);
    setAiError(null);
    setAddedIds(new Set());
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/legal/scan', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Tarama başarısız', description: json?.message || 'İşlem tamamlanamadı.' });
        setScanOpen(false);
        return;
      }
      setCandidates(Array.isArray(json.candidates) ? json.candidates : []);
      setAiError(json.aiError || null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Tarama başarısız', description: e instanceof Error ? e.message : 'Hata' });
      setScanOpen(false);
    } finally {
      setScanning(false);
    }
  };

  const addCandidate = async (c: ScanCandidate) => {
    setAddingIds(prev => new Set(prev).add(c.id));
    try {
      const wasExisting = (legislations || []).some(l => l.id === c.id);
      await setDoc(doc(db, COLLECTIONS.legislations, c.id), {
        name: c.name, number: c.number || '', country: c.country || 'TR', category: c.category || 'Diğer',
        riskLevel: c.riskLevel || 'orta', complianceStatus: c.complianceStatus || 'inceleniyor',
        hangelSubject: c.hangelSubject || '', affectedModules: c.affectedModules || [],
        articleText: c.articleText || '', interpretation: c.interpretation || '', links: c.links || '',
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setAddedIds(prev => new Set(prev).add(c.id));
      toast({ title: wasExisting ? 'Güncellendi' : 'Eklendi', description: `"${c.name}" sisteme ${wasExisting ? 'güncellendi' : 'eklendi'}.` });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      toast({ variant: 'destructive', title: 'Eklenemedi', description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : (e instanceof Error ? e.message : 'Hata') });
    } finally {
      setAddingIds(prev => { const n = new Set(prev); n.delete(c.id); return n; });
    }
  };

  const addAllCandidates = async () => {
    for (const c of candidates) {
      if (!addedIds.has(c.id)) await addCandidate(c);
    }
  };

  return (
    <>
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Kanun adı, no, kategori ara..." className="pl-10 h-10" />
          </div>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-44 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Ülkeler</SelectItem>
              {COUNTRIES.filter(c => (countryCounts.get(c.code) || 0) > 0 || c.code === 'TR' || c.code === 'EU').map(c => (
                <SelectItem key={c.code} value={c.code}>{c.label}{countryCounts.get(c.code) ? ` (${countryCounts.get(c.code)})` : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-40 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Riskler</SelectItem>
              {Object.entries(RISK_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleScan} disabled={scanning} className="gap-1.5">
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
            Mevzuat & Karar Tara
          </Button>
          <LegislationEditDialog onSave={handleSave} />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookText className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Henüz mevzuat eklenmedi. &quot;Yeni Mevzuat&quot; ile ekleyin.</p>
          </div>
        ) : (
          <div className="divide-y border-t">
            {filtered.map(l => (
              <div key={l.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Scale className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold">{l.name}</p>
                        <Badge variant="secondary" className="text-[9px]">{countryLabel(l.country)}</Badge>
                        {l.number && <Badge variant="outline" className="text-[9px]">No: {l.number}</Badge>}
                        {l.category && <Badge variant="secondary" className="text-[9px]">{l.category}</Badge>}
                        {l.riskLevel && <Badge className={cn('text-[9px]', RISK_META[l.riskLevel].cls)}>{RISK_META[l.riskLevel].label} Risk</Badge>}
                        {l.complianceStatus && <Badge className={cn('text-[9px]', COMPLIANCE_META[l.complianceStatus].cls)}>{COMPLIANCE_META[l.complianceStatus].label}</Badge>}
                      </div>
                      {l.hangelSubject && <p className="text-xs text-muted-foreground italic leading-snug">💡 {l.hangelSubject}</p>}
                      {l.affectedModules && l.affectedModules.length > 0 && (
                        <div className="flex flex-wrap gap-1">{l.affectedModules.map(m => <Badge key={m} variant="outline" className="text-[9px]">{m}</Badge>)}</div>
                      )}
                      {l.links && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {l.links.split('\n').filter(Boolean).slice(0, 3).map((url, i) => (
                            <a key={i} href={url.trim()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                              <Link2 className="h-3 w-3" /> Kaynak {i + 1} <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <LegislationDetailDialog item={l} contractOptions={contractOptions} onSaveRelated={handleSaveRelated} />
                    <LegislationEditDialog item={l} onSave={handleSave} />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10" aria-label="Sil"><Trash2 className="h-4 w-4" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Silinsin mi?</AlertDialogTitle>
                          <AlertDialogDescription>&quot;{l.name}&quot; mevzuatı silinecek.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                          <AlertDialogAction className={cn(buttonVariants({ variant: 'destructive' }))} onClick={() => handleDelete(l)}>Sil</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {l.relatedContracts && l.relatedContracts.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap pl-8">
                    <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1"><FileText className="h-3 w-3" /> İlişkili:</span>
                    {l.relatedContracts.map(slug => {
                      const title = contractOptions.find(c => c.slug === slug)?.title || slug;
                      return (
                        <Link key={slug} href={`/settings/contracts/${slug}`} target="_blank" rel="noopener noreferrer">
                          <Badge variant="secondary" className="text-[9px] gap-1 hover:bg-secondary/70"><Eye className="h-2.5 w-2.5" /> {title}</Badge>
                        </Link>
                      );
                    })}
                  </div>
                )}
                {(l.articleText || l.interpretation) && (
                  <details className="text-xs text-muted-foreground pl-8">
                    <summary className="cursor-pointer hover:text-foreground font-medium">Detay (madde + yorum)</summary>
                    {l.articleText && <div className="mt-2"><span className="font-bold">Madde:</span> {l.articleText}</div>}
                    {l.interpretation && <div className="mt-1"><span className="font-bold">Yorum:</span> {l.interpretation}</div>}
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    <Dialog open={scanOpen} onOpenChange={setScanOpen}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ScanSearch className="h-5 w-5 text-primary" /> Mevzuat & Karar Tarama</DialogTitle>
          <DialogDescription>
            Sistemde olmayan veya değişmiş olabilecek kanun, Resmi Gazete yayını ve mahkeme/Danıştay/KVKK kararı adayları.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs p-2.5 flex items-start gap-2">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Bu liste yapay zeka + varsayılan kütüphaneden üretilen <b>adaylardır</b>; canlı resmî kaynak değildir. Eklemeden önce künye ve karar numaralarını resmî kaynaktan / avukatla <b>doğrulayın</b>.</span>
        </div>
        {aiError && <p className="text-xs text-muted-foreground italic">{aiError}</p>}

        {scanning ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Mevzuat ve kararlar taranıyor…</p>
          </div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Yeni veya değişmiş aday bulunamadı. Sistem güncel görünüyor.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {candidates.map(c => {
              const added = addedIds.has(c.id);
              const adding = addingIds.has(c.id);
              return (
                <div key={c.id} className="border rounded-xl p-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge className={cn('text-[9px]', c.status === 'updated' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700')}>
                          {c.status === 'updated' ? 'Güncellenebilir' : 'Yeni'}
                        </Badge>
                        <Badge variant="secondary" className="text-[9px]">{countryLabel(c.country)}</Badge>
                        {c.source === 'ai' && <Badge variant="outline" className="text-[9px] gap-1"><Sparkles className="h-2.5 w-2.5" /> AI</Badge>}
                        <span className="font-bold text-sm">{c.name}</span>
                        {c.number && <Badge variant="outline" className="text-[9px]">No: {c.number}</Badge>}
                        {c.riskLevel && <Badge className={cn('text-[9px]', RISK_META[c.riskLevel].cls)}>{RISK_META[c.riskLevel].label}</Badge>}
                      </div>
                      {c.reason && <p className="text-[11px] text-muted-foreground">{c.reason}</p>}
                      {c.hangelSubject && <p className="text-[11px] text-muted-foreground italic">💡 {c.hangelSubject}</p>}
                      {c.links && (
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {c.links.split('\n').filter(Boolean).slice(0, 3).map((url, i) => (
                            <a key={i} href={url.trim()} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                              <Link2 className="h-3 w-3" /> Kaynak {i + 1} <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant={added ? 'ghost' : 'default'} disabled={adding || added} onClick={() => addCandidate(c)} className="shrink-0 gap-1.5">
                      {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : added ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Plus className="h-3.5 w-3.5" />}
                      {added ? 'Eklendi' : 'Sisteme Ekle'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!scanning && candidates.length > 0 && (
          <DialogFooter className="flex-row justify-between sm:justify-between">
            <span className="text-xs text-muted-foreground self-center">{candidates.length} aday · {addedIds.size} eklendi</span>
            <Button onClick={addAllCandidates} disabled={addedIds.size === candidates.length} className="gap-1.5">
              <Plus className="h-4 w-4" /> Tümünü Ekle
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
