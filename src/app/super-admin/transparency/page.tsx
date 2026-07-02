'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEFAULT_CRITERIA, type CriterionType } from '@/lib/transparency';
import { Edit3, Loader2, Plus, ShieldCheck, Trash2, Search, Inbox, CheckCircle, Clock, Eye, ExternalLink, FileText, FolderOpen } from 'lucide-react';
import type { NGO } from '@/lib/types';
import { COLLECTIONS } from '@/firebase/collections';
import TransparencyEditor from '@/components/super-admin/transparency-editor';

interface NGORow extends NGO {
  id: string;
  status?: string;
  transparencyChecklist?: { criterionId: string; passed: boolean }[];
}

interface TransparencyCriterion {
  id: string;
  name: string;
  description?: string;
  points: number;
  category?: string;
  type?: CriterionType;
  options?: string[];
  order?: number;
}

const TYPE_LABELS: Record<CriterionType, string> = {
  'document': 'Belge',
  'link': 'Link',
  'text': 'Bilgi/Metin',
  'document-link': 'Belge veya Link',
  'multi-select': 'Çoklu Seçim',
};

const NGO_EDIT = ({ ngo, criteria, open, onOpenChange, onSave }: {
  ngo: NGORow | null;
  criteria: TransparencyCriterion[];
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (id: string, payload: { transparencyScore: number; transparencyChecklist: { criterionId: string; passed: boolean }[] }) => Promise<void>;
}) => {
  const [score, setScore] = useState(ngo?.transparencyScore || 0);
  const [checklist, setChecklist] = useState<{ criterionId: string; passed: boolean }[]>([]);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (ngo) {
      setScore(ngo.transparencyScore || 0);
      setChecklist(ngo.transparencyChecklist || criteria.map(c => ({ criterionId: c.id, passed: false })));
    }
  }, [ngo, criteria]);

  const total = useMemo(() => {
    return criteria.reduce((sum, c) => {
      const passed = checklist.find(x => x.criterionId === c.id)?.passed;
      return sum + (passed ? c.points : 0);
    }, 0);
  }, [checklist, criteria]);

  React.useEffect(() => { setScore(total); }, [total]);

  const togglePass = (cid: string) => setChecklist(prev => {
    const exists = prev.find(p => p.criterionId === cid);
    if (exists) return prev.map(p => p.criterionId === cid ? { ...p, passed: !p.passed } : p);
    return [...prev, { criterionId: cid, passed: true }];
  });

  const handleSave = async () => {
    if (!ngo) return;
    setSaving(true);
    try {
      await onSave(ngo.id, { transparencyScore: total, transparencyChecklist: checklist });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!ngo) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" /> {ngo.name} — Şeffaflık Profili
          </DialogTitle>
          <DialogDescription>
            Şeffaflık endeksindeki kriterleri işaretle, puan otomatik hesaplanır.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {criteria.length === 0 && (
            <p className="text-sm text-muted-foreground italic">Henüz şeffaflık kriteri tanımlı değil. Endeks sekmesinden ekleyin.</p>
          )}
          {criteria.map(c => {
            const passed = checklist.find(x => x.criterionId === c.id)?.passed || false;
            return (
              <label key={c.id} className="flex items-center justify-between gap-3 p-3 border rounded-xl hover:bg-muted/30 cursor-pointer">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{c.name}</p>
                  {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline">+{c.points}</Badge>
                  <input type="checkbox" className="h-4 w-4" checked={passed} onChange={() => togglePass(c.id)} />
                </div>
              </label>
            );
          })}
        </div>
        <DialogFooter className="items-center justify-between">
          <Badge className="text-base font-black px-3 py-1">Toplam: {score} puan</Badge>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
            <Button disabled={saving} onClick={handleSave}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function TransparencyPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [editingNgo, setEditingNgo] = useState<NGORow | null>(null);

  const ngosQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.ngos) : null), [db]);
  const { data: ngos, isLoading: ngosLoading } = useCollection<NGORow>(ngosQuery);

  const criteriaQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.transparencyCriteria) : null), [db]);
  const { data: criteria, isLoading: critLoading } = useCollection<TransparencyCriterion>(criteriaQuery);

  // Onay bekleyen şeffaflık belgeleri — STK'ların transparency/{adminUid} kayıtları.
  const { user: authUser } = useUser();
  const transparencyQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.transparency) : null), [db]);
  type TItem = { id: number | string; name: string; points: number; isCompleted?: boolean; status?: string; type?: string; fileUrl?: string; fileName?: string; linkUrl?: string; textValue?: string; selectedOptions?: string[] };
  const { data: transparencyDocs, isLoading: tLoading } = useCollection<{ id: string; criteria?: TItem[] }>(transparencyQuery);
  const [approvingKey, setApprovingKey] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<TItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ ownerUid: string; item: TItem } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);
  // Süper-admin'in belge/bilgi düzenleyip onaylayabildiği tam editör hedefi.
  const [editorTarget, setEditorTarget] = useState<{ ngoId: string; ownerUid: string; name: string } | null>(null);

  const ngoByAdmin = useMemo(() => {
    const m = new Map<string, NGORow>();
    (ngos || []).forEach(n => { const a = (n as { adminUserId?: string }).adminUserId; if (a) m.set(a, n); });
    return m;
  }, [ngos]);

  // adminUid → yüklenen (tamamlanan) ve onay bekleyen madde sayısı. Geçmiş + güncel
  // tüm yükleyenleri STK Profilleri sekmesinde görünür kılar.
  const statsByAdmin = useMemo(() => {
    const m = new Map<string, { completed: number; pending: number }>();
    (transparencyDocs || []).forEach(td => {
      const items = td.criteria || [];
      m.set(td.id, {
        completed: items.filter(c => c.isCompleted).length,
        pending: items.filter(c => c.isCompleted && c.status === 'pending').length,
      });
    });
    return m;
  }, [transparencyDocs]);

  const pendingQueue = useMemo(() => {
    return (transparencyDocs || [])
      .map(td => {
        const items = (td.criteria || []).filter(c => c.isCompleted && c.status === 'pending');
        if (items.length === 0) return null;
        return { ownerUid: td.id, ngo: ngoByAdmin.get(td.id), items };
      })
      .filter(Boolean) as { ownerUid: string; ngo?: NGORow; items: TItem[] }[];
  }, [transparencyDocs, ngoByAdmin]);

  const approveItem = async (ownerUid: string, itemId: number | string, approved: boolean) => {
    if (!authUser) return;
    setApprovingKey(`${ownerUid}:${itemId}`);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/super-admin/transparency/approve', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerUid, itemId, approved }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Onaylanamadı');
      toast({ title: approved ? 'Onaylandı' : 'Onay geri alındı', description: body.ngoUpdated ? `STK şeffaflık puanı: ${body.approvedScore}` : 'Kaydedildi (eşleşen STK bulunamadı).' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'İşlem başarısız', description: e instanceof Error ? e.message : '' });
    } finally {
      setApprovingKey(null);
    }
  };

  // Kriter belgesini/bilgisini sil (Admin SDK route — transparency owner-only yazılır).
  const confirmDeleteItem = async () => {
    if (!authUser || !deleteTarget) return;
    setDeletingItem(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/super-admin/transparency/delete-item', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerUid: deleteTarget.ownerUid, itemId: deleteTarget.item.id }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Silinemedi');
      toast({ title: 'Belge silindi', description: body.ngoUpdated ? `STK şeffaflık puanı: ${body.approvedScore}` : 'Kaydedildi.' });
      setDeleteTarget(null);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Silinemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setDeletingItem(false);
    }
  };

  const filteredNgos = useMemo(() => {
    const list = (ngos || []).filter(n => n.status !== 'Pasif');
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(n => n.name.toLowerCase().includes(q) || (n.category || '').toLowerCase().includes(q));
  }, [ngos, search]);

  const handleSaveNgo = async (id: string, payload: { transparencyScore: number; transparencyChecklist: { criterionId: string; passed: boolean }[] }) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.ngos, id), payload);
      toast({ title: 'Şeffaflık Profili Güncellendi', description: `Yeni puan: ${payload.transparencyScore}` });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({
        variant: 'destructive',
        title: 'Güncellenemedi',
        description: code === 'permission-denied' ? 'Süper admin yetkisi gerekli.' : message,
      });
    }
  };

  // Endeks maddesi yönetimi
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPoints, setNewPoints] = useState<number>(5);
  const [newType, setNewType] = useState<CriterionType>('document');
  const [newOptions, setNewOptions] = useState('');
  const [editingCriterion, setEditingCriterion] = useState<TransparencyCriterion | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Madde değişince TÜM STK puanlarını güncel kriterlerle yeniden hesapla + yayınla.
  const recalcAll = useCallback(async (silent = false) => {
    if (!authUser) return;
    setRecalculating(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/super-admin/transparency/recalculate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => null) as { updated?: number; message?: string } | null;
      if (!res.ok) throw new Error(data?.message || 'Yeniden hesaplanamadı');
      if (!silent) toast({ title: 'Puanlar yayınlandı', description: `${data?.updated ?? 0} STK şeffaflık puanı güncel kriterlere göre yeniden hesaplandı.` });
    } catch (e) {
      if (!silent) toast({ variant: 'destructive', title: 'Yeniden hesaplama başarısız', description: e instanceof Error ? e.message : '' });
    } finally {
      setRecalculating(false);
    }
  }, [authUser, toast]);

  // Koleksiyon boşsa 14 standart maddeyi 1..14 id'leriyle yükle (mevcut STK verisi korunur).
  const seedDefaults = useCallback(async () => {
    setSeeding(true);
    try {
      await Promise.all(DEFAULT_CRITERIA.map(c =>
        setDoc(doc(db, COLLECTIONS.transparencyCriteria, c.id), {
          name: c.name, description: '', points: c.points, type: c.type,
          options: c.options || [], order: c.order, createdAt: serverTimestamp(),
        }, { merge: true }),
      ));
      toast({ title: 'Standart maddeler yüklendi', description: '14 varsayılan şeffaflık kriteri eklendi.' });
      await recalcAll(true);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Yüklenemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setSeeding(false);
    }
  }, [db, toast, recalcAll]);

  const handleAddCriterion = async () => {
    if (!newName.trim()) return;
    try {
      const order = (criteria || []).reduce((max, c) => Math.max(max, c.order ?? 0), 0) + 1;
      await addDoc(collection(db, COLLECTIONS.transparencyCriteria), {
        name: newName.trim(),
        description: newDesc.trim(),
        points: newPoints,
        type: newType,
        options: newType === 'multi-select' ? newOptions.split(',').map(s => s.trim()).filter(Boolean) : [],
        order,
        createdAt: serverTimestamp(),
      });
      setNewName(''); setNewDesc(''); setNewPoints(5); setNewType('document'); setNewOptions('');
      toast({ title: 'Kriter Eklendi', description: `"${newName}" eklendi. Puanlar yeniden hesaplanıyor…` });
      await recalcAll();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({ variant: 'destructive', title: 'Eklenemedi', description: message });
    }
  };

  const handleUpdateCriterion = async () => {
    if (!editingCriterion) return;
    try {
      await updateDoc(doc(db, COLLECTIONS.transparencyCriteria, editingCriterion.id), {
        name: editingCriterion.name,
        description: editingCriterion.description || '',
        points: editingCriterion.points,
        type: editingCriterion.type || 'document',
        options: editingCriterion.options || [],
      });
      toast({ title: 'Kriter Güncellendi', description: 'Puanlar yeniden hesaplanıyor…' });
      setEditingCriterion(null);
      await recalcAll();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({ variant: 'destructive', title: 'Güncellenemedi', description: message });
    }
  };

  const handleDeleteCriterion = async (id: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.transparencyCriteria, id));
      toast({ variant: 'destructive', title: 'Kriter Silindi', description: 'Puanlar yeniden hesaplanıyor…' });
      await recalcAll();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({ variant: 'destructive', title: 'Silinemedi', description: message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-foreground">Şeffaflık Yönetimi</h1>
        <p className="text-muted-foreground text-sm font-medium">
          Tüm STK'ların şeffaflık profillerini ve şeffaflık endeksi kriterlerini yönet.
        </p>
      </div>

      <Tabs defaultValue="approvals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="approvals">Onay Bekleyenler ({pendingQueue.reduce((s, p) => s + p.items.length, 0)})</TabsTrigger>
          <TabsTrigger value="ngos">STK Şeffaflık Profilleri</TabsTrigger>
          <TabsTrigger value="index">Endeks Maddeleri ({criteria?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="approvals" className="space-y-4">
          {tLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : pendingQueue.length === 0 ? (
            <Card className="rounded-2xl"><CardContent className="p-16 flex flex-col items-center text-center gap-2">
              <CheckCircle className="h-10 w-10 text-green-500/40" />
              <p className="text-muted-foreground italic">Onay bekleyen belge yok. Tümü güncel.</p>
            </CardContent></Card>
          ) : (
            <div className="space-y-4">
              {pendingQueue.map(p => (
                <Card key={p.ownerUid} className="rounded-2xl border-amber-300/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Clock className="h-4 w-4 text-amber-500" />
                          {p.ngo?.name || `STK (admin: ${p.ownerUid.slice(0, 6)}…)`}
                        </CardTitle>
                        <CardDescription>{p.items.length} belge/bilgi onay bekliyor</CardDescription>
                      </div>
                      {p.ngo?.id && (
                        <Button size="sm" variant="outline" className="rounded-xl shrink-0" onClick={() => setEditorTarget({ ngoId: p.ngo!.id, ownerUid: p.ownerUid, name: p.ngo?.name ?? '—' })}>
                          <Edit3 className="h-4 w-4 mr-1.5" /> İncele & Düzenle
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {p.items.map(it => {
                      const hasContent = !!(it.fileUrl || it.linkUrl || it.textValue || (it.selectedOptions && it.selectedOptions.length));
                      return (
                        <div key={it.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl border bg-amber-500/5">
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{it.name}</p>
                            <p className="text-[11px] text-muted-foreground">+{it.points} puan</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button size="icon" variant="ghost" className="h-9 w-9" aria-label="İncele" disabled={!hasContent} onClick={() => setPreviewItem(it)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            {hasContent && it.fileUrl && (
                              <Button asChild size="icon" variant="ghost" className="h-9 w-9" aria-label="İndir">
                                <a href={it.fileUrl} target="_blank" rel="noopener noreferrer" download><FileText className="h-4 w-4" /></a>
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-9 w-9 text-destructive" aria-label="Sil" onClick={() => setDeleteTarget({ ownerUid: p.ownerUid, item: it })}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" disabled={approvingKey === `${p.ownerUid}:${it.id}`} onClick={() => approveItem(p.ownerUid, it.id, true)} className="bg-green-600 hover:bg-green-700">
                              {approvingKey === `${p.ownerUid}:${it.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle className="h-4 w-4 mr-1.5" /> Onayla</>}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ngos" className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="STK ara..."
              className="pl-10 rounded-xl"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {ngosLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : filteredNgos.length === 0 ? (
            <Card className="rounded-2xl"><CardContent className="p-16 flex flex-col items-center text-center gap-2">
              <Inbox className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-muted-foreground italic">Eşleşen STK bulunamadı.</p>
            </CardContent></Card>
          ) : (
            <Card className="rounded-2xl border-border">
              <CardContent className="p-0 divide-y">
                {filteredNgos.map(ngo => (
                  <div key={ngo.id} className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12 border shadow-sm">
                      <AvatarImage src={ngo.avatarUrl} />
                      <AvatarFallback>{(ngo.name || '?').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold break-words">{ngo.name}</p>
                      <p className="text-xs text-muted-foreground">{ngo.category} · {ngo.type}</p>
                    </div>
                    {(() => {
                      const st = statsByAdmin.get((ngo as { adminUserId?: string }).adminUserId || '');
                      if (!st || st.completed === 0) return <Badge variant="secondary" className="text-[10px] text-muted-foreground">Belge yok</Badge>;
                      return (
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px] gap-1"><FileText className="h-3 w-3" />{st.completed} belge/bilgi</Badge>
                          {st.pending > 0 && <Badge className="text-[10px] bg-amber-500 hover:bg-amber-500 gap-1"><Clock className="h-3 w-3" />{st.pending} onay bekliyor</Badge>}
                        </div>
                      );
                    })()}
                    <Badge variant="outline" className="font-black">
                      <ShieldCheck className="mr-1 h-3 w-3 text-primary" />
                      {ngo.transparencyScore || 0} puan
                    </Badge>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditorTarget({ ngoId: ngo.id, ownerUid: (ngo as { adminUserId?: string }).adminUserId || '', name: ngo.name })}>
                      <FolderOpen className="mr-2 h-4 w-4" /> Belgeler
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditingNgo(ngo)}>
                      <Edit3 className="mr-2 h-4 w-4" /> Puan
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="index" className="space-y-4">
          <Card className="rounded-2xl border-amber-300/40 bg-amber-500/5">
            <CardContent className="py-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-semibold">Endeks maddeleri tüm STK'ların doldurduğu canlı listedir.</p>
                <p className="text-xs text-muted-foreground">Madde ekleme/çıkarma, ad veya puan değişikliği anında her STK'nın şeffaflık endeksine yansır ve puanlar yeniden hesaplanıp yayınlanır.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {(!criteria || criteria.length === 0) && (
                  <Button variant="outline" className="rounded-xl" onClick={seedDefaults} disabled={seeding}>
                    {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                    14 Standart Maddeyi Yükle
                  </Button>
                )}
                <Button variant="outline" className="rounded-xl" onClick={() => recalcAll()} disabled={recalculating}>
                  {recalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  Tümünü Yeniden Hesapla
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Plus className="h-4 w-4" /> Yeni Kriter Ekle</CardTitle>
              <CardDescription>Endeks listesine yeni şeffaflık kriteri ekle. STK profillerinde işaretlenebilir.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Kriter Adı</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Örn: Bağımsız Denetim Raporu Yayımlanmış" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Puan</Label>
                <Input type="number" min={0} max={100} value={newPoints} onChange={e => setNewPoints(parseInt(e.target.value) || 0)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tür</Label>
                <Select value={newType} onValueChange={(v) => setNewType(v as CriterionType)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(TYPE_LABELS) as CriterionType[]).map(tk => (
                      <SelectItem key={tk} value={tk}>{TYPE_LABELS[tk]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">Açıklama (opsiyonel)</Label>
                <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Kriterin kısa açıklaması" className="rounded-xl" />
              </div>
              {newType === 'multi-select' && (
                <div className="space-y-1.5 md:col-span-3">
                  <Label className="text-xs">Seçenekler (virgülle ayır)</Label>
                  <Input value={newOptions} onChange={e => setNewOptions(e.target.value)} placeholder="Örn: Afet Platformu, Açık Açık, Tüsev" className="rounded-xl" />
                </div>
              )}
              <Button onClick={handleAddCriterion} disabled={!newName.trim()} className="md:col-span-3 rounded-xl">
                <Plus className="mr-2 h-4 w-4" /> Kriter Ekle
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="text-base">Mevcut Kriterler</CardTitle>
            </CardHeader>
            <CardContent>
              {critLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !criteria || criteria.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-6 text-center">Henüz kriter eklenmemiş.</p>
              ) : (
                <div className="divide-y -mx-2">
                  {criteria.map(c => (
                    <div key={c.id} className="px-2 py-3 flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{c.name}</p>
                        {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
                        <Badge variant="secondary" className="text-[10px] mt-1">{TYPE_LABELS[(c.type as CriterionType) || 'document']}</Badge>
                      </div>
                      <Badge variant="outline" className="font-bold shrink-0">+{c.points}</Badge>
                      <Dialog open={editingCriterion?.id === c.id} onOpenChange={(o) => !o && setEditingCriterion(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCriterion(c)}>
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        {editingCriterion?.id === c.id && (
                          <DialogContent className="rounded-3xl">
                            <DialogHeader>
                              <DialogTitle>Kriteri Düzenle</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <Label>Adı</Label>
                                <Input value={editingCriterion.name} onChange={e => setEditingCriterion({ ...editingCriterion, name: e.target.value })} />
                              </div>
                              <div className="space-y-1.5">
                                <Label>Açıklama</Label>
                                <Input value={editingCriterion.description || ''} onChange={e => setEditingCriterion({ ...editingCriterion, description: e.target.value })} />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label>Puan</Label>
                                  <Input type="number" value={editingCriterion.points} onChange={e => setEditingCriterion({ ...editingCriterion, points: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>Tür</Label>
                                  <Select value={editingCriterion.type || 'document'} onValueChange={(v) => setEditingCriterion({ ...editingCriterion, type: v as CriterionType })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      {(Object.keys(TYPE_LABELS) as CriterionType[]).map(tk => (
                                        <SelectItem key={tk} value={tk}>{TYPE_LABELS[tk]}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              {editingCriterion.type === 'multi-select' && (
                                <div className="space-y-1.5">
                                  <Label>Seçenekler (virgülle ayır)</Label>
                                  <Input
                                    value={(editingCriterion.options || []).join(', ')}
                                    onChange={e => setEditingCriterion({ ...editingCriterion, options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                                  />
                                </div>
                              )}
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingCriterion(null)}>Vazgeç</Button>
                              <Button onClick={handleUpdateCriterion}>Kaydet</Button>
                            </DialogFooter>
                          </DialogContent>
                        )}
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCriterion(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NGO_EDIT
        ngo={editingNgo}
        criteria={criteria || []}
        open={!!editingNgo}
        onOpenChange={(o) => !o && setEditingNgo(null)}
        onSave={handleSaveNgo}
      />

      {/* Tam şeffaflık editörü — süper-admin STK'nın belge/link/bilgilerini düzenler + onaylar */}
      <Dialog open={!!editorTarget} onOpenChange={(o) => !o && setEditorTarget(null)}>
        <DialogContent className="rounded-3xl max-w-2xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> {editorTarget?.name} — Şeffaflık Belgeleri
            </DialogTitle>
            <DialogDescription>Belge yükle/değiştir, link veya bilgi gir, işaretle ve kaydet. Kaydedilen maddeler onaylı sayılır, STK puanı otomatik hesaplanır.</DialogDescription>
          </DialogHeader>
          {editorTarget && (
            <TransparencyEditor ngoId={editorTarget.ngoId} ownerUid={editorTarget.ownerUid || null} ngoName={editorTarget.name} />
          )}
        </DialogContent>
      </Dialog>

      {/* Tekil madde önizleme — onay bekleyen belge/link/bilgi */}
      <Dialog open={!!previewItem} onOpenChange={(o) => !o && setPreviewItem(null)}>
        <DialogContent className="rounded-3xl max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewItem?.name}</DialogTitle>
          </DialogHeader>
          {previewItem && (
            <div className="py-2 space-y-3 max-h-[70vh] overflow-y-auto">
              {previewItem.fileUrl && (
                <div className="space-y-2">
                  {/\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(previewItem.fileUrl) ? (
                    <img src={previewItem.fileUrl} alt={previewItem.fileName || previewItem.name} className="w-full rounded-lg border" />
                  ) : /\.pdf(\?|$)/i.test(previewItem.fileUrl) ? (
                    <iframe src={previewItem.fileUrl} title={previewItem.name} className="w-full h-[60vh] rounded-lg border" />
                  ) : null}
                  <a href={previewItem.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
                    <FileText className="h-4 w-4" /> {previewItem.fileName || 'Belgeyi yeni sekmede aç'}
                  </a>
                </div>
              )}
              {previewItem.linkUrl && (
                <a href={previewItem.linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all">
                  <ExternalLink className="h-4 w-4 shrink-0" /> {previewItem.linkUrl}
                </a>
              )}
              {previewItem.textValue && (
                <p className="text-sm bg-muted/50 rounded-lg p-3 whitespace-pre-wrap">{previewItem.textValue}</p>
              )}
              {previewItem.selectedOptions && previewItem.selectedOptions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {previewItem.selectedOptions.map(o => <Badge key={o} variant="secondary">{o}</Badge>)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Belgeyi sil?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.item.name}&quot; kriterine girilen belge/bilgi kaldırılacak ve STK&apos;nın şeffaflık puanı yeniden hesaplanacak. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingItem}>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void confirmDeleteItem(); }}
              disabled={deletingItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingItem ? 'Siliniyor…' : 'Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
