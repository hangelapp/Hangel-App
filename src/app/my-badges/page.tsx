'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, Users, Heart, Download, Eye, PawPrint, Grape, HeartPulse } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { badges, certificates, user } from '@/lib/data';

const stats = [
    { icon: Star, value: user.impactScore.toLocaleString(), label: 'Etki Puanı' },
    { icon: Award, value: badges.filter(b => b.currentPoints >= b.pointsRequired).length, label: 'Rozet' },
    { icon: Users, value: `${user.stats.volunteerHours} Saat`, label: 'Gönüllülük' },
    { icon: Heart, value: `${user.stats.totalDonation.toLocaleString('tr-TR')} ₺`, label: 'Bağış' },
];


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
        
        <Tabs defaultValue="badges" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="badges">Rozetler</TabsTrigger>
                <TabsTrigger value="certificates">Sertifikalar</TabsTrigger>
            </TabsList>
            <TabsContent value="badges" className="mt-4">
                <div className="grid grid-cols-2 gap-4">
                    {badges.map(badge => (
                        <Card key={badge.name} className="p-4 flex flex-col items-center justify-center text-center">
                            <div className={`relative p-3 rounded-full mb-2 ${badge.currentPoints < badge.pointsRequired ? 'bg-muted' : 'bg-primary/10'}`}>
                                <badge.iconName className={`h-8 w-8 ${badge.currentPoints < badge.pointsRequired ? 'text-muted-foreground' : 'text-primary'}`}/>
                            </div>
                            <p className="font-semibold text-sm">{badge.name}</p>
                            <p className="text-xs text-muted-foreground">{badge.level} Seviye</p>
                            
                            {badge.currentPoints < badge.pointsRequired ? (
                                <>
                                    <Progress value={(badge.currentPoints / badge.pointsRequired) * 100} className="mt-2 h-2" />
                                    <p className="text-xs text-muted-foreground mt-1">{badge.currentPoints}/{badge.pointsRequired} Puan</p>
                                </>
                            ) : (
                                <p className="text-xs font-semibold text-green-600 mt-1">Kazanıldı!</p>
                            )}
                        </Card>
                    ))}
                </div>
            </TabsContent>
            <TabsContent value="certificates" className="mt-4">
                {certificates.length > 0 ? (
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            {certificates.map(cert => (
                                <div key={cert.id} className='p-3 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center'>
                                   <div className='flex-1 mb-3 sm:mb-0'>
                                     <p className='font-semibold'>{cert.title}</p>
                                     <p className='text-sm text-muted-foreground'>{cert.organization}</p>
                                     <p className='text-xs text-muted-foreground mt-1'>Tarih: {cert.date}</p>
                                   </div>
                                   <div className='flex gap-2 self-end sm:self-center'>
                                       <Button size="icon" variant="ghost"><Eye className="h-4 w-4"/></Button>
                                       <Button size="icon" variant="ghost"><Download className="h-4 w-4"/></Button>
                                   </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="text-center text-muted-foreground py-12">
                        <p>Henüz kazanılmış bir sertifikanız bulunmuyor.</p>
                    </div>
                )}
            </TabsContent>
        </Tabs>
    </div>
  );
}
