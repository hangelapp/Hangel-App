'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Upload, Link as LinkIcon, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

const criteria = [
  { id: 1, name: 'Faaliyet Belgesi', points: 10, isCompleted: true, type: 'document' },
  { id: 2, name: 'Tüzük / Vakıf Senedi', points: 10, isCompleted: true, type: 'document' },
  { id: 3, name: 'Yönetim Kurulu Listesi', points: 5, isCompleted: false, type: 'document' },
  { id: 4, name: 'Yıllık Faaliyet Raporu', points: 10, isCompleted: true, type: 'link' },
  { id: 5, name: 'Finansal Tablolar', points: 10, isCompleted: false, type: 'link' },
  { id: 6, name: 'Bağımsız Denetim Raporu', points: 10, isCompleted: false, type: 'link' },
  { id: 7, name: 'Etki Raporu', points: 10, isCompleted: false, type: 'link' },
  { id: 8, name: 'Web Sitesi', points: 5, isCompleted: true, type: 'link' },
  { id: 9, name: 'Posta Adresi', points: 5, isCompleted: true, type: 'text' },
  { id: 10, name: 'Ofis Adresi', points: 5, isCompleted: false, type: 'text' },
  { id: 11, name: 'E-posta Adresi', points: 5, isCompleted: true, type: 'text' },
  { id: 12, name: 'Telefon Numarası', points: 5, isCompleted: true, type: 'text' },
  { id: 13, name: 'Açık Açık Üyeliği', points: 5, isCompleted: true, type: 'link' },
  { id: 14, name: 'Afet Platformu Üyeliği', points: 5, isCompleted: false, type: 'link' },
];

export default function TransparencyPage() {
  const totalPoints = criteria.reduce((sum, item) => sum + item.points, 0);
  const currentPoints = criteria.filter(item => item.isCompleted).reduce((sum, item) => sum + item.points, 0);
  const progressValue = (currentPoints / totalPoints) * 100;
  const hasMetThreshold = currentPoints > 35;

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
            {criteria.map((item) => (
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
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.isCompleted ? (
                    <>
                      {item.type === 'document' ? (
                        <Button asChild variant="secondary" size="sm">
                          <label htmlFor={`upload-${item.id}`} className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" /> Güncelle
                            <Input id={`upload-${item.id}`} type="file" className="hidden" />
                          </label>
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm">
                          <LinkIcon className="mr-2 h-4 w-4" /> Güncelle
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      {item.type === 'document' && (
                        <Button asChild variant="secondary" size="sm">
                          <label htmlFor={`upload-${item.id}`} className="cursor-pointer">
                            <Upload className="mr-2 h-4 w-4" /> Yükle
                            <Input id={`upload-${item.id}`} type="file" className="hidden" />
                          </label>
                        </Button>
                      )}
                      {item.type !== 'document' && (
                        <Button variant="secondary" size="sm">
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
