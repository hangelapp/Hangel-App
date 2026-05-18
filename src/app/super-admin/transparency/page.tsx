'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { Edit3, Loader2, Plus, ShieldCheck, Trash2, Search, Inbox } from 'lucide-react';
import type { NGO } from '@/lib/types';

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
}

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

  const ngosQuery = useMemoFirebase(() => (db ? collection(db, 'ngos') : null), [db]);
  const { data: ngos, isLoading: ngosLoading } = useCollection<NGORow>(ngosQuery);

  const criteriaQuery = useMemoFirebase(() => (db ? collection(db, 'transparencyCriteria') : null), [db]);
  const { data: criteria, isLoading: critLoading } = useCollection<TransparencyCriterion>(criteriaQuery);

  const filteredNgos = useMemo(() => {
    const list = (ngos || []).filter(n => n.status !== 'Pasif');
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(n => n.name.toLowerCase().includes(q) || (n.category || '').toLowerCase().includes(q));
  }, [ngos, search]);

  const handleSaveNgo = async (id: string, payload: { transparencyScore: number; transparencyChecklist: { criterionId: string; passed: boolean }[] }) => {
    try {
      await updateDoc(doc(db, 'ngos', id), payload);
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
  const [editingCriterion, setEditingCriterion] = useState<TransparencyCriterion | null>(null);

  const handleAddCriterion = async () => {
    if (!newName.trim()) return;
    try {
      await addDoc(collection(db, 'transparencyCriteria'), {
        name: newName.trim(),
        description: newDesc.trim(),
        points: newPoints,
        createdAt: serverTimestamp(),
      });
      setNewName(''); setNewDesc(''); setNewPoints(5);
      toast({ title: 'Kriter Eklendi', description: `"${newName}" şeffaflık endeksine eklendi.` });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({ variant: 'destructive', title: 'Eklenemedi', description: message });
    }
  };

  const handleUpdateCriterion = async () => {
    if (!editingCriterion) return;
    try {
      await updateDoc(doc(db, 'transparencyCriteria', editingCriterion.id), {
        name: editingCriterion.name,
        description: editingCriterion.description || '',
        points: editingCriterion.points,
      });
      toast({ title: 'Kriter Güncellendi' });
      setEditingCriterion(null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({ variant: 'destructive', title: 'Güncellenemedi', description: message });
    }
  };

  const handleDeleteCriterion = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'transparencyCriteria', id));
      toast({ variant: 'destructive', title: 'Kriter Silindi' });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Bilinmeyen hata';
      toast({ variant: 'destructive', title: 'Silinemedi', description: message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Şeffaflık Yönetimi</h1>
        <p className="text-muted-foreground text-sm font-medium">
          Tüm STK'ların şeffaflık profillerini ve şeffaflık endeksi kriterlerini yönet.
        </p>
      </div>

      <Tabs defaultValue="ngos" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ngos">STK Şeffaflık Profilleri</TabsTrigger>
          <TabsTrigger value="index">Endeks Maddeleri ({criteria?.length || 0})</TabsTrigger>
        </TabsList>

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
            <Card className="rounded-2xl border-black/5">
              <CardContent className="p-0 divide-y">
                {filteredNgos.map(ngo => (
                  <div key={ngo.id} className="p-4 flex items-center gap-4">
                    <Avatar className="h-12 w-12 border shadow-sm">
                      <AvatarImage src={ngo.avatarUrl} />
                      <AvatarFallback>{(ngo.name || '?').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold truncate">{ngo.name}</p>
                      <p className="text-xs text-muted-foreground">{ngo.category} · {ngo.type}</p>
                    </div>
                    <Badge variant="outline" className="font-black">
                      <ShieldCheck className="mr-1 h-3 w-3 text-primary" />
                      {ngo.transparencyScore || 0} puan
                    </Badge>
                    <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setEditingNgo(ngo)}>
                      <Edit3 className="mr-2 h-4 w-4" /> Düzenle
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="index" className="space-y-4">
          <Card className="rounded-2xl border-black/5">
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
              <div className="space-y-1.5 md:col-span-3">
                <Label className="text-xs">Açıklama (opsiyonel)</Label>
                <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Kriterin kısa açıklaması" className="rounded-xl" />
              </div>
              <Button onClick={handleAddCriterion} disabled={!newName.trim()} className="md:col-span-3 rounded-xl">
                <Plus className="mr-2 h-4 w-4" /> Kriter Ekle
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-black/5">
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
                              <div className="space-y-1.5">
                                <Label>Puan</Label>
                                <Input type="number" value={editingCriterion.points} onChange={e => setEditingCriterion({ ...editingCriterion, points: parseInt(e.target.value) || 0 })} />
                              </div>
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
    </div>
  );
}
