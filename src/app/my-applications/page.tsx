
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { applications, ngos } from '@/lib/data';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search, ArrowDownUp, Filter } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Application } from '@/lib/types';


const statusVariantMap = {
    'Onaylandı': "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300/50",
    'Beklemede': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300/50",
    'Reddedildi': "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300/50",
} as const;


const ApplicationList = ({ apps }: { apps: Application[] }) => {
    if (apps.length === 0) {
        return <div className="text-center text-muted-foreground p-16">Bu kriterlere uygun başvuru bulunmuyor.</div>
    }

    return (
        <Accordion type="single" collapsible className="w-full space-y-3">
            {apps.map(app => {
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
  const [activeTab, setActiveTab] = useState('Gönüllülük');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [statusFilter, setStatusFilter] = useState('Tümü'); // 'Tümü', 'Onaylandı', 'Beklemede', 'Reddedildi'
  const allStatuses = ['Tümü', 'Onaylandı', 'Beklemede', 'Reddedildi'];


  const filteredApps = useMemo(() => {
    let apps = activeTab === 'Tümü'
      ? applications
      : applications.filter(app => app.type === activeTab);
    
    if (searchTerm) {
        apps = apps.filter(app => app.title.toLowerCase().includes(searchTerm.toLowerCase()) || app.org.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (statusFilter !== 'Tümü') {
        apps = apps.filter(app => app.status === statusFilter);
    }

    apps.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return apps;
  }, [activeTab, searchTerm, sortOrder, statusFilter]);

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
      
       <div className="p-0 flex gap-2 items-center">
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Başvurularda ara..."
                    className="pl-10 h-11"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11">
                        <Filter className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                     <DropdownMenuLabel>Duruma Göre Filtrele</DropdownMenuLabel>
                     <DropdownMenuSeparator />
                     {allStatuses.map(status => (
                        <DropdownMenuCheckboxItem
                            key={status}
                            checked={statusFilter === status}
                            onCheckedChange={() => setStatusFilter(status)}
                        >
                            {status}
                        </DropdownMenuCheckboxItem>
                     ))}
                </DropdownMenuContent>
            </DropdownMenu>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-11 w-11">
                        <ArrowDownUp className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortOrder('desc')}>Tarihe Göre (En Yeni)</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOrder('asc')}>Tarihe Göre (En Eski)</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
      </div>

      <Tabs defaultValue="Gönüllülük" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="Gönüllülük">Gönüllülük</TabsTrigger>
              <TabsTrigger value="Kulüpler">Kulüpler</TabsTrigger>
              <TabsTrigger value="STK">STK</TabsTrigger>
              <TabsTrigger value="Marka">Marka</TabsTrigger>
          </TabsList>
          <TabsContent value="Gönüllülük" className='mt-4'>
              <ApplicationList apps={filteredApps} />
          </TabsContent>
          <TabsContent value="Kulüpler" className='mt-4'>
              <ApplicationList apps={filteredApps} />
          </TabsContent>
           <TabsContent value="STK" className='mt-4'>
              <ApplicationList apps={filteredApps} />
          </TabsContent>
           <TabsContent value="Marka" className='mt-4'>
              <ApplicationList apps={filteredApps} />
          </TabsContent>
      </Tabs>
    </div>
  );
}
