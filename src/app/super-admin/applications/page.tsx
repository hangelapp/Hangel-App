
'use client';

import React, { useState, useEffect } from 'react';
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
import { FileText } from "lucide-react";


type Application = {
  id: string;
  name: string;
  date: string;
  avatar: string;
  type: 'STK' | 'Marka' | 'Kulüp';
};

const initialData: {
  pending: {
    ngo: Application[];
    brand: Application[];
    club: Application[];
  };
  approved: Application[];
  rejected: Application[];
} = {
  pending: {
    ngo: [
      { id: 'ngo1', name: 'Doğa Koruma Derneği', date: '2024-07-22', avatar: 'https://logo.clearbit.com/wwf.org', type: 'STK' },
      { id: 'ngo2', name: 'Eğitim Meşalesi Vakfı', date: '2024-07-21', avatar: 'https://logo.clearbit.com/tegv.org', type: 'STK' },
    ],
    brand: [
      { id: 'brand1', name: 'Eko Giyim', date: '2024-07-22', avatar: 'https://logo.clearbit.com/patagonia.com', type: 'Marka' },
      { id: 'brand2', name: 'Sağlıklı Atıştırmalıklar', date: '2024-07-20', avatar: 'https://logo.clearbit.com/fellasfoods.com.tr', type: 'Marka' },
    ],
    club: [
      { id: 'club1', name: 'YTÜ Sosyal Sorumluluk Kulübü', date: '2024-07-21', avatar: 'https://logo.clearbit.com/yildiz.edu.tr', type: 'Kulüp' },
    ],
  },
  approved: [
    { id: 'ngo3', name: 'TEMA Vakfı', date: '2024-07-15', avatar: 'https://logo.clearbit.com/tema.org.tr', type: 'STK' },
    { id: 'brand3', name: 'Decathlon', date: '2024-07-14', avatar: 'https://logo.clearbit.com/decathlon.com.tr', type: 'Marka' },
  ],
  rejected: [],
};

const ApplicationDetailsDialog = ({ application }: { application: Application }) => (
    <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
            <DialogTitle>Başvuru Detayları: {application.name}</DialogTitle>
            <DialogDescription>
                <strong>Tür:</strong> {application.type} <br />
                <strong>Başvuru Tarihi:</strong> {application.date}
            </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <Card>
                <CardHeader><CardTitle className="text-base">Kuruluş Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>Yasal Adı:</strong> {application.name}</p>
                    <p><strong>Web Sitesi:</strong> <a href="#" className="text-primary underline">https://ornek-site.org</a></p>
                    <p><strong>Kategori:</strong> {application.type === 'STK' ? 'Eğitim' : 'Giyim'}</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader><CardTitle className="text-base">Yetkili Bilgileri</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p><strong>Ad Soyad:</strong> Ali Veli</p>
                    <p><strong>E-posta:</strong> ali.veli@ornek-site.org</p>
                    <p><strong>Telefon:</strong> +90 555 123 45 67</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-base">Yasal Belgeler</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start"><FileText className="mr-2 h-4 w-4"/> Faaliyet Belgesi.pdf</Button>
                    <Button variant="outline" size="sm" className="w-full justify-start"><FileText className="mr-2 h-4 w-4"/> Vergi Levhası.pdf</Button>
                </CardContent>
            </Card>
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="secondary">Kapat</Button>
            </DialogClose>
        </DialogFooter>
    </DialogContent>
);

const EditApplicationDialog = ({ application, open, onOpenChange, onSave }: { application: Application | null, open: boolean, onOpenChange: (open: boolean) => void, onSave: (updatedApp: Application) => void }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState<'STK' | 'Marka' | 'Kulüp'>('STK');

    useEffect(() => {
        if (application) {
            setName(application.name);
            setType(application.type);
        }
    }, [application]);
    
    if (!application) return null;

    const handleSave = () => {
        onSave({ ...application, name, type });
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Başvuruyu Düzenle</DialogTitle>
                    <DialogDescription>{application.name} başvurusunun bilgilerini güncelleyin.</DialogDescription>
                </DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Kuruluş Adı</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="type">Başvuru Türü</Label>
                        <Select value={type} onValueChange={(value) => setType(value as 'STK' | 'Marka' | 'Kulüp')}>
                            <SelectTrigger id="type">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="STK">STK</SelectItem>
                                <SelectItem value="Marka">Marka</SelectItem>
                                <SelectItem value="Kulüp">Kulüp</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>İptal</Button>
                    <Button onClick={handleSave}>Kaydet</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const PendingApplicationCard = ({ item, onApprove, onReject, onEdit }: { item: Application, onApprove: (item: Application) => void, onReject: (item: Application) => void, onEdit: (item: Application) => void }) => (
    <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.date} - {item.type}</p>
                </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" className="flex-1 sm:flex-grow-0">İncele</Button>
                    </DialogTrigger>
                    <ApplicationDetailsDialog application={item} />
                </Dialog>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-grow-0" onClick={() => onEdit(item)}>Düzenle</Button>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-grow-0 text-green-600 border-green-600 hover:bg-green-100" onClick={() => onApprove(item)}>Onayla</Button>
                <Button variant="destructive" size="sm" className="flex-1 sm:flex-grow-0" onClick={() => onReject(item)}>Reddet</Button>
            </div>
        </CardContent>
    </Card>
);

const ProcessedApplicationCard = ({ item, onEdit }: { item: Application, onEdit: (item: Application) => void }) => (
    <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.type} - Onaylandı: {item.date}</p>
                </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex-1 sm:flex-grow-0">Profili Görüntüle</Button>
                    </DialogTrigger>
                    <ApplicationDetailsDialog application={item} />
                </Dialog>
                <Button variant="outline" size="sm" className="flex-1 sm:flex-grow-0" onClick={() => onEdit(item)}>Düzenle</Button>
            </div>
        </CardContent>
    </Card>
);

const RejectedApplicationCard = ({ item }: { item: Application }) => (
    <Card>
        <CardContent className="p-4 flex items-center justify-between opacity-70">
            <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.type} - Reddedildi: {new Date().toLocaleDateString('tr-CA')}</p>
                </div>
            </div>
            <Button variant="ghost" size="sm">Detay</Button>
        </CardContent>
    </Card>
);


export default function ApplicationsPage() {
    const { toast } = useToast();
    const [data, setData] = useState(initialData);
    const [editingApplication, setEditingApplication] = useState<Application | null>(null);

    const handleApprove = (appToApprove: Application) => {
        setData(prevData => {
            const newPending = {
                ngo: prevData.pending.ngo.filter(app => app.id !== appToApprove.id),
                brand: prevData.pending.brand.filter(app => app.id !== appToApprove.id),
                club: prevData.pending.club.filter(app => app.id !== appToApprove.id),
            };
            const newApproved = [...prevData.approved, appToApprove].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            return { ...prevData, pending: newPending, approved: newApproved };
        });
        toast({
            title: "Başvuru Onaylandı",
            description: `${appToApprove.name} başvurusu başarıyla onaylandı.`,
        });
    };

    const handleReject = (appToReject: Application) => {
         setData(prevData => {
            const newPending = {
                ngo: prevData.pending.ngo.filter(app => app.id !== appToReject.id),
                brand: prevData.pending.brand.filter(app => app.id !== appToReject.id),
                club: prevData.pending.club.filter(app => app.id !== appToReject.id),
            };
            const newRejected = [...prevData.rejected, appToReject];
            return { ...prevData, pending: newPending, rejected: newRejected };
        });
        toast({
            variant: "destructive",
            title: "Başvuru Reddedildi",
            description: `${appToReject.name} başvurusu reddedildi.`,
        });
    };
    
    const handleSave = (updatedApp: Application) => {
        setData(prevData => ({
            pending: {
                ngo: prevData.pending.ngo.map(app => app.id === updatedApp.id ? updatedApp : app),
                brand: prevData.pending.brand.map(app => app.id === updatedApp.id ? updatedApp : app),
                club: prevData.pending.club.map(app => app.id === updatedApp.id ? updatedApp : app),
            },
            approved: prevData.approved.map(app => app.id === updatedApp.id ? updatedApp : app),
            rejected: prevData.rejected.map(app => app.id === updatedApp.id ? updatedApp : app),
        }));
        toast({
            title: "Başvuru Güncellendi",
            description: `${updatedApp.name} başvurusu başarıyla güncellendi.`,
        });
        setEditingApplication(null);
    };

    const allPending = [...data.pending.ngo, ...data.pending.brand, ...data.pending.club].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Başvuru Yönetimi</h1>
            <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">Bekleyen Başvurular ({allPending.length})</TabsTrigger>
                    <TabsTrigger value="approved">Onaylananlar ({data.approved.length})</TabsTrigger>
                    <TabsTrigger value="rejected">Reddedilenler ({data.rejected.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                     <Tabs defaultValue="all">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">Tümü ({allPending.length})</TabsTrigger>
                            <TabsTrigger value="ngo">STK ({data.pending.ngo.length})</TabsTrigger>
                            <TabsTrigger value="brand">Marka ({data.pending.brand.length})</TabsTrigger>
                            <TabsTrigger value="club">Kulüp ({data.pending.club.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="all" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tüm Bekleyen Başvurular</CardTitle>
                                    <CardDescription>
                                        Onay bekleyen tüm başvuruları burada yönetin.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                {allPending.length > 0 ? allPending.map(app => <PendingApplicationCard key={app.id} item={app} onApprove={handleApprove} onReject={handleReject} onEdit={setEditingApplication} />) : <p className="text-muted-foreground text-center p-8">Bekleyen başvuru bulunmuyor.</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="ngo" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bekleyen STK Başvuruları</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                {data.pending.ngo.length > 0 ? data.pending.ngo.map(app => <PendingApplicationCard key={app.id} item={app} onApprove={handleApprove} onReject={handleReject} onEdit={setEditingApplication} />) : <p className="text-muted-foreground text-center p-8">Bekleyen STK başvurusu bulunmuyor.</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="brand" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bekleyen Marka Başvuruları</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                {data.pending.brand.length > 0 ? data.pending.brand.map(app => <PendingApplicationCard key={app.id} item={app} onApprove={handleApprove} onReject={handleReject} onEdit={setEditingApplication} />) : <p className="text-muted-foreground text-center p-8">Bekleyen marka başvurusu bulunmuyor.</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="club" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bekleyen Öğrenci Kulübü Başvuruları</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                {data.pending.club.length > 0 ? data.pending.club.map(app => <PendingApplicationCard key={app.id} item={app} onApprove={handleApprove} onReject={handleReject} onEdit={setEditingApplication} />) : <p className="text-muted-foreground text-center p-8">Bekleyen öğrenci kulübü başvurusu bulunmuyor.</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </TabsContent>
                <TabsContent value="approved" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Onaylanan Başvurular</CardTitle>
                            <CardDescription>
                                Yakın zamanda onaylanmış başvurular.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {data.approved.length > 0 ? data.approved.map(app => <ProcessedApplicationCard key={app.id} item={app} onEdit={setEditingApplication} />) : <p className="text-muted-foreground text-center p-8">Henüz onaylanmış bir başvuru bulunmuyor.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="rejected" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reddedilen Başvurular</CardTitle>
                            <CardDescription>
                                Geçmişte reddedilmiş başvurular.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           {data.rejected.length > 0 ? data.rejected.map(app => <RejectedApplicationCard key={app.id} item={app} />) : <p className="text-muted-foreground text-center p-8">Reddedilmiş bir başvuru bulunmuyor.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
            <EditApplicationDialog 
                application={editingApplication}
                open={!!editingApplication}
                onOpenChange={() => setEditingApplication(null)}
                onSave={handleSave}
            />
        </>
    )
}
