
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const applicationData = {
  pending: {
    ngo: [
      { id: 'ngo1', name: 'Doğa Koruma Derneği', date: '2024-07-22', avatar: 'https://logo.clearbit.com/wwf.org' },
      { id: 'ngo2', name: 'Eğitim Meşalesi Vakfı', date: '2024-07-21', avatar: 'https://logo.clearbit.com/tegv.org' },
    ],
    brand: [
      { id: 'brand1', name: 'Eko Giyim', date: '2024-07-22', avatar: 'https://logo.clearbit.com/patagonia.com' },
      { id: 'brand2', name: 'Sağlıklı Atıştırmalıklar', date: '2024-07-20', avatar: 'https://logo.clearbit.com/fellasfoods.com.tr' },
    ],
    club: [
      { id: 'club1', name: 'YTÜ Sosyal Sorumluluk Kulübü', date: '2024-07-21', avatar: 'https://logo.clearbit.com/yildiz.edu.tr' },
    ],
  },
  approved: [
    { id: 'ngo3', name: 'TEMA Vakfı', date: '2024-07-15', avatar: 'https://logo.clearbit.com/tema.org.tr', type: 'STK' },
    { id: 'brand3', name: 'Decathlon', date: '2024-07-14', avatar: 'https://logo.clearbit.com/decathlon.com.tr', type: 'Marka' },
  ]
};

const PendingApplicationCard = ({ item }: { item: { id: string, name: string, date: string, avatar: string } }) => (
    <Card>
        <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Avatar>
                    <AvatarImage src={item.avatar} />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="secondary" size="sm">İncele</Button>
                <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-100">Onayla</Button>
                <Button variant="destructive" size="sm">Reddet</Button>
            </div>
        </CardContent>
    </Card>
);

const ApprovedApplicationCard = ({ item }: { item: { id: string, name: string, date: string, avatar: string, type: string } }) => (
    <Card>
        <CardContent className="p-4 flex items-center justify-between">
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
            <Button variant="outline" size="sm">Profili Görüntüle</Button>
        </CardContent>
    </Card>
);


export default function ApplicationsPage() {
    const allPending = [...applicationData.pending.ngo, ...applicationData.pending.brand, ...applicationData.pending.club].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Başvuru Yönetimi</h1>
            <Tabs defaultValue="pending">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="pending">Bekleyen Başvurular ({allPending.length})</TabsTrigger>
                    <TabsTrigger value="approved">Onaylananlar ({applicationData.approved.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="mt-4">
                     <Tabs defaultValue="all">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="all">Tümü ({allPending.length})</TabsTrigger>
                            <TabsTrigger value="ngo">STK ({applicationData.pending.ngo.length})</TabsTrigger>
                            <TabsTrigger value="brand">Marka ({applicationData.pending.brand.length})</TabsTrigger>
                            <TabsTrigger value="club">Kulüp ({applicationData.pending.club.length})</TabsTrigger>
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
                                {allPending.length > 0 ? allPending.map(app => <PendingApplicationCard key={app.id} item={app} />) : <p className="text-muted-foreground text-center p-8">Bekleyen başvuru bulunmuyor.</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="ngo" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bekleyen STK Başvuruları</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                {applicationData.pending.ngo.length > 0 ? applicationData.pending.ngo.map(app => <PendingApplicationCard key={app.id} item={app} />) : <p className="text-muted-foreground text-center p-8">Bekleyen STK başvurusu bulunmuyor.</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="brand" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bekleyen Marka Başvuruları</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                {applicationData.pending.brand.length > 0 ? applicationData.pending.brand.map(app => <PendingApplicationCard key={app.id} item={app} />) : <p className="text-muted-foreground text-center p-8">Bekleyen marka başvurusu bulunmuyor.</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="club" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bekleyen Öğrenci Kulübü Başvuruları</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                {applicationData.pending.club.length > 0 ? applicationData.pending.club.map(app => <PendingApplicationCard key={app.id} item={app} />) : <p className="text-muted-foreground text-center p-8">Bekleyen öğrenci kulübü başvurusu bulunmuyor.</p>}
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
                           {applicationData.approved.length > 0 ? applicationData.approved.map(app => <ApprovedApplicationCard key={app.id} item={app} />) : <p className="text-muted-foreground text-center p-8">Henüz onaylanmış bir başvuru bulunmuyor.</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    )
}
