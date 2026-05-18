'use client';
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Crown, Star, Heart, Handshake, Globe, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React from 'react';
import { useFirestore, useMemoFirebase, useCollection, useUser } from '@/firebase';
import { collection } from 'firebase/firestore';

type LeaderboardUser = {
  id?: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  stats?: { impactScore?: number; volunteerHours?: number; totalDonation?: number };
  impactScore?: number;
  volunteerHours?: number;
  totalDonation?: number;
  personalInfo?: { address?: { school?: string; city?: string } };
  volunteerInfo?: { education?: Array<{ school?: string }> };
  _value?: number;
};

// Veri farklı yerlerde olabiliyor: stats.* (yeni şema) veya top-level (eski/invite akışı). İkisini de okuyup maks alıyoruz.
const getValue = (u: LeaderboardUser, key: 'impactScore' | 'volunteerHours' | 'totalDonation'): number => {
  const fromStats = Number(u?.stats?.[key]) || 0;
  const fromTop = Number(u?.[key]) || 0;
  return Math.max(fromStats, fromTop);
};

const userSchools = (u: LeaderboardUser): string[] => {
  const list: string[] = [];
  if (u?.personalInfo?.address?.school) list.push(u.personalInfo.address.school);
  if (Array.isArray(u?.volunteerInfo?.education)) {
    u.volunteerInfo.education.forEach((e) => {
      if (e?.school) list.push(e.school);
    });
  }
  return list;
};

type LeaderboardTableProps = {
  valueKey: 'impactScore' | 'volunteerHours' | 'totalDonation';
  unit: string;
  allUsers: LeaderboardUser[] | null | undefined;
  authUserId: string | undefined;
  scope: string;
  isLoading: boolean;
};

const LeaderboardTable = ({ valueKey, unit, allUsers, authUserId, scope, isLoading }: LeaderboardTableProps) => {
  const sortedData = useMemo(() => {
    if (!allUsers) return [];
    let dataToFilter = allUsers;
    const me = authUserId ? dataToFilter.find(u => u.id === authUserId) : null;

      if (scope === 'city' && me) {
        const city = me.personalInfo?.address?.city;
        if (city) dataToFilter = dataToFilter.filter(u => u.personalInfo?.address?.city === city);
      } else if (scope === 'school' && me) {
        const mySchools = userSchools(me);
        if (mySchools.length > 0) {
          dataToFilter = dataToFilter.filter(u => userSchools(u).some(s => mySchools.includes(s)));
        }
      }

    return [...dataToFilter]
      .map(u => ({ user: u, value: getValue(u, valueKey) }))
      .filter(x => x.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 100)
      .map(x => ({ ...x.user, _value: x.value }));
  }, [allUsers, valueKey, scope, authUserId]);

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
          {sortedData.length > 0 ? sortedData.map((userItem: LeaderboardUser, index: number) => (
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
                    {valueKey !== 'impactScore' && getValue(userItem, 'impactScore') > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Star className="h-3 w-3 text-amber-500" />
                        <span>{getValue(userItem, 'impactScore').toLocaleString('tr-TR')} Puan</span>
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-bold text-base">
                {(userItem._value ?? getValue(userItem, valueKey)).toLocaleString('tr-TR')} {unit}
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

export default function LeaderboardPage() {
  const [scope, setScope] = useState('country');
  const { user: authUser } = useUser();
  const db = useFirestore();

  const usersRef = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: allUsers, isLoading } = useCollection<LeaderboardUser>(usersRef);

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
          <MemoizedLeaderboardTable valueKey="impactScore" unit="Puan" allUsers={allUsers} authUserId={authUser?.uid} scope={scope} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="volunteer" className="mt-4">
          <MemoizedLeaderboardTable valueKey="volunteerHours" unit="Saat" allUsers={allUsers} authUserId={authUser?.uid} scope={scope} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="donation" className="mt-4">
          <MemoizedLeaderboardTable valueKey="totalDonation" unit="₺" allUsers={allUsers} authUserId={authUser?.uid} scope={scope} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
