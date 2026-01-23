'use client';
import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/user-avatar';
import { user } from '@/lib/data';
import { Crown, Star, Heart, Handshake } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Create more mock users for the leaderboard
const mockUsers = [
  { ...user, id: '1', impactScore: 15750, volunteerHours: 48, totalDonation: 1250 },
  { id: '2', name: 'Ayşe Yılmaz', username: '@ayseyilmaz', avatarUrl: 'https://i.pravatar.cc/150?u=ayse', impactScore: 14200, volunteerHours: 60, totalDonation: 980, personalInfo: { address: { city: 'Ankara', school: 'Orta Doğu Teknik Üniversitesi' } } },
  { id: '3', name: 'Mehmet Kaya', username: '@mehmetkaya', avatarUrl: 'https://i.pravatar.cc/150?u=mehmet', impactScore: 12500, volunteerHours: 30, totalDonation: 1500, personalInfo: { address: { city: 'İzmir', school: 'Ege Üniversitesi' } } },
  { id: '4', name: 'Fatma Demir', username: '@fatmademir', avatarUrl: 'https://i.pravatar.cc/150?u=fatma', impactScore: 11800, volunteerHours: 75, totalDonation: 600, personalInfo: { address: { city: 'İstanbul', school: 'Boğaziçi Üniversitesi' } } },
  { id: '5', name: 'Ali Öztürk', username: '@aliozturk', avatarUrl: 'https://i.pravatar.cc/150?u=ali', impactScore: 10500, volunteerHours: 25, totalDonation: 1800, personalInfo: { address: { city: 'Ankara', school: 'Hacettepe Üniversitesi' } } },
  { id: '6', name: 'Zeynep Arslan', username: '@zeyneparslan', avatarUrl: 'https://i.pravatar.cc/150?u=zeynep', impactScore: 9800, volunteerHours: 90, totalDonation: 450, personalInfo: { address: { city: 'İstanbul', school: 'İstanbul Teknik Üniversitesi' } } },
  { id: '7', name: 'Mustafa Çelik', username: '@mustafacelik', avatarUrl: 'https://i.pravatar.cc/150?u=mustafa', impactScore: 8500, volunteerHours: 40, totalDonation: 1100, personalInfo: { address: { city: 'İzmir', school: 'Dokuz Eylül Üniversitesi' } } },
  { id: '8', name: 'Elif Aydın', username: '@elifaydin', avatarUrl: 'https://i.pravatar.cc/150?u=elif', impactScore: 7600, volunteerHours: 100, totalDonation: 300, personalInfo: { address: { city: 'Bursa', school: 'Uludağ Üniversitesi' } } },
];


export default function LeaderboardPage() {
  const [scope, setScope] = useState('country');

  const LeaderboardTable = ({ data, valueKey, unit }: { data: any[], valueKey: 'impactScore' | 'volunteerHours' | 'totalDonation', unit: string }) => {
    const sortedData = useMemo(() => 
        [...data].sort((a, b) => b[valueKey] - a[valueKey]), 
    [data, valueKey]);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-16">Sıra</TableHead>
                    <TableHead>Kullanıcı</TableHead>
                    <TableHead className="text-right">Puan</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sortedData.map((user, index) => (
                    <TableRow key={user.id} className={cn(index < 3 && 'bg-accent')}>
                        <TableCell className="font-bold text-lg text-center">
                            {index === 0 ? <Crown className="text-yellow-500 w-6 h-6 mx-auto" /> : index + 1}
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.username}</p>
                                </div>
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-base">{user[valueKey].toLocaleString('tr-TR')} {unit}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold font-headline">Liderlik Tablosu</h1>
      
      <Tabs defaultValue="impact" className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <TabsList className="grid grid-cols-3 w-full sm:w-auto">
                <TabsTrigger value="impact"><Star className="mr-2 h-4 w-4" /> Etki Puanı</TabsTrigger>
                <TabsTrigger value="volunteer"><Handshake className="mr-2 h-4 w-4" /> Gönüllülük</TabsTrigger>
                <TabsTrigger value="donation"><Heart className="mr-2 h-4 w-4" /> Bağış</TabsTrigger>
            </TabsList>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className='w-full sm:w-auto'>
                        {scope === 'country' ? 'Ülke Geneli' : scope === 'city' ? 'Şehir Geneli' : 'Okul Geneli'}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuRadioGroup value={scope} onValueChange={setScope}>
                        <DropdownMenuRadioItem value="country">Ülke Geneli</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="city">Şehir Geneli</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="school">Okul Geneli</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <TabsContent value="impact" className="mt-4">
            <LeaderboardTable data={mockUsers} valueKey="impactScore" unit="Puan" />
        </TabsContent>
        <TabsContent value="volunteer" className="mt-4">
            <LeaderboardTable data={mockUsers} valueKey="volunteerHours" unit="Saat" />
        </TabsContent>
        <TabsContent value="donation" className="mt-4">
            <LeaderboardTable data={mockUsers} valueKey="totalDonation" unit="₺" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
