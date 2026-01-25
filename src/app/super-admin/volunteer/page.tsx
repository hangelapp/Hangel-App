'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";


const initialOpportunities = [
    { id: '1', title: 'Kadıköy Sahil Temizliği', org: 'TEMA Vakfı', status: 'Onay Bekliyor', applicants: 12 },
    { id: '2', title: 'Barınak Ziyareti ve Besleme', org: 'HAYTAP', status: 'Aktif', applicants: 35 },
    { id: '3', title: 'Çocuklara Kodlama Eğitimi', org: 'TEGV', status: 'Onay Bekliyor', applicants: 8 },
    { id: '4', title: 'Afet Bölgesi Lojistik Destek', org: 'Ahbap Derneği', status: 'Aktif', applicants: 78 },
    { id: '5', title: 'Müze Rehberliği', org: 'Kültür Sanat Vakfı', status: 'Pasif', applicants: 22 },
];

const mockApplicants = [
    { name: 'Ayşe Yılmaz', avatar: 'https://i.pravatar.cc/150?u=ayse' },
    { name: 'Mehmet Kaya', avatar: 'https://i.pravatar.cc/150?u=mehmet' },
    { name: 'Zeynep Arslan', avatar: 'https://i.pravatar.cc/150?u=zeynep' },
    { name: 'Ali Veli', avatar: 'https://i.pravatar.cc/150?u=ali' },
];

const OpportunityCard = ({ opp, onStatusChange, onDelete }: { opp: typeof initialOpportunities[0], onStatusChange: (id: string, status: 'Aktif' | 'Pasif' | 'Onay Bekliyor') => void, onDelete: (id: string) => void }) => (
    <Card>
        <CardContent className="p-4 flex items-center justify-between">
            <div>
                <p className="font-semibold">{opp.title}</p>
                <p className="text-sm text-muted-foreground">{opp.org} - <span className="font-medium text-amber-600">{opp.status}</span></p>
            </div>
            <div className="flex items-center gap-2">
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">{opp.applicants} Başvuru</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Başvuran Kullanıcılar</DialogTitle>
                            <DialogDescription>"{opp.title}" ilanına başvuranlar.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3 py-4 max-h-96 overflow-y-auto">
                            {mockApplicants.slice(0, opp.applicants).map((applicant, index) => (
                                <div key={index} className="flex items-center gap-3 p-2 border rounded-lg">
                                    <Avatar>
                                        <AvatarImage src={applicant.avatar} />
                                        <AvatarFallback>{applicant.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <p className="font-medium">{applicant.name}</p>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>
                
                <Button variant="secondary" size="sm">Detaylar</Button>
                
                {opp.status === 'Onay Bekliyor' && <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onStatusChange(opp.id, 'Aktif')}>Onayla</Button>}
                {opp.status === 'Aktif' && <Button variant="outline" size="sm" onClick={() => onStatusChange(opp.id, 'Pasif')}>Pasife Al</Button>}
                {opp.status === 'Pasif' && <Button variant="secondary" size="sm" onClick={() => onStatusChange(opp.id, 'Aktif')}>Aktif Et</Button>}

                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">Sil</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>İlanı Silmek Üzeresiniz</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bu işlem geri alınamaz. İlan kalıcı olarak silinecektir. Devam etmek istiyor musunuz?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                            <AlertDialogAction
                                className={cn(buttonVariants({ variant: "destructive" }))}
                                onClick={() => onDelete(opp.id)}>
                                Evet, Sil
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </CardContent>
    </Card>
);

export default function VolunteerManagementPage() {
    const [opportunities, setOpportunities] = useState(initialOpportunities);
    const { toast } = useToast();

    const handleUpdateStatus = (id: string, newStatus: 'Aktif' | 'Pasif' | 'Onay Bekliyor') => {
        setOpportunities(prev =>
            prev.map(opp =>
                opp.id === id ? { ...opp, status: newStatus } : opp
            )
        );
        toast({
            title: "İlan Durumu Güncellendi",
            description: `İlan durumu "${newStatus}" olarak ayarlandı.`,
        });
    };

    const handleDelete = (id: string) => {
        setOpportunities(prev => prev.filter(opp => opp.id !== id));
        toast({
            variant: "destructive",
            title: "İlan Silindi",
            description: "Gönüllülük ilanı kalıcı olarak silindi.",
        });
    };

    const pendingOpportunities = opportunities.filter(o => o.status === 'Onay Bekliyor');
    const activeOpportunities = opportunities.filter(o => o.status === 'Aktif');
    const passiveOpportunities = opportunities.filter(o => o.status === 'Pasif');

    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Gönüllülük Yönetimi</h1>
            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">Onay Bekleyen İlanlar ({pendingOpportunities.length})</TabsTrigger>
                    <TabsTrigger value="active">Aktif İlanlar ({activeOpportunities.length})</TabsTrigger>
                    <TabsTrigger value="passive">Pasif İlanlar ({passiveOpportunities.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Onay Bekleyen Gönüllülük İlanları</CardTitle>
                            <CardDescription>
                                Yayına alınması beklenen ilanları inceleyin ve yönetin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {pendingOpportunities.length > 0 ? (
                                pendingOpportunities.map(opp => <OpportunityCard key={opp.id} opp={opp} onStatusChange={handleUpdateStatus} onDelete={handleDelete} />)
                            ) : (
                                <p className="text-center text-muted-foreground p-8">Onay bekleyen ilan bulunmuyor.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="active" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Aktif Gönüllülük İlanları</CardTitle>
                            <CardDescription>
                                Şu anda yayında olan ilanları yönetin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {activeOpportunities.length > 0 ? (
                                activeOpportunities.map(opp => <OpportunityCard key={opp.id} opp={opp} onStatusChange={handleUpdateStatus} onDelete={handleDelete} />)
                            ) : (
                                <p className="text-center text-muted-foreground p-8">Aktif ilan bulunmuyor.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="passive" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pasif Gönüllülük İlanları</CardTitle>
                            <CardDescription>
                                Yayından kaldırılmış ilanlar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {passiveOpportunities.length > 0 ? (
                                passiveOpportunities.map(opp => <OpportunityCard key={opp.id} opp={opp} onStatusChange={handleUpdateStatus} onDelete={handleDelete} />)
                            ) : (
                                <p className="text-center text-muted-foreground p-8">Pasif ilan bulunmuyor.</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    )
}
