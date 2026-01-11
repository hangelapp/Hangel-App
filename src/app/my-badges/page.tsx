import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, Users, Heart, Leaf, Dog, Baby, ShieldCheck, Download, Eye } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

const stats = [
    { icon: Star, value: '15,750', label: 'Etki Puanı' },
    { icon: Award, value: '4', label: 'Rozet' },
    { icon: Users, value: '48 Saat', label: 'Gönüllülük' },
    { icon: Heart, value: '1,250 ₺', label: 'Bağış' },
];

const badges = [
  { icon: Leaf, name: 'Doğa Koruyucu', level: 'Altın', progress: 100 },
  { icon: Dog, name: 'Hayvan Dostu', level: 'Gümüş', progress: 100 },
  { icon: Baby, name: 'Çocuk Gelişimi', level: 'Bronz', progress: 100 },
  { icon: ShieldCheck, name: 'Toplum Lideri', level: 'Platin', progress: 100 },
  { icon: Heart, name: 'Bağış Kahramanı', level: 'Çelik', progress: 75 },
  { icon: Star, name: 'Etki Lideri', level: 'Demir', progress: 40 },
]

const certificates = [
    {id: 1, title: 'Afet Bölgesi Yardım Dağıtımı Katılım Sertifikası', org: 'Ahbap Derneği'}
]

export default function MyBadgesPage() {
  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
        <h1 className="text-2xl font-bold font-headline">Rozetler ve Sertifikalar</h1>

        <Card>
            <CardContent className="p-4 grid grid-cols-2 gap-4 text-center">
                {stats.map(stat => (
                    <div key={stat.label}>
                        <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                        <p className="text-lg font-bold">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                ))}
            </CardContent>
        </Card>

        <div>
            <h2 className="text-lg font-semibold mb-2">Tüm Rozetler</h2>
            <div className="grid grid-cols-2 gap-4">
                {badges.map(badge => (
                    <Card key={badge.name} className="p-4 flex flex-col items-center justify-center text-center">
                        <div className={`p-3 rounded-full mb-2 ${badge.progress < 100 ? 'bg-muted' : 'bg-primary/10'}`}>
                            <badge.icon className={`h-8 w-8 ${badge.progress < 100 ? 'text-muted-foreground' : 'text-primary'}`}/>
                        </div>
                        <p className="font-semibold text-sm">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.level} Seviye</p>
                        {badge.progress < 100 && <Progress value={badge.progress} className="mt-2 h-2" />}
                    </Card>
                ))}
            </div>
        </div>

        <div>
            <h2 className="text-lg font-semibold mb-2">Sertifikalarım</h2>
            <Card>
                <CardContent className="p-4 space-y-4">
                    {certificates.map(cert => (
                        <div key={cert.id} className='p-3 rounded-lg border flex justify-between items-center'>
                           <div>
                             <p className='font-semibold'>{cert.title}</p>
                             <p className='text-sm text-muted-foreground'>{cert.org}</p>
                           </div>
                           <div className='flex gap-2'>
                               <Button size="icon" variant="ghost"><Eye className="h-4 w-4"/></Button>
                               <Button size="icon" variant="ghost"><Download className="h-4 w-4"/></Button>
                           </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
