import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function LibraryPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Kütüphane Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Kütüphane İçerikleri</CardTitle>
                    <CardDescription>
                        Kütüphaneye yeni içerikler (makale, kitap, film) ekleyin, mevcutları düzenleyin veya silin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <p>İçerik yönetim araçları burada görünecek.</p>
                   <Button className="mt-4">Yeni İçerik Ekle</Button>
                </CardContent>
            </Card>
        </>
    )
}
