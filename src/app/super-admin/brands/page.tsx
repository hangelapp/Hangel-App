import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function BrandsPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Marka Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Tüm Markalar</CardTitle>
                    <CardDescription>
                        Platformdaki tüm markaları görüntüleyin, düzenleyin veya kaldırın.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <p>Marka listesi ve yönetim araçları burada görünecek.</p>
                </CardContent>
            </Card>
        </>
    )
}
