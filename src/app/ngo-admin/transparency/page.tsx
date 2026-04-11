'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Upload, Link as LinkIcon, Eye, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

interface CriteriaItem {
  id: number;
  name: string;
  points: number;
  isCompleted: boolean;
  type: string;
  fileName?: string;
  linkUrl?: string;
  textValue?: string;
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

export default function TransparencyPage() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const [criteria, setCriteria] = useState<CriteriaItem[]>(defaultCriteria);
  const [uploadingId, setUploadingId] = useState<number | null>(null);

  // Load transparency data from Firestore
  const transparencyDocRef = useMemoFirebase(() => {
    if (!authUser?.uid) return null;
    return doc(firestore, 'transparency', authUser.uid);
  }, [firestore, authUser?.uid]);

  const { data: transparencyData, isLoading } = useDoc<{ criteria: CriteriaItem[] }>(transparencyDocRef);

  // Merge Firestore data with defaults when available
  const activeCriteria = transparencyData?.criteria || criteria;

  const totalPoints = activeCriteria.reduce((sum, item) => sum + item.points, 0);
  const currentPoints = activeCriteria.filter(item => item.isCompleted).reduce((sum, item) => sum + item.points, 0);
  const progressValue = (currentPoints / totalPoints) * 100;
  const hasMetThreshold = currentPoints > 35;

  const handleFileUpload = useCallback((itemId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Dosya boyutu çok büyük',
        description: 'Dosya boyutu en fazla 10MB olabilir.',
      });
      return;
    }

    setUploadingId(itemId);

    // Update criteria state with file name
    const updatedCriteria = activeCriteria.map(item =>
      item.id === itemId
        ? { ...item, isCompleted: true, fileName: file.name }
        : item
    );

    setCriteria(updatedCriteria);

    // Save to Firestore
    if (authUser?.uid) {
      try {
        setDocumentNonBlocking(
          doc(firestore, 'transparency', authUser.uid),
          { criteria: updatedCriteria, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        toast({
          title: 'Dosya yüklendi',
          description: `"${file.name}" dosyası "${activeCriteria.find(c => c.id === itemId)?.name}" kriteri için kaydedildi.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Yükleme hatası',
          description: 'Dosya kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.',
        });
      }
    }

    setUploadingId(null);
    // Reset the input so same file can be selected again
    event.target.value = '';
  }, [activeCriteria, authUser?.uid, firestore, toast]);

  const handleLinkOrTextAdd = useCallback((itemId: number) => {
    const item = activeCriteria.find(c => c.id === itemId);
    if (!item) return;

    const updatedCriteria = activeCriteria.map(c =>
      c.id === itemId ? { ...c, isCompleted: true } : c
    );

    setCriteria(updatedCriteria);

    if (authUser?.uid) {
      try {
        setDocumentNonBlocking(
          doc(firestore, 'transparency', authUser.uid),
          { criteria: updatedCriteria, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        toast({
          title: 'Kriter güncellendi',
          description: `"${item.name}" kriteri tamamlandı olarak işaretlendi.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Güncelleme hatası',
          description: 'Kriter kaydedilirken bir hata oluştu.',
        });
      }
    }
  }, [activeCriteria, authUser?.uid, firestore, toast]);

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
          <CardTitle className={cn("text-2xl font-bold", hasMetThreshold ? "text-green-600" : "text-destructive")}>
            Şeffaflık Puanı: {currentPoints} / {totalPoints}
          </CardTitle>
          <Progress
            value={progressValue}
            className={cn("mt-2", hasMetThreshold && "[&>div]:bg-green-600")}
          />
        </CardHeader>
        <CardContent>
            <Alert variant={hasMetThreshold ? "default" : "destructive"} className={cn(hasMetThreshold && 'border-green-600/50 bg-green-500/5 text-green-700 [&>svg]:text-green-600')}>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{hasMetThreshold ? 'Tebrikler!' : 'Önemli Uyarı'}</AlertTitle>
                <AlertDescription>
                     {hasMetThreshold ? 'Şeffaflık eşiğini aştınız. Profiliniz platformda güvenle listeleniyor.' : 'Şeffaflık puanı 35\'in altında olan kuruluşlar platformda listelenmez.'}
                </AlertDescription>
            </Alert>
          <div className="space-y-4 mt-6">
            {activeCriteria.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg gap-4">
                <div className="flex items-center gap-3 flex-1">
                  {item.isCompleted ? (
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.points} Puan</p>
                    {item.fileName && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>{item.fileName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 p-0">
                                <Eye className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{item.name}</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                {item.isCompleted ? (
                                    <div>
                                        <p>Bu kriter tamamlanmıştır.</p>
                                        {item.fileName && (
                                            <p className="text-sm text-muted-foreground mt-2">Yüklenen dosya: {item.fileName}</p>
                                        )}
                                    </div>
                                ) : (
                                    <p>Bu kriter henüz karşılanmamıştır. Yüklendiğinde burada görüntülenecektir.</p>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>
                  {item.isCompleted ? (
                    <>
                      {item.type === 'document' ? (
                        <Button asChild variant="secondary" size="sm" disabled={uploadingId === item.id}>
                          <label htmlFor={`upload-${item.id}`} className="cursor-pointer">
                            {uploadingId === item.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="mr-2 h-4 w-4" />
                            )}
                            Güncelle
                            <Input
                              id={`upload-${item.id}`}
                              type="file"
                              className="hidden"
                              onChange={(e) => handleFileUpload(item.id, e)}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </label>
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm" onClick={() => handleLinkOrTextAdd(item.id)}>
                          <LinkIcon className="mr-2 h-4 w-4" /> Güncelle
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      {item.type === 'document' && (
                        <Button asChild variant="secondary" size="sm" disabled={uploadingId === item.id}>
                          <label htmlFor={`upload-${item.id}`} className="cursor-pointer">
                            {uploadingId === item.id ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="mr-2 h-4 w-4" />
                            )}
                            Yükle
                            <Input
                              id={`upload-${item.id}`}
                              type="file"
                              className="hidden"
                              onChange={(e) => handleFileUpload(item.id, e)}
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </label>
                        </Button>
                      )}
                      {item.type !== 'document' && (
                        <Button variant="secondary" size="sm" onClick={() => handleLinkOrTextAdd(item.id)}>
                          <LinkIcon className="mr-2 h-4 w-4" /> Ekle
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
