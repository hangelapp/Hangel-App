'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Upload, LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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

  const renderInput = (item: typeof criteria[0]) => {
    if (item.isCompleted) return null;

    switch (item.type) {
        case 'document':
            return (
                <>
                    <Input id={`upload-${item.id}`} type="file" className="hidden" />
                    <Button asChild variant="outline" className="flex-1">
                        <label htmlFor={`upload-${item.id}`} className="cursor-pointer"><Upload className="mr-2 h-4 w-4" /> Belge Yükle</label>
                    </Button>
                </>
            );
        case 'link':
            return (
                 <div className="flex w-full items-center gap-2">
                    <LinkIcon className="h-5 w-5 text-muted-foreground" />
                    <Input placeholder="https://..." className="flex-1"/>
                    <Button size="sm">Ekle</Button>
                </div>
            );
        case 'text':
             return (
                 <div className="flex w-full items-center gap-2">
                    <Input placeholder={`${item.name} giriniz...`} className="flex-1"/>
                    <Button size="sm">Ekle</Button>
                </div>
            );
        default:
            return null;
    }
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
          <CardTitle>Şeffaflık Puanı: {currentPoints} / {totalPoints}</CardTitle>
          <Progress value={progressValue} className="mt-2" />
        </CardHeader>
        <CardContent>
            <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Önemli Uyarı</AlertTitle>
                <AlertDescription>
                    Şeffaflık puanı 35'in altında olan kuruluşlar platformda listelenmez.
                </AlertDescription>
            </Alert>
          <div className="space-y-4">
            {criteria.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-4 sm:mb-0">
                  {item.isCompleted ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.points} Puan</p>
                  </div>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                   {renderInput(item)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
