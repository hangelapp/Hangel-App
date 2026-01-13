"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { applications } from '@/lib/data';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from 'lucide-react';

const statusVariantMap = {
    'Onaylandı': "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300/50",
    'Beklemede': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300/50",
    'Reddedildi': "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300/50",
} as const;


const ApplicationList = ({ type }: { type: (typeof applications)[0]['type'] | 'Tümü' }) => {
    const filteredApps = type === 'Tümü'
      ? applications
      : applications.filter(app => app.type === type);

    if (filteredApps.length === 0) {
        return <div className="text-center text-muted-foreground p-8">Bu kategoride başvuru bulunmuyor.</div>
    }

    return (
        <div className="space-y-4">
            {filteredApps.map(app => (
              <Card key={app.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{app.title}</CardTitle>
                      <CardDescription>{app.org}</CardDescription>
                    </div>
                    <div className='text-right flex-shrink-0 ml-4'>
                       <Badge variant="outline" className={cn("text-xs", statusVariantMap[app.status])}>{app.status}</Badge>
                       <p className='text-xs text-muted-foreground mt-1'>{app.date}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
        </div>
    )
}

export default function MyApplicationsPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Başvurularım</h1>
        <Button asChild>
           <Link href="#">
             <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Başvuru
           </Link>
        </Button>
      </div>
      <p className="text-muted-foreground">Gönüllülük ve diğer başvurularınızın durumunu buradan takip edin.</p>
      
        <Tabs defaultValue="Gönüllülük" className="w-full">
            <TabsList>
                <TabsTrigger value="Gönüllülük">Gönüllülük</TabsTrigger>
                <TabsTrigger value="Kulüpler">Kulüpler</TabsTrigger>
                <TabsTrigger value="STK">STK</TabsTrigger>
                <TabsTrigger value="Marka">Marka</TabsTrigger>
            </TabsList>
            <TabsContent value="Gönüllülük" className='mt-4'>
                <ApplicationList type="Gönüllülük" />
            </TabsContent>
            <TabsContent value="Kulüpler" className='mt-4'>
                <ApplicationList type="Kulüpler" />
            </TabsContent>
             <TabsContent value="STK" className='mt-4'>
                <ApplicationList type="STK" />
            </TabsContent>
             <TabsContent value="Marka" className='mt-4'>
                <ApplicationList type="Marka" />
            </TabsContent>
        </Tabs>
    </div>
  );
}
