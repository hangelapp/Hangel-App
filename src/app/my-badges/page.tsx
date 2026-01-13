'use client'

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, Users, Heart, Download, Eye, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { badges, certificates, user } from '@/lib/data';
import { Badge as BadgeType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { groupBy } from 'lodash';

const stats = [
    { icon: Star, value: user.impactScore.toLocaleString(), label: 'Etki Puanı' },
    { icon: Award, value: badges.filter(b => b.currentPoints >= b.pointsRequired).length, label: 'Rozet' },
    { icon: Users, value: `${user.stats.volunteerHours} Saat`, label: 'Gönüllülük' },
    { icon: Heart, value: `${user.stats.totalDonation.toLocaleString('tr-TR')} ₺`, label: 'Bağış' },
];

const levelColors: Record<BadgeType['level'], { bg: string; text: string }> = {
    'Demir': { bg: 'bg-gray-400/20', text: 'text-gray-500' },
    'Bakır': { bg: 'bg-orange-500/20', text: 'text-orange-600' },
    'Bronz': { bg: 'bg-amber-700/20', text: 'text-amber-800' },
    'Çelik': { bg: 'bg-slate-500/20', text: 'text-slate-600' },
    'Gümüş': { bg: 'bg-zinc-400/20', text: 'text-zinc-500' },
    'Altın': { bg: 'bg-yellow-400/20', text: 'text-yellow-500' },
    'Platin': { bg: 'bg-cyan-200/20', text: 'text-cyan-400' },
    'Elmas': { bg: 'bg-sky-300/20', text: 'text-sky-400' },
  };

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
    const groupedBadges = React.useMemo(() => {
        return groupBy(badges, 'socialArea');
    }, []);

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
                                     <p className='font-semibold'>{cert.title}</p>
                                     <p className='text-sm text-muted-foreground'>{cert.organization}</p>
                                     <p className='text-xs text-muted-foreground mt-1'>Tarih: {cert.date}</p>
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
