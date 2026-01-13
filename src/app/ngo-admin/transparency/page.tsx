'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Upload, LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const criteria = [
  { id: 1, name: 'Faaliyet Belgesi', points: 20, isCompleted: true, type: 'document' },
  { id: 2, name: 'Tüzük / Vakıf Senedi', points: 15, isCompleted: true, type: 'document' },
  { id: 3, name: 'Yönetim Kurulu Listesi', points: 10, isCompleted: false, type: 'document' },
  { id: 4, name: 'Yıllık Faaliyet Raporu', points: 15, isCompleted: true, type: 'link' },
  { id: 5, name: 'Finansal Tablolar', points: 15, isCompleted: false, type: 'link' },
  { id: 6, name: 'Bağımsız Denetim Raporu', points: 15, isCompleted: false, type: 'link' },
  { id: 7, name: 'Etki Raporu', points: 10, isCompleted: false, type: 'link' },
];

export default function TransparencyPage() {
  const totalPoints = criteria.reduce((sum, item) => sum + item.points, 0);
  const currentPoints = criteria.filter(item => item.isCompleted).reduce((sum, item) => sum + item.points, 0);
  const progressValue = (currentPoints / totalPoints) * 100;

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
                {!item.isCompleted && (
                  <div className="flex w-full sm:w-auto gap-2">
                    {item.type === 'document' ? (
                       <>
                        <Input id={`upload-${item.id}`} type="file" className="hidden" />
                        <Button asChild variant="outline" className="flex-1">
                            <label htmlFor={`upload-${item.id}`} className="cursor-pointer"><Upload className="mr-2 h-4 w-4" /> Belge Yükle</label>
                        </Button>
                       </>
                    ) : (
                        <div className="flex w-full items-center gap-2">
                            <LinkIcon className="h-5 w-5 text-muted-foreground" />
                            <Input placeholder="https://..." className="flex-1"/>
                            <Button size="sm">Ekle</Button>
                        </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
