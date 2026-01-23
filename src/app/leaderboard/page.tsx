'use client';
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { user } from '@/lib/data';
import { Crown, Star, Heart, Handshake, Users, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React from 'react';

// Create more mock users for the leaderboard
const mockUsers = [
  { ...user, id: '1', impactScore: 15750, volunteerHours: 48, totalDonation: 1250, personalInfo: {...user.personalInfo, address: {...user.personalInfo.address, school: 'Boğaziçi Üniversitesi'}} },
  { id: '2', name: 'Ayşe Yılmaz', username: '@ayseyilmaz', avatarUrl: 'https://i.pravatar.cc/150?u=ayse', impactScore: 14200, volunteerHours: 60, totalDonation: 980, personalInfo: { address: { city: 'Ankara', school: 'Orta Doğu Teknik Üniversitesi' } } },
  { id: '3', name: 'Mehmet Kaya', username: '@mehmetkaya', avatarUrl: 'https://i.pravatar.cc/150?u=mehmet', impactScore: 12500, volunteerHours: 30, totalDonation: 1500, personalInfo: { address: { city: 'İzmir', school: 'Ege Üniversitesi' } } },
  { id: '4', name: 'Fatma Demir', username: '@fatmademir', avatarUrl: 'https://i.pravatar.cc/150?u=fatma', impactScore: 11800, volunteerHours: 75, totalDonation: 600, personalInfo: { address: { city: 'İstanbul', school: 'Boğaziçi Üniversitesi' } } },
  { id: '5', name: 'Ali Öztürk', username: '@aliozturk', avatarUrl: 'https://i.pravatar.cc/150?u=ali', impactScore: 10500, volunteerHours: 25, totalDonation: 1800, personalInfo: { address: { city: 'Ankara', school: 'Hacettepe Üniversitesi' } } },
  { id: '6', name: 'Zeynep Arslan', username: '@zeyneparslan', avatarUrl: 'https://i.pravatar.cc/150?u=zeynep', impactScore: 9800, volunteerHours: 90, totalDonation: 450, personalInfo: { address: { city: 'İstanbul', school: 'İstanbul Teknik Üniversitesi' } } },
  { id: '7', name: 'Mustafa Çelik', username: '@mustafacelik', avatarUrl: 'https://i.pravatar.cc/150?u=mustafa', impactScore: 8500, volunteerHours: 40, totalDonation: 1100, personalInfo: { address: { city: 'İzmir', school: 'Dokuz Eylül Üniversitesi' } } },
  { id: '8', name: 'Elif Aydın', username: '@elifaydin', avatarUrl: 'https://i.pravatar.cc/150?u=elif', impactScore: 7600, volunteerHours: 100, totalDonation: 300, personalInfo: { address: { city: 'Bursa', school: 'Uludağ Üniversitesi' } } },
];

const mockFriends = [mockUsers[1], mockUsers[3], mockUsers[5], user];


export default function LeaderboardPage() {
  const [scope, setScope] = useState('country');

  const LeaderboardTable = ({ data, valueKey, unit }: { data: any[], valueKey: 'impactScore' | 'volunteerHours' | 'totalDonation', unit: string }) => {
    const sortedData = useMemo(() => {
        let dataToFilter = data;
        if (scope === 'city') {
            dataToFilter = data.filter(u => u.personalInfo.address.city === user.personalInfo.address.city);
        } else if (scope === 'school') {
             const userSchool = 'Boğaziçi Üniversitesi'; // hardcoded for simplicity
            dataToFilter = data.filter(u => u.personalInfo.address.school === userSchool);
        } else if (scope === 'friends') {
            dataToFilter = mockFriends;
        }
        
        return [...dataToFilter].sort((a, b) => b[valueKey] - a[valueKey]);
    }, 
    [data, valueKey, scope]);
    
    const headerLabel = unit === 'Puan' ? 'Puan' : (unit === 'Saat' ? 'Saat' : 'Tutar');

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
                {sortedData.length > 0 ? sortedData.map((userItem, index) => (
                    <TableRow key={userItem.id} className={cn(index < 3 && 'bg-accent')}>
                        <TableCell className="font-bold text-lg text-center">
                            {index === 0 ? <Crown className="text-yellow-500 w-6 h-6 mx-auto" /> : index + 1}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={userItem.avatarUrl} alt={userItem.name} />
                                    <AvatarFallback>{userItem.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{userItem.name}</p>
                                    <p className="text-sm text-muted-foreground">{userItem.username}</p>
                                    {valueKey !== 'impactScore' && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                            <Star className="h-3 w-3 text-amber-500" />
                                            <span>{userItem.impactScore.toLocaleString('tr-TR')} Puan</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-base">{userItem[valueKey].toLocaleString('tr-TR')} {unit}</TableCell>
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
        <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="global"><Globe className="mr-2 h-4 w-4" />Global</TabsTrigger>
            <TabsTrigger value="country">Ülkemde</TabsTrigger>
            <TabsTrigger value="city">Şehrimde</TabsTrigger>
            <TabsTrigger value="school">Okulumda</TabsTrigger>
            <TabsTrigger value="friends"><Users className="mr-2 h-4 w-4" />Arkadaşlarım</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Tabs defaultValue="impact" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="impact"><Star className="mr-2 h-4 w-4" /> Etki Puanı</TabsTrigger>
            <TabsTrigger value="volunteer"><Handshake className="mr-2 h-4 w-4" /> Gönüllülük</TabsTrigger>
            <TabsTrigger value="donation"><Heart className="mr-2 h-4 w-4" /> Bağış</TabsTrigger>
        </TabsList>

        <TabsContent value="impact" className="mt-4">
            <MemoizedLeaderboardTable data={mockUsers} valueKey="impactScore" unit="Puan" />
        </TabsContent>
        <TabsContent value="volunteer" className="mt-4">
            <MemoizedLeaderboardTable data={mockUsers} valueKey="volunteerHours" unit="Saat" />
        </TabsContent>
        <TabsContent value="donation" className="mt-4">
            <MemoizedLeaderboardTable data={mockUsers} valueKey="totalDonation" unit="₺" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
