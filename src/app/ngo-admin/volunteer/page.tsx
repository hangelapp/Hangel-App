
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { volunteeringOpportunities } from '@/lib/data';
import { Badge } from '@/components/ui/badge';

// Data for applications, same as in dashboard component
const applications = [
  { id: 1, applicant: 'Ayşe Yılmaz', opportunity: 'Afet Bölgesi Yardım Dağıtımı', date: '2024-07-21', avatar: 'https://i.pravatar.cc/150?u=ayse' },
  { id: 2, applicant: 'Mehmet Kaya', opportunity: 'Afet Bölgesi Yardım Dağıtımı', date: '2024-07-20', avatar: 'https://i.pravatar.cc/150?u=mehmet' },
];

const VolunteerApplicationsTab = () => (
    <div className="space-y-4">
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
    </div>
);

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
        <h1 className="text-2xl font-bold">Gönüllülük</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Yeni İlan Oluştur
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
