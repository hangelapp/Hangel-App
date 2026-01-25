import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function CommunicationsPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">İletişim Yönetimi</h1>
             <Card>
                <CardHeader>
                    <CardTitle>Bülten Gönderimi</CardTitle>
                    <CardDescription>
                        Haftalık veya aylık bültenleri oluşturup gönderin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Konu</Label>
                        <Input id="subject" placeholder="Bülten Konusu" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="content">İçerik</Label>
                        <Textarea id="content" placeholder="Bülten içeriğini buraya yazın..." rows={10}/>
                    </div>
                    <Button>Bülteni Gönder</Button>
                </CardContent>
            </Card>
        </>
    )
}
