
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { user, badges } from '@/lib/data';
import { 
    Star, Briefcase, Heart, School, FileText, Badge as BadgeIcon, Languages, Laptop, 
    HandCoins, Hourglass, ChevronRight
} from 'lucide-react';
import { UserAvatar } from '@/components/shared/user-avatar';
import Link from 'next/link';

const InfoRow = ({ icon: Icon, label, value, href }: { icon: React.ElementType; label: string; value?: string | null; href?: string }) => {
  const content = (
    <div className="flex items-center p-4">
      <div className='p-1.5 bg-primary/10 rounded-lg mr-4'>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-base">{label}</p>
        {value && <p className="text-sm text-muted-foreground">{value}</p>}
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </div>
  );

  if (href) {
    return <Link href={href} className='block hover:bg-accent first:rounded-t-xl last:rounded-b-xl transition-colors'>{content}</Link>;
  }
  return <div className='block'>{content}</div>;
};

const StatCard = ({ icon: Icon, value, label }: { icon: React.ElementType, value: string, label: string }) => (
  <Card className='text-center p-4 shadow-none'>
    <Icon className="h-8 w-8 text-primary mx-auto mb-2" />
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </Card>
);

export default function ProfilePage() {

  const impactStats = [
    { icon: Star, value: user.impactScore.toLocaleString('tr-TR'), label: 'Etki Puanı' },
    { icon: HandCoins, value: `${user.stats.totalDonation.toLocaleString('tr-TR')} ₺`, label: 'Bağış' },
    { icon: Hourglass, value: `${user.stats.volunteerHours} Saat`, label: 'Gönüllülük' },
  ];

  return (
    <div className="animate-in fade-in-0 bg-secondary min-h-screen">
      <div className="p-4 space-y-6">
        <div className="flex flex-col items-center text-center pt-8">
            <UserAvatar className="w-24 h-24 mb-4" />
            <h1 className="text-3xl font-bold">{user.name}</h1>
            <p className="text-lg text-muted-foreground">{user.username}</p>
            <Button variant="link" className="mt-1">Profili Düzenle</Button>
        </div>

        <div className="grid grid-cols-3 gap-2">
           {impactStats.map(stat => <StatCard key={stat.label} {...stat} />)}
        </div>

        <Card>
          <CardContent className="p-0 divide-y">
            <InfoRow href="/my-donations" icon={HandCoins} label="Bağışlarım" value={`${user.stats.totalDonation.toLocaleString('tr-TR')} ₺`} />
            <InfoRow href="/my-applications" icon={FileText} label="Başvurularım" value="3 Beklemede" />
            <InfoRow href="/my-badges" icon={BadgeIcon} label="Rozetler ve Sertifikalar" value={`${badges.filter(b => b.currentPoints >= b.pointsRequired).length} Rozet`} />
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-0 divide-y">
            <InfoRow href="/invite" icon={Heart} label="Arkadaşlarını Davet Et" value="İyiliği paylaş, puan kazan" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
