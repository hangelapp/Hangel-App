
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"

const documents = {
    ngo: [
        { id: 1, org: 'TEMA Vakfı', doc: '2023 Faaliyet Raporu', status: 'Onay Bekliyor' },
        { id: 2, org: 'Ahbap Derneği', doc: 'Vakıf Senedi Güncellemesi', status: 'Onaylandı' },
    ],
    club: [
        { id: 3, org: 'İTÜ Girişimcilik Kulübü', doc: 'Yönetim Kurulu Listesi', status: 'Onay Bekliyor' },
    ]
}

const DocumentItem = ({ item }: { item: { id: number, org: string, doc: string, status: string } }) => (
    <div className="p-3 border rounded-lg flex items-center justify-between">
        <div>
            <p className="font-semibold">{item.doc}</p>
            <p className="text-sm text-muted-foreground">{item.org}</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-amber-600">{item.status}</span>
            <Button variant="secondary" size="sm">İncele</Button>
            {item.status === 'Onay Bekliyor' && (
                <>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">Onayla</Button>
                    <Button variant="destructive" size="sm">Reddet</Button>
                </>
            )}
        </div>
    </div>
);


export default function TransparencyPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Şeffaflık Yönetimi</h1>
            <Tabs defaultValue="ngo">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="ngo">STK'lar</TabsTrigger>
                    <TabsTrigger value="club">Öğrenci Kulüpleri</TabsTrigger>
                </TabsList>
                <TabsContent value="ngo" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>STK Şeffaflık Belgeleri</CardTitle>
                            <CardDescription>
                                STK'lar tarafından yüklenen şeffaflık belgelerini kontrol edin, onaylayın veya reddedin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           {documents.ngo.map(item => <DocumentItem key={item.id} item={item} />)}
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="club" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Öğrenci Kulübü Bilgileri</CardTitle>
                            <CardDescription>
                                Öğrenci kulüplerinin bilgilerini ve belgelerini kontrol edin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                           {documents.club.map(item => <DocumentItem key={item.id} item={item} />)}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    )
}
