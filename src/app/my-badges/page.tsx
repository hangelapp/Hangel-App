
'use client'

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Award, Star, Users, Heart, Download, Eye, Share2, Milestone, Briefcase, HandCoins, Handshake, DollarSign, Filter, ArrowDownUp, Leaf, X, GraduationCap, Code, Palette, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { user, badges } from '@/lib/data';
import { Badge as BadgeType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { groupBy } from 'lodash';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const levelColors: Record<BadgeType['level'], { bg: string; text: string }> = {
  'Bronz': { bg: 'bg-amber-700/20', text: 'text-amber-800' },
  'Gümüş': { bg: 'bg-gray-400/20', text: 'text-gray-500' },
  'Altın': { bg: 'bg-yellow-500/20', text: 'text-yellow-600' },
  'Platin': { bg: 'bg-cyan-300/20', text: 'text-cyan-400' },
  'Elmas': { bg: 'bg-sky-400/20', text: 'text-sky-500' },
};

const NextBadgeGoal = () => {
    const nextBadge = {
        name: 'Gümüş Çevre Koruyucusu',
        icon: Leaf,
        progress: 80,
        current: 800,
        required: 1000,
    };
    
    return (
        <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" /> Sıradaki Hedefin
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white rounded-2xl shadow-sm">
                        <nextBadge.icon className="h-8 w-8 text-green-600"/>
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-end">
                            <p className="font-bold text-sm">{nextBadge.name}</p>
                            <p className="text-xs font-bold text-primary">%{nextBadge.progress}</p>
                        </div>
                        <Progress value={nextBadge.progress} className="h-2" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {nextBadge.current} / {nextBadge.required} Puan (Kalan: {nextBadge.required - nextBadge.current})
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const VectorBadge = ({ badge }: { badge: BadgeType }) => {
    const isEarned = badge.currentPoints >= badge.pointsRequired;
    const Icon = badge.iconName;
    const colors = levelColors[badge.level];
    const progress = Math.min((badge.currentPoints / badge.pointsRequired) * 100, 100);
    const pointsRemaining = Math.max(badge.pointsRequired - badge.currentPoints, 0);

    return (
        <Card className={cn("rounded-[2rem] border-black/5 flex flex-col items-center text-center p-6 transition-all hover:shadow-xl group", !isEarned && "opacity-60 grayscale-[0.5]")}>
            <div className={cn('relative w-20 h-20 flex items-center justify-center rounded-3xl transition-all duration-500 mb-4 group-hover:scale-110', isEarned ? colors.bg : 'bg-muted')}>
                <Icon className={cn('w-10 h-10 transition-colors', isEarned ? colors.text : 'text-muted-foreground')} />
                {isEarned && (
                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 text-white shadow-lg border-2 border-white">
                        <CheckCircle className="h-3 w-3" />
                    </div>
                )}
            </div>
            <div className="space-y-1 w-full">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{badge.level}</p>
                <h4 className="font-bold text-sm leading-tight h-10 flex items-center justify-center">{badge.name}</h4>
                <div className="pt-2">
                    <Progress value={progress} className="h-1.5" />
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mt-2">
                        <span className="text-muted-foreground">{badge.currentPoints} / {badge.pointsRequired}</span>
                        {isEarned ? (
                            <span className="text-green-600">TAMAMLANDI</span>
                        ) : (
                            <span className="text-primary">{pointsRemaining} KALDI</span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default function MyBadgesPage() {
    const { toast } = useToast();
    const groupedBadges = React.useMemo(() => {
        return groupBy(badges, 'socialArea');
    }, []);

  return (
    <div className="p-4 space-y-8 animate-in fade-in-0 max-w-5xl mx-auto pb-32">
        <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter font-headline">Rozetler ve Sertifikalar</h1>
            <p className="text-muted-foreground text-sm font-medium">Toplumsal etki yolculuğundaki tüm başarılarını burada gör.</p>
        </div>
        
        <NextBadgeGoal />

        <Tabs defaultValue="badges" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-14 bg-muted/50 p-1.5 rounded-2xl backdrop-blur-xl">
                <TabsTrigger value="impact-score" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">Etki Puanı</TabsTrigger>
                <TabsTrigger value="badges" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">Rozetler</TabsTrigger>
                <TabsTrigger value="certificates" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">Sertifikalar</TabsTrigger>
            </TabsList>

            <TabsContent value="impact-score" className="mt-8 space-y-6">
                <Card className="text-center rounded-[3rem] border-none shadow-2xl bg-black text-white p-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10 space-y-2">
                        <p className="text-xs font-black uppercase tracking-[0.3em] opacity-60">TOPLAM SOSYAL ETKİ PUANI</p>
                        <p className="text-8xl font-black tracking-tighter text-primary drop-shadow-2xl">{user.impactScore.toLocaleString('tr-TR')}</p>
                    </div>
                </Card>
            </Card>

            <TabsContent value="badges" className="mt-8 space-y-12">
                 {Object.entries(groupedBadges).map(([socialArea, areaBadges]) => (
                    <div key={socialArea} className="space-y-6">
                        <div className="px-1 flex items-center justify-between">
                            <h2 className="text-2xl font-bold tracking-tight">{socialArea} Alanı</h2>
                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">{areaBadges.length} Rozet</Badge>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                            {areaBadges.map(badge => (
                                <VectorBadge key={badge.id} badge={badge} />
                            ))}
                        </div>
                    </div>
                 ))}
            </TabsContent>

            <TabsContent value="certificates" className="mt-8 text-center py-20">
                <Milestone className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Sertifikalarınız bu bölümde listelenecektir.</p>
            </TabsContent>
        </Tabs>
    </div>
  );
}
