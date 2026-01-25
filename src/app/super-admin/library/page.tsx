
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const libraryItems = [
    { id: 1, title: 'Etkili Gönüllülük İçin 5 Adım', type: 'Rehber' },
    { id: 2, title: 'Sapiens: Hayvanlardan Tanrılara', type: 'Kitap' },
    { id: 3, title: 'Captain Fantastic (2016)', type: 'Film' },
];

export default function LibraryPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Kütüphane Yönetimi</h1>
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <div>
                        <CardTitle>Kütüphane İçerikleri</CardTitle>
                        <CardDescription>
                            Kütüphaneye yeni içerikler ekleyin, mevcutları düzenleyin veya silin.
                        </CardDescription>
                    </div>
                    <Button>Yeni İçerik Ekle</Button>
                </CardHeader>
                <CardContent className="space-y-3">
                   {libraryItems.map(item => (
                       <div key={item.id} className="p-3 border rounded-lg flex items-center justify-between">
                           <div>
                               <p className="font-semibold">{item.title}</p>
                               <p className="text-sm text-muted-foreground">{item.type}</p>
                           </div>
                           <div className="flex gap-2">
                               <Button variant="outline" size="sm">Düzenle</Button>
                               <Button variant="destructive" size="sm">Sil</Button>
                           </div>
                       </div>
                   ))}
                </CardContent>
            </Card>
        </>
    )
}
