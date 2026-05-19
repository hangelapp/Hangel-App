'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import React, { useMemo, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Volunteering, Application as UserApplication } from '@/lib/types';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from "@/components/ui/skeleton";
import { COLLECTIONS } from '@/firebase/collections';


const VolunteerApplicationsTab = ({ opportunities }: { opportunities: Volunteering[] }) => {
    const { toast } = useToast();
    const db = useFirestore();

    const opportunityIds = useMemo(() => opportunities.map(o => o.id), [opportunities]);

    const applicationsQuery = useMemoFirebase(() => {
        if (opportunityIds.length === 0) return null;
        // Firebase query 'in' limited to 10 items, but for now we query all and filter if needed or just query by type
        return query(collection(db, COLLECTIONS.applications), where('type', '==', 'Gönüllülük'));
    }, [db, opportunityIds]);

    const { data: allApps, isLoading } = useCollection<UserApplication>(applicationsQuery);

    const applications = useMemo(() => {
        if (!allApps) return [];
        return allApps.filter(app => opportunityIds.includes(app.entityId || ''));
    }, [allApps, opportunityIds]);

    const handleApplication = (appId: string, decision: 'approved' | 'rejected') => {
        toast({
            title: `Başvuru ${decision === 'approved' ? 'Onaylandı' : 'Reddedildi'}`,
            description: `Başvuru işlemi simüle edildi (Firestore kaydı yapılmadı).`,
        });
    };

    const groupedApplications = useMemo(() => {
        return applications.reduce((acc, app) => {
            const key = app.title;
            if (!acc[key]) acc[key] = [];
            acc[key].push(app);
            return acc;
        }, {} as Record<string, UserApplication[]>);
    }, [applications]);

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>;

    return (
        <div className="space-y-6">
            {Object.keys(groupedApplications).length > 0 ? Object.entries(groupedApplications).map(([opportunityTitle, apps]) => (
                <Card key={opportunityTitle}>
                    <CardHeader>
                        <CardTitle>{opportunityTitle}</CardTitle>
                        <CardDescription>{apps.length} başvuru</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {apps.map((app) => (
                            <div key={app.id} className="p-3 border rounded-lg flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarFallback>{app.userName?.charAt(0) || 'G'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{app.userName || 'Gönüllü'}</p>
                                        <p className="text-xs text-muted-foreground">{app.date}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 basis-full sm:basis-auto justify-end">
                                  <Button variant="outline" size="sm" className="flex-1 sm:flex-grow-0" asChild>
                                    <Link href={`/profile/${app.userId}`}>Profil</Link>
                                  </Button>
                                  <Button variant="secondary" size="sm" className="flex-1 sm:flex-grow-0 text-green-600 border-green-600 hover:bg-green-100" onClick={() => handleApplication(app.id, 'approved')}>Onayla</Button>
                                  <Button variant="destructive" size="sm" className="flex-1 sm:flex-grow-0" onClick={() => handleApplication(app.id, 'rejected')}>Reddet</Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )) : <p className="text-center text-muted-foreground p-8">Henüz başvuru bulunmuyor.</p>}
        </div>
    );
};


const OpportunityManagementTab = ({ opportunities, isLoading }: { opportunities: Volunteering[], isLoading: boolean }) => {
    const { toast } = useToast();

    const handleDeactivate = (_oppId: string) => {
        toast({
            title: "İlan Pasife Alındı",
            description: "Gönüllülük ilanı yayından kaldırıldı (Simüle edildi)."
        });
    };

    if (isLoading) return <div className="space-y-4"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>;

    return (
        <div className="space-y-4">
            {opportunities.length > 0 ? opportunities.map((opp) => (
              <Card key={opp.id}>
                <CardHeader className='pb-4'>
                  <CardTitle className="text-base">{opp.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center text-sm">
                    <div>
                        <p><strong>Durum:</strong> <Badge>Aktif</Badge></p>
                        <p><strong>Başvurular:</strong> {opp.volunteerCount?.applications || 0}</p>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button asChild variant="secondary" size="sm" className='flex-1'>
                        <Link href={`/volunteering/${opp.id}`}>Görüntüle</Link>
                    </Button>
                    <Button variant="destructive" size="sm" className='flex-1' onClick={() => handleDeactivate(opp.id)}>Pasife Al</Button>
                </CardFooter>
              </Card>
            )) : <p className="text-center p-8 text-muted-foreground">Aktif ilanınız bulunmuyor.</p>}
        </div>
    );
};


const VolunteerPage = () => {
  const searchParams = useSearchParams();
  const entityId = searchParams.get('id');
  const db = useFirestore();
  const { user: authUser } = useUser();

  const oppsQuery = useMemoFirebase(() => {
    const finalId = entityId || (authUser?.uid);
    if (!db || !finalId) return null;
    return query(collection(db, COLLECTIONS.volunteering), where('ngoId', '==', finalId));
  }, [db, entityId, authUser?.uid]);

  const { data: opportunities, isLoading } = useCollection<Volunteering>(oppsQuery);

  return (
    <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
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
                <VolunteerApplicationsTab opportunities={opportunities || []} />
            </TabsContent>
            <TabsContent value="opportunities" className="mt-4">
                <OpportunityManagementTab opportunities={opportunities || []} isLoading={isLoading} />
            </TabsContent>
          </Tabs>
        </div>
    </Suspense>
  );
};

export default function Page() {
    return (
        <Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <VolunteerPage />
        </Suspense>
    );
}
