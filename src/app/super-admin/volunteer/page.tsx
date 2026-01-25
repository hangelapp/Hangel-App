import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
                <CardContent>
                   <p>İlan listesi ve onay araçları burada görünecek.</p>
                </CardContent>
            </Card>
        </>
    )
}
