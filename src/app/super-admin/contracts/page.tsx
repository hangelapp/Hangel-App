'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CountryMultiSelect, inferCountriesFromText } from '@/components/ui/country-multi-select';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Plus, Pencil, Trash2, Loader2, Search, Eye, FileText, CalendarDays,
  LayoutDashboard, Scale, Shield, BookText, GitCompare, Send, ClipboardCheck,
  MessagesSquare, Archive, Clock, AlertTriangle, FileSignature,
} from 'lucide-react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, query, orderBy, limit, documentId } from 'firebase/firestore';
import { contractsData as seedContracts } from '@/lib/contracts';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { COLLECTIONS } from '@/firebase/collections';
import { LegislationTab } from './_components/legislation-tab';
import { ArchiveTab } from './_components/archive-tab';
import { ApprovalsTab } from './_components/approvals-tab';
import { PublishTab } from './_components/publish-tab';
import { ComplianceTab } from './_components/compliance-tab';
import { LegalChatTab } from './_components/legal-chat-tab';
import { StatisticsSection } from './_components/statistics-section';

// ---- Tipler ----
type DocStatus = 'taslak' | 'incelemede' | 'yayinlandi' | 'arsivlendi';
type ApprovalType = 'bilgilendirme' | 'giris-popup' | 'zorunlu-onay' | 'islem-oncesi' | 'yillik-onay';
type RiskLevel = 'dusuk' | 'orta' | 'yuksek' | 'kritik';
type DocKind = 'contract' | 'policy';

type Contract = {
  id: string;        // == slug
  slug: string;
  title: string;
  content: string;
  group?: string;
  kind?: DocKind;
  version?: string;
  status?: DocStatus;
  targetGroups?: string[];
  approvalType?: ApprovalType;
  riskLevel?: RiskLevel;
  language?: string;
  country?: string;
  // hangel — opsiyonel ülke/yetki alanları, yoksa slug+başlıktan heuristic çıkarılır.
  jurisdictions?: string[];
  updatedAt?: unknown;
  publishedAt?: string;
  updatedByName?: string;
  source?: 'firestore' | 'seed';
};

// ---- Sabitler ----
const TARGET_GROUPS = [
  'Tüm kullanıcılar', 'Yeni kullanıcılar', 'STK yöneticileri', 'STK üyeleri',
  'Gönüllüler', 'Kurumsal markalar', 'Öğrenci kulüpleri', 'Süper adminler',
  'Moderatörler', 'Hukuk görevlileri',
];

const APPROVAL_LABELS: Record<ApprovalType, string> = {
  'bilgilendirme': 'Bilgilendirme yeterli',
  'giris-popup': 'Girişte popup göster',
  'zorunlu-onay': 'Devam için zorunlu onay',
  'islem-oncesi': 'İşlem öncesi onay iste',
  'yillik-onay': 'Yıllık yeniden onay',
};

const STATUS_META: Record<DocStatus, { label: string; cls: string }> = {
  'taslak': { label: 'Taslak', cls: 'bg-gray-200 text-gray-700' },
  'incelemede': { label: 'İncelemede', cls: 'bg-amber-100 text-amber-800' },
  'yayinlandi': { label: 'Yayınlandı', cls: 'bg-green-600 text-white' },
  'arsivlendi': { label: 'Arşivlendi', cls: 'bg-slate-300 text-slate-700' },
};

const RISK_META: Record<RiskLevel, { label: string; cls: string }> = {
  'dusuk': { label: 'Düşük Risk', cls: 'bg-emerald-100 text-emerald-700' },
  'orta': { label: 'Orta Risk', cls: 'bg-amber-100 text-amber-800' },
  'yuksek': { label: 'Yüksek Risk', cls: 'bg-orange-100 text-orange-800' },
  'kritik': { label: 'Kritik Risk', cls: 'bg-red-600 text-white' },
};

const POLICY_TEMPLATES = [
  'KVKK Politikası', 'Çerez Politikası', 'Bağış Aracılığı Politikası',
  'Gönüllülük Politikası', 'Topluluk Kuralları', 'Çocuk Güvenliği Politikası',
  'Kan İlanı Politikası', 'Yapay Zeka Kullanım Politikası', 'İçerik Moderasyon Politikası',
];

const fmtDateShort = (iso?: string): string => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return ''; }
};

const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ---- Editör (versiyon + durum + hedef kitle + onay tipi + risk) ----
const ContractEditDialog = ({ contract, defaultKind, onSave }: {
  contract?: Contract;
  defaultKind: DocKind;
  onSave: (c: Contract) => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const isNew = !contract;
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [group, setGroup] = useState('');
  const [version, setVersion] = useState('');
  const [status, setStatus] = useState<DocStatus>('taslak');
  const [targetGroups, setTargetGroups] = useState<string[]>([]);
  const [approvalType, setApprovalType] = useState<ApprovalType>('bilgilendirme');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('dusuk');
  const [language, setLanguage] = useState('tr');
  const [country, setCountry] = useState('TR');
  const [saving, setSaving] = useState(false);

  const handleOpen = (o: boolean) => {
    setOpen(o);
    if (o) {
      setTitle(contract?.title || '');
      setSlug(contract?.slug || '');
      setContent(contract?.content || '');
      setGroup(contract?.group || '');
      setVersion(contract?.version || '1.0');
      setStatus(contract?.status || 'taslak');
      setTargetGroups(contract?.targetGroups || ['Tüm kullanıcılar']);
      setApprovalType(contract?.approvalType || 'bilgilendirme');
      setRiskLevel(contract?.riskLevel || 'dusuk');
      setLanguage(contract?.language || 'tr');
      setCountry(contract?.country || 'TR');
    }
  };

  const toggleGroup = (g: string) => {
    setTargetGroups(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    const finalSlug = (slug || slugify(title)).trim();
    setSaving(true);
    try {
      await onSave({
        id: finalSlug, slug: finalSlug, title: title.trim(), content,
        group: group.trim(), kind: contract?.kind || defaultKind,
        version: version.trim() || '1.0', status, targetGroups,
        approvalType, riskLevel, language, country,
        publishedAt: contract?.publishedAt,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const kindLabel = (contract?.kind || defaultKind) === 'policy' ? 'Politika' : 'Sözleşme';

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {isNew
          ? <Button className="gap-2"><Plus className="h-4 w-4" /> Yeni {kindLabel} Ekle</Button>
          : <Button variant="outline" size="sm" className="gap-1.5"><Pencil className="h-4 w-4" /> Düzenle</Button>
        }
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? `Yeni ${kindLabel} Ekle` : `Düzenle: ${contract?.title}`}</DialogTitle>
          <DialogDescription>
            Metni görsel editörle yaz. Versiyon, hedef kitle ve onay tipini belirle.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Başlık *</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={kindLabel === 'Politika' ? 'KVKK Politikası' : 'Kullanıcı Sözleşmesi'} />
            </div>
            <div className="space-y-2">
              <Label>Slug (URL)</Label>
              <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder={title ? slugify(title) : 'slug'} disabled={!isNew} />
              <p className="text-[10px] text-muted-foreground">/settings/contracts/{slug || (title ? slugify(title) : 'slug')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Versiyon</Label>
              <Input value={version} onChange={e => setVersion(e.target.value)} placeholder="2.4" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Durum</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as DocStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Dil</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tr">Türkçe</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Ülke</Label>
              <Input value={country} onChange={e => setCountry(e.target.value)} placeholder="TR" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Onay Tipi</Label>
              <Select value={approvalType} onValueChange={(v) => setApprovalType(v as ApprovalType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(APPROVAL_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Hukuki Risk Etiketi</Label>
              <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as RiskLevel)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(RISK_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Hedef Kitle (checkbox)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg border p-3">
              {TARGET_GROUPS.map(g => (
                <label key={g} className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox checked={targetGroups.includes(g)} onCheckedChange={() => toggleGroup(g)} />
                  <span>{g}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Grup</Label>
            <Input value={group} onChange={e => setGroup(e.target.value)} placeholder="A. Ana Sözleşmeler / B. Gizlilik Politikaları" />
          </div>
          <div className="space-y-2">
            <Label>İçerik *</Label>
            <RichTextEditor value={content} onChange={setContent} placeholder="Metni buraya yazın..." minHeight={320} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim() || !content.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isNew ? 'Oluştur' : 'Kaydet'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// hangel — bir doc'un hangi ülke kodlarına ait olduğunu döndürür.
// Önce explicit jurisdictions field, sonra `country`, son çare slug+başlık heuristic.
function resolveDocCountries(c: Contract): string[] {
  if (c.jurisdictions && c.jurisdictions.length > 0) {
    return c.jurisdictions.map((j) => j.toUpperCase());
  }
  if (c.country) return [c.country.toUpperCase()];
  return inferCountriesFromText(`${c.slug} ${c.title} ${c.group ?? ''}`);
}

// ---- Sözleşme/Politika listesi (kind'e göre filtreli) ----
function DocList({ kind, docs, isLoading, countryFilter, onCountryFilterChange, onSave, onDelete }: {
  kind: DocKind;
  docs: Contract[];
  isLoading: boolean;
  countryFilter: string[];
  onCountryFilterChange: (next: string[]) => void;
  onSave: (c: Contract) => Promise<void>;
  onDelete: (c: Contract) => Promise<void>;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [sortKey, setSortKey] = useState<string>('title');
  const filtered = useMemo(() => {
    let list = docs;
    if (statusFilter !== 'all') list = list.filter(c => c.status === statusFilter);
    if (riskFilter !== 'all') list = list.filter(c => (c.riskLevel || 'dusuk') === riskFilter);
    if (countryFilter.length > 0) {
      list = list.filter(c => {
        const docCountries = resolveDocCountries(c);
        return docCountries.some(code => countryFilter.includes(code));
      });
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c => c.title.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.group || '').toLowerCase().includes(q));
    }
    const riskOrder: Record<string, number> = { kritik: 4, yuksek: 3, orta: 2, dusuk: 1 };
    const dateVal = (c: Contract) => { const d = (c.publishedAt || c.updatedAt) as string | undefined; return d ? (new Date(d).getTime() || 0) : 0; };
    return [...list].sort((a, b) => {
      if (sortKey === 'date') return dateVal(b) - dateVal(a);
      if (sortKey === 'risk') return (riskOrder[b.riskLevel || 'dusuk'] || 0) - (riskOrder[a.riskLevel || 'dusuk'] || 0);
      return a.title.localeCompare(b.title, 'tr');
    });
  }, [docs, searchTerm, statusFilter, riskFilter, countryFilter, sortKey]);
  const isFilterActive = searchTerm.trim().length > 0 || statusFilter !== 'all' || riskFilter !== 'all' || countryFilter.length > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3">
        {/* hangel — filtre satırı: grid bazlı, dar ekranda dikey stack, geniş ekranda tek satır. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto_auto] gap-2 items-stretch">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Başlık / slug / grup ara..."
              className="pl-10 h-10 rounded-2xl"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 rounded-2xl lg:w-36"><SelectValue placeholder="Durum" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              {Object.entries(STATUS_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="h-10 rounded-2xl lg:w-32"><SelectValue placeholder="Risk" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Riskler</SelectItem>
              {Object.entries(RISK_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <CountryMultiSelect
            value={countryFilter}
            onChange={onCountryFilterChange}
            placeholder="Ülke (tümü)"
            triggerClassName="h-10 rounded-2xl w-full lg:w-auto"
          />
          <Select value={sortKey} onValueChange={setSortKey}>
            <SelectTrigger className="h-10 rounded-2xl lg:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Ada Göre (A-Z)</SelectItem>
              <SelectItem value="date">Tarihe Göre (Yeni)</SelectItem>
              <SelectItem value="risk">Riske Göre (Yüksek)</SelectItem>
            </SelectContent>
          </Select>
          <div className="col-span-1 sm:col-span-2 lg:col-span-1 lg:justify-self-end">
            <ContractEditDialog defaultKind={kind} onSave={onSave} />
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {isFilterActive
              ? `${filtered.length} / ${docs.length} ${kind === 'policy' ? 'politika' : 'sözleşme'} görüntüleniyor`
              : `Toplam ${docs.length} ${kind === 'policy' ? 'politika' : 'sözleşme'}`}
          </span>
          {kind === 'policy' && (
            <span className="hidden md:inline truncate min-w-0">
              Örnek: {POLICY_TEMPLATES.slice(0, 4).join(' · ')}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <ul className="divide-y border-t">
            {filtered.map(c => {
              const docCountries = resolveDocCountries(c);
              return (
                <li
                  key={c.slug}
                  className="group relative p-4 flex flex-col sm:flex-row sm:items-start gap-3 transition-colors hover:bg-accent/40 focus-within:bg-accent/40 focus-within:ring-2 focus-within:ring-primary/30"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="h-10 w-10 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      {/* Başlık + meta pill'ler */}
                      <div className="flex items-start gap-2 flex-wrap">
                        <p
                          className="font-bold text-sm leading-snug min-w-0 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden break-words"
                          title={c.title}
                        >
                          {c.title}
                        </p>
                      </div>
                      {/* Slug */}
                      <p
                        className="text-[11px] text-muted-foreground font-mono truncate"
                        title={`/${c.slug}`}
                      >
                        /{c.slug}
                      </p>
                      {/* Durum / versiyon / risk / jurisdiction badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {c.version && (
                          <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0">
                            v{c.version}
                          </Badge>
                        )}
                        {c.status && (
                          <Badge className={cn('text-[10px] rounded-full px-2 py-0 font-semibold', STATUS_META[c.status].cls)}>
                            {STATUS_META[c.status].label}
                          </Badge>
                        )}
                        {c.riskLevel && c.riskLevel !== 'dusuk' && (
                          <Badge className={cn('text-[10px] rounded-full px-2 py-0 font-semibold', RISK_META[c.riskLevel].cls)}>
                            {RISK_META[c.riskLevel].label}
                          </Badge>
                        )}
                        {docCountries.slice(0, 4).map((code) => (
                          <Badge
                            key={code}
                            variant="glass"
                            className="text-[10px] rounded-full px-2 py-0 font-mono tracking-wide"
                            title={`Yetki alanı: ${code}`}
                          >
                            {code}
                          </Badge>
                        ))}
                        {docCountries.length > 4 && (
                          <Badge variant="glass" className="text-[10px] rounded-full px-2 py-0">
                            +{docCountries.length - 4}
                          </Badge>
                        )}
                        {c.source === 'seed' && (
                          <Badge variant="outline" className="text-[10px] rounded-full px-2 py-0 uppercase tracking-wide">
                            Varsayılan
                          </Badge>
                        )}
                      </div>
                      {/* Alt satır: onay tipi, hedef kitle, tarih, grup */}
                      <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-[11px] text-muted-foreground">
                        {c.approvalType && (
                          <span className="inline-flex items-center gap-1">
                            <ClipboardCheck className="h-3 w-3" />
                            {APPROVAL_LABELS[c.approvalType]}
                          </span>
                        )}
                        {c.targetGroups && c.targetGroups.length > 0 && (
                          <span
                            className="inline-flex items-center gap-1 truncate max-w-[260px]"
                            title={c.targetGroups.join(', ')}
                          >
                            <span aria-hidden>•</span>
                            {c.targetGroups.slice(0, 3).join(', ')}
                            {c.targetGroups.length > 3 ? ` +${c.targetGroups.length - 3}` : ''}
                          </span>
                        )}
                        {c.publishedAt && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> Yayın: {fmtDateShort(c.publishedAt)}
                          </span>
                        )}
                        {!c.publishedAt && typeof c.updatedAt === 'string' && (
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> Güncelleme: {fmtDateShort(c.updatedAt as string)}
                          </span>
                        )}
                        {c.group && (
                          <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0">
                            {c.group}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Aksiyonlar: mobilde tam genişlik, sm+ ekranda sağda */}
                  <div className="flex items-center gap-1 shrink-0 self-start flex-wrap sm:flex-nowrap">
                    <Button variant="ghost" size="sm" asChild className="gap-1.5 rounded-full focus-visible:ring-2 focus-visible:ring-primary">
                      <Link href={`/settings/contracts/${c.slug}`}>
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Önizle</span>
                      </Link>
                    </Button>
                    <ContractEditDialog contract={c} defaultKind={kind} onSave={onSave} />
                    {c.source === 'firestore' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full text-destructive hover:bg-destructive/10 focus-visible:ring-2 focus-visible:ring-destructive"
                            aria-label="Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Silinsin mi?</AlertDialogTitle>
                            <AlertDialogDescription>&ldquo;{c.title}&rdquo; Firestore kaydı silinecek.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                            <AlertDialogAction
                              className={cn(buttonVariants({ variant: 'destructive' }))}
                              onClick={() => onDelete(c)}
                            >
                              Sil
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="text-center text-muted-foreground italic p-12">Sonuç bulunamadı.</li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function ContractsAdminPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState('genel');

  // hangel — URL ile senkron ülke süzgeci: ?countries=TR,EU,UK
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialCountries = useMemo(() => {
    const raw = searchParams?.get('countries') ?? '';
    return raw
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
  }, [searchParams]);
  const [countryFilter, setCountryFilter] = useState<string[]>(initialCountries);

  useEffect(() => {
    const current = new URLSearchParams(searchParams?.toString() ?? '');
    if (countryFilter.length > 0) {
      current.set('countries', countryFilter.join(','));
    } else {
      current.delete('countries');
    }
    const qs = current.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    // searchParams kasten dışarıda: yalnızca countryFilter değişince yaz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryFilter, pathname, router]);

  const contractsQuery = useMemoFirebase(() => query(collection(db, COLLECTIONS.contracts), orderBy(documentId()), limit(200)), [db]);
  const { data: firestoreContracts, isLoading } = useCollection<Contract>(contractsQuery);

  const allContracts = useMemo<Contract[]>(() => {
    const fsBySlug = new Map<string, Contract>();
    (firestoreContracts || []).forEach(c => fsBySlug.set(c.slug || c.id, { ...c, source: 'firestore' }));
    const merged: Contract[] = [];
    seedContracts.forEach(s => {
      if (fsBySlug.has(s.slug)) { merged.push(fsBySlug.get(s.slug)!); fsBySlug.delete(s.slug); }
      else merged.push({ id: s.slug, slug: s.slug, title: s.title, content: s.content, source: 'seed' });
    });
    fsBySlug.forEach(c => merged.push(c));
    return merged;
  }, [firestoreContracts]);

  // kind ayrımı: explicit kind='policy' VEYA başlık/grup "politika" içeriyorsa politika say.
  const isPolicy = (c: Contract) =>
    c.kind === 'policy' || (!c.kind && /politika|gizlilik|kvkk|çerez|cerez|topluluk|moderasyon/i.test(`${c.title} ${c.group || ''}`));
  const contracts = useMemo(() => allContracts.filter(c => !isPolicy(c)), [allContracts]);
  const policies = useMemo(() => allContracts.filter(isPolicy), [allContracts]);

  // ---- Genel dashboard istatistikleri ----
  const stats = useMemo(() => {
    const published = allContracts.filter(c => c.status === 'yayinlandi').length;
    const drafts = allContracts.filter(c => c.status === 'taslak' || c.status === 'incelemede').length;
    const criticalRisk = allContracts.filter(c => c.riskLevel === 'kritik' || c.riskLevel === 'yuksek').length;
    return {
      activeContracts: contracts.length,
      activePolicies: policies.length,
      published,
      drafts,
      criticalRisk,
    };
  }, [allContracts, contracts.length, policies.length]);

  const handleSave = async (c: Contract) => {
    try {
      const now = new Date().toISOString();
      const payload: Record<string, unknown> = {
        slug: c.slug, title: c.title, content: c.content, group: c.group || '',
        kind: c.kind || 'contract', version: c.version || '1.0', status: c.status || 'taslak',
        targetGroups: c.targetGroups || [], approvalType: c.approvalType || 'bilgilendirme',
        riskLevel: c.riskLevel || 'dusuk', language: c.language || 'tr', country: c.country || 'TR',
        updatedAt: now,
      };
      // Yayınlanma tarihi: durum "yayınlandı" ise (ilk kez) publishedAt yaz.
      if (c.status === 'yayinlandi' && !c.publishedAt) payload.publishedAt = now;
      await setDoc(doc(db, COLLECTIONS.contracts, c.slug), payload, { merge: true });
      toast({ title: 'Kaydedildi', description: `"${c.title}" güncellendi.` });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      toast({ variant: 'destructive', title: 'Kaydedilemedi', description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : (e instanceof Error ? e.message : 'Hata.') });
      throw e;
    }
  };

  const handleDelete = async (c: Contract) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.contracts, c.slug));
      toast({ variant: 'destructive', title: 'Silindi', description: `"${c.title}" kaldırıldı.` });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      toast({ variant: 'destructive', title: 'Silinemedi', description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : (e instanceof Error ? e.message : 'Hata.') });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter">Sözleşmeler ve Politikalar Yönetimi</h1>
        <p className="text-muted-foreground text-sm">hangel hukuk ve uyumluluk merkezi — sözleşmeler, politikalar, mevzuatlar, onay süreçleri.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full overflow-x-auto justify-start h-auto p-1 gap-1">
          <TabsTrigger value="genel" className="gap-1.5 shrink-0"><LayoutDashboard className="h-4 w-4" /> Genel</TabsTrigger>
          <TabsTrigger value="sozlesmeler" className="gap-1.5 shrink-0"><Scale className="h-4 w-4" /> Sözleşmeler</TabsTrigger>
          <TabsTrigger value="politikalar" className="gap-1.5 shrink-0"><Shield className="h-4 w-4" /> Politikalar</TabsTrigger>
          <TabsTrigger value="mevzuatlar" className="gap-1.5 shrink-0"><BookText className="h-4 w-4" /> Mevzuatlar</TabsTrigger>
          <TabsTrigger value="uyum" className="gap-1.5 shrink-0"><GitCompare className="h-4 w-4" /> Uyum</TabsTrigger>
          <TabsTrigger value="yayin" className="gap-1.5 shrink-0"><Send className="h-4 w-4" /> Yayın & Bildirim</TabsTrigger>
          <TabsTrigger value="onay" className="gap-1.5 shrink-0"><ClipboardCheck className="h-4 w-4" /> Onay Kayıtları</TabsTrigger>
          <TabsTrigger value="chat" className="gap-1.5 shrink-0"><MessagesSquare className="h-4 w-4" /> Hukuk Chat</TabsTrigger>
          <TabsTrigger value="arsiv" className="gap-1.5 shrink-0"><Archive className="h-4 w-4" /> Arşiv</TabsTrigger>
        </TabsList>

        {/* 1. GENEL */}
        <TabsContent value="genel" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard icon={Scale} label="Aktif Sözleşme" value={stats.activeContracts} />
            <StatCard icon={Shield} label="Aktif Politika" value={stats.activePolicies} />
            <StatCard icon={FileSignature} label="Yayınlanan" value={stats.published} accent="green" />
            <StatCard icon={Clock} label="Bekleyen Taslak" value={stats.drafts} accent="amber" />
            <StatCard icon={AlertTriangle} label="Yüksek/Kritik Risk" value={stats.criticalRisk} accent="red" />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Hızlı İşlemler</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <ContractEditDialog defaultKind="contract" onSave={handleSave} />
              <ContractEditDialog defaultKind="policy" onSave={handleSave} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Hızlı Erişim</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {([
                { v: 'sozlesmeler', label: 'Sözleşmeler', icon: Scale },
                { v: 'politikalar', label: 'Politikalar', icon: Shield },
                { v: 'mevzuatlar', label: 'Mevzuatlar', icon: BookText },
                { v: 'uyum', label: 'Uyum Analizi', icon: GitCompare },
                { v: 'yayin', label: 'Yayın & Bildirim', icon: Send },
                { v: 'onay', label: 'Onay Kayıtları', icon: ClipboardCheck },
                { v: 'chat', label: 'Hukuk Chat', icon: MessagesSquare },
                { v: 'arsiv', label: 'Arşiv', icon: Archive },
              ] as const).map(item => {
                const Icon = item.icon;
                return (
                  <button key={item.v} onClick={() => setActiveTab(item.v)} className="flex items-center gap-2 rounded-xl border p-3 text-left hover:bg-accent transition-colors">
                    <span className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon className="h-4 w-4 text-primary" /></span>
                    <span className="text-sm font-medium leading-tight">{item.label}</span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* hangel — Hızlı Erişim altı: anlık istatistik özet (chart + tablo). */}
          <StatisticsSection contracts={allContracts} isLoading={isLoading} language="tr" />
        </TabsContent>

        {/* 2. SÖZLEŞMELER */}
        <TabsContent value="sozlesmeler" className="mt-4">
          <DocList
            kind="contract"
            docs={contracts}
            isLoading={isLoading}
            countryFilter={countryFilter}
            onCountryFilterChange={setCountryFilter}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        </TabsContent>

        {/* 3. POLİTİKALAR */}
        <TabsContent value="politikalar" className="mt-4">
          <DocList
            kind="policy"
            docs={policies}
            isLoading={isLoading}
            countryFilter={countryFilter}
            onCountryFilterChange={setCountryFilter}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        </TabsContent>

        {/* 4. MEVZUATLAR — fonksiyonel */}
        <TabsContent value="mevzuatlar" className="mt-4">
          <LegislationTab />
        </TabsContent>

        {/* 5. UYUM ANALİZİ — fonksiyonel (Gemini AI) */}
        <TabsContent value="uyum" className="mt-4">
          <ComplianceTab contracts={allContracts} />
        </TabsContent>

        {/* 6. YAYIN & BİLDİRİM — fonksiyonel */}
        <TabsContent value="yayin" className="mt-4">
          <PublishTab />
        </TabsContent>

        {/* 7. ONAY KAYITLARI — fonksiyonel */}
        <TabsContent value="onay" className="mt-4">
          <ApprovalsTab />
        </TabsContent>

        {/* 8. HUKUK CHAT — fonksiyonel */}
        <TabsContent value="chat" className="mt-4">
          <LegalChatTab contracts={allContracts} />
        </TabsContent>

        {/* 9. ARŞİV — fonksiyonel */}
        <TabsContent value="arsiv" className="mt-4">
          <ArchiveTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: number; accent?: 'green' | 'amber' | 'red' }) {
  const accentCls = accent === 'green' ? 'text-green-600' : accent === 'amber' ? 'text-amber-600' : accent === 'red' ? 'text-red-600' : 'text-primary';
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <Icon className={cn('h-5 w-5', accentCls)} />
        <p className="text-2xl font-black">{value}</p>
        <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
      </CardContent>
    </Card>
  );
}
