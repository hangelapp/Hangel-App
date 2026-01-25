

"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { applications as initialApplications } from '@/lib/data';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search, ArrowDownUp, Filter, Eye, Trash2, CheckCircle, Hourglass, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Application } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function MyApplicationsPage() {
  const [applications, setApplications] = useState(initialApplications);
  const [activeTab, setActiveTab] = useState('Gönüllülük');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [statusFilter, setStatusFilter] = useState('Tümü'); // 'Tümü', 'Onaylandı', 'Beklemede', 'Reddedildi'
  const allStatuses = ['Tümü', 'Onaylandı', 'Beklemede', 'Reddedildi'];
  const { toast } = useToast();

  const handleWithdrawApplication = (appId: string, appTitle: string) => {
    setApplications(prev => prev.filter(app => app.id !== appId));
    toast({
        title: 'Başvuru Geri Çekildi',
        description: `"${appTitle}" başvurunuz başarıyla iptal edildi.`,
    });
  };

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
  }, [activeTab, searchTerm, sortOrder, statusFilter, applications]);

  const ApplicationCard = ({ app, onWithdraw }: { app: Application, onWithdraw: (id: string, title: string) => void }) => {
    const getEntityLink = () => {
        if (!app.entityId) return '#';
        switch (app.type) {
            case 'Gönüllülük': return `/volunteering/${app.entityId}`;
            case 'Kulüpler': return `/admin/clubs/profile/${app.entityId}`;
            default: return '#';
        }
    };

    const StatusIcon = {
        'Onaylandı': <CheckCircle className="h-5 w-5 text-green-600" />,
        'Beklemede': <Hourglass className="h-5 w-5 text-yellow-500" />,
        'Reddedildi': <XCircle className="h-5 w-5 text-destructive" />,
    }[app.status];

    return (
        <Card className="transition-colors hover:bg-accent/50">
            <CardHeader className="flex flex-row items-start justify-between gap-4 p-4">
                 <div>
                    <CardTitle className="text-base">{app.title}</CardTitle>
                    <CardDescription>{app.org} - {app.location}</CardDescription>
                </div>
                <div className='text-right flex-shrink-0 ml-4 space-y-1'>
                    <div className="flex items-center justify-end gap-2">
                        {StatusIcon}
                        <p className="font-semibold text-sm">{app.status}</p>
                    </div>
                    <p className='text-xs text-muted-foreground'>{app.date}</p>
                </div>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-sm space-y-4">
                {app.status === 'Reddedildi' && app.rejectionReason && (
                    <Alert variant="destructive">
                        <AlertTitle>Reddedilme Nedeni</AlertTitle>
                        <AlertDescription>{app.rejectionReason}</AlertDescription>
                    </Alert>
                )}
                 <div className="flex gap-2">
                    <Button asChild variant="secondary" className="flex-1">
                        <Link href={getEntityLink()}>
                            <Eye className="mr-2 h-4 w-4" /> İlanı Görüntüle
                        </Link>
                    </Button>
                    {app.status === 'Beklemede' && (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" className="flex-1">
                                    <Trash2 className="mr-2 h-4 w-4" /> Başvuruyu Geri Çek
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Başvuruyu Geri Çekmek İstediğinizden Emin misiniz?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Bu işlem geri alınamaz. "{app.title}" başvurunuz kalıcı olarak iptal edilecektir.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => onWithdraw(app.id, app.title)} className={cn(buttonVariants({ variant: "destructive" }))}>
                                        Evet, Geri Çek
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                 </div>
            </CardContent>
        </Card>
    );
};


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
            {filteredApps.length > 0 ? (
                <div className="space-y-4">
                    {filteredApps.map(app => <ApplicationCard key={app.id} app={app} onWithdraw={handleWithdrawApplication} />)}
                </div>
            ) : <div className="text-center text-muted-foreground p-16">Bu kriterlere uygun başvuru bulunmuyor.</div>}
          </TabsContent>
          <TabsContent value="Kulüpler" className='mt-4'>
            {filteredApps.length > 0 ? (
                <div className="space-y-4">
                    {filteredApps.map(app => <ApplicationCard key={app.id} app={app} onWithdraw={handleWithdrawApplication} />)}
                </div>
            ) : <div className="text-center text-muted-foreground p-16">Bu kriterlere uygun başvuru bulunmuyor.</div>}
          </TabsContent>
           <TabsContent value="STK" className='mt-4'>
            {filteredApps.length > 0 ? (
                <div className="space-y-4">
                    {filteredApps.map(app => <ApplicationCard key={app.id} app={app} onWithdraw={handleWithdrawApplication} />)}
                </div>
            ) : <div className="text-center text-muted-foreground p-16">Bu kriterlere uygun başvuru bulunmuyor.</div>}
          </TabsContent>
           <TabsContent value="Marka" className='mt-4'>
            {filteredApps.length > 0 ? (
                <div className="space-y-4">
                    {filteredApps.map(app => <ApplicationCard key={app.id} app={app} onWithdraw={handleWithdrawApplication} />)}
                </div>
            ) : <div className="text-center text-muted-foreground p-16">Bu kriterlere uygun başvuru bulunmuyor.</div>}
          </TabsContent>
      </Tabs>
    </div>
  );
}
