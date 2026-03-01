
'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Application } from '@/lib/types';

const ApplicationDetailsDialog = ({ application }: { application: Application }) => (
    <DialogContent className="sm:max-w-[600px] rounded-[2.5rem]">
        <DialogHeader>
            <DialogTitle>Başvuru Detayları: {application.org}</DialogTitle>
            <DialogDescription>
                <strong>Tür:</strong> {application.type} <br />
                <strong>Başvuru Tarihi:</strong> {application.date}
            </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
            <Card className="rounded-2xl border-black/5 bg-muted/30">
                <CardHeader><CardTitle className="text-base">Kuruluş Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>Yasal Adı:</strong> {application.org}</p>
                    <p><strong>Konum:</strong> {application.location}</p>
                    <p><strong>Başvuru Başlığı:</strong> {application.title}</p>
                </CardContent>
            </Card>
             <Card className="rounded-2xl border-black/5">
                <CardHeader><CardTitle className="text-base">Durum Takibi</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>Bu başvuru şu an <strong>{application.status}</strong> durumundadır.</p>
                </CardContent>
            </Card>
            <Card className="rounded-2xl border-black/5">
                <CardHeader><CardTitle className="text-base">Yasal Belgeler</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start rounded-xl"><FileText className="mr-2 h-4 w-4 text-primary"/> Faaliyet_Belgesi.pdf</Button>
                    <Button variant="outline" size="sm" className="w-full justify-start rounded-xl"><FileText className="mr-2 h-4 w-4 text-primary"/> Vergi_Levhasi.pdf</Button>
                </CardContent>
            </Card>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="secondary" className="rounded-xl">Kapat</Button>
            </DialogClose>
        </DialogFooter>
    </DialogContent>
);

const PendingApplicationCard = ({ item, onApprove, onReject }: { item: Application, onApprove: (id: string) => void, onReject: (id: string) => void }) => (
    <Card className="rounded-2xl border-black/5 hover:shadow-md transition-all group">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {item.org[0]}
                </div>
                <div>
                    <p className="font-bold text-foreground">{item.org}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{item.date} • {item.type}</p>
                </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" className="flex-1 sm:flex-grow-0 rounded-xl font-bold">İncele</Button>
                    </DialogTrigger>
                    <ApplicationDetailsDialog application={item} />
                </Dialog>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-grow-0 text-green-600 border-green-600 hover:bg-green-50 rounded-xl font-bold" 
                    onClick={() => onApprove(item.id)}
                >
                    Onayla
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-1 sm:flex-grow-0 text-destructive hover:bg-destructive/10 rounded-xl font-bold" 
                    onClick={() => onReject(item.id)}
                >
                    Reddet
                </Button>
            </div>
        </CardContent>
    </Card>
);

export default function ApplicationsPage() {
    const db = useFirestore();
    const { toast } = useToast();
    
    const appsQuery = useMemoFirebase(() => collection(db, 'applications'), [db]);
    const { data: applications, isLoading } = useCollection<Application>(appsQuery);

    const handleUpdateStatus = (id: string, newStatus: 'Onaylandı' | 'Reddedildi') => {
        const appRef = doc(db, 'applications', id);
        updateDocumentNonBlocking(appRef, { status: newStatus });
        
        toast({
            title: newStatus === 'Onaylandı' ? "Başvuru Onaylandı" : "Başvuru Reddedildi",
            description: `İşlem başarıyla Firestore üzerine yansıtıldı.`,
        });
    };

    const sortedApps = useMemo(() => {
        if (!applications) return { pending: [], approved: [], rejected: [] };
        return {
            pending: applications.filter(a => a.status === 'Beklemede').sort((a, b) => b.date.localeCompare(a.date)),
            approved: applications.filter(a => a.status === 'Onaylandı').sort((a, b) => b.date.localeCompare(a.date)),
            rejected: applications.filter(a => a.status === 'Reddedildi').sort((a, b) => b.date.localeCompare(a.date)),
        };
    }, [applications]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Başvurular Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in-0">
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Başvuru Yönetimi</h1>
                <p className="text-muted-foreground text-sm font-medium">STK, Marka ve Kulüp başvurularını gerçek zamanlı denetleyin.</p>
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-14 rounded-2xl bg-muted/50 p-1.5 backdrop-blur-xl">
                    <TabsTrigger value="pending" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
                        <Clock className="mr-2 h-4 w-4" /> Bekleyenler ({sortedApps.pending.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
                        <CheckCircle className="mr-2 h-4 w-4" /> Onaylananlar
                    </TabsTrigger>
                    <TabsTrigger value="rejected" className="rounded-xl font-bold data-[state=active]:bg-background data-[state=active]:shadow-lg">
                        <XCircle className="mr-2 h-4 w-4" /> Reddedilenler
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="mt-8 space-y-4">
                    {sortedApps.pending.length > 0 ? (
                        sortedApps.pending.map(app => (
                            <PendingApplicationCard 
                                key={app.id} 
                                item={app} 
                                onApprove={(id) => handleUpdateStatus(id, 'Onaylandı')}
                                onReject={(id) => handleUpdateStatus(id, 'Reddedildi')}
                            />
                        ))
                    ) : (
                        <div className="text-center py-24 bg-white/50 rounded-[3rem] border-2 border-dashed border-black/5">
                            <CheckCircle className="h-12 w-12 text-green-500/30 mx-auto mb-4" />
                            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Bekleyen başvuru bulunmuyor.</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="approved" className="mt-8 space-y-4">
                    {sortedApps.approved.map(app => (
                        <Card key={app.id} className="rounded-2xl border-black/5 bg-green-50/30">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-bold">
                                        {app.org[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold">{app.org}</p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{app.type} • ONAYLANDI</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(app.id, 'Beklemede')}>Geri Al</Button>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                <TabsContent value="rejected" className="mt-8 space-y-4">
                    {sortedApps.rejected.map(app => (
                        <Card key={app.id} className="rounded-2xl border-black/5 opacity-60">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-bold">
                                        {app.org[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold">{app.org}</p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{app.type} • REDDEDİLDİ</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => handleUpdateStatus(app.id, 'Beklemede')}>Yeniden Değerlendir</Button>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>
            </Tabs>
        </div>
    );
}
