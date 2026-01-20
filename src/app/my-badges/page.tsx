'use client'

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Award, Star, Users, Heart, Download, Eye, Share2, Milestone, Briefcase, HandCoins, Handshake, DollarSign, Filter, ArrowDownUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { badges, certificates, user } from '@/lib/data';
import { Badge as BadgeType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { groupBy } from 'lodash';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const stats = [
    { icon: Star, value: user.impactScore.toLocaleString('tr-TR'), label: 'Etki Puanı' },
    { icon: Award, value: badges.filter(b => b.currentPoints >= b.pointsRequired).length, label: 'Rozet' },
    { icon: Users, value: `${user.stats.volunteerHours} Saat`, label: 'Gönüllülük' },
    { icon: Heart, value: `${user.stats.totalDonation.toLocaleString('tr-TR')} ₺`, label: 'Bağış' },
    { icon: Milestone, value: certificates.length, label: 'Sertifika' },
    { icon: Briefcase, value: user.stats.completedProjects, label: 'Proje' }
];

const levelColors: Record<BadgeType['level'], { bg: string; text: string }> = {
  'Demir': { bg: 'bg-gray-500/20', text: 'text-gray-600' },
  'Bakır': { bg: 'bg-orange-600/20', text: 'text-orange-700' },
  'Bronz': { bg: 'bg-amber-700/20', text: 'text-amber-800' },
  'Çelik': { bg: 'bg-slate-600/20', text: 'text-slate-700' },
  'Gümüş': { bg: 'bg-gray-400/20', text: 'text-gray-500' },
  'Altın': { bg: 'bg-yellow-500/20', text: 'text-yellow-600' },
  'Platin': { bg: 'bg-cyan-300/20', text: 'text-cyan-400' },
  'Elmas': { bg: 'bg-sky-400/20', text: 'text-sky-500' },
};

const allPointTransactions = [
    { icon: HandCoins, description: "Doğa Dostu Giyim alışverişi", points: 120, time: "2 saat önce" },
    { icon: Handshake, description: "TEMA Fidan Dikimi gönüllülüğü", points: 150, time: "1 gün önce" },
    { icon: Users, description: "Ayşe Yılmaz'ı davet ettin", points: 100, time: "3 gün önce" },
    { icon: Award, description: "'Bronz Çevre Koruyucusu' rozeti", points: 250, time: "3 gün önce" },
    { icon: DollarSign, description: "Lezzet Köyü alışverişi", points: 45, time: "5 gün önce" },
    { icon: HandCoins, description: "Kitap Kurdu alışverişi", points: 80, time: "1 hafta önce" },
    { icon: Handshake, description: "Barınak ziyareti gönüllülüğü", points: 75, time: "2 hafta önce" },
    { icon: Users, description: "Ahmet Demir'i davet ettin", points: 100, time: "2 hafta önce" },
    { icon: DollarSign, description: "Tekno Market alışverişi", points: 25, time: "3 hafta önce" },
    { icon: Award, description: "'Bronz Hayvan Dostu' rozeti", points: 250, time: "1 ay önce" },
    { icon: HandCoins, description: "Sürdürülebilir Moda alışverişi", points: 95, time: "1 ay önce" },
    { icon: Handshake, description: "Sahil temizliği etkinliği", points: 120, time: "1 ay önce" },
];


const VectorBadge = ({ badge }: { badge: BadgeType }) => {
    const isEarned = badge.currentPoints >= badge.pointsRequired;
    const Icon = badge.iconName;
    const colors = levelColors[badge.level];

    return (
        <div className="flex flex-col items-center justify-center text-center p-2">
            <div
                className={cn(
                    'relative w-20 h-20 flex items-center justify-center rounded-full transition-colors',
                    isEarned ? colors.bg : 'bg-muted'
                )}
            >
                <Icon
                    className={cn(
                        'w-10 h-10 transition-colors',
                        isEarned ? colors.text : 'text-muted-foreground'
                    )}
                />
            </div>
            <p className="mt-2 text-xs font-semibold">{badge.level}</p>
            {isEarned ? (
                <p className="text-xs font-semibold text-green-600 mt-1">Kazanıldı!</p>
            ) : (
                <p className="text-xs text-muted-foreground mt-1">
                    {badge.currentPoints}/{badge.pointsRequired} Puan
                </p>
            )}
        </div>
    );
};

export default function MyBadgesPage() {
    const [visibleTxCount, setVisibleTxCount] = useState(5);

    const groupedBadges = React.useMemo(() => {
        return groupBy(badges, 'socialArea');
    }, []);

    const recentPointTransactions = allPointTransactions.slice(0, visibleTxCount);

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
        <h1 className="text-2xl font-bold font-headline">Puan, Rozet ve Sertifikalar</h1>
        
        <Tabs defaultValue="impact-score" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="impact-score">Sosyal Etki Puanı</TabsTrigger>
                <TabsTrigger value="badges">Rozetler</TabsTrigger>
                <TabsTrigger value="certificates">Sertifikalar</TabsTrigger>
            </TabsList>
            <TabsContent value="impact-score" className="mt-6 space-y-6">
                <Card className="text-center">
                    <CardHeader>
                        <CardTitle>Toplam Sosyal Etki Puanın</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-6xl font-bold text-primary">{user.impactScore.toLocaleString('tr-TR')}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Etki Puanı Özeti</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4 text-center">
                        {stats.map(stat => (
                            <div key={stat.label}>
                                <stat.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                                <p className="text-lg font-bold">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <CardTitle>Son Puan İşlemleri</CardTitle>
                            <div className="flex items-center">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Filter className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ArrowDownUp className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {recentPointTransactions.map((tx, index) => {
                            const Icon = tx.icon;
                            return (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p>{tx.description}</p>
                                        <p className="text-xs text-muted-foreground">{tx.time}</p>
                                    </div>
                                </div>
                                <p className="font-bold text-green-600">+{tx.points} Puan</p>
                            </div>
                        )})}
                    </CardContent>
                    <CardFooter>
                         {visibleTxCount < allPointTransactions.length && (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setVisibleTxCount(prev => prev + 5)}
                            >
                                Daha Eski
                            </Button>
                        )}
                    </CardFooter>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Nasıl Puan Kazanırım?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                            <li>Anlaşmalı markalardan yaptığın her alışverişle.</li>
                            <li>Gönüllülük faaliyetlerini tamamlayarak.</li>
                            <li>Platforma yeni arkadaşlarını davet ederek.</li>
                            <li>Rozetler kazanarak ve seviye atlayarak.</li>
                        </ul>
                         <Accordion type="single" collapsible className="w-full mt-2">
                            <AccordionItem value="puan-cetveli" className="border-t">
                                <AccordionTrigger className="text-sm">Puan Cetvelini Gör</AccordionTrigger>
                                <AccordionContent>
                                    <div className="space-y-3 text-sm pt-2">
                                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                            <div>
                                                <p className="font-semibold">Alışverişle Bağış</p>
                                                <p className="text-xs text-muted-foreground">Her 1₺ bağış için <strong>1 Puan</strong></p>
                                            </div>
                                            <p className="font-bold text-base text-primary">{(user.stats.totalDonation).toLocaleString('tr-TR')} Puan</p>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                            <div>
                                                <p className="font-semibold">Gönüllülük</p>
                                                <p className="text-xs text-muted-foreground">Her 1 saat için <strong>10 Puan</strong></p>
                                            </div>
                                            <p className="font-bold text-base text-primary">{(user.stats.volunteerHours * 10).toLocaleString('tr-TR')} Puan</p>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                            <div>
                                                <p className="font-semibold">Arkadaş Daveti</p>
                                                <p className="text-xs text-muted-foreground">Her başarılı davet için <strong>100 Puan</strong></p>
                                            </div>
                                            <p className="font-bold text-base text-primary">{(5 * 100).toLocaleString('tr-TR')} Puan</p>
                                        </div>
                                        <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                                            <div>
                                                <p className="font-semibold">Rozet Kazanımı</p>
                                                <p className="text-xs text-muted-foreground">Her rozet için <strong>250 Puan</strong></p>
                                            </div>
                                            <p className="font-bold text-base text-primary">{(badges.filter(b => b.currentPoints >= b.pointsRequired).length * 250).toLocaleString('tr-TR')} Puan</p>
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="badges" className="mt-4 space-y-6">
                 {Object.entries(groupedBadges).map(([socialArea, areaBadges]) => (
                    <div key={socialArea}>
                        <h2 className="text-lg font-semibold mb-2">{areaBadges[0].name}</h2>
                        <Card>
                            <CardContent className="p-2 grid grid-cols-4 gap-1">
                                {areaBadges.map(badge => (
                                    <VectorBadge key={badge.id} badge={badge} />
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                 ))}
            </TabsContent>
            <TabsContent value="certificates" className="mt-4">
                {certificates.length > 0 ? (
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            {certificates.map(cert => (
                                <div key={cert.id} className='relative p-4 rounded-lg border'>
                                   <div className='pr-24'>
                                     <p className='text-sm text-muted-foreground'>{cert.organization} - {cert.date}</p>
                                     <p className='font-semibold mt-1'>{cert.title}</p>
                                   </div>
                                   <div className='absolute top-2 right-2 flex gap-1 bg-background/50 backdrop-blur-sm rounded-md p-1'>
                                       <Button size="icon" variant="ghost" className="h-7 w-7"><Eye className="h-4 w-4"/></Button>
                                       <Button size="icon" variant="ghost" className="h-7 w-7"><Download className="h-4 w-4"/></Button>
                                       <Button size="icon" variant="ghost" className="h-7 w-7"><Share2 className="h-4 w-4"/></Button>
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
