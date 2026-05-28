'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, Search, BookText, Scale, Link2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { cn } from '@/lib/utils';

type RiskLevel = 'dusuk' | 'orta' | 'yuksek' | 'kritik';
type ComplianceStatus = 'uyumlu' | 'inceleniyor' | 'eksik' | 'riskli' | 'aksiyon-gerekli';

interface Legislation {
  id: string;
  name: string;
  number?: string;
  category?: string;
  riskLevel?: RiskLevel;
  complianceStatus?: ComplianceStatus;
  hangelSubject?: string;     // hangel konusu / mini çıkarım
  affectedModules?: string[]; // bağış, gönüllülük, etkinlik, AI, mesajlaşma
  articleText?: string;       // resmi madde metni
  interpretation?: string;    // hukuki yorum / risk analizi / operasyon önerisi
  relatedPolicies?: string;
  links?: string;             // Resmi Gazete / Danıştay / içtihat linkleri (satır satır)
  updatedAt?: unknown;
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

const slugify = (s: string) =>
  s.toLowerCase().replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

function LegislationEditDialog({ item, onSave }: { item?: Legislation; onSave: (l: Legislation) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const isNew = !item;
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
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
      setName(item?.name || ''); setNumber(item?.number || ''); setCategory(item?.category || '');
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
      await onSave({ id, name: name.trim(), number: number.trim(), category, riskLevel, complianceStatus, hangelSubject: hangelSubject.trim(), affectedModules, articleText: articleText.trim(), interpretation: interpretation.trim(), links: links.trim() });
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
            <Textarea value={hangelSubject} onChange={e => setHangelSubject(e.target.value)} placeholder="Hangel doğrudan bağış toplamadığı durumda dijital aracılık modeli kapsamında değerlendirilir." className="min-h-[60px]" /></div>
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

export function LegislationTab() {
  const { toast } = useToast();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  const legQuery = useMemoFirebase(() => collection(db, COLLECTIONS.legislations), [db]);
  const { data: legislations, isLoading } = useCollection<Legislation>(legQuery);

  const filtered = useMemo(() => {
    let list = legislations || [];
    if (riskFilter !== 'all') list = list.filter(l => l.riskLevel === riskFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(l => l.name.toLowerCase().includes(q) || (l.number || '').includes(q) || (l.category || '').toLowerCase().includes(q));
    }
    return list;
  }, [legislations, searchTerm, riskFilter]);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Kanun adı, no, kategori ara..." className="pl-10 h-10" />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-40 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Riskler</SelectItem>
              {Object.entries(RISK_META).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
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
  );
}
