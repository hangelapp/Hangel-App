import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function SettingsPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Panel Ayarları</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Genel Platform Ayarları</CardTitle>
                    <CardDescription>
                        Hangel platformunun temel ayarlarını buradan yapılandırın.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   <p>Önemli platform ayarları (puan katsayıları, ana sayfa özellikleri vb.) burada yer alacak.</p>
                   <Button className="mt-4">Değişiklikleri Kaydet</Button>
                </CardContent>
            </Card>
        </>
    )
}
