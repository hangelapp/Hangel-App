
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { applications, ngos } from '@/lib/data';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
        return <div className="text-center text-muted-foreground p-16">Bu kategoride başvuru bulunmuyor.</div>
    }

    return (
        <Accordion type="single" collapsible className="w-full space-y-3">
            {filteredApps.map(app => {
                const ngo = ngos.find(n => n.name === app.org);
                return (
                    <AccordionItem value={app.id} key={app.id} className="border-b-0">
                        <Card className="hover:bg-accent/50 transition-colors">
                            <AccordionTrigger className="p-4 w-full hover:no-underline [&>svg]:ml-auto">
                                <div className="flex justify-between items-start w-full">
                                    <div>
                                        <p className="text-base font-semibold text-left">{app.title}</p>
                                        <p className="text-sm text-muted-foreground text-left">{app.org}</p>
                                    </div>
                                    <div className='text-right flex-shrink-0 ml-4 space-y-1'>
                                        <Badge variant="outline" className={cn("text-xs font-medium", statusVariantMap[app.status])}>{app.status}</Badge>
                                        <p className='text-xs text-muted-foreground'>{app.date}</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                {ngo ? (
                                    <div className="pt-4 border-t text-sm space-y-2">
                                        <h4 className="font-semibold">{ngo.name} İletişim</h4>
                                        <p className="text-muted-foreground">E-posta: {ngo.contact.email}</p>
                                        <p className="text-muted-foreground">Telefon: {ngo.contact.phone}</p>
                                    </div>
                                ) : (
                                    <p className="pt-4 border-t text-sm text-muted-foreground">Kuruluş iletişim bilgisi bulunamadı.</p>
                                )}
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                )
            })}
        </Accordion>
    )
}

export default function MyApplicationsPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold font-headline">Başvurularım</h1>
            <p className="text-muted-foreground text-sm">Başvurularınızın durumunu buradan takip edin.</p>
        </div>
        <Button asChild size="sm">
           <Link href="/my-applications/new">
             <PlusCircle className="mr-2 h-4 w-4" />
            Yeni Başvuru
           </Link>
        </Button>
      </div>
      
        <Tabs defaultValue="Gönüllülük" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
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
