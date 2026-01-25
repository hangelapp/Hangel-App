import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
                <CardContent>
                   <p>Destek talepleri listesi burada görünecek.</p>
                </CardContent>
            </Card>
        </>
    )
}
