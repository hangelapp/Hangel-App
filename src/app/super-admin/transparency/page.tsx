
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

const documents = {
    pending: [
        { id: 1, org: 'TEMA Vakfı', doc: '2023 Faaliyet Raporu', date: '2024-07-22', type: 'STK' },
        { id: 3, org: 'İTÜ Girişimcilik Kulübü', doc: 'Yönetim Kurulu Listesi', date: '2024-07-21', type: 'Kulüp' },
    ],
    approved: [
        { id: 2, org: 'Ahbap Derneği', doc: 'Vakıf Senedi Güncellemesi', date: '2024-07-20', approver: 'İsmail H.', type: 'STK' },
    ]
}

const DocumentItem = ({ item, isPending }: { item: { id: number, org: string, doc: string, date: string, approver?: string }, isPending: boolean }) => (
    <div className="p-3 border rounded-lg flex items-center justify-between gap-4">
        <div>
            <p className="font-semibold">{item.doc}</p>
            <p className="text-sm text-muted-foreground">{item.org} - Yükleme: {item.date}</p>
        </div>
        <div className="flex items-center gap-2">
            {isPending ? (
                <>
                    <Button variant="secondary" size="sm">İncele</Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">Onayla</Button>
                    <Button variant="destructive" size="sm">Reddet</Button>
                </>
            ) : (
                <div className="text-sm text-muted-foreground">
                    <p>Onaylayan: {item.approver}</p>
                </div>
            )}
        </div>
    </div>
);


export default function TransparencyPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Şeffaflık Yönetimi</h1>
            <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">Onay Bekleyen Belgeler ({documents.pending.length})</TabsTrigger>
                    <TabsTrigger value="approved">Onaylanmış Belgeler ({documents.approved.length})</TabsTrigger>
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
                           {documents.pending.map(item => <DocumentItem key={item.id} item={item} isPending={true} />)}
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
                           {documents.approved.map(item => <DocumentItem key={item.id} item={item} isPending={false} />)}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    )
}
