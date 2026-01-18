'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import React from 'react';

const applications = [
  { id: 1, applicant: 'Ayşe Yılmaz', opportunity: 'Afet Bölgesi Yardım Dağıtımı', date: '2024-07-21', avatar: 'https://i.pravatar.cc/150?u=ayse' },
  { id: 2, applicant: 'Mehmet Kaya', opportunity: 'Afet Bölgesi Yardım Dağıtımı', date: '2024-07-20', avatar: 'https://i.pravatar.cc/150?u=mehmet' },
];

const VolunteerApplications = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gönüllü Başvuruları</CardTitle>
        <CardDescription>Gönüllülük ilanlarınıza gelen başvuruları buradan yönetebilirsiniz.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {applications.map((app) => (
          <Card key={app.id}>
            <CardHeader className="flex-row items-center gap-4 pb-4">
               <Avatar>
                  <AvatarImage src={app.avatar} />
                  <AvatarFallback>{app.applicant.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{app.applicant}</p>
                    <p className="text-sm text-muted-foreground">{app.date}</p>
                </div>
            </CardHeader>
            <CardContent className='pb-4'>
                <p className="text-sm font-medium">{app.opportunity}</p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" size="sm" className='flex-1'>Detay</Button>
              <Button variant="secondary" size="sm" className="flex-1 text-green-600 border-green-600 hover:bg-green-100">Onayla</Button>
              <Button variant="destructive" size="sm" className='flex-1'>Reddet</Button>
            </CardFooter>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

export default VolunteerApplications;
