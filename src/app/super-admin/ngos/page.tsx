import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function NgosPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">STK Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Tüm STK'lar</CardTitle>
                    <CardDescription>
                        Platformdaki tüm STK'ları görüntüleyin, düzenleyin veya kaldırın.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <p>STK listesi ve yönetim araçları burada görünecek.</p>
                </CardContent>
            </Card>
        </>
    )
}
