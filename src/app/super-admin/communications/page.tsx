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
import { Badge } from "@/components/ui/badge"

const history = [
    { id: 1, type: 'Bülten', title: 'Haftanın Gelişmeleri', date: '2024-07-20', status: 'Gönderildi', seen: '12,543' },
    { id: 2, type: 'Bildirim', title: 'Yeni Gönüllülük Fırsatı!', date: '2024-07-18', status: 'Gönderildi', seen: '8,120' },
]

export default function CommunicationsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-lg font-semibold md:text-2xl">Bildirim ve Bülten Yönetimi</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Anlık Bildirim Gönder</CardTitle>
                        <CardDescription>
                            Mobil ve web kullanıcılarına anlık bildirim (push notification) gönderin.
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
                        <Button className="w-full">Bildirimi Gönder</Button>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>E-posta Bülteni Oluştur</CardTitle>
                        <CardDescription>
                            Haftalık veya aylık bültenleri oluşturup tüm üyelere gönderin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Konu</Label>
                            <Input id="subject" placeholder="Haftanın Gelişmeleri" />
                        </div>
                            <div className="space-y-2">
                            <Label htmlFor="content">İçerik</Label>
                            <Textarea id="content" placeholder="Bülten içeriğini buraya HTML olarak yazın..." rows={10}/>
                        </div>
                        <Button className="w-full">Bülteni Gönder</Button>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Geçmiş Gönderimler</CardTitle>
                    <CardDescription>
                        Geçmiş bildirimleri ve istatistiklerini buradan takip edin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                   {history.map(item => (
                       <div key={item.id} className="p-3 border rounded-lg flex items-center justify-between">
                           <div>
                               <p className="font-semibold">{item.title} <Badge variant="outline">{item.type}</Badge></p>
                               <p className="text-sm text-muted-foreground">Gönderim Tarihi: {item.date}</p>
                           </div>
                           <div className="text-right">
                               <p className="font-bold">{item.seen}</p>
                               <p className="text-sm text-muted-foreground">Görüntülenme</p>
                           </div>
                       </div>
                   ))}
                </CardContent>
            </Card>
        </div>
    )
}
