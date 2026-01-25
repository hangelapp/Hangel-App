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


export default function TransparencyPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Şeffaflık Yönetimi</h1>
            <Tabs defaultValue="ngo">
                <TabsList>
                    <TabsTrigger value="ngo">STK'lar</TabsTrigger>
                    <TabsTrigger value="club">Öğrenci Kulüpleri</TabsTrigger>
                </TabsList>
                <TabsContent value="ngo">
                    <Card>
                        <CardHeader>
                            <CardTitle>STK Şeffaflık Belgeleri</CardTitle>
                            <CardDescription>
                                STK'lar tarafından yüklenen şeffaflık belgelerini kontrol edin, onaylayın veya reddedin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p>STK belge listesi burada görünecek.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="club">
                    <Card>
                        <CardHeader>
                            <CardTitle>Öğrenci Kulübü Bilgileri</CardTitle>
                            <CardDescription>
                                Öğrenci kulüplerinin bilgilerini kontrol edin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p>Öğrenci kulübü bilgi listesi burada görünecek.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    )
}
