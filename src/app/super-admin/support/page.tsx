
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const tickets = [
    { id: 1, subject: 'STK profilimi güncelleyemiyorum', user: 'Ahbap Derneği', status: 'Açık', priority: 'Yüksek' },
    { id: 2, subject: 'Bağışım görünmüyor', user: 'İsmail Hilmi Adıgüzel', status: 'Cevaplandı', priority: 'Normal' },
    { id: 3, subject: 'Yeni marka başvurusu hakkında', user: 'Eko Giyim', status: 'Açık', priority: 'Normal' },
];

const TicketItem = ({ ticket }: { ticket: typeof tickets[0] }) => (
    <div className="p-3 border rounded-lg flex items-center justify-between">
        <div>
            <p className="font-semibold">{ticket.subject}</p>
            <p className="text-sm text-muted-foreground">{ticket.user}</p>
        </div>
        <div className="flex items-center gap-4">
            <Badge variant={ticket.priority === 'Yüksek' ? 'destructive' : 'secondary'}>{ticket.priority}</Badge>
            <Button size="sm">Görüntüle</Button>
        </div>
    </div>
)

export default function SupportPage() {
    const openTickets = tickets.filter(t => t.status === 'Açık');
    const answeredTickets = tickets.filter(t => t.status === 'Cevaplandı');

    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Destek Talepleri</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Destek Talepleri</CardTitle>
                    <CardDescription>
                        Kullanıcılardan ve kuruluşlardan gelen destek taleplerini görüntüleyin ve yanıtlayın.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="open">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="open">Açık Talepler ({openTickets.length})</TabsTrigger>
                            <TabsTrigger value="answered">Cevaplananlar ({answeredTickets.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="open" className="mt-4 space-y-3">
                            {openTickets.length > 0 ? openTickets.map(ticket => (
                                <TicketItem key={ticket.id} ticket={ticket} />
                            )) : <p className="text-center text-muted-foreground py-8">Açık destek talebi bulunmuyor.</p>}
                        </TabsContent>
                        <TabsContent value="answered" className="mt-4 space-y-3">
                             {answeredTickets.length > 0 ? answeredTickets.map(ticket => (
                                <TicketItem key={ticket.id} ticket={ticket} />
                            )) : <p className="text-center text-muted-foreground py-8">Cevaplanmış destek talebi bulunmuyor.</p>}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </>
    )
}
