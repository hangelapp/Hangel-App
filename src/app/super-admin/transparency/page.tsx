'use client';

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Document = {
  id: number;
  org: string;
  doc: string;
  date: string;
  type: 'STK' | 'Kulüp';
  approver?: string;
  rejectionReason?: string;
};

const initialDocuments: {
  pending: Document[];
  approved: Document[];
  rejected: Document[];
} = {
    pending: [
        { id: 1, org: 'TEMA Vakfı', doc: '2023 Faaliyet Raporu', date: '2024-07-22', type: 'STK' },
        { id: 3, org: 'İTÜ Girişimcilik Kulübü', doc: 'Yönetim Kurulu Listesi', date: '2024-07-21', type: 'Kulüp' },
        { id: 4, org: 'LÖSEV', doc: '2023 Bağımsız Denetim Raporu', date: '2024-07-20', type: 'STK' },
    ],
    approved: [
        { id: 2, org: 'Ahbap Derneği', doc: 'Vakıf Senedi Güncellemesi', date: '2024-07-20', approver: 'İsmail H.', type: 'STK' },
    ],
    rejected: []
};


const DocumentDetailsDialog = ({ document }: { document: Document }) => (
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Belge Detayı: {document.doc}</DialogTitle>
            <DialogDescription>
                <strong>Kuruluş:</strong> {document.org} <br />
                <strong>Yükleme Tarihi:</strong> {document.date}
            </DialogDescription>
        </DialogHeader>
        <div className="py-4">
            <p>Burada belgenin içeriği (PDF görüntüleyici veya metin içeriği) yer alacaktır. Bu bir örnek inceleme penceresidir.</p>
        </div>
        <DialogFooter>
            <DialogTrigger asChild>
                <Button variant="secondary">Kapat</Button>
            </DialogTrigger>
        </DialogFooter>
    </DialogContent>
);

const DocumentItem = ({ item, onApprove, onReject }: { item: Document; onApprove?: (item: Document) => void; onReject?: (item: Document) => void; }) => {
    const isPending = !!onApprove;

    return (
        <div className="p-3 border rounded-lg flex items-center justify-between gap-4">
            <div>
                <p className="font-semibold">{item.doc}</p>
                <p className="text-sm text-muted-foreground">{item.org} - Yükleme: {item.date}</p>
            </div>
            <div className="flex items-center gap-2">
                <Dialog>
                    <DialogTrigger asChild>
                         <Button variant="secondary" size="sm">İncele</Button>
                    </DialogTrigger>
                    <DocumentDetailsDialog document={item} />
                </Dialog>
                {isPending ? (
                    <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onApprove?.(item)}>Onayla</Button>
                        <Button variant="destructive" size="sm" onClick={() => onReject?.(item)}>Reddet</Button>
                    </>
                ) : (
                    item.approver ?
                    <div className="text-sm text-muted-foreground">
                        <p>Onaylayan: {item.approver}</p>
                    </div>
                    :
                     <div className="text-sm text-destructive">
                        <p>Reddedildi</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default function TransparencyPage() {
    const [documents, setDocuments] = useState(initialDocuments);
    const { toast } = useToast();

    const handleApprove = (docToApprove: Document) => {
        setDocuments(prev => ({
            ...prev,
            pending: prev.pending.filter(d => d.id !== docToApprove.id),
            approved: [{...docToApprove, approver: 'Admin'}, ...prev.approved]
        }));
        toast({ title: 'Belge Onaylandı', description: `"${docToApprove.doc}" belgesi onaylandı.` });
    };

    const handleReject = (docToReject: Document) => {
        setDocuments(prev => ({
            ...prev,
            pending: prev.pending.filter(d => d.id !== docToReject.id),
            rejected: [{...docToReject, rejectionReason: 'Eksik bilgi.'}, ...prev.rejected]
        }));
        toast({ variant: 'destructive', title: 'Belge Reddedildi', description: `"${docToReject.doc}" belgesi reddedildi.` });
    };

    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Şeffaflık Yönetimi</h1>
            <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">Onay Bekleyen Belgeler ({documents.pending.length})</TabsTrigger>
                    <TabsTrigger value="approved">Onaylanmış Belgeler ({documents.approved.length})</TabsTrigger>
                    <TabsTrigger value="rejected">Reddedilmiş Belgeler ({documents.rejected.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Onay Bekleyen Şeffaflık Belgeleri</CardTitle>
                            <CardDescription>
                                STK ve kulüpler tarafından yüklenen belgeleri kontrol edin, onaylayın veya reddedin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           {documents.pending.length > 0 ? documents.pending.map(item => <DocumentItem key={item.id} item={item} onApprove={handleApprove} onReject={handleReject} />) : <p className="text-center p-8 text-muted-foreground">Onay bekleyen belge bulunmuyor.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="approved" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Onaylanmış Belgeler</CardTitle>
                            <CardDescription>
                                Yakın zamanda onaylanan şeffaflık belgeleri.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           {documents.approved.length > 0 ? documents.approved.map(item => <DocumentItem key={item.id} item={item} />) : <p className="text-center p-8 text-muted-foreground">Henüz onaylanmış belge bulunmuyor.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="rejected" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reddedilmiş Belgeler</CardTitle>
                            <CardDescription>
                                Geçmişte reddedilmiş belgeler.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           {documents.rejected.length > 0 ? documents.rejected.map(item => <DocumentItem key={item.id} item={item} />) : <p className="text-center p-8 text-muted-foreground">Reddedilmiş belge bulunmuyor.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    )
}
