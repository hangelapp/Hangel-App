
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card"
import { Button } from "@/components/ui/button";

const opportunities = [
    { id: '1', title: 'Kadıköy Sahil Temizliği', org: 'TEMA Vakfı', status: 'Onay Bekliyor' },
    { id: '2', title: 'Barınak Ziyareti ve Besleme', org: 'HAYTAP', status: 'Aktif' },
    { id: '3', title: 'Çocuklara Kodlama Eğitimi', org: 'TEGV', status: 'Onay Bekliyor' },
];

export default function VolunteerManagementPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Gönüllülük Yönetimi</h1>
             <Card>
                <CardHeader>
                    <CardTitle>Gönüllülük İlanları</CardTitle>
                    <CardDescription>
                        Yayına alınması beklenen veya yayındaki gönüllülük ilanlarını yönetin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                   {opportunities.map(opp => (
                       <Card key={opp.id}>
                           <CardContent className="p-4 flex items-center justify-between">
                               <div>
                                   <p className="font-semibold">{opp.title}</p>
                                   <p className="text-sm text-muted-foreground">{opp.org} - <span className="font-medium text-amber-600">{opp.status}</span></p>
                               </div>
                               <div className="flex gap-2">
                                   <Button variant="secondary" size="sm">Detayları Gör</Button>
                                   {opp.status === 'Onay Bekliyor' && <Button size="sm" className="bg-green-600 hover:bg-green-700">Onayla</Button>}
                                   {opp.status === 'Aktif' && <Button variant="destructive" size="sm">Pasife Al</Button>}
                               </div>
                           </CardContent>
                       </Card>
                   ))}
                </CardContent>
            </Card>
        </>
    )
}
