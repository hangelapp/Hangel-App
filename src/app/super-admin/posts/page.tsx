import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function PostsPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Gönderi Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Tüm Gönderiler</CardTitle>
                    <CardDescription>
                        Platformdaki gönderileri yönetin, onaylayın, pasife alın veya silin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <p>Gönderi listesi ve yönetim araçları burada görünecek.</p>
                </CardContent>
            </Card>
        </>
    )
}
