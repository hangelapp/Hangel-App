
'use client'

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Award, Star, Users, Heart, Download, Eye, Share2, Milestone, Briefcase, HandCoins, Handshake, DollarSign, Filter, ArrowDownUp, Leaf, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { badges, certificates, user } from '@/lib/data';
import { Badge as BadgeType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { groupBy } from 'lodash';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

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
    { type: 'Alışveriş', icon: HandCoins, description: "Doğa Dostu Giyim alışverişi", points: 120, date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    { type: 'Gönüllülük', icon: Handshake, description: "TEMA Fidan Dikimi gönüllülüğü", points: 150, date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    { type: 'Davet', icon: Users, description: "Ayşe Yılmaz'ı davet ettin", points: 100, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'Rozet', icon: Award, description: "'Bronz Çevre Koruyucusu' rozeti", points: 250, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'Alışveriş', icon: DollarSign, description: "Lezzet Köyü alışverişi", points: 45, date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'Alışveriş', icon: HandCoins, description: "Kitap Kurdu alışverişi", points: 80, date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'Gönüllülük', icon: Handshake, description: "Barınak ziyareti gönüllülüğü", points: 75, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'Davet', icon: Users, description: "Ahmet Demir'i davet ettin", points: 100, date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'Alışveriş', icon: DollarSign, description: "Tekno Market alışverişi", points: 25, date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'Rozet', icon: Award, description: "'Bronz Hayvan Dostu' rozeti", points: 250, date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'Alışveriş', icon: HandCoins, description: "Sürdürülebilir Moda alışverişi", points: 95, date: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'Gönüllülük', icon: Handshake, description: "Sahil temizliği etkinliği", points: 120, date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString() },
];

const transactionTypes = ['Alışveriş', 'Gönüllülük', 'Davet', 'Rozet'];

const NextBadgeGoal = () => {
    const [isVisible, setIsVisible] = useState(true);
    const nextBadge = {
        name: 'Gümüş Çevre Koruyucusu',
        icon: Leaf,
        progress: 80,
        current: 800,
        required: 1000,
    };
    
    if (!isVisible) return null;

    return (
        <Card className="relative bg-transparent shadow-none">
            <CardHeader>
                <CardTitle className="text-lg">Sıradaki Rozet Hedefi</CardTitle>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setIsVisible(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <Link href="/my-badges" className="block p-3 rounded-lg border hover:bg-accent">
                    <div className="flex items-center gap-4">
                        <nextBadge.icon className="h-8 w-8 text-green-600"/>
                        <div className="flex-1">
                            <p className="font-semibold text-sm">{nextBadge.name}</p>
                            <Progress value={nextBadge.progress} className="mt-1 h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{nextBadge.current} / {nextBadge.required} Puan</p>
                        </div>
                    </div>
                </Link>
            </CardContent>
        </Card>
    );
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
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [filters, setFilters] = useState<string[]>([]);

    const groupedBadges = React.useMemo(() => {
        return groupBy(badges, 'socialArea');
    }, []);

    const sortedAndFilteredTransactions = useMemo(() => {
        let transactions = [...allPointTransactions];

        if (filters.length > 0) {
            transactions = transactions.filter(tx => filters.includes(tx.type));
        }

        transactions.sort((a, b) => {
            let valA, valB;
            if (sortConfig.key === 'date') {
                valA = parseISO(a.date).getTime();
                valB = parseISO(b.date).getTime();
            } else { // points
                valA = a.points;
                valB = b.points;
            }

            if (sortConfig.direction === 'desc') {
                return valB - valA;
            } else {
                return valA - valA;
            }
        });

        return transactions;
    }, [sortConfig, filters]);

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
        <h1 className="text-2xl font-bold font-headline">Rozetler ve Sertifikalar</h1>
        
        <NextBadgeGoal />

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
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Filter className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>İşlem Türü</DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {transactionTypes.map(type => (
                                            <DropdownMenuCheckboxItem
                                                key={type}
                                                checked={filters.includes(type)}
                                                onCheckedChange={(checked) => {
                                                    setFilters(prev => checked ? [...prev, type] : prev.filter(t => t !== type));
                                                }}
                                            >
                                                {type}
                                            </DropdownMenuCheckboxItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <ArrowDownUp className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'date', direction: 'desc' })}>Tarihe Göre (En Yeni)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'date', direction: 'asc' })}>Tarihe Göre (En Eski)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'points', direction: 'desc' })}>Puana Göre (En Yüksek)</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'points', direction: 'asc' })}>Puana Göre (En Düşük)</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {sortedAndFilteredTransactions.map((tx, index) => {
                            const Icon = tx.icon;
                            return (
                            <div key={index} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-3">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p>{tx.description}</p>
                                        <p className="text-xs text-muted-foreground">{format(parseISO(tx.date), "dd MMMM yyyy, HH:mm", { locale: tr })}</p>
                                    </div>
                                </div>
                                <p className="font-bold text-green-600">+{tx.points} Puan</p>
                            </div>
                        )})}
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
