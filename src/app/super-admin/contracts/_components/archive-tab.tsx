'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Search, Archive, FileText, Building2, ShoppingBag, GraduationCap, CheckCircle2, Circle, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, serverTimestamp, query, orderBy, limit, documentId, type Timestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ArchiveDoc {
  id: string;
  entityId?: string;
  entityName?: string;
  entityType?: 'ngo' | 'brand' | 'club';
  docType?: string;   // tüzük, faaliyet belgesi, izin belgesi
  fileUrl?: string;
  year?: string;
  uploadedBy?: string;
  uploadedAt?: unknown;
  reviewed?: boolean;       // hukukçu "incelendi" tiki
  reviewedByName?: string;
  reviewedAt?: Timestamp;
}

const ENTITY_META: Record<string, { label: string; icon: React.ElementType; cls: string }> = {
  ngo: { label: 'STK', icon: Building2, cls: 'text-orange-600' },
  brand: { label: 'Marka', icon: ShoppingBag, cls: 'text-green-600' },
  club: { label: 'Kulüp', icon: GraduationCap, cls: 'text-blue-600' },
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

export function ArchiveTab() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [reviewFilter, setReviewFilter] = useState<string>('all');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ArchiveDoc | null>(null);

  // Geçmiş belgeleri OTOMATİK tara — oturum başına bir kez (buton yok).
  useEffect(() => {
    if (!user) return;
    if (typeof window !== 'undefined' && sessionStorage.getItem('archive-backfilled')) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await user.getIdToken();
        await fetch('/api/admin/archive-backfill', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        if (!cancelled && typeof window !== 'undefined') sessionStorage.setItem('archive-backfilled', '1');
      } catch { /* sessiz — sonraki açılışta tekrar denenir */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const archiveQuery = useMemoFirebase(() => query(collection(db, COLLECTIONS.documentArchive), orderBy(documentId()), limit(200)), [db]);
  const { data: docs, isLoading } = useCollection<ArchiveDoc>(archiveQuery);

  const reviewStats = useMemo(() => {
    const all = docs || [];
    return { total: all.length, reviewed: all.filter(d => d.reviewed).length };
  }, [docs]);

  // Hukukçu "incelendi" tikini aç/kapat (documentArchive update yalnız super-admin'e açık).
  const toggleReview = async (d: ArchiveDoc) => {
    setMarkingId(d.id);
    try {
      const next = !d.reviewed;
      await updateDoc(doc(db, COLLECTIONS.documentArchive, d.id), next ? {
        reviewed: true,
        reviewedBy: user?.uid || null,
        reviewedByName: user?.displayName || user?.email?.split('@')[0] || 'Hukuk Görevlisi',
        reviewedAt: serverTimestamp(),
      } : {
        reviewed: false, reviewedBy: null, reviewedByName: null, reviewedAt: null,
      });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      toast({ variant: 'destructive', title: 'İşaretlenemedi', description: code === 'permission-denied' ? 'Super-admin yetkisi gerekli.' : (e instanceof Error ? e.message : 'Hata') });
    } finally {
      setMarkingId(null);
    }
  };

  // Kuruma göre grupla
  const grouped = useMemo(() => {
    let list = docs || [];
    if (yearFilter !== 'all') list = list.filter(d => d.year === yearFilter);
    if (typeFilter !== 'all') list = list.filter(d => d.entityType === typeFilter);
    if (reviewFilter === 'reviewed') list = list.filter(d => d.reviewed);
    else if (reviewFilter === 'unreviewed') list = list.filter(d => !d.reviewed);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(d => (d.entityName || '').toLowerCase().includes(q) || (d.docType || '').toLowerCase().includes(q));
    }
    const byEntity = new Map<string, { name: string; type?: string; docs: ArchiveDoc[] }>();
    list.forEach(d => {
      const key = d.entityId || d.entityName || d.id;
      if (!byEntity.has(key)) byEntity.set(key, { name: d.entityName || 'Bilinmeyen Kurum', type: d.entityType, docs: [] });
      byEntity.get(key)!.docs.push(d);
    });
    return Array.from(byEntity.values());
  }, [docs, searchTerm, yearFilter, typeFilter, reviewFilter]);

  const isImg = (u?: string) => !!u && /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(u);

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          <Archive className="h-5 w-5 text-primary" /> Evrak Arşivi (Kurum Bazlı)
          {reviewStats.total > 0 && (
            <Badge variant="outline" className={cn('text-[10px] gap-1', reviewStats.reviewed === reviewStats.total ? 'border-green-500 text-green-700' : 'text-muted-foreground')}>
              <CheckCircle2 className="h-3 w-3" /> {reviewStats.reviewed}/{reviewStats.total} incelendi
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-3 flex-wrap pt-2">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Kurum adı / evrak türü ara..." className="pl-10 h-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Kurumlar</SelectItem>
              <SelectItem value="ngo">STK</SelectItem>
              <SelectItem value="brand">Marka</SelectItem>
              <SelectItem value="club">Kulüp</SelectItem>
            </SelectContent>
          </Select>
          <Select value={yearFilter} onValueChange={setYearFilter}>
            <SelectTrigger className="w-32 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Yıllar</SelectItem>
              {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={reviewFilter} onValueChange={setReviewFilter}>
            <SelectTrigger className="w-40 h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">İnceleme: Tümü</SelectItem>
              <SelectItem value="unreviewed">İncelenmemiş</SelectItem>
              <SelectItem value="reviewed">İncelendi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : grouped.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Archive className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Henüz evrak yüklenmemiş.</p>
            <p className="text-xs mt-1">STK / marka / kulüp panellerinden tüzük, faaliyet belgesi vb. yüklendiğinde burada kurum kurum listelenir.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((entity, i) => {
              const meta = entity.type ? ENTITY_META[entity.type] : null;
              const Icon = meta?.icon || Building2;
              // Yıla göre grupla
              const byYear = new Map<string, ArchiveDoc[]>();
              entity.docs.forEach(d => {
                const y = d.year || 'Tarihsiz';
                if (!byYear.has(y)) byYear.set(y, []);
                byYear.get(y)!.push(d);
              });
              return (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <div className="flex items-center gap-2 p-3 bg-muted/40 border-b">
                    <Icon className={cn('h-5 w-5', meta?.cls || 'text-muted-foreground')} />
                    <span className="font-bold text-sm">{entity.name}</span>
                    {meta && <Badge variant="outline" className="text-[9px]">{meta.label}</Badge>}
                    {(() => { const rv = entity.docs.filter(d => d.reviewed).length; return (
                      <Badge variant="outline" className={cn('text-[9px] ml-auto gap-1', rv === entity.docs.length ? 'border-green-500 text-green-700' : 'text-muted-foreground')}>
                        <CheckCircle2 className="h-2.5 w-2.5" /> {rv}/{entity.docs.length} incelendi
                      </Badge>
                    ); })()}
                    <Badge variant="secondary" className="text-[9px]">{entity.docs.length} evrak</Badge>
                  </div>
                  <div className="p-2 space-y-2">
                    {Array.from(byYear.entries()).sort((a, b) => b[0].localeCompare(a[0])).map(([year, yearDocs]) => (
                      <div key={year}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-2 py-1">{year}</p>
                        <div className="space-y-1">
                          {yearDocs.map(d => (
                            <div key={d.id} className={cn('flex items-center gap-2 p-2 rounded hover:bg-accent/40', d.reviewed && 'bg-green-50/60')}>
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="text-sm flex-1 truncate">{d.docType || 'Evrak'}</span>
                              {d.reviewed && d.reviewedByName && (
                                <span className="text-[10px] text-green-700 hidden sm:inline shrink-0" title="İnceleyen">{d.reviewedByName}</span>
                              )}
                              {d.fileUrl && (
                                <button onClick={() => setPreviewDoc(d)} className="inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0">
                                  <Eye className="h-3 w-3" /> Önizle
                                </button>
                              )}
                              <button
                                onClick={() => toggleReview(d)}
                                disabled={markingId === d.id}
                                title={d.reviewed ? 'İncelendi — geri almak için tıkla' : 'İncelendi olarak işaretle'}
                                className={cn('inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 border shrink-0 transition-colors',
                                  d.reviewed ? 'bg-green-600 text-white border-green-600 hover:bg-green-700' : 'text-muted-foreground hover:bg-accent')}
                              >
                                {markingId === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : d.reviewed ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                                {d.reviewed ? 'İncelendi' : 'İncele'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Önizleme popup (yeni sekme yerine) */}
    <Dialog open={!!previewDoc} onOpenChange={(o) => { if (!o) setPreviewDoc(null); }}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle className="truncate pr-8">{previewDoc?.docType || 'Evrak'}{previewDoc?.entityName ? ` — ${previewDoc.entityName}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto bg-muted/30">
          {previewDoc?.fileUrl && (isImg(previewDoc.fileUrl) ? (
            <div className="w-full h-full flex items-center justify-center p-4">
              <img src={previewDoc.fileUrl} alt={previewDoc.docType || 'Evrak'} className="max-w-full max-h-full object-contain rounded shadow" />
            </div>
          ) : (
            <iframe src={previewDoc.fileUrl} className="w-full h-full border-0" title="Belge önizleme" />
          ))}
        </div>
        <DialogFooter className="p-3 border-t shrink-0 gap-2">
          {previewDoc?.fileUrl && (
            <Button asChild variant="outline">
              <a href={previewDoc.fileUrl} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4 mr-2" /> İndir / Yeni Sekme</a>
            </Button>
          )}
          <Button variant="secondary" onClick={() => setPreviewDoc(null)}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
