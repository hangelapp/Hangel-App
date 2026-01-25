import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function CommunicationsPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Bildirim ve İletişim Yönetimi</h1>
            <Tabs defaultValue="push">
                <TabsList>
                    <TabsTrigger value="push">Anlık Bildirim Gönder</TabsTrigger>
                    <TabsTrigger value="newsletter">Bülten Gönder</TabsTrigger>
                    <TabsTrigger value="history">Geçmiş Bildirimler</TabsTrigger>
                </TabsList>
                <TabsContent value="push">
                    <Card>
                        <CardHeader>
                            <CardTitle>Anlık Bildirim (Push Notification)</CardTitle>
                            <CardDescription>
                                Mobil ve web kullanıcılarına anlık bildirim gönderin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="push-title">Bildirim Başlığı</Label>
                                <Input id="push-title" placeholder="Yeni bir gönüllülük fırsatı!" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="push-content">Bildirim İçeriği</Label>
                                <Textarea id="push-content" placeholder="Çevre konusunda fark yaratmak ister misin?" rows={3}/>
                            </div>
                            <Button>Bildirimi Gönder</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="newsletter">
                    <Card>
                        <CardHeader>
                            <CardTitle>E-posta Bülteni</CardTitle>
                            <CardDescription>
                                Haftalık veya aylık bültenleri oluşturup gönderin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="subject">Konu</Label>
                                <Input id="subject" placeholder="Haftanın Gelişmeleri" />
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="content">İçerik</Label>
                                <Textarea id="content" placeholder="Bülten içeriğini buraya yazın..." rows={10}/>
                            </div>
                            <Button>Bülteni Gönder</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="history">
                     <Card>
                        <CardHeader>
                            <CardTitle>Gönderilen Bildirimler</CardTitle>
                            <CardDescription>
                                Geçmiş bildirimleri ve istatistiklerini (görüntülenme, tıklanma) buradan takip edin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <p>Geçmiş bildirimler listesi burada görünecek.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </>
    )
}
