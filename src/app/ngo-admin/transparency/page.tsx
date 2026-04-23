'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Upload, Link as LinkIcon, Eye, Loader2, FileText, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

interface CriteriaItem {
  id: number;
  name: string;
  points: number;
  isCompleted: boolean;
  type: 'document' | 'link' | 'text';
  fileName?: string;
  fileUrl?: string;
  storagePath?: string;
  linkUrl?: string;
  textValue?: string;
  updatedAt?: string;
}

const defaultCriteria: CriteriaItem[] = [
  { id: 1, name: 'Faaliyet Belgesi', points: 10, isCompleted: false, type: 'document' },
  { id: 2, name: 'Tüzük / Vakıf Senedi', points: 10, isCompleted: false, type: 'document' },
  { id: 3, name: 'Yönetim Kurulu Listesi', points: 5, isCompleted: false, type: 'document' },
  { id: 4, name: 'Yıllık Faaliyet Raporu', points: 10, isCompleted: false, type: 'link' },
  { id: 5, name: 'Finansal Tablolar', points: 10, isCompleted: false, type: 'link' },
  { id: 6, name: 'Bağımsız Denetim Raporu', points: 10, isCompleted: false, type: 'link' },
  { id: 7, name: 'Etki Raporu', points: 10, isCompleted: false, type: 'link' },
  { id: 8, name: 'Web Sitesi', points: 5, isCompleted: false, type: 'link' },
  { id: 9, name: 'Posta Adresi', points: 5, isCompleted: false, type: 'text' },
  { id: 10, name: 'Ofis Adresi', points: 5, isCompleted: false, type: 'text' },
  { id: 11, name: 'E-posta Adresi', points: 5, isCompleted: false, type: 'text' },
  { id: 12, name: 'Telefon Numarası', points: 5, isCompleted: false, type: 'text' },
  { id: 13, name: 'Açık Açık Üyeliği', points: 5, isCompleted: false, type: 'link' },
  { id: 14, name: 'Afet Platformu Üyeliği', points: 5, isCompleted: false, type: 'link' },
];

const mergeWithDefaults = (saved: CriteriaItem[] | undefined): CriteriaItem[] => {
  if (!saved || saved.length === 0) return defaultCriteria;
  const byId = new Map(saved.map(c => [c.id, c]));
  return defaultCriteria.map(def => ({ ...def, ...(byId.get(def.id) || {}) }));
};

export default function TransparencyPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<CriteriaItem | null>(null);
  const [editValue, setEditValue] = useState('');

  const transparencyDocRef = useMemoFirebase(() => {
    if (!authUser?.uid) return null;
    return doc(firestore, 'transparency', authUser.uid);
  }, [firestore, authUser?.uid]);

  const { data: transparencyData, isLoading } = useDoc<{ criteria: CriteriaItem[] }>(transparencyDocRef);

  const activeCriteria = mergeWithDefaults(transparencyData?.criteria);

  const totalPoints = activeCriteria.reduce((sum, item) => sum + item.points, 0);
  const currentPoints = activeCriteria.filter(item => item.isCompleted).reduce((sum, item) => sum + item.points, 0);
  const progressValue = (currentPoints / totalPoints) * 100;
  const hasMetThreshold = currentPoints >= 35;

  const persistCriteria = useCallback((next: CriteriaItem[]) => {
    if (!authUser?.uid) return;
    setDocumentNonBlocking(
      doc(firestore, 'transparency', authUser.uid),
      { criteria: next, ngoId: authUser.uid, updatedAt: new Date().toISOString() },
      { merge: true },
    );
  }, [authUser?.uid, firestore]);

  const handleFileUpload = useCallback(async (itemId: number, file: File) => {
    if (!authUser?.uid) {
      toast({ variant: 'destructive', title: 'Oturum bulunamadı' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'En fazla 10MB yükleyebilirsiniz.' });
      return;
    }

    setUploadingId(itemId);
    try {
      const storage = getStorage();
      const existing = activeCriteria.find(c => c.id === itemId);
      // Delete previous file if exists
      if (existing?.storagePath) {
        try { await deleteObject(ref(storage, existing.storagePath)); } catch {}
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `transparency/${authUser.uid}/${itemId}-${Date.now()}-${safeName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);
      const fileUrl = await getDownloadURL(storageRef);

      const next = activeCriteria.map(item =>
        item.id === itemId
          ? { ...item, isCompleted: true, fileName: file.name, fileUrl, storagePath, updatedAt: new Date().toISOString() }
          : item,
      );
      persistCriteria(next);

      toast({ title: 'Belge yüklendi', description: `"${file.name}" kaydedildi.` });
    } catch (err: any) {
      console.error('Upload failed', err);
      toast({ variant: 'destructive', title: 'Yükleme hatası', description: err?.message || 'Bilinmeyen hata.' });
    } finally {
      setUploadingId(null);
    }
  }, [activeCriteria, authUser?.uid, persistCriteria, toast]);

  const handleRemove = useCallback(async (itemId: number) => {
    if (!authUser?.uid) return;
    const target = activeCriteria.find(c => c.id === itemId);
    if (!target) return;

    if (target.storagePath) {
      try { await deleteObject(ref(getStorage(), target.storagePath)); } catch {}
    }

    const next = activeCriteria.map(item =>
      item.id === itemId
        ? { ...item, isCompleted: false, fileName: undefined, fileUrl: undefined, storagePath: undefined, linkUrl: undefined, textValue: undefined, updatedAt: new Date().toISOString() }
        : item,
    );
    persistCriteria(next);
    toast({ title: 'Kaldırıldı', description: `"${target.name}" kriteri sıfırlandı.` });
  }, [activeCriteria, authUser?.uid, persistCriteria, toast]);

  const openEditor = (item: CriteriaItem) => {
    setEditingItem(item);
    setEditValue(item.type === 'link' ? (item.linkUrl || '') : (item.textValue || ''));
  };

  const saveEditor = () => {
    if (!editingItem) return;
    const val = editValue.trim();
    if (!val) {
      toast({ variant: 'destructive', title: 'Boş değer girilemez' });
      return;
    }
    if (editingItem.type === 'link' && !/^https?:\/\//i.test(val)) {
      toast({ variant: 'destructive', title: 'Geçersiz bağlantı', description: 'Bağlantı http:// veya https:// ile başlamalı.' });
      return;
    }

    const next = activeCriteria.map(item =>
      item.id === editingItem.id
        ? {
          ...item,
          isCompleted: true,
          linkUrl: editingItem.type === 'link' ? val : item.linkUrl,
          textValue: editingItem.type === 'text' ? val : item.textValue,
          updatedAt: new Date().toISOString(),
        }
        : item,
    );
    persistCriteria(next);
    toast({ title: 'Kaydedildi', description: `"${editingItem.name}" güncellendi.` });
    setEditingItem(null);
    setEditValue('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Şeffaflık Endeksi</h1>
        <p className="text-muted-foreground">
          Platformda STK'ların şeffaflık puanını belirleyen kriterler aşağıda listelenmiştir. Bu kriterleri karşılayarak destekçilerinizin güvenini artırabilirsiniz.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className={cn('text-2xl font-bold', hasMetThreshold ? 'text-green-600' : 'text-destructive')}>
            Şeffaflık Puanı: {currentPoints} / {totalPoints}
          </CardTitle>
          <Progress value={progressValue} className={cn('mt-2', hasMetThreshold && '[&>div]:bg-green-600')} />
        </CardHeader>
        <CardContent>
          <Alert variant={hasMetThreshold ? 'default' : 'destructive'} className={cn(hasMetThreshold && 'border-green-600/50 bg-green-500/5 text-green-700 [&>svg]:text-green-600')}>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{hasMetThreshold ? 'Tebrikler!' : 'Önemli Uyarı'}</AlertTitle>
            <AlertDescription>
              {hasMetThreshold ? 'Şeffaflık eşiğini aştınız. Profiliniz platformda güvenle listeleniyor.' : 'Şeffaflık puanı 35\'in altında olan kuruluşlar platformda listelenmez.'}
            </AlertDescription>
          </Alert>

          <div className="space-y-3 mt-6">
            {activeCriteria.map(item => (
              <div key={item.id} className={cn(
                'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg',
                item.isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-border',
              )}>
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {item.isCompleted ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{item.name}</p>
                      <Badge variant={item.isCompleted ? 'default' : 'secondary'} className={cn('text-[10px]', item.isCompleted && 'bg-green-600 hover:bg-green-600')}>
                        {item.isCompleted ? 'Yüklendi' : `+${item.points} puan`}
                      </Badge>
                    </div>
                    {item.type === 'document' && item.fileName && (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline truncate max-w-full"
                      >
                        <FileText className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.fileName}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                      </a>
                    )}
                    {item.type === 'link' && item.linkUrl && (
                      <a
                        href={item.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline truncate max-w-full"
                      >
                        <LinkIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{item.linkUrl}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
                      </a>
                    )}
                    {item.type === 'text' && item.textValue && (
                      <p className="text-xs text-muted-foreground truncate">{item.textValue}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {item.isCompleted && item.type === 'document' && item.fileUrl && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Görüntüle">
                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  {item.isCompleted && item.type === 'link' && item.linkUrl && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild title="Aç">
                      <a href={item.linkUrl} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                  )}

                  {item.type === 'document' ? (
                    <Button asChild variant={item.isCompleted ? 'outline' : 'secondary'} size="sm" disabled={uploadingId === item.id}>
                      <label htmlFor={`upload-${item.id}`} className="cursor-pointer">
                        {uploadingId === item.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {item.isCompleted ? 'Güncelle' : 'Yükle'}
                        <input
                          id={`upload-${item.id}`}
                          type="file"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(item.id, file);
                            e.target.value = '';
                          }}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        />
                      </label>
                    </Button>
                  ) : (
                    <Button
                      variant={item.isCompleted ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => openEditor(item)}
                    >
                      <LinkIcon className="mr-2 h-4 w-4" />
                      {item.isCompleted ? 'Güncelle' : 'Ekle'}
                    </Button>
                  )}

                  {item.isCompleted && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemove(item.id)} title="Kaldır">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingItem} onOpenChange={open => { if (!open) { setEditingItem(null); setEditValue(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>{editingItem?.type === 'link' ? 'Bağlantı (URL)' : 'Değer'}</Label>
            <Input
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              placeholder={editingItem?.type === 'link' ? 'https://...' : 'Değeri girin'}
              type={editingItem?.type === 'link' ? 'url' : 'text'}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingItem(null); setEditValue(''); }}>İptal</Button>
            <Button onClick={saveEditor}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
