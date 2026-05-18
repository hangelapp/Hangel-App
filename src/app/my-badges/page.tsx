'use client'

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Milestone, CheckCircle, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { badges } from '@/lib/data';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Badge as BadgeType, BadgeLevel } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { groupBy } from 'lodash';
import { Progress } from '@/components/ui/progress';

const levelColors: Record<BadgeLevel, { bg: string; text: string }> = {
  'Bakır':  { bg: 'bg-orange-700/15',  text: 'text-orange-800' },
  'Bronz':  { bg: 'bg-amber-700/20',   text: 'text-amber-800' },
  'Gümüş':  { bg: 'bg-gray-400/20',    text: 'text-gray-500' },
  'Altın':  { bg: 'bg-yellow-500/20',  text: 'text-yellow-600' },
  'Platin': { bg: 'bg-cyan-300/20',    text: 'text-cyan-500' },
};

const LEVEL_ORDER: BadgeLevel[] = ['Bakır', 'Bronz', 'Gümüş', 'Altın', 'Platin'];

const NextBadgeGoal = ({ nextBadge }: { nextBadge: (BadgeType & { current: number; progress: number }) | null }) => {
    if (!nextBadge) {
        return (
            <Card className="bg-primary/5 border-primary/10">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" /> Sıradaki Hedefin
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Henüz puan kazanmadın. Bağış, gönüllülük ve davet ile rozetleri açmaya başlayabilirsin.
                    </p>
                </CardContent>
            </Card>
        );
    }
    const Icon = nextBadge.iconName;
    const remaining = Math.max(nextBadge.pointsRequired - nextBadge.current, 0);
    return (
        <Card className="bg-primary/5 border-primary/10">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" /> Sıradaki Hedefin
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-4">
                    <div className={cn('p-3 rounded-2xl shadow-sm bg-white')}>
                        <Icon className={cn('h-8 w-8', levelColors[nextBadge.level].text)} />
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-end">
                            <p className="font-bold text-sm">{nextBadge.name}</p>
                            <p className="text-xs font-bold text-primary">%{Math.round(nextBadge.progress)}</p>
                        </div>
                        <Progress value={nextBadge.progress} className="h-2" />
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            {nextBadge.current.toLocaleString('tr-TR')} / {nextBadge.pointsRequired.toLocaleString('tr-TR')} Puan (Kalan: {remaining.toLocaleString('tr-TR')})
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
        <Card
            className={cn(
                "rounded-[2rem] border-black/5 flex flex-col items-center text-center p-6 transition-all hover:shadow-xl group",
                // PRD görsel kuralı: hak kazanılmayan rozetler renksiz/gri,
                // hak kazanıldığında ikon renkli görünür.
                !isEarned && "grayscale opacity-50",
            )}
        >
            <div className={cn('relative w-20 h-20 flex items-center justify-center rounded-3xl transition-all duration-500 mb-4 group-hover:scale-110', isEarned ? colors.bg : 'bg-muted')}>
                <Icon className={cn('w-10 h-10 transition-colors', isEarned ? colors.text : 'text-muted-foreground/60')} />
                {isEarned ? (
                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1.5 text-white shadow-lg border-2 border-white">
                        <CheckCircle className="h-3 w-3" />
                    </div>
                ) : (
                    <div className="absolute -top-2 -right-2 bg-muted-foreground/30 rounded-full p-1.5 text-white shadow-md border-2 border-white">
                        <Lock className="h-3 w-3" />
                    </div>
                )}
            </div>
            <div className="space-y-1 w-full">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{badge.level}</p>
                <h4 className="font-bold text-sm leading-tight h-10 flex items-center justify-center">{badge.name}</h4>
                <div className="pt-2">
                    <Progress value={progress} className="h-1.5" />
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest mt-2">
                        <span className="text-muted-foreground">
                            {badge.currentPoints.toLocaleString('tr-TR')} / {badge.pointsRequired.toLocaleString('tr-TR')}
                        </span>
                        {isEarned ? (
                            <span className="text-green-600">TAMAMLANDI</span>
                        ) : (
                            <span className="text-primary">{pointsRemaining.toLocaleString('tr-TR')} KALDI</span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default function MyBadgesPage() {
    const { user: authUser } = useUser();
    const db = useFirestore();
    const userDocRef = useMemoFirebase(
        () => authUser ? doc(db, 'users', authUser.uid) : null,
        [db, authUser?.uid],
    );
    const { data: userData } = useDoc(userDocRef);

    // Top-level veya stats.* — invite akışı top-level yazıyor, signup stats altına yazıyor.
    type UserDataLike = { impactScore?: number; stats?: { impactScore?: number }; areaPoints?: Record<string, number> };
    const impactScore: number = Math.max(
        Number((userData as UserDataLike | undefined)?.impactScore) || 0,
        Number((userData as UserDataLike | undefined)?.stats?.impactScore) || 0,
    );

    // Sosyal alan bazında puan haritası: userData.areaPoints[socialArea] = number
    // Henüz tanımlı değilse: 0 (rozetler kilitli görünür)
    const areaPoints = useMemo<Record<string, number>>(
        () => (userData as UserDataLike | undefined)?.areaPoints || {},
        [userData]
    );

    // Rozetlere areaPoints'ten currentPoints aktar
    const enrichedBadges: BadgeType[] = useMemo(() => {
        return badges.map(b => ({
            ...b,
            currentPoints: Number(areaPoints[b.socialArea]) || 0,
        }));
    }, [areaPoints]);

    // Sıradaki hedef: en yakın kazanılmamış rozet (kalan puan en az olan)
    const nextBadge = useMemo(() => {
        const candidates = enrichedBadges
            .filter(b => b.currentPoints < b.pointsRequired)
            .map(b => ({
                ...b,
                current: b.currentPoints,
                progress: Math.min((b.currentPoints / b.pointsRequired) * 100, 100),
                remaining: b.pointsRequired - b.currentPoints,
            }))
            .sort((a, b) => a.remaining - b.remaining);
        return candidates[0] || null;
    }, [enrichedBadges]);

    // Sosyal alan başlığı altında, seviye sırası ile
    const groupedBadges = useMemo(() => {
        const grouped = groupBy(enrichedBadges, 'socialArea');
        Object.keys(grouped).forEach(area => {
            grouped[area].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
        });
        return grouped;
    }, [enrichedBadges]);

    const earnedCount = enrichedBadges.filter(b => b.currentPoints >= b.pointsRequired).length;

    return (
        <div className="p-4 space-y-8 animate-in fade-in-0 max-w-5xl mx-auto pb-32">
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter font-headline">Rozetler ve Sertifikalar</h1>
                <p className="text-muted-foreground text-sm font-medium">Toplumsal etki yolculuğundaki tüm başarılarını burada gör.</p>
            </div>

            <NextBadgeGoal nextBadge={nextBadge} />

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
                            <p className="text-8xl font-black tracking-tighter text-primary drop-shadow-2xl">{impactScore.toLocaleString('tr-TR')}</p>
                            <p className="text-xs font-black uppercase tracking-widest opacity-60 pt-4">
                                {earnedCount} / {enrichedBadges.length} ROZET KAZANILDI
                            </p>
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="badges" className="mt-8 space-y-12">
                    {Object.entries(groupedBadges).map(([socialArea, areaBadges]) => {
                        const areaCurrent = Number(areaPoints[socialArea]) || 0;
                        return (
                            <div key={socialArea} className="space-y-6">
                                <div className="px-1 flex items-center justify-between">
                                    <div>
                                        <h2 className="text-2xl font-bold tracking-tight">{socialArea} Alanı</h2>
                                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                                            Bu alandaki puanın: {areaCurrent.toLocaleString('tr-TR')}
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest">
                                        {areaBadges.filter(b => b.currentPoints >= b.pointsRequired).length} / {areaBadges.length} Rozet
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                    {areaBadges.map(badge => (
                                        <VectorBadge key={badge.id} badge={badge} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </TabsContent>

                <TabsContent value="certificates" className="mt-8 text-center py-20">
                    <Milestone className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
                    <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Sertifikalarınız bu bölümde listelenecektir.</p>
                </TabsContent>
            </Tabs>
        </div>
    );
}
