import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const applications = [
    { id: '1', title: 'Afet Bölgesi Yardım Dağıtımı', org: 'Ahbap Derneği', status: 'Onaylandı', statusVariant: 'default' as 'default' | 'secondary' | 'destructive' | 'outline' },
    { id: '2', title: 'Fransızca Tercüman Gönüllüsü', org: 'Sınır Tanımayan Doktorlar', status: 'Beklemede', statusVariant: 'secondary' as 'default' | 'secondary' | 'destructive' | 'outline'},
    { id: '3', title: 'Kodlama Eğitmeni', org: 'Teknasyon', status: 'Reddedildi', statusVariant: 'destructive' as 'default' | 'secondary' | 'destructive' | 'outline'},
];

export default function MyApplicationsPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold font-headline">Başvurularım</h1>
      <p className="text-muted-foreground">Gönüllülük ve diğer başvurularınızın durumunu buradan takip edin.</p>
      
      <div className="space-y-4">
        {applications.map(app => (
          <Card key={app.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{app.title}</CardTitle>
                  <CardDescription>{app.org}</CardDescription>
                </div>
                <Badge variant={app.statusVariant}>{app.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
                <Button variant="outline" size="sm">Detayları Gör</Button>
            </CardContent>
          </Card>
        ))}
      </div>
       <div className="text-center text-muted-foreground py-12">
        <p>Başka başvuru bulunmuyor.</p>
      </div>
    </div>
  );
}
