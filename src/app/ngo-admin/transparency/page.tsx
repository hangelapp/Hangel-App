'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Upload, Link as LinkIcon, Eye, Loader2, FileText, Trash2, ExternalLink, Plus, Download, X as XIcon, ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
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
  type: 'document' | 'link' | 'text' | 'document-link' | 'multi-select';
  fileName?: string;
  fileUrl?: string;
  storagePath?: string;
  linkUrl?: string;
  textValue?: string;
  selectedOptions?: string[];
  options?: string[];
  updatedAt?: string;
}

const MEMBERSHIP_OPTIONS = [
  'Afet Platformu', 'Açık Açık', 'Tüsev', 'Adım Adım', 'Ability Pool',
  'HelpSteps', 'Candid', 'Global Compact', 'Idealist', 'www.gonulluyuzbiz.gov.tr',
  'TGSP', 'Diğer',
];

const defaultCriteria: CriteriaItem[] = [
  { id: 1, name: 'Faaliyet Belgesi', points: 10, isCompleted: false, type: 'document' },
  { id: 2, name: 'Tüzük / Vakıf Senedi', points: 10, isCompleted: false, type: 'document' },
  { id: 3, name: 'Yönetim Kurulu Listesi', points: 5, isCompleted: false, type: 'document-link' },
  { id: 4, name: 'Yıllık Faaliyet Raporu', points: 10, isCompleted: false, type: 'document-link' },
  { id: 5, name: 'Finansal Tablolar', points: 10, isCompleted: false, type: 'document-link' },
  { id: 6, name: 'Bağımsız Denetim Raporu', points: 10, isCompleted: false, type: 'document-link' },
  { id: 7, name: 'Etki Raporu', points: 10, isCompleted: false, type: 'document-link' },
  { id: 8, name: 'Web Sitesi', points: 5, isCompleted: false, type: 'link' },
  { id: 9, name: 'Posta Adresi', points: 5, isCompleted: false, type: 'text' },
  { id: 10, name: 'Ofis Adresi', points: 5, isCompleted: false, type: 'text' },
  { id: 11, name: 'E-posta Adresi', points: 5, isCompleted: false, type: 'text' },
  { id: 12, name: 'Telefon Numarası', points: 5, isCompleted: false, type: 'text' },
  { id: 13, name: 'Açık Açık Üyeliği', points: 5, isCompleted: false, type: 'link' },
  { id: 14, name: 'Afet Platformu Üyeliği', points: 5, isCompleted: false, type: 'multi-select', options: MEMBERSHIP_OPTIONS },
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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [previewItem, setPreviewItem] = useState<CriteriaItem | null>(null);

  const isImageUrl = (url?: string, name?: string) => {
    const target = (url || name || '').toLowerCase();
    return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/.test(target);
  };
  const isPdfUrl = (url?: string, name?: string) => {
    const target = (url || name || '').toLowerCase();
    return /\.pdf(\?|$)/.test(target);
  };

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
    } catch (err) {
      console.error('Upload failed', err);
      const e = err as { message?: string };
      toast({ variant: 'destructive', title: 'Yükleme hatası', description: e?.message || 'Bilinmeyen hata.' });
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
        ? { ...item, isCompleted: false, fileName: undefined, fileUrl: undefined, storagePath: undefined, linkUrl: undefined, textValue: undefined, selectedOptions: [], updatedAt: new Date().toISOString() }
        : item,
    );
    persistCriteria(next);
    toast({ title: 'Kaldırıldı', description: `"${target.name}" kriteri sıfırlandı.` });
  }, [activeCriteria, authUser?.uid, persistCriteria, toast]);

  const openEditor = (item: CriteriaItem) => {
    setEditingId(item.id);
    setEditValue(item.type === 'link' ? (item.linkUrl || '') : (item.textValue || ''));
  };

  const cancelEditor = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEditor = (item: CriteriaItem) => {
    const val = editValue.trim();
    if (!val) {
      toast({ variant: 'destructive', title: 'Boş değer girilemez' });
      return;
    }
    const isLinkType = item.type === 'link' || item.type === 'document-link';
    if (isLinkType && !/^https?:\/\//i.test(val)) {
      toast({ variant: 'destructive', title: 'Geçersiz bağlantı', description: 'Bağlantı http:// veya https:// ile başlamalı.' });
      return;
    }

    const next = activeCriteria.map(c =>
      c.id === item.id
        ? {
          ...c,
          isCompleted: true,
          linkUrl: isLinkType ? val : c.linkUrl,
          textValue: item.type === 'text' ? val : c.textValue,
          updatedAt: new Date().toISOString(),
        }
        : c,
    );
    persistCriteria(next);
    toast({ title: 'Kaydedildi', description: `"${item.name}" güncellendi.` });
    setEditingId(null);
    setEditValue('');
  };

  const toggleMultiOption = (item: CriteriaItem, option: string) => {
    const currentSelected = item.selectedOptions || [];
    const isSelected = currentSelected.includes(option);
    const nextSelected = isSelected ? currentSelected.filter(o => o !== option) : [...currentSelected, option];
    const next = activeCriteria.map(c =>
      c.id === item.id
        ? {
          ...c,
          selectedOptions: nextSelected,
          isCompleted: nextSelected.length > 0,
          updatedAt: new Date().toISOString(),
        }
        : c,
    );
    persistCriteria(next);
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
            {activeCriteria.map(item => {
              const isEditing = editingId === item.id;
              return (
              <div key={item.id} className={cn(
                'p-4 border rounded-lg',
                item.isCompleted ? 'border-green-500/30 bg-green-500/5' : 'border-border',
              )}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {item.isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{item.name}</p>
                        {item.isCompleted ? (
                          <Badge className="text-[10px] bg-green-600 hover:bg-green-600 gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {item.type === 'document' ? 'Yüklendi' : 'Tamamlandı'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">+{item.points} puan</Badge>
                        )}
                      </div>
                      {!isEditing && (item.type === 'document' || item.type === 'document-link') && item.fileName && (
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
                      {!isEditing && (item.type === 'link' || item.type === 'document-link') && item.linkUrl && (
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
                      {!isEditing && item.type === 'text' && item.textValue && (
                        <p className="text-xs text-muted-foreground truncate">{item.textValue}</p>
                      )}
                      {item.type === 'multi-select' && (item.selectedOptions || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(item.selectedOptions || []).map(opt => (
                            <Badge key={opt} variant="secondary" className="text-[10px] font-normal">{opt}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    {/* Önizle butonu — yüklü dosya veya bağlantı varsa */}
                    {!isEditing && item.isCompleted && (item.fileUrl || item.linkUrl) && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setPreviewItem(item)}
                        title="Önizle"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden sm:inline">Önizle</span>
                      </Button>
                    )}

                    {/* Belge yükleme butonu (document ve document-link için) */}
                    {(item.type === 'document' || item.type === 'document-link') && (
                      <Button asChild variant={item.fileName ? 'outline' : 'secondary'} size="sm" disabled={uploadingId === item.id}>
                        <label htmlFor={`upload-${item.id}`} className="cursor-pointer">
                          {uploadingId === item.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          {item.fileName ? 'Dosya Güncelle' : (item.type === 'document-link' ? 'Dosya Yükle' : 'Yükle')}
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
                    )}

                    {/* Bağlantı ekleme butonu (link ve document-link için) */}
                    {!isEditing && (item.type === 'link' || item.type === 'document-link') && (
                      <Button
                        variant={item.linkUrl ? 'outline' : 'secondary'}
                        size="sm"
                        onClick={() => openEditor(item)}
                      >
                        <LinkIcon className="mr-2 h-4 w-4" />
                        {item.linkUrl ? 'Bağlantı Güncelle' : 'Bağlantı Ekle'}
                      </Button>
                    )}

                    {/* Metin değer ekleme butonu (text için) */}
                    {!isEditing && item.type === 'text' && (
                      <Button
                        variant={item.isCompleted ? 'outline' : 'secondary'}
                        size="sm"
                        onClick={() => openEditor(item)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {item.isCompleted ? 'Güncelle' : 'Ekle'}
                      </Button>
                    )}

                    {/* Çoklu seçim dropdown'u (multi-select için) */}
                    {item.type === 'multi-select' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant={item.isCompleted ? 'outline' : 'secondary'} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            {item.isCompleted
                              ? `${(item.selectedOptions || []).length} seçili`
                              : 'Seçiniz'}
                            <ChevronDown className="ml-1 h-3 w-3 opacity-60" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
                          <DropdownMenuLabel>Üye olunan platformlar</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {(item.options || MEMBERSHIP_OPTIONS).map(opt => (
                            <DropdownMenuCheckboxItem
                              key={opt}
                              checked={(item.selectedOptions || []).includes(opt)}
                              onCheckedChange={() => toggleMultiOption(item, opt)}
                              onSelect={(e) => e.preventDefault()}
                            >
                              {opt}
                            </DropdownMenuCheckboxItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {!isEditing && item.isCompleted && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemove(item.id)} title="Kaldır" aria-label="Kaldır">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row gap-2">
                    <Input
                      autoFocus
                      type={(item.type === 'link' || item.type === 'document-link') ? 'url' : 'text'}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); saveEditor(item); }
                        if (e.key === 'Escape') cancelEditor();
                      }}
                      placeholder={
                        item.type === 'link' ? 'https://...' :
                        item.name === 'E-posta Adresi' ? 'ornek@kuruluş.org' :
                        item.name === 'Telefon Numarası' ? '+90 xxx xxx xx xx' :
                        'Değeri girin'
                      }
                      className="flex-1"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEditor(item)}>Kaydet</Button>
                      <Button size="sm" variant="outline" onClick={cancelEditor}>İptal</Button>
                    </div>
                  </div>
                )}
              </div>
            )})}
          </div>
        </CardContent>
      </Card>

      {/* Belge / Bağlantı önizleme dialog'u */}
      <Dialog open={!!previewItem} onOpenChange={open => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-4 border-b shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <DialogTitle className="truncate">{previewItem?.name}</DialogTitle>
                {previewItem?.fileName && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{previewItem.fileName}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {previewItem?.type === 'document' && previewItem?.fileUrl && (
                  <Button asChild variant="outline" size="sm" className="gap-1.5">
                    <a href={previewItem.fileUrl} download={previewItem.fileName} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">İndir</span>
                    </a>
                  </Button>
                )}
                {(previewItem?.fileUrl || previewItem?.linkUrl) && (
                  <Button asChild variant="ghost" size="sm" className="gap-1.5">
                    <a href={previewItem.fileUrl || previewItem.linkUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      <span className="hidden sm:inline">Yeni Sekme</span>
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-muted/30 relative">
            {previewItem?.type === 'document' && previewItem?.fileUrl && (
              isImageUrl(previewItem.fileUrl, previewItem.fileName) ? (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                  <img
                    src={previewItem.fileUrl}
                    alt={previewItem.name}
                    className="max-w-full max-h-full object-contain rounded shadow-lg"
                  />
                </div>
              ) : isPdfUrl(previewItem.fileUrl, previewItem.fileName) ? (
                <iframe
                  src={previewItem.fileUrl}
                  className="w-full h-full border-0"
                  title={previewItem.name}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center gap-4">
                  <FileText className="h-16 w-16 text-muted-foreground/40" />
                  <div className="space-y-1">
                    <p className="font-medium">{previewItem.fileName || 'Belge'}</p>
                    <p className="text-sm text-muted-foreground">Bu dosya türü tarayıcıda önizlenemiyor.</p>
                  </div>
                  <Button asChild>
                    <a href={previewItem.fileUrl} download={previewItem.fileName} target="_blank" rel="noopener noreferrer">
                      <Download className="mr-2 h-4 w-4" /> Dosyayı İndir
                    </a>
                  </Button>
                </div>
              )
            )}
            {previewItem?.type === 'link' && previewItem?.linkUrl && (
              <iframe
                src={previewItem.linkUrl}
                className="w-full h-full border-0"
                title={previewItem.name}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            )}
          </div>
          <DialogFooter className="p-3 border-t shrink-0">
            <Button variant="outline" onClick={() => setPreviewItem(null)} className="gap-1.5">
              <XIcon className="h-4 w-4" /> Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
