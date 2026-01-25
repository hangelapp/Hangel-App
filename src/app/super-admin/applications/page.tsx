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

export default function ApplicationsPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Başvuru Yönetimi</h1>
            <Tabs defaultValue="all">
                <TabsList>
                    <TabsTrigger value="all">Tümü</TabsTrigger>
                    <TabsTrigger value="ngo">STK</TabsTrigger>
                    <TabsTrigger value="brand">Marka</TabsTrigger>
                    <TabsTrigger value="club">Kulüp</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tüm Bekleyen Başvurular</CardTitle>
                            <CardDescription>
                                Onay bekleyen tüm başvuruları burada yönetin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p>Başvuru listesi burada görünecek.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    )
}
