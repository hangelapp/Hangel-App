
'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Search, MessageSquare, Radio, Inbox, ArrowDownUp } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, orderBy, query } from 'firebase/firestore';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { COLLECTIONS } from '@/firebase/collections';

interface SurveyUser {
    id: string;
    name?: string;
    displayName?: string;
    fullName?: string;
    username?: string;
    avatarUrl?: string;
    photoURL?: string;
    profilePhoto?: string;
    personalInfo?: { email?: string; phone?: string };
    email?: string;
}

const UserCell = ({ userId, userMap }: { userId: string; userMap: Map<string, SurveyUser> }) => {
    const user = userMap.get(userId);
    // Önce doğrudan eşleşme, yoksa email/phone üzerinden ikinci tur arama
    let resolvedUser: SurveyUser | undefined = user;
    if (!resolvedUser && userId) {
        // userId bazen e-posta gibi gelebilir
        for (const u of userMap.values()) {
            if (u.email === userId || u.personalInfo?.email === userId || u.personalInfo?.phone === userId) {
                resolvedUser = u;
                break;
            }
        }
    }
    // PDF #1: "bilinmeyen kullanıcı olmamalı" — eğer ad-soyad çözülemiyorsa
    // (silinmiş hesap, eksik profil) "Anonim Kullanıcı" göster, hash/UID gösterme.
    const name = resolvedUser?.name
        || resolvedUser?.displayName
        || resolvedUser?.fullName
        || resolvedUser?.username
        || resolvedUser?.personalInfo?.email
        || resolvedUser?.email
        || 'Anonim Kullanıcı';
    const avatar = resolvedUser?.avatarUrl || resolvedUser?.photoURL || resolvedUser?.profilePhoto;
    const initial = (name || 'U').charAt(0).toUpperCase();
    return (
        <div className="flex items-center gap-2 min-w-0" title={userId}>
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback className="text-xs font-bold">{initial}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium break-words">{name}</span>
        </div>
    );
};

interface SurveyDoc {
    id: string;
    type: string;
    source: string;
    detail?: string;
    userId: string;
    createdAt: string;
}

interface RatingDoc {
    id: string;
    rating: number;
    comment?: string;
    userId: string;
    createdAt: string;
}

const SOURCE_COLORS: Record<string, string> = {
    'Sosyal Medya': 'bg-blue-100 text-blue-700',
    'Reklamlar': 'bg-purple-100 text-purple-700',
    'Sivil Toplum Kuruluşu': 'bg-green-100 text-green-700',
    'Arkadaşım': 'bg-orange-100 text-orange-700',
};

const StarDisplay = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
            />
        ))}
    </div>
);

const formatDate = (iso: string) => {
    if (!iso) return '-';
    try {
        return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
    } catch {
        return iso;
    }
};

export default function SurveysPage() {
    const firestore = useFirestore();
    const [surveySearch, setSurveySearch] = useState('');
    const [ratingSearch, setRatingSearch] = useState('');
    const [ratingSort, setRatingSort] = useState<'desc' | 'asc'>('desc');

    const surveysQuery = useMemoFirebase(() =>
        query(collection(firestore, COLLECTIONS.surveys), orderBy('createdAt', 'desc')),
        [firestore]
    );
    const ratingsQuery = useMemoFirebase(() =>
        query(collection(firestore, COLLECTIONS.ratings), orderBy('createdAt', 'desc')),
        [firestore]
    );

    const { data: surveysData, isLoading: surveysLoading } = useCollection<SurveyDoc>(surveysQuery);
    const { data: ratingsData, isLoading: ratingsLoading } = useCollection<RatingDoc>(ratingsQuery);

    const usersQuery = useMemoFirebase(() => collection(firestore, COLLECTIONS.users), [firestore]);
    const { data: usersData } = useCollection<SurveyUser>(usersQuery);
    const userMap = useMemo(() => {
        const m = new Map<string, SurveyUser>();
        (usersData || []).forEach(u => m.set(u.id, u));
        return m;
    }, [usersData]);

    const userMatches = (uid: string | undefined, q: string) => {
        if (!uid) return false;
        const u = userMap.get(uid);
        const hay = `${uid} ${u?.name || ''} ${u?.displayName || ''}`.toLowerCase();
        return hay.includes(q);
    };

    const filteredSurveys = useMemo(() => {
        if (!surveysData) return [];
        if (!surveySearch.trim()) return surveysData;
        const q = surveySearch.toLowerCase();
        return surveysData.filter(s =>
            s.source?.toLowerCase().includes(q) ||
            s.detail?.toLowerCase().includes(q) ||
            userMatches(s.userId, q)
        );
    }, [surveysData, surveySearch, userMap]); // eslint-disable-line react-hooks/exhaustive-deps

    const filteredRatings = useMemo(() => {
        if (!ratingsData) return [];
        let list = [...ratingsData];

        if (ratingSearch.trim()) {
            const q = ratingSearch.toLowerCase();
            list = list.filter(r =>
                r.comment?.toLowerCase().includes(q) ||
                userMatches(r.userId, q)
            );
        }

        list.sort((a, b) => {
            if (ratingSort === 'desc') return (b.rating || 0) - (a.rating || 0);
            return (a.rating || 0) - (b.rating || 0);
        });

        return list;
    }, [ratingsData, ratingSearch, ratingSort, userMap]); // eslint-disable-line react-hooks/exhaustive-deps

    const avgRating = useMemo(() => {
        if (!ratingsData || ratingsData.length === 0) return 0;
        const sum = ratingsData.reduce((acc, r) => acc + (r.rating || 0), 0);
        return sum / ratingsData.length;
    }, [ratingsData]);

    const sourceDistribution = useMemo(() => {
        if (!surveysData) return [];
        const counts: Record<string, number> = {};
        surveysData.forEach(s => {
            counts[s.source] = (counts[s.source] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([source, count]) => ({ source, count, pct: Math.round((count / surveysData.length) * 100) }))
            .sort((a, b) => b.count - a.count);
    }, [surveysData]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Anket & Değerlendirmeler</h1>
                <p className="text-muted-foreground text-sm">Kullanıcıların doldurduğu keşif anketleri ve uygulama değerlendirmeleri.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-5 pb-4 flex flex-col items-center text-center">
                        <Radio className="h-7 w-7 text-blue-500 mb-2" />
                        <p className="text-2xl font-bold">{surveysData?.length ?? '...'}</p>
                        <p className="text-xs text-muted-foreground mt-1">Keşif Anketi</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4 flex flex-col items-center text-center">
                        <Star className="h-7 w-7 text-yellow-500 mb-2" />
                        <p className="text-2xl font-bold">{ratingsData?.length ?? '...'}</p>
                        <p className="text-xs text-muted-foreground mt-1">Değerlendirme</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4 flex flex-col items-center text-center">
                        <Star className="h-7 w-7 text-yellow-400 mb-2" />
                        <p className="text-2xl font-bold">{ratingsLoading ? '...' : avgRating.toFixed(1)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Ortalama Puan</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-5 pb-4 flex flex-col items-center text-center">
                        <MessageSquare className="h-7 w-7 text-green-500 mb-2" />
                        <p className="text-2xl font-bold">
                            {ratingsLoading ? '...' : (ratingsData?.filter(r => r.comment?.trim()).length ?? 0)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Yazılı Yorum</p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="surveys">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="surveys">Keşif Anketleri</TabsTrigger>
                    <TabsTrigger value="ratings">Değerlendirmeler</TabsTrigger>
                </TabsList>

                {/* Keşif Anketleri */}
                <TabsContent value="surveys" className="space-y-4 mt-4">
                    {/* Source distribution */}
                    {sourceDistribution.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Kaynak Dağılımı</CardTitle>
                                <CardDescription>Kullanıcılar hangel'i nereden duydu?</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {sourceDistribution.map(({ source, count, pct }) => (
                                        <div key={source} className="rounded-xl border p-3 space-y-1">
                                            <Badge className={SOURCE_COLORS[source] || 'bg-gray-100 text-gray-700'} variant="outline">
                                                {source}
                                            </Badge>
                                            <p className="text-xl font-bold">{count}</p>
                                            <p className="text-xs text-muted-foreground">%{pct} oran</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-3">
                                <CardTitle className="text-base">Tüm Anket Yanıtları</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Ara..."
                                        className="pl-9 h-8 text-sm"
                                        value={surveySearch}
                                        onChange={(e) => setSurveySearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {surveysLoading ? (
                                <div className="py-10 text-center text-muted-foreground text-sm">Yükleniyor...</div>
                            ) : filteredSurveys.length === 0 ? (
                                <div className="py-10 flex flex-col items-center text-center gap-2">
                                    <Inbox className="h-10 w-10 text-muted-foreground/30" />
                                    <p className="text-muted-foreground text-sm">Henüz anket yanıtı yok.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Kullanıcı</TableHead>
                                                <TableHead>Kaynak</TableHead>
                                                <TableHead>Detay</TableHead>
                                                <TableHead>Tarih</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredSurveys.map((s) => (
                                                <TableRow key={s.id}>
                                                    <TableCell className="max-w-[200px]">
                                                        <UserCell userId={s.userId} userMap={userMap} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={SOURCE_COLORS[s.source] || 'bg-gray-100 text-gray-700'} variant="outline">
                                                            {s.source}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm max-w-[200px] truncate">
                                                        {s.detail || <span className="text-muted-foreground">-</span>}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                        {formatDate(s.createdAt)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Değerlendirmeler */}
                <TabsContent value="ratings" className="space-y-4 mt-4">
                    {/* Star distribution */}
                    {ratingsData && ratingsData.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Puan Dağılımı</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = ratingsData.filter(r => r.rating === star).length;
                                        const pct = ratingsData.length > 0 ? (count / ratingsData.length) * 100 : 0;
                                        return (
                                            <div key={star} className="flex items-center gap-3">
                                                <div className="flex items-center gap-1 w-24">
                                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                                    <span className="text-sm font-medium">{star}</span>
                                                </div>
                                                <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-yellow-400 h-full rounded-full transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-3">
                                <CardTitle className="text-base">Tüm Değerlendirmeler</CardTitle>
                                <div className="flex gap-2">
                                    <div className="relative w-52">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Yorum ara..."
                                            className="pl-9 h-8 text-sm"
                                            value={ratingSearch}
                                            onChange={(e) => setRatingSearch(e.target.value)}
                                        />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline" size="sm" className="h-8 gap-1">
                                                <ArrowDownUp className="h-3.5 w-3.5" />
                                                Sırala
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setRatingSort('desc')}>En Yüksek Puan</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => setRatingSort('asc')}>En Düşük Puan</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {ratingsLoading ? (
                                <div className="py-10 text-center text-muted-foreground text-sm">Yükleniyor...</div>
                            ) : filteredRatings.length === 0 ? (
                                <div className="py-10 flex flex-col items-center text-center gap-2">
                                    <Inbox className="h-10 w-10 text-muted-foreground/30" />
                                    <p className="text-muted-foreground text-sm">Henüz değerlendirme yok.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {filteredRatings.map((r) => (
                                        <div key={r.id} className="rounded-xl border p-4 space-y-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <UserCell userId={r.userId} userMap={userMap} />
                                                <StarDisplay rating={r.rating} />
                                            </div>
                                            {r.comment?.trim() && (
                                                <p className="text-sm text-foreground bg-muted/50 rounded-lg px-3 py-2">
                                                    {r.comment}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-muted-foreground/60 text-right">
                                                {formatDate(r.createdAt)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
