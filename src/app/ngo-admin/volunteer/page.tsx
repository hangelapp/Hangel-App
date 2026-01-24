'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Star } from "lucide-react";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { volunteeringOpportunities } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const applications = [
  { id: 1, applicant: 'Ayşe Yılmaz', opportunity: 'Afet Bölgesi Yardım Dağıtımı', date: '2024-07-21', avatar: 'https://i.pravatar.cc/150?u=ayse', impactScore: 12540 },
  { id: 2, applicant: 'Mehmet Kaya', opportunity: 'Afet Bölgesi Yardım Dağıtımı', date: '2024-07-20', avatar: 'https://i.pravatar.cc/150?u=mehmet', impactScore: 9800 },
  { id: 3, applicant: 'Zeynep Arslan', opportunity: 'Sosyal Medya İçerik Gönüllüsü', date: '2024-07-19', avatar: 'https://i.pravatar.cc/150?u=zeynep', impactScore: 15200 },
  { id: 4, applicant: 'Ali Veli', opportunity: 'Afet Bölgesi Yardım Dağıtımı', date: '2024-07-18', avatar: 'https://i.pravatar.cc/150?u=ali', impactScore: 6400 },
];

const VolunteerApplicationsTab = () => {
    const groupedApplications = applications.reduce((acc, app) => {
        const key = app.opportunity;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(app);
        return acc;
    }, {} as Record<string, typeof applications>);

    return (
        <div className="space-y-6">
            {Object.keys(groupedApplications).length > 0 ? Object.entries(groupedApplications).map(([opportunityTitle, apps]) => (
                <Card key={opportunityTitle}>
                    <CardHeader>
                        <CardTitle>{opportunityTitle}</CardTitle>
                        <CardDescription>{apps.length} yeni başvuru</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {apps.map((app) => (
                            <div key={app.id} className="p-3 border rounded-lg flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={app.avatar} />
                                        <AvatarFallback>{app.applicant.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{app.applicant}</p>
                                        <p className="text-xs text-muted-foreground">{app.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold flex items-center gap-1 justify-end">
                                        <Star className="h-4 w-4 text-primary" /> {app.impactScore.toLocaleString('tr-TR')}
                                    </div>
                                    <p className="text-xs text-muted-foreground">Etki Puanı</p>
                                </div>
                                <div className="flex gap-2 basis-full sm:basis-auto justify-end">
                                  <Button variant="outline" size="sm" className="flex-1 sm:flex-grow-0">Detay</Button>
                                  <Button variant="secondary" size="sm" className="flex-1 sm:flex-grow-0 text-green-600 border-green-600 hover:bg-green-100">Onayla</Button>
                                  <Button variant="destructive" size="sm" className="flex-1 sm:flex-grow-0">Reddet</Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )) : <p className="text-center text-muted-foreground p-8">Aktif başvuru bulunmuyor.</p>}
        </div>
    );
};


const OpportunityManagementTab = () => {
    const ngoOpportunities = volunteeringOpportunities.filter(o => o.organization === 'Ahbap Derneği');
    return (
        <div className="space-y-4">
            {ngoOpportunities.map((opp) => (
              <Card key={opp.id}>
                <CardHeader className='pb-4'>
                  <CardTitle className="text-base">{opp.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center text-sm">
                    <div>
                        <p><strong>Durum:</strong> <Badge>Aktif</Badge></p>
                        <p><strong>Başvurular:</strong> {opp.volunteerCount.applications}</p>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button variant="secondary" size="sm" className='flex-1'>Görüntüle</Button>
                    <Button variant="destructive" size="sm" className='flex-1'>Pasife Al</Button>
                </CardFooter>
              </Card>
            ))}
        </div>
    );
};


const VolunteerPage = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gönüllülük Yönetimi</h1>
        <Button asChild>
          <Link href="/ngo-admin/volunteer/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Yeni İlan Oluştur
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="applications" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="applications">Başvurular</TabsTrigger>
          <TabsTrigger value="opportunities">İlan Yönetimi</TabsTrigger>
        </TabsList>
        <TabsContent value="applications" className="mt-4">
            <VolunteerApplicationsTab />
        </TabsContent>
        <TabsContent value="opportunities" className="mt-4">
            <OpportunityManagementTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VolunteerPage;
