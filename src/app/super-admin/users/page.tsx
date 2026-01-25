import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function UsersPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Kullanıcı Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Tüm Kullanıcılar</CardTitle>
                    <CardDescription>
                        Platformdaki tüm kullanıcıları arayın ve yönetin.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <p>Kullanıcı listesi ve yönetim araçları burada görünecek.</p>
                </CardContent>
            </Card>
        </>
    )
}
