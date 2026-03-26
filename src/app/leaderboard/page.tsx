'use client';
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Crown, Star, Heart, Handshake, Users, Globe, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React from 'react';
import { useFirestore, useMemoFirebase, useCollection, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function LeaderboardPage() {
  const [scope, setScope] = useState('country');
  const { user: authUser } = useUser();
  const db = useFirestore();

  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: allUsers, isLoading } = useCollection(usersRef);

  const LeaderboardTable = ({ valueKey, unit }: { valueKey: 'impactScore' | 'volunteerHours' | 'totalDonation', unit: string }) => {
    const sortedData = useMemo(() => {
      if (!allUsers) return [];
      let dataToFilter = allUsers as any[];

      if (scope === 'city' && authUser) {
        const city = (allUsers as any[]).find(u => u.id === authUser.uid)?.personalInfo?.address?.city;
        if (city) dataToFilter = dataToFilter.filter(u => u.personalInfo?.address?.city === city);
      } else if (scope === 'school' && authUser) {
        const school = (allUsers as any[]).find(u => u.id === authUser.uid)?.personalInfo?.address?.school;
        if (school) dataToFilter = dataToFilter.filter(u => u.personalInfo?.address?.school === school);
      }

      return [...dataToFilter]
        .filter(u => u[valueKey] !== undefined)
        .sort((a, b) => (b[valueKey] || 0) - (a[valueKey] || 0));
    }, [allUsers, valueKey, scope]);

    const headerLabel = unit === 'Puan' ? 'Puan' : (unit === 'Saat' ? 'Saat' : 'Tutar');

    if (isLoading) {
      return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Sıra</TableHead>
            <TableHead>Kullanıcı</TableHead>
            <TableHead className="text-right">{headerLabel}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length > 0 ? sortedData.map((userItem: any, index: number) => (
            <TableRow key={userItem.id} className={cn(index < 3 && 'bg-accent')}>
              <TableCell className="font-bold text-lg text-center">
                {index === 0 ? <Crown className="text-yellow-500 w-6 h-6 mx-auto" /> : index + 1}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userItem.avatarUrl} alt={userItem.name} />
                    <AvatarFallback>{(userItem.name || '?').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{userItem.name}</p>
                    <p className="text-sm text-muted-foreground">{userItem.username}</p>
                    {valueKey !== 'impactScore' && userItem.impactScore && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span>{(userItem.impactScore || 0).toLocaleString('tr-TR')} Puan</span>
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-bold text-base">
                {(userItem[valueKey] || 0).toLocaleString('tr-TR')} {unit}
              </TableCell>
            </TableRow>
          )) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                Bu kategoride gösterilecek kimse yok.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  const MemoizedLeaderboardTable = React.memo(LeaderboardTable);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold font-headline">Liderlik Tablosu</h1>

      <Tabs defaultValue="country" className="w-full" onValueChange={setScope}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="global"><Globe className="mr-2 h-4 w-4" />Global</TabsTrigger>
          <TabsTrigger value="country">Ülkemde</TabsTrigger>
          <TabsTrigger value="city">Şehrimde</TabsTrigger>
          <TabsTrigger value="school">Okulumda</TabsTrigger>
        </TabsList>
      </Tabs>

      <Tabs defaultValue="impact" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="impact"><Star className="mr-2 h-4 w-4" /> Etki Puanı</TabsTrigger>
          <TabsTrigger value="volunteer"><Handshake className="mr-2 h-4 w-4" /> Gönüllülük</TabsTrigger>
          <TabsTrigger value="donation"><Heart className="mr-2 h-4 w-4" /> Bağış</TabsTrigger>
        </TabsList>

        <TabsContent value="impact" className="mt-4">
          <MemoizedLeaderboardTable valueKey="impactScore" unit="Puan" />
        </TabsContent>
        <TabsContent value="volunteer" className="mt-4">
          <MemoizedLeaderboardTable valueKey="volunteerHours" unit="Saat" />
        </TabsContent>
        <TabsContent value="donation" className="mt-4">
          <MemoizedLeaderboardTable valueKey="totalDonation" unit="₺" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
