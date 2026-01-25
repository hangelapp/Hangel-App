
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const tickets = [
    { id: 1, subject: 'STK profilimi güncelleyemiyorum', user: 'Ahbap Derneği', status: 'Açık', priority: 'Yüksek' },
    { id: 2, subject: 'Bağışım görünmüyor', user: 'İsmail Hilmi Adıgüzel', status: 'Cevaplandı', priority: 'Normal' },
    { id: 3, subject: 'Yeni marka başvurusu hakkında', user: 'Eko Giyim', status: 'Açık', priority: 'Normal' },
];

export default function SupportPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Yönetici Destek</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Destek Talepleri</CardTitle>
                    <CardDescription>
                        Kullanıcılardan ve kuruluşlardan gelen destek taleplerini görüntüleyin ve yanıtlayın.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                   {tickets.map(ticket => (
                       <div key={ticket.id} className="p-3 border rounded-lg flex items-center justify-between">
                           <div>
                               <p className="font-semibold">{ticket.subject}</p>
                               <p className="text-sm text-muted-foreground">{ticket.user}</p>
                           </div>
                           <div className="flex items-center gap-4">
                               <Badge variant={ticket.priority === 'Yüksek' ? 'destructive' : 'secondary'}>{ticket.priority}</Badge>
                               <Badge variant={ticket.status === 'Açık' ? 'default' : 'outline'}>{ticket.status}</Badge>
                               <Button size="sm">Görüntüle</Button>
                           </div>
                       </div>
                   ))}
                </CardContent>
            </Card>
        </>
    )
}
