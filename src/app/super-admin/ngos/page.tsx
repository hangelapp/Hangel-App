import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ngos } from "@/lib/data";

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
                <CardContent className="space-y-3">
                   {ngos.map(ngo => (
                       <div key={ngo.id} className="p-3 border rounded-lg flex items-center justify-between">
                           <div className="flex items-center gap-3">
                               <Avatar>
                                   <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                                   <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div>
                                   <p className="font-semibold">{ngo.name}</p>
                                   <p className="text-sm text-muted-foreground">{ngo.category}</p>
                               </div>
                           </div>
                           <div className="flex items-center gap-2">
                               <span className="text-sm font-medium">{ngo.transparencyScore} Puan</span>
                               <Button variant="outline" size="sm">Profili Düzenle</Button>
                               <Button variant="destructive" size="sm">Kaldır</Button>
                           </div>
                       </div>
                   ))}
                </CardContent>
            </Card>
        </>
    )
}
