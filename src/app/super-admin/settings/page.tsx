
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
import { Switch } from "@/components/ui/switch"
import Link from "next/link"
import { Handshake, ChevronRight } from "lucide-react"

export default function SettingsPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Panel Ayarları</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Alt Modüller</CardTitle>
                    <CardDescription>Belirli alanlara özel ayar sayfaları.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Link
                        href="/super-admin/settings/volunteer-scoring"
                        className="flex items-center gap-3 p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Handshake className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold">Gönüllülük Puantajı</p>
                            <p className="text-xs text-muted-foreground">
                                İlan iş kalemleri, saat başı etki puanı ve adam-saat maliyeti.
                            </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Genel Platform Ayarları</CardTitle>
                    <CardDescription>
                        hangel platformunun temel ayarlarını buradan yapılandırın.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   <div className="space-y-4">
                       <h3 className="font-semibold">Puanlama Katsayıları</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                           <div className="space-y-2">
                               <Label htmlFor="donation-multiplier">Bağış Puanı Çarpanı</Label>
                               <Input id="donation-multiplier" type="number" defaultValue="1" />
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="volunteer-multiplier">Gönüllülük Puanı Çarpanı</Label>
                               <Input id="volunteer-multiplier" type="number" defaultValue="10" />
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="invite-multiplier">Davet Puanı</Label>
                               <Input id="invite-multiplier" type="number" defaultValue="100" />
                           </div>
                           <div className="space-y-2">
                               <Label htmlFor="badge-multiplier">Rozet Puanı</Label>
                               <Input id="badge-multiplier" type="number" defaultValue="250" />
                           </div>
                       </div>
                   </div>
                   <div className="space-y-4 border-t pt-6">
                       <h3 className="font-semibold">Özellik Yönetimi</h3>
                       <div className="flex items-center justify-between p-4 border rounded-lg">
                           <Label htmlFor="feature-story" className="font-medium text-sm flex-1">Etki Hikayem (Yapay Zeka)</Label>
                           <Switch id="feature-story" defaultChecked />
                       </div>
                       <div className="flex items-center justify-between p-4 border rounded-lg">
                           <Label htmlFor="feature-market-ai" className="font-medium text-sm flex-1">Market Asistanı (Yapay Zeka)</Label>
                           <Switch id="feature-market-ai" defaultChecked />
                       </div>
                   </div>
                   <div className="flex justify-end mt-6">
                        <Button>Değişiklikleri Kaydet</Button>
                   </div>
                </CardContent>
            </Card>
        </>
    )
}
