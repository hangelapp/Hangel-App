import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { studentClubs } from "@/lib/data";

export default function ClubsPage() {
    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Öğrenci Kulübü Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Tüm Öğrenci Kulüpleri</CardTitle>
                    <CardDescription>
                        Platformdaki tüm öğrenci kulüplerini görüntüleyin, düzenleyin veya kaldırın.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                   {studentClubs.map(club => (
                       <div key={club.id} className="p-3 border rounded-lg flex items-center justify-between">
                           <div className="flex items-center gap-3">
                               <Avatar>
                                   <AvatarImage src={club.avatarUrl} alt={club.name} />
                                   <AvatarFallback>{club.name.charAt(0)}</AvatarFallback>
                               </Avatar>
                               <div>
                                   <p className="font-semibold">{club.name}</p>
                                   <p className="text-sm text-muted-foreground">{club.university}</p>
                               </div>
                           </div>
                           <div className="flex items-center gap-2">
                               <span className="text-sm font-medium">{club.points} Puan</span>
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
